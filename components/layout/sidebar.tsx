"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Settings,
  ChevronRight,
  History,
  Upload
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const sidebarLinks = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Transcriptions",
    icon: FileText,
    href: "/transcriptions",
  },
  {
    title: "Upload",
    icon: Upload,
    href: "/upload",
  },
  {
    title: "History",
    icon: History,
    href: "/history",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
  },
]

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false)
  const pathname = usePathname()

  return (
    <div
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-background border-r border-border/40 transition-all duration-300 z-30",
        isExpanded ? "w-64" : "w-16"
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="flex flex-col gap-2 p-4">
        {sidebarLinks.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href

          return (
            <Link key={link.href} href={link.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isExpanded ? "px-4" : "px-2",
                  isActive && "bg-primary/10"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
                {isExpanded && (
                  <span className="ml-2">{link.title}</span>
                )}
              </Button>
            </Link>
          )
        })}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute -right-3 top-3 h-6 w-6 rounded-full border border-border/40 bg-background",
          !isExpanded && "rotate-180"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <ChevronRight className="h-3 w-3" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>
    </div>
  )
} 
