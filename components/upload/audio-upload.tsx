"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, FileAudio, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useSupabase } from "@/components/supabase-provider"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_AUDIO_TYPES = {
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
}

export function AudioUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()
  const { supabase, user } = useSupabase()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Please upload an audio file smaller than 10MB",
        variant: "destructive",
      })
      return
    }

    setFile(file)
  }, [toast])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_AUDIO_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: false,
  })

  const handleUpload = async () => {
    if (!file || !user) return

    try {
      setUploading(true)
      setProgress(0)

      // Sanitize filename
      const timestamp = new Date().getTime()
      const sanitizedFilename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const filePath = `${user.id}/audio/${sanitizedFilename}`

      const { error } = await supabase.storage
        .from('audio-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
          metadata: {
            owner: user.id,
            uploadedAt: new Date().toISOString(),
            originalName: file.name
          }
        })

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('audio-uploads')
        .getPublicUrl(filePath)

      toast({
        title: "Upload successful",
        description: "Your audio file has been uploaded",
      })

      // Reset state
      setFile(null)
      setProgress(0)

    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? "border-primary bg-primary/10" : "border-border"}
          ${file ? "border-success bg-success/10" : ""}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          {file ? (
            <>
              <FileAudio className="h-8 w-8 text-success" />
              <p className="text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setFile(null)
                }}
              >
                <X className="h-4 w-4" />
                Remove
              </Button>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">
                {isDragActive ? "Drop the audio file here" : "Drag & drop an audio file"}
              </p>
              <p className="text-xs text-muted-foreground">
                MP3 files up to 10MB
              </p>
            </>
          )}
        </div>
      </div>

      {file && (
        <div className="space-y-2">
          {uploading && (
            <Progress value={progress} className="h-2" />
          )}
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading... {progress}%
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload Audio
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
} 
