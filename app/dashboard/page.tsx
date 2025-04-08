"use client"

import { Card } from "@/components/ui/card"
import { useSupabase } from "@/components/supabase-provider"
import { FileText, Clock, Target, Upload, Share2, Play } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DashboardPage() {
  const { user } = useSupabase()

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to VoiceScribe. Manage your transcriptions and analyze your data.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Total Transcriptions</span>
            </div>
            <span className="text-2xl font-bold">24</span>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <span className="text-emerald-500">+4</span>
            <span className="ml-1">since last month</span>
          </div>
          <div className="mt-4 h-1 w-full bg-primary/20 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: '75%' }} />
          </div>
        </Card>

        <Card className="p-6 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Hours Processed</span>
            </div>
            <span className="text-2xl font-bold">36.5</span>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <span className="text-emerald-500">+8.5</span>
            <span className="ml-1">since last month</span>
          </div>
          <div className="mt-4 h-1 w-full bg-primary/20 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: '65%' }} />
          </div>
        </Card>

        <Card className="p-6 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">AI Precision</span>
            </div>
            <span className="text-2xl font-bold">92%</span>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <span className="text-emerald-500">+2%</span>
            <span className="ml-1">since last month</span>
          </div>
          <div className="mt-4 h-1 w-full bg-primary/20 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: '92%' }} />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="transcriptions">Transcriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Activity */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Team Meeting - Q2 Planning</p>
                    <p className="text-xs text-muted-foreground">Transcription completed • 2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Share2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Client Interview</p>
                    <p className="text-xs text-muted-foreground">File shared • 5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Play className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Podcast Episode #42</p>
                    <p className="text-xs text-muted-foreground">Transcription started • 1 day ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Annual Conference.mp4</p>
                    <p className="text-xs text-muted-foreground">File uploaded • 2 days ago</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Usage Stats */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Plan Usage</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Transcription Hours</span>
                    <span>36.5 / 50 hours</span>
                  </div>
                  <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '73%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Storage</span>
                    <span>6.5 GB / 10 GB</span>
                  </div>
                  <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '65%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Active Projects</span>
                    <span>8 / 15</span>
                  </div>
                  <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '53%' }} />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transcriptions">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Your Transcriptions</h3>
            {/* Add transcriptions list here */}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 
