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
  const [hasMicrophonePermission, setHasMicrophonePermission] = useState<boolean | null>(null)
  const { toast } = useToast()
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [recordingTime, setRecordingTime] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Check if the browser supports getUserMedia
    if (!navigator.mediaDevices?.getUserMedia) {
      toast({
        title: "Browser not supported",
        description: "Your browser doesn't support audio recording.",
        variant: "destructive",
      })
      return
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000";
    console.log("Attempting to connect WebSocket to:", wsUrl);

    // Initialize WebSocket connection
    const ws = new WebSocket(wsUrl)
    
    ws.onopen = () => {
      console.log("WebSocket connected")
    }

    ws.onmessage = (event) => {
      console.log("WebSocket message received:", event.data);
      try {
        const data = JSON.parse(event.data)
        console.log("Parsed WebSocket message:", data);
        if (data.type === "transcription") {
          console.log("Transcription received:", data.text);
          if (onTranscriptionComplete) {
            onTranscriptionComplete(data.text, data.isFinal)
          }
        } else if (data.type === "error") {
          console.error("Error from server:", data.message);
          toast({
            title: "Transcription error",
            description: data.message || "An error occurred during transcription.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    }

    ws.onerror = (event) => {
      console.error("WebSocket error event:", event);
      toast({
        title: "Connection error",
        description: "Failed to connect to transcription service. Please try again.",
        variant: "destructive",
      })
    }

    wsRef.current = ws

    // Check microphone permission status
    navigator.permissions.query({ name: 'microphone' as PermissionName })
      .then((permissionStatus) => {
        setHasMicrophonePermission(permissionStatus.state === 'granted')
        
        permissionStatus.onchange = () => {
          setHasMicrophonePermission(permissionStatus.state === 'granted')
        }
      })
      .catch(error => {
        console.error("Error checking microphone permission:", error)
      })

    return () => {
      ws.close()
    }
  }, [toast, onTranscriptionComplete])

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const requestMicrophonePermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      setHasMicrophonePermission(true)
      startRecording()
    } catch (error) {
      console.error("Error requesting microphone permission:", error)
      toast({
        title: "Permission denied",
        description: "Please allow microphone access to record audio. You may need to enable it in your browser settings.",
        variant: "destructive",
      })
      setHasMicrophonePermission(false)
    }
  }

  const startRecording = async () => {
    console.log("Attempting to start recording...");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log("Microphone access granted.");
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        console.log(`ondataavailable event fired. Data size: ${event.data.size}`);
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
          // Send audio chunk through WebSocket
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            console.log("WebSocket OPEN, sending audio chunk...");
            wsRef.current.send(event.data)
          } else {
            console.log(`WebSocket not open. State: ${wsRef.current?.readyState}`);
          }
        }
      }

      mediaRecorder.onstop = () => {
        console.log("mediaRecorder.onstop event fired.");
        // Send stop signal to server
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          console.log("WebSocket OPEN, sending stop signal...");
          wsRef.current.send(JSON.stringify({ type: "stop" }))
        } else {
           console.log(`WebSocket not open on stop. State: ${wsRef.current?.readyState}`);
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        toast({
          title: "Recording Error",
          description: "An error occurred with the media recorder.",
          variant: "destructive",
        });
      };

      mediaRecorder.start(1000) // Collect data every second
      console.log("MediaRecorder started.");
      setIsRecording(true)
      onRecordingStateChange?.(true)
    } catch (error) {
      console.error("Error starting recording:", error)
      toast({
        title: "Recording error",
        description: "Failed to start recording. Please check your microphone settings.",
        variant: "destructive",
      })
    }
  }

  const stopRecording = async () => {
    console.log("Attempting to stop recording...");
    try {
      if (!mediaRecorderRef.current) return

      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      onRecordingStateChange?.(false)
      setIsProcessing(true)
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

  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording()
    } else if (hasMicrophonePermission === true) {
      startRecording()
    } else {
      requestMicrophonePermission()
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Button
        onClick={handleRecordClick}
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
      {isRecording && <span>{formatTime(recordingTime)}</span>}
    </div>
  )
} 
