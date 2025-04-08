"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mic, Copy, Save, Trash2, StopCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/components/supabase-provider"

export default function HomePage() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcription, setTranscription] = useState("")
  const [title, setTitle] = useState("")
  const { toast } = useToast()
  const { user, supabase } = useSupabase()
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const startRecording = async () => {
    if (!title) {
      toast({
        title: "Title Required",
        description: "Please enter a title before starting the recording",
        variant: "destructive",
      })
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      mediaRecorder.start()
      setIsRecording(true)

      // For now, we'll just simulate transcription
      mediaRecorder.ondataavailable = () => {
        // Here you would normally send the audio data to your transcription service
        // For now, we'll just append some placeholder text
        setTranscription(prev => prev + "Sample transcription text... ")
      }
    } catch (error) {
      console.error("Error accessing microphone:", error)
      toast({
        title: "Error",
        description: "Could not access microphone. Please check your permissions.",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }

  const copyTranscription = async () => {
    try {
      await navigator.clipboard.writeText(transcription)
      toast({
        title: "Copied!",
        description: "Transcription copied to clipboard",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy transcription",
        variant: "destructive",
      })
    }
  }

  const resetTranscription = () => {
    if (isRecording) {
      stopRecording()
    }
    setTranscription("")
    setTitle("")
  }

  const saveTranscription = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save transcriptions",
        variant: "destructive",
      })
      return
    }

    if (!title) {
      toast({
        title: "Title required",
        description: "Please enter a title for your transcription",
        variant: "destructive",
      })
      return
    }
    
    try {
      const { error } = await supabase
        .from('transcriptions')
        .insert([
          {
            title,
            content: transcription,
            user_id: user.id,
            created_at: new Date().toISOString(),
          }
        ])

      if (error) throw error

      toast({
        title: "Success",
        description: `Transcription saved as "${title}"`,
      })
    } catch (error) {
      console.error('Error saving transcription:', error)
      toast({
        title: "Error",
        description: "Failed to save transcription. Please try again.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [isRecording])

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Input
            type="text"
            placeholder="Enter transcription title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1"
            disabled={isRecording}
          />
          
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? "destructive" : "default"}
            className="w-40 shrink-0"
          >
            {isRecording ? (
              <>
                <StopCircle className="mr-2 h-4 w-4" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="mr-2 h-4 w-4" />
                Start Recording
              </>
            )}
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={copyTranscription}
              disabled={!transcription}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
            <Button
              variant="outline"
              onClick={resetTranscription}
              disabled={!transcription && !title}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button
              onClick={saveTranscription}
              disabled={!transcription || !title || isRecording}
            >
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </div>

        <Textarea
          placeholder="Your transcription will appear here..."
          value={transcription}
          onChange={(e) => setTranscription(e.target.value)}
          className="min-h-[300px] resize-none"
        />
      </div>
    </div>
  )
}

