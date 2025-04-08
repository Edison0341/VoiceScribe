"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Mic, Clock, Trash2, ArrowLeft, Loader2 } from "lucide-react"
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

export default function TranscriptionsPage() {
  const { supabase, user, loading: userLoading } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    if (userLoading) return

    if (!user) {
      router.push("/")
      return
    }

    const fetchTranscriptions = async () => {
      try {
        const { data, error } = await supabase
          .from("transcriptions")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) throw error

        setTranscriptions(data || [])
      } catch (error) {
        console.error("Error fetching transcriptions:", error)
        toast({
          title: "Error fetching transcriptions",
          description: "There was an error fetching your transcriptions. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTranscriptions()
  }, [supabase, user, userLoading, router, toast])

  const deleteTranscription = async (id: string) => {
    try {
      setDeleting(id)

      const { error } = await supabase.from("transcriptions").delete().eq("id", id)

      if (error) throw error

      setTranscriptions(transcriptions.filter((t) => t.id !== id))

      toast({
        title: "Transcription deleted",
        description: "Your transcription has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting transcription:", error)
      toast({
        title: "Error deleting transcription",
        description: "There was an error deleting your transcription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleting(null)
    }
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">My Transcriptions</h1>
            <p className="text-muted-foreground">View and manage your saved transcriptions</p>
          </div>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Transcribe
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : transcriptions.length === 0 ? (
          <Card className="border-dashed border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Mic className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No transcriptions yet</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                You haven't saved any transcriptions yet. Start recording and save your transcriptions to see them here.
              </p>
              <Button asChild>
                <Link href="/">Start Transcribing</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {transcriptions.map((transcription) => (
              <Card key={transcription.id} className="overflow-hidden border-border/50 transition-all hover:shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="line-clamp-1">{transcription.title}</CardTitle>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(transcription.created_at), "MMM d, yyyy")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mic className="h-3 w-3" />
                      {formatDuration(transcription.duration)}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="line-clamp-3 text-sm text-muted-foreground">{transcription.content}</p>
                </CardContent>
                <CardFooter className="flex justify-between pt-0">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/transcriptions/${transcription.id}`}>View Details</Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                    onClick={() => deleteTranscription(transcription.id)}
                    disabled={deleting === transcription.id}
                  >
                    {deleting === transcription.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

