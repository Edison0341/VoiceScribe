import { WebSocketServer, WebSocket } from "ws"
import { writeFile, readFile } from "fs/promises"
import { join } from "path"
import OpenAI from "openai"
import { config } from "dotenv"
import { mkdir } from "fs/promises"

config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Create tmp directory if it doesn't exist
const tmpDir = join(process.cwd(), "tmp")
mkdir(tmpDir).catch(() => {})

const wss = new WebSocketServer({ port: Number(process.env.WS_PORT) || 3001 })
const audioChunks: Map<string, Buffer[]> = new Map()
const transcriptionBuffers: Map<string, string> = new Map()

wss.on("connection", (ws: WebSocket) => {
  const clientId = Math.random().toString(36).substring(7)
  audioChunks.set(clientId, [])
  transcriptionBuffers.set(clientId, "")

  console.log(`Client connected: ${clientId}`)

  ws.on("message", async (data: Buffer) => {
    try {
      // Check if the message is a stop signal
      if (data.toString().startsWith("{")) {
        const message = JSON.parse(data.toString())
        if (message.type === "stop") {
          const chunks = audioChunks.get(clientId)
          if (chunks && chunks.length > 0) {
            const audioBuffer = Buffer.concat(chunks)
            const audioPath = join(tmpDir, `${clientId}.webm`)
            
            // Save the audio file
            await writeFile(audioPath, audioBuffer)

            try {
              // Transcribe the audio using OpenAI Whisper
              const transcription = await openai.audio.transcriptions.create({
                file: new File([audioBuffer], `${clientId}.webm`, {
                  type: "audio/webm",
                }),
                model: "whisper-1",
              })

              // Send final transcription back to client
              ws.send(JSON.stringify({
                type: "transcription",
                text: transcription.text,
                isFinal: true,
              }))

              // Clean up
              audioChunks.delete(clientId)
              transcriptionBuffers.delete(clientId)
            } catch (error) {
              console.error("Transcription error:", error)
              ws.send(JSON.stringify({
                type: "error",
                message: "Failed to transcribe audio",
              }))
            }
          }
          return
        }
      }

      // Handle audio chunks
      const chunks = audioChunks.get(clientId)
      if (chunks) {
        chunks.push(data)

        // Every 5 seconds, send a partial transcription
        if (chunks.length % 5 === 0) {
          const partialBuffer = Buffer.concat(chunks.slice(-5))
          const partialPath = join(tmpDir, `${clientId}_partial.webm`)
          await writeFile(partialPath, partialBuffer)

          try {
            const partialTranscription = await openai.audio.transcriptions.create({
              file: new File([partialBuffer], `${clientId}_partial.webm`, {
                type: "audio/webm",
              }),
              model: "whisper-1",
            })

            // Update the transcription buffer
            const currentBuffer = transcriptionBuffers.get(clientId) || ""
            transcriptionBuffers.set(clientId, currentBuffer + " " + partialTranscription.text)

            // Send partial transcription to client
            ws.send(JSON.stringify({
              type: "transcription",
              text: transcriptionBuffers.get(clientId) || "",
              isFinal: false,
            }))
          } catch (error) {
            console.error("Partial transcription error:", error)
          }
        }
      }
    } catch (error) {
      console.error("Error processing audio:", error)
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
})

console.log(`WebSocket server running on port ${process.env.WS_PORT || 3001}`) 
