"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, MicOff, Save, Copy, Trash, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/components/supabase-provider"
import { cn } from "@/lib/utils"

// Define types for SpeechRecognition
interface SpeechRecognitionEvent {
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      length: number;
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export function TranscriptionApp() {
  const { supabase, user } = useSupabase()
  const { toast } = useToast()
  const [isListening, setIsListening] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [title, setTitle] = useState("Untitled Transcription")
  const [isSaving, setIsSaving] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true

      recognitionRef.current.onresult = (event) => {
        let currentTranscript = ""
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + " "
        }

        // Basic punctuation handling
        currentTranscript = currentTranscript
          .replace(/\s+/g, " ")
          .replace(/\s([,.!?])/g, "$1")
          .replace(/\s+([,.!?])\s+/g, "$1 ")
          .replace(/([,.!?])([a-zA-Z])/g, "$1 $2")
          .replace(/\s+/g, " ")
          .trim()

        // Capitalize first letter of sentences
        currentTranscript = currentTranscript.replace(/([.!?]\s+)([a-z])/g, (match, p1, p2) => {
          return p1 + p2.toUpperCase()
        })

        // Capitalize the first letter of the transcript
        if (currentTranscript.length > 0) {
          currentTranscript = currentTranscript.charAt(0).toUpperCase() + currentTranscript.slice(1)
        }

        setTranscript(currentTranscript)
      }

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error)
        if (event.error === "not-allowed") {
          toast({
            title: "Microphone access denied",
            description: "Please allow microphone access to use the transcription feature.",
            variant: "destructive",
          })
          stopListening()
        }
      }
    } else {
      toast({
        title: "Speech recognition not supported",
        description: "Your browser does not support speech recognition. Please try a different browser.",
        variant: "destructive",
      })
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [toast])

  const startListening = () => {
    if (!recognitionRef.current) return

    try {
      recognitionRef.current.start()
      setIsListening(true)
      setIsPaused(false)

      // Start timer
      const start = Date.now() - elapsedTime
      setStartTime(start)
      timerRef.current = setInterval(() => {
        setElapsedTime(Date.now() - start)
      }, 1000)

      toast({
        title: "Transcription started",
        description: "Speak clearly into your microphone.",
      })
    } catch (error) {
      console.error("Error starting speech recognition:", error)
      toast({
        title: "Error starting transcription",
        description: "There was an error starting the transcription. Please try again.",
        variant: "destructive",
      })
    }
  }

  const pauseListening = () => {
    if (!recognitionRef.current) return

    try {
      recognitionRef.current.stop()
      setIsPaused(true)

      // Pause timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      toast({
        title: "Transcription paused",
        description: "Click resume to continue transcribing.",
      })
    } catch (error) {
      console.error("Error pausing speech recognition:", error)
    }
  }

  const resumeListening = () => {
    if (!recognitionRef.current) return

    try {
      recognitionRef.current.start()
      setIsPaused(false)

      // Resume timer
      if (startTime) {
        const start = Date.now() - elapsedTime
        setStartTime(start)
        timerRef.current = setInterval(() => {
          setElapsedTime(Date.now() - start)
        }, 1000)
      }

      toast({
        title: "Transcription resumed",
        description: "Continue speaking into your microphone.",
      })
    } catch (error) {
      console.error("Error resuming speech recognition:", error)
    }
  }

  const stopListening = () => {
    if (!recognitionRef.current) return

    try {
      recognitionRef.current.stop()
      setIsListening(false)
      setIsPaused(false)

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }

      toast({
        title: "Transcription stopped",
        description: "Your transcription is ready.",
      })
    } catch (error) {
      console.error("Error stopping speech recognition:", error)
    }
  }

  const resetTranscription = () => {
    setTranscript("")
    setTitle("Untitled Transcription")
    setElapsedTime(0)
    setStartTime(null)

    toast({
      title: "Transcription reset",
      description: "Your transcription has been cleared.",
    })
  }

  const copyTranscription = () => {
    if (!transcript) {
      toast({
        title: "Nothing to copy",
        description: "Start a transcription first.",
        variant: "destructive",
      })
      return
    }

    navigator.clipboard.writeText(transcript)
    toast({
      title: "Copied to clipboard",
      description: "Your transcription has been copied to the clipboard.",
    })
  }

  const saveTranscription = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save your transcription.",
        variant: "destructive",
      })
      return
    }

    if (!transcript) {
      toast({
        title: "Nothing to save",
        description: "Start a transcription first.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const { error } = await supabase.from("transcriptions").insert({
        user_id: user.id,
        title,
        content: transcript,
        duration: Math.floor(elapsedTime / 1000),
      })

      if (error) throw error

      toast({
        title: "Transcription saved",
        description: "Your transcription has been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving transcription:", error)
      toast({
        title: "Error saving transcription",
        description: "There was an error saving your transcription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60)
    const minutes = Math.floor((ms / (1000 * 60)) % 60)
    const hours = Math.floor(ms / (1000 * 60 * 60))

    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      seconds.toString().padStart(2, "0"),
    ].join(":")
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-medium"
              placeholder="Enter a title for your transcription"
            />
          </div>
          <div className="flex flex-col space-y-2">
            <Label htmlFor="transcript">Transcript</Label>
            <Textarea
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="min-h-[200px] resize-y font-medium"
              placeholder="Your transcription will appear here..."
            />
          </div>
          <div className="flex flex-wrap gap-2 justify-between items-center pt-4">
            <div className="flex gap-2">
              {!isListening ? (
                <Button onClick={startListening} className="gap-2">
                  <Mic className="h-4 w-4" />
                  Start Recording
                </Button>
              ) : (
                <>
                  {!isPaused ? (
                    <Button onClick={pauseListening} variant="secondary" className="gap-2">
                      <MicOff className="h-4 w-4" />
                      Pause
                    </Button>
                  ) : (
                    <Button onClick={resumeListening} variant="secondary" className="gap-2">
                      <Mic className="h-4 w-4" />
                      Resume
                    </Button>
                  )}
                  <Button onClick={stopListening} variant="destructive" className="gap-2">
                    <MicOff className="h-4 w-4" />
                    Stop
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={copyTranscription}
                variant="outline"
                className="gap-2"
                disabled={!transcript}
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
              <Button
                onClick={resetTranscription}
                variant="outline"
                className="gap-2"
                disabled={!transcript && title === "Untitled Transcription"}
              >
                <Trash className="h-4 w-4" />
                Reset
              </Button>
              {user && (
                <Button
                  onClick={saveTranscription}
                  className="gap-2"
                  disabled={isSaving || !transcript}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      {isListening && (
        <div className="text-center text-sm text-muted-foreground">
          Recording time: {formatTime(elapsedTime)}
        </div>
      )}
    </div>
  )
}

