"use client"

import { useSupabase } from "@/components/supabase-provider"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/layout/sidebar"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user } = useSupabase()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {user && <Sidebar />}
      <main className={`transition-all duration-300 ${user ? "ml-16" : ""}`}>
        {children}
      </main>
    </div>
  )
} 
