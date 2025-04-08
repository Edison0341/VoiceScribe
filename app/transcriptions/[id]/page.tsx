"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, Clock, Copy, Mic, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useSupabase } from "@/components/supabase-provider"

interface Transcription {
  id: string
  title: string
  content: string
  duration: number
  created_at: string
}

export default function TranscriptionDetailPage({ params }: { params: { id: string } }) {
  const { supabase, user, loading: userLoading } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()
  const [transcription, setTranscription] = useState<Transcription | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (userLoading) return

    if (!user) {
      router.push("/")
      return
    }

    const fetchTranscription = async () => {
      try {
        const { data, error } = await supabase.from("transcriptions").select("*").eq("id", params.id).single()

        if (error) throw error

        setTranscription(data)
      } catch (error) {
        console.error("Error fetching transcription:", error)
        toast({
          title: "Error fetching transcription",
          description: "There was an error fetching your transcription. Please try again.",
          variant: "destructive",
        })
        router.push("/transcriptions")
      } finally {
        setLoading(false)
      }
    }

    fetchTranscription()
  }, [supabase, user, userLoading, params.id, router, toast])

  const deleteTranscription = async () => {
    try {
      setDeleting(true)

      const { error } = await supabase.from("transcriptions").delete().eq("id", params.id)

      if (error) throw error

      toast({
        title: "Transcription deleted",
        description: "Your transcription has been deleted successfully.",
      })

      router.push("/transcriptions")
    } catch (error) {
      console.error("Error deleting transcription:", error)
      toast({
        title: "Error deleting transcription",
        description: "There was an error deleting your transcription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const copyTranscription = () => {
    if (!transcription) return

    navigator.clipboard.writeText(transcription.content)
    toast({
      title: "Copied to clipboard",
      description: "Your transcription has been copied to the clipboard.",
    })
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    } else {
      return `${remainingSeconds}s`
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 container max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Button asChild variant="outline" className="gap-2 mr-4">
            <Link href="/transcriptions">
              <ArrowLeft className="h-4 w-4" />
              Back to Transcriptions
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : transcription ? (
          <Card className="overflow-hidden border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">{transcription.title}</CardTitle>
              <CardDescription className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(transcription.created_at), "MMMM d, yyyy 'at' h:mm a")}
                </span>
                <span className="flex items-center gap-1">
                  <Mic className="h-3 w-3" />
                  {formatDuration(transcription.duration)}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-background/50 rounded-md p-4 whitespace-pre-wrap text-lg leading-relaxed">
                {transcription.content}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between pt-4 border-t">
              <Button variant="outline" className="gap-2" onClick={copyTranscription}>
                <Copy className="h-4 w-4" />
                Copy Text
              </Button>
              <Button variant="destructive" className="gap-2" onClick={deleteTranscription} disabled={deleting}>
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Transcription not found.</p>
          </div>
        )}
      </main>
      <footer className="py-6 border-t border-border/40">
        <div className="container max-w-5xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} VoiceScribe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

