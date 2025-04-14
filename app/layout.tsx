import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SupabaseProvider } from "@/components/supabase-provider"
import { MainLayout } from "@/components/layout/main-layout"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "VoiceScribe - Modern Voice Transcription",
  description: "Real-time voice-to-text transcription powered by AI",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen bg-background`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <SupabaseProvider>
            <MainLayout>
              {children}
            </MainLayout>
            <Toaster />
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'
