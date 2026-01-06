"use client"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { ListMagnifyingGlassIcon } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { CommandHistory } from "./command-history"
import { DrawerHistory } from "./drawer-history"
import { useYan } from "@/lib/chat-store/provider"

type HistoryTriggerProps = {
  classNameTrigger?: string
  icon?: React.ReactNode
  label?: React.ReactNode | string
  hasPopover?: boolean
}

export function HistoryTrigger({
  classNameTrigger,
  icon,
  label,
  hasPopover = true,
}: HistoryTriggerProps) {
  const isMobile = useIsMobile()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const { conversations, updateConversationTitle, deleteConversation, deleteMessages, conversationId } = useYan()

  const handleSaveEdit = async (id: string, newTitle: string) => {
    await updateConversationTitle(id, newTitle)
  }

  const handleConfirmDelete = async (id: string) => {
    if (id === conversationId) {
      setIsOpen(false)
    }
    await deleteMessages()
    await deleteConversation(id, conversationId ?? undefined, () => router.push("/"))
  }

  const defaultTrigger = (
    <button
      className={cn(
        "text-muted-foreground hover:text-foreground hover:bg-muted bg-background pointer-events-auto rounded-full p-1.5 transition-colors",
        "block",
        classNameTrigger
      )}
      type="button"
      onClick={() => setIsOpen(true)}
      aria-label="Search"
      tabIndex={isMobile ? -1 : 0}
    >
      {icon || <ListMagnifyingGlassIcon size={24} />}
      {label}
    </button>
  )

  if (isMobile) {
    return (
      <DrawerHistory
        chatHistory={conversations}
        onSaveEdit={handleSaveEdit}
        onConfirmDelete={handleConfirmDelete}
        trigger={defaultTrigger}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
    )
  }

  return (
    <CommandHistory
      chatHistory={conversations}
      onSaveEdit={handleSaveEdit}
      onConfirmDelete={handleConfirmDelete}
      trigger={defaultTrigger}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      onOpenChange={setIsOpen}
      hasPopover={hasPopover}
    />
  )
}
