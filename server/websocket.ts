import { WebSocketServer, WebSocket } from "ws"
import { writeFile, readFile } from "fs/promises"
import { join } from "path"
import OpenAI from "openai"
import { mkdir } from "fs/promises"
import { config } from "dotenv"
import { createReadStream } from "fs"

config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Store audio chunks for each client
const audioChunks = new Map<string, Buffer[]>()
const transcriptionBuffers = new Map<string, string>()

// Create tmp directory if it doesn't exist
const tmpDir = join(process.cwd(), "tmp")
mkdir(tmpDir, { recursive: true }).catch(console.error)

const wss = new WebSocketServer({ port: process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 3000 })

wss.on("connection", (ws: WebSocket) => {
  const clientId = Math.random().toString(36).substring(7)
  audioChunks.set(clientId, [])
  transcriptionBuffers.set(clientId, "")

  console.log(`Client connected: ${clientId}`)

  ws.on("message", async (data: Buffer) => {
    console.log(`[${clientId}] Received message. Type: ${typeof data}, Size: ${data.length}`);

    try {
      // Check if the message is a stop signal
      if (data.toString().startsWith("{")) {
        console.log(`[${clientId}] Received potential JSON message: ${data.toString()}`);
        const message = JSON.parse(data.toString())
        if (message.type === "stop") {
          console.log(`[${clientId}] Received stop signal.`);
          const chunks = audioChunks.get(clientId)
          if (chunks && chunks.length > 0) {
            console.log(`[${clientId}] Processing ${chunks.length} audio chunks for final transcription.`);
            const audioBuffer = Buffer.concat(chunks)
            const audioPath = join(tmpDir, `${clientId}.webm`)
            console.log(`[${clientId}] Writing final audio to: ${audioPath}`);
            
            // Save the audio file
            await writeFile(audioPath, audioBuffer)
            console.log(`[${clientId}] Final audio file written successfully.`);

            try {
              // Create a File object for OpenAI
              const file = createReadStream(audioPath)
              console.log(`[${clientId}] Sending final audio to OpenAI for transcription...`);
              console.log(`[${clientId}] OpenAI API Key length:`, process.env.OPENAI_API_KEY?.length || 'not set');
              console.log(`[${clientId}] Audio file size:`, audioBuffer.length, 'bytes');
              try {
                console.log(`[${clientId}] Calling OpenAI API...`);
                const transcription = await openai.audio.transcriptions.create({
                  file,
                  model: "whisper-1",
                })
                console.log(`[${clientId}] Final transcription received from OpenAI:`, transcription);

                // Send final transcription back to client
                ws.send(JSON.stringify({
                  type: "transcription",
                  text: transcription.text,
                  isFinal: true,
                }))
                console.log(`[${clientId}] Sent final transcription to client.`);
              } catch (error: any) {
                console.error(`[${clientId}] OpenAI API Error:`, error);
                console.error(`[${clientId}] OpenAI API Error details:`, {
                  message: error.message,
                  status: error.status,
                  response: error.response?.data,
                });
                ws.send(JSON.stringify({
                  type: "error",
                  message: "Failed to transcribe audio: " + (error.message || 'Unknown OpenAI error'),
                }));
              }

              // Clean up
              audioChunks.delete(clientId)
              transcriptionBuffers.delete(clientId)
              console.log(`[${clientId}] Cleaned up resources.`);
            } catch (error) {
              console.error(`[${clientId}] Transcription error:`, error)
              ws.send(JSON.stringify({
                type: "error",
                message: "Failed to transcribe audio",
              }))
            }
          } else {
             console.log(`[${clientId}] Stop signal received, but no audio chunks found.`);
          }
          return
        }
      } else {
         console.log(`[${clientId}] Received audio data chunk.`);
      }

      // Handle audio chunks
      const chunks = audioChunks.get(clientId)
      if (chunks) {
        chunks.push(data)

        // Every 5 seconds, send a partial transcription
        if (chunks.length % 5 === 0) {
          console.log(`[${clientId}] Processing ${chunks.length} audio chunks for partial transcription.`);
          const partialBuffer = Buffer.concat(chunks.slice(-5))
          const partialPath = join(tmpDir, `${clientId}_partial.webm`)
          console.log(`[${clientId}] Writing partial audio to: ${partialPath}`);
          await writeFile(partialPath, partialBuffer)
          console.log(`[${clientId}] Partial audio file written successfully.`);

          try {
            // Create a File object for OpenAI
            const file = createReadStream(partialPath)
            console.log(`[${clientId}] Sending partial audio to OpenAI for transcription...`);
            const partialTranscription = await openai.audio.transcriptions.create({
              file,
              model: "whisper-1",
            })
             console.log(`[${clientId}] Partial transcription received from OpenAI.`);

            // Update the transcription buffer
            const currentBuffer = transcriptionBuffers.get(clientId) || ""
            transcriptionBuffers.set(clientId, currentBuffer + " " + partialTranscription.text)

            // Send partial transcription to client
            ws.send(JSON.stringify({
              type: "transcription",
              text: transcriptionBuffers.get(clientId) || "",
              isFinal: false,
            }))
            console.log(`[${clientId}] Sent partial transcription to client.`);
          } catch (error) {
            console.error(`[${clientId}] Partial transcription error:`, error)
          }
        }
      } else {
        console.warn(`[${clientId}] Received audio chunk but no chunk array found for client.`);
      }
    } catch (error) {
      console.error(`[${clientId}] Error processing message:`, error)
      ws.send(JSON.stringify({
        type: "error",
        message: "Failed to process audio",
      }))
    }
  })

  ws.on("close", () => {
    console.log(`Client disconnected: ${clientId}`)
    audioChunks.delete(clientId)
    transcriptionBuffers.delete(clientId)
  })

  ws.on('error', (error) => {
    console.error(`[${clientId}] WebSocket error for client:`, error);
    audioChunks.delete(clientId);
    transcriptionBuffers.delete(clientId);
  });
})

console.log(`WebSocket server is running on port ${process.env.WS_PORT || 3000}`) 
