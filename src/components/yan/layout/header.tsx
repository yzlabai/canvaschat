"use client"

import { ButtonNewChat } from "@/components/yan/layout/button-new-chat"
import { APP_NAME } from "@/lib/config"
import Link from "next/link"
import { HeaderSidebarTrigger } from "./header-sidebar-trigger"
import { useAppContext } from "@/contexts/app"
import { HistoryTrigger } from "@/components/yan/history/history-trigger"

export function Header({title}: {title?: string}) {
  const { user } = useAppContext()
  const isLoggedIn = !!user

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear sticky top-0 bg-white rounded-t-md shadow z-10">
      <div className="flex-1 flex items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <HeaderSidebarTrigger />
          <Link
            href="/"
            className="pointer-events-auto inline-flex items-center text-xl font-medium tracking-tight"
          >
            {title || APP_NAME}
          </Link>
        
      </div>
      <div />
      {!isLoggedIn ? (
        <div className="pointer-events-auto flex flex-1 items-center justify-end gap-4 px-4 lg:gap-4 lg:px-6">
          <Link
            href="/auth"
            className="font-base text-muted-foreground hover:text-foreground text-base transition-colors"
          >
            Login
          </Link>
        </div>
      ) : (
        <div className="pointer-events-auto flex flex-1 items-center justify-end gap-2 px-4 lg:gap-2 lg:px-6">
          <ButtonNewChat />
          <HistoryTrigger />
        </div>
      )}
    </header>
  )
}
