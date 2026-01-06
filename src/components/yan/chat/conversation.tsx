import {
  ChatContainerContent,
  ChatContainerRoot,
} from "@/components/ui/chat-container"
import { Loader } from "@/components/ui/loader"
import { ScrollButton } from "@/components/ui/scroll-button"
import { useRef } from "react"
import { MyUIMessage } from "@/types/api.types"
import { MessageUser } from "./message-user"
import { MessageAssistant } from "./message-assistant"
import { CanvasChatStatus } from "@/lib/chat-store/provider"

type ConversationProps = {
  messages: MyUIMessage[]
  status?: "streaming" | "ready" | "submitted" | "error"
  canvasStatus?: CanvasChatStatus
  onDelete: (id: string) => void
  onEdit: (id: string, newText: string) => void
}

export function Conversation({
  messages,
  status = "ready",
  canvasStatus,
  onDelete,
  onEdit,
}: ConversationProps) {
  const initialMessageCount = useRef(messages.length)


  if (!messages || messages.length === 0) {
    console.log("Conversation: No messages to display. Messages:", messages)
    return <div className="h-full w-full"></div>
  }
  console.log("Rendering <Conversation /> with messages status:", status)
  return (
      <ChatContainerRoot className="relative w-full">
        <ChatContainerContent
          className="flex w-full flex-col items-center pt-20 pb-4"
          style={{
            scrollbarGutter: "stable both-edges",
            scrollbarWidth: "none",
          }}
        >
          {messages?.map((message, index) => {
            const isLast =
              index === messages.length - 1 && status !== "submitted"
            const hasScrollAnchor =
              isLast && messages.length > initialMessageCount.current
            const role = message.role
            const parts = message.parts || []
            const id = message.id
            const attachments = message.attachments || []

              if (role === "user") {
                return (
                  <MessageUser
                    key={id}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    id={id}
                    hasScrollAnchor={hasScrollAnchor}
                    attachments={attachments}
                    content={message.content || ""}
                  />
                )
              } else if (role === "assistant") {
                return (
                  <MessageAssistant
                    key={id}
                    message={message}
                    isLast={isLast}
                    hasScrollAnchor={hasScrollAnchor}
                    parts={parts}
                    status={status}
                  />
                )
              } else {
                return null
              }
          })}
          {(canvasStatus === "loading") &&
            messages.length > 0 && (
              <div className="group min-h-scroll-anchor flex w-full max-w-3xl flex-col items-start gap-2 px-6 pb-2">
                <Loader />
              </div>
            )}
          <div className="absolute bottom-0 flex w-full max-w-3xl flex-1 items-end justify-end gap-4 px-6 pb-2">
            <ScrollButton className="absolute top-[-50px] right-[30px]" />
          </div>
        </ChatContainerContent>
      </ChatContainerRoot>

  )
}
