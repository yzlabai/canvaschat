"use client"

import { useKeyShortcut } from "@/hooks/use-key-shortcut"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { YanConversation } from "@/lib/chat-store/types"
import { cn } from "@/lib/utils"
import { Check, PencilSimple, TrashSimple, X } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { SetStateAction, useCallback, useMemo, useRef, useState } from "react"
import { CommandFooter } from "./command-footer"
import { formatDate, groupChatsByDate } from "./utils"
import { useYan } from "@/lib/chat-store/provider"

type CommandHistoryProps = {
  chatHistory: YanConversation[]
  onSaveEdit: (id: string, newTitle: string) => Promise<void>
  onConfirmDelete: (id: string) => Promise<void>
  trigger: React.ReactNode
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  onOpenChange?: (open: boolean) => void
  hasPopover?: boolean
}

type CommandItemEditProps = {
  chat: YanConversation
  editTitle: string
  setEditTitle: (title: string) => void
  onSave: (id: string) => void
  onCancel: () => void
}

type CommandItemDeleteProps = {
  chat: YanConversation
  onConfirm: (id: string) => void
  onCancel: () => void
}

type CommandItemRowProps = {
  chat: YanConversation
  onEdit: (chat: YanConversation) => void
  onDelete: (id: string) => void
  editingId: string | null
  deletingId: string | null
}

// Component for editing a chat item
function CommandItemEdit({
  chat,
  editTitle,
  setEditTitle,
  onSave,
  onCancel,
}: CommandItemEditProps) {
  return (
    <form
      className="flex w-full items-center justify-between"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(chat.id)
      }}
    >
      <Input
        value={editTitle}
        onChange={(e) => setEditTitle(e.target.value)}
        className="border-input h-8 flex-1 rounded border bg-transparent px-3 py-1 text-sm"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            onSave(chat.id)
          }
        }}
      />
      <div className="ml-2 flex gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="group/edit-confirm text-muted-foreground hover:bg-primary/10 size-8 transition-colors duration-150"
              type="submit"
              aria-label="Confirm"
            >
              <Check className="group-hover/edit-confirm:text-primary size-4 transition-colors duration-150" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Confirm</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="group/edit-cancel text-muted-foreground hover:bg-primary/10 size-8 transition-colors duration-150"
              type="button"
              onClick={onCancel}
              aria-label="Cancel"
            >
              <X className="group-hover/edit-cancel:text-primary size-4 transition-colors duration-150" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cancel</TooltipContent>
        </Tooltip>
      </div>
    </form>
  )
}

// Component for deleting a chat item
function CommandItemDelete({
  chat,
  onConfirm,
  onCancel,
}: CommandItemDeleteProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onConfirm(chat.id)
      }}
      className="flex w-full items-center justify-between"
    >
      <div className="flex flex-1 items-center">
        <span className="line-clamp-1 text-base font-normal">{chat.title}</span>
        <input
          type="text"
          className="sr-only hidden"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault()
              onCancel()
            } else if (e.key === "Enter") {
              e.preventDefault()
              onConfirm(chat.id)
            }
          }}
        />
      </div>
      <div className="ml-2 flex gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="group/delete-confirm text-muted-foreground hover:text-destructive-foreground hover:bg-primary/10 size-8 transition-colors duration-150"
              type="submit"
              aria-label="Confirm"
            >
              <Check className="group-hover/delete-confirm:text-primary size-4 transition-colors duration-150" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Confirm</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="group/delete-cancel text-muted-foreground hover:text-foreground hover:bg-primary/10 size-8 transition-colors duration-150"
              onClick={onCancel}
              type="button"
              aria-label="Cancel"
            >
              <X className="group-hover/delete-cancel:text-primary size-4 transition-colors duration-150" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cancel</TooltipContent>
        </Tooltip>
      </div>
    </form>
  )
}

// Component for displaying a normal chat row
function CommandItemRow({
  chat,
  onEdit,
  onDelete,
  editingId,
  deletingId,
}: CommandItemRowProps) {
  const { conversationId } = useYan()
  const isCurrentChat = chat.id === conversationId

  return (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="line-clamp-1 text-base font-normal">
          {chat?.title || "Untitled Chat"}
        </span>
        {isCurrentChat && <Badge variant="outline">current</Badge>}
      </div>

      <div className="relative flex min-w-[140px] flex-shrink-0 items-center justify-end">
        <div className="text-muted-foreground mr-2 text-xs transition-opacity duration-200 group-hover:opacity-0">
          {formatDate(
            typeof chat.created_at === "string"
              ? chat.created_at
              : chat.created_at?.toISOString?.() ?? ""
          )}
        </div>

        <div className="absolute right-0 flex translate-x-1 gap-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="group/edit text-muted-foreground hover:bg-primary/10 size-8 transition-colors duration-150"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(chat)
                }}
                disabled={!!editingId || !!deletingId}
                aria-label="Edit"
              >
                <PencilSimple className="group-hover/edit:text-primary size-4 transition-colors duration-150" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Edit</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="group/delete text-muted-foreground hover:text-destructive-foreground hover:bg-primary/10 size-8 transition-colors duration-150"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(chat.id)
                }}
                disabled={!!editingId || !!deletingId}
                aria-label="Delete"
              >
                <TrashSimple className="group-hover/delete:text-primary size-4 transition-colors duration-150" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </>
  )
}

type CustomCommandDialogProps = React.ComponentProps<typeof Dialog> & {
  title?: string
  description?: string
  className?: string
  onOpenChange?: (open: boolean) => void
}

// Custom CommandDialog with className support
function CustomCommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  onOpenChange,
  open,
  ...props
}: CustomCommandDialogProps) {
  return (
    <Dialog {...props} onOpenChange={onOpenChange} open={open}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn("overflow-hidden border-none p-0", className)}
      >
        <Command className="[&_[cmdk-group-heading]]:text-muted-foreground border-none **:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5 [&_[cmdk-item]_svg]:border-none">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

export function CommandHistory({
  chatHistory,
  onSaveEdit,
  onConfirmDelete,
  trigger,
  isOpen,
  setIsOpen,
  onOpenChange,
  hasPopover = true,
}: CommandHistoryProps) {
  const { conversationId } = useYan()
  const router = useRouter()
  const hasPrefetchedRef = useRef(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null)
  const [isPreviewPanelHovered, setIsPreviewPanelHovered] = useState(false)

  if (isOpen && !hasPrefetchedRef.current) {
    const recentChats = chatHistory.slice(0, 10)
    recentChats.forEach((chat) => {
      router.prefetch(`/yan/c/${chat.id}`)
    })
    hasPrefetchedRef.current = true
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    onOpenChange?.(open)

    if (!open) {
      setSearchQuery("")
      setEditingId(null)
      setEditTitle("")
      setDeletingId(null)
      setSelectedChatId(null)
      setHoveredChatId(null)
      setIsPreviewPanelHovered(false)
      hasPrefetchedRef.current = false
    }
  }

  useKeyShortcut(
    (e: KeyboardEvent) => e.key === "k" && (e.metaKey || e.ctrlKey),
    () => handleOpenChange(!isOpen)
  )

  const handleEdit = useCallback((chat: YanConversation) => {
    setEditingId(chat.id)
    setEditTitle(chat.title || "")
  }, [])

  const handleSaveEdit = useCallback(
    async (id: string) => {
      setEditingId(null)
      await onSaveEdit(id, editTitle)
    },
    [editTitle, onSaveEdit]
  )

  const handleCancelEdit = useCallback(() => {
    setEditingId(null)
    setEditTitle("")
  }, [])

  const handleDelete = useCallback((id: string) => {
    setDeletingId(id)
  }, [])

  const handleConfirmDelete = useCallback(
    async (id: string) => {
      setDeletingId(null)
      await onConfirmDelete(id)

      // Clear preview and selection if the deleted chat was being previewed
      if (hoveredChatId === id || selectedChatId === id) {
        setHoveredChatId(null)
        setSelectedChatId(null)
      }
    },
    [onConfirmDelete, hoveredChatId, selectedChatId]
  )

  const handleCancelDelete = useCallback(() => {
    setDeletingId(null)
  }, [])

  const filteredChat = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return query
      ? chatHistory.filter((chat) =>
          (chat.title || "").toLowerCase().includes(query)
        )
      : chatHistory
  }, [chatHistory, searchQuery])

  const groupedChats = useMemo(
    () => groupChatsByDate(chatHistory, searchQuery),
    [chatHistory, searchQuery]
  )

  const activePreviewChatId =
    hoveredChatId || (isPreviewPanelHovered ? hoveredChatId : null)

  const renderChatItem = useCallback(
    (chat: YanConversation) => {
      const isCurrentChatSession = chat.id === conversationId
      const isCurrentChatEditOrDelete =
        chat.id === editingId || chat.id === deletingId
      const isEditOrDeleteMode = editingId || deletingId

      return (
        <CommandItem
          key={chat.id}
          onSelect={() => {
            if (isCurrentChatSession) {
              setIsOpen(false)
              return
            }
            if (!editingId && !deletingId) {
              router.push(`/yan/c/${chat.id}`)
            }
          }}
          className={cn(
            "group group data-[selected=true]:bg-accent flex w-full items-center justify-between rounded-md",
            isCurrentChatEditOrDelete ? "!py-2" : "py-2",
            isCurrentChatEditOrDelete &&
              "bg-accent data-[selected=true]:bg-accent",
            !isCurrentChatEditOrDelete &&
              isEditOrDeleteMode &&
              "data-[selected=true]:bg-transparent"
          )}
          value={chat.id}
        >
          {editingId === chat.id ? (
            <CommandItemEdit
              chat={chat}
              editTitle={editTitle}
              setEditTitle={setEditTitle}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />
          ) : deletingId === chat.id ? (
            <CommandItemDelete
              chat={chat}
              onConfirm={handleConfirmDelete}
              onCancel={handleCancelDelete}
            />
          ) : (
            <CommandItemRow
              chat={chat}
              onEdit={handleEdit}
              onDelete={handleDelete}
              editingId={editingId}
              deletingId={deletingId}
            />
          )}
        </CommandItem>
      )
    },
    [
      conversationId,
      router,
      setIsOpen,
      editingId,
      deletingId,
      editTitle,
      selectedChatId,
      handleSaveEdit,
      handleCancelEdit,
      handleConfirmDelete,
      handleCancelDelete,
      handleEdit,
      handleDelete,
    ]
  )

  return (
    <>
      {hasPopover ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent>History ⌘+K</TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}

      <CustomCommandDialog
        onOpenChange={handleOpenChange}
        open={isOpen}
        title="Chat History"
        description="Search through your past conversations"
        className={cn(
          "sm:max-w-3xl"
        )}
      >
        <CommandInput
          placeholder="Search history..."
          value={searchQuery}
          onValueChange={(value: SetStateAction<string>) => setSearchQuery(value)}
        />

        <div className="grid grid-cols-5">
          <div
            className={cn(
              "col-span-5"
            )}
          >
            <CommandList
              className={cn(
                "max-h-[480px] min-h-[480px] flex-1 [&>[cmdk-list-sizer]]:space-y-6 [&>[cmdk-list-sizer]]:py-2"
              )}
            >
              {filteredChat.length === 0 && (
                <CommandEmpty>No chat history found.</CommandEmpty>
              )}

              {searchQuery ? (
                <CommandGroup className="p-1.5">
                  {filteredChat.map((chat) => renderChatItem(chat))}
                </CommandGroup>
              ) : (
                groupedChats?.map((group) => (
                  <CommandGroup
                    key={group.name}
                    heading={group.name}
                    className="space-y-0 px-1.5"
                  >
                    {group.chats.map((chat) => renderChatItem(chat))}
                  </CommandGroup>
                ))
              )}
            </CommandList>
          </div>
        </div>
        <CommandFooter />
      </CustomCommandDialog>
    </>
  )
}
