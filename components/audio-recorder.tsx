"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Mic, Square, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface AudioRecorderProps {
  onTranscriptionComplete?: (text: string, isFinal: boolean) => void
  onRecordingStateChange?: (isRecording: boolean) => void
}

export function AudioRecorder({ onTranscriptionComplete, onRecordingStateChange }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    // Initialize WebSocket connection
    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3001")
    
    ws.onopen = () => {
      console.log("WebSocket connected")
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === "transcription") {
        if (onTranscriptionComplete) {
          onTranscriptionComplete(data.text, data.isFinal)
        }
      }
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
      toast({
        title: "Connection error",
        description: "Failed to connect to transcription service",
        variant: "destructive",
      })
    }

    wsRef.current = ws

    return () => {
      ws.close()
    }
  }, [toast, onTranscriptionComplete])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
          // Send audio chunk through WebSocket
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(event.data)
          }
        }
      }

      mediaRecorder.onstop = () => {
        // Send stop signal to server
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "stop" }))
        }
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      onRecordingStateChange?.(true)
    } catch (error) {
      console.error("Error starting recording:", error)
      toast({
        title: "Recording error",
        description: "Failed to start recording. Please check your microphone permissions.",
        variant: "destructive",
      })
    }
  }

  const stopRecording = async () => {
    try {
      if (!mediaRecorderRef.current) return

      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      onRecordingStateChange?.(false)
      setIsProcessing(true)

      // The onstop handler will send the stop signal to the server
      // and the server will respond with the transcription
    } catch (error) {
      console.error("Error stopping recording:", error)
      toast({
        title: "Recording error",
        description: "Failed to stop recording",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        variant={isRecording ? "destructive" : "default"}
        size="lg"
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : isRecording ? (
          <Square className="h-4 w-4 mr-2" />
        ) : (
          <Mic className="h-4 w-4 mr-2" />
        )}
        {isProcessing ? "Processing..." : isRecording ? "Stop Recording" : "Start Recording"}
      </Button>
    </div>
  )
} 
