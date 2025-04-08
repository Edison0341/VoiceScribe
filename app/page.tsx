"use client"

import { useState, useCallback } from "react"
import { AudioRecorder } from "@/components/audio-recorder"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useSupabase } from "@/components/supabase-provider"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function HomePage() {
  const [transcription, setTranscription] = useState("")
  const [title, setTitle] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const { user } = useSupabase()
  const { toast } = useToast()

  const handleTranscriptionUpdate = useCallback((text: string, isFinal: boolean) => {
    setTranscription(text)
    if (isFinal) {
      setIsRecording(false)
    }
  }, [])

  const handleRecordingStateChange = useCallback((recording: boolean) => {
    setIsRecording(recording)
    if (recording) {
      setTranscription("") // Clear transcription when starting
    }
  }, [])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(transcription)
      .then(() => {
        toast({
          title: "Copied!",
          description: "Transcription copied to clipboard.",
        })
      })
      .catch(err => {
        console.error("Failed to copy text: ", err)
        toast({
          title: "Error",
          description: "Failed to copy transcription.",
          variant: "destructive",
        })
      })
  }

  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold">Voice Transcription</h1>
        <p className="text-muted-foreground">
          Record your voice and get instant transcription using AI.
        </p>
      </div>

      <div className="grid gap-6">
        <Card className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="title"
                placeholder="Enter a title for your transcription..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full"
                disabled={isRecording}
              />
            </div>
            <AudioRecorder 
              onTranscriptionComplete={handleTranscriptionUpdate}
              onRecordingStateChange={handleRecordingStateChange}
            />
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                {title || "Untitled Transcription"}
              </h2>
              {transcription && (
                <Button variant="ghost" size="icon" onClick={copyToClipboard} disabled={!transcription}>
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copy transcription</span>
                </Button>
              )}
            </div>
            <div className="p-4 bg-muted rounded-lg min-h-[200px]">
              <p className="text-muted-foreground whitespace-pre-wrap">
                {transcription || (isRecording ? "Recording in progress..." : "Your transcription will appear here...")}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

