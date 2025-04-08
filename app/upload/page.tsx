"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/components/supabase-provider"
import { AudioUpload } from "@/components/upload/audio-upload"

export default function UploadPage() {
  const { user, loading } = useSupabase()
  const router = useRouter()

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="container max-w-2xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Upload Audio</h1>
        <p className="text-muted-foreground">
          Upload your audio files for transcription. Supported formats: MP3
        </p>
      </div>

      <AudioUpload />
    </div>
  )
} 
