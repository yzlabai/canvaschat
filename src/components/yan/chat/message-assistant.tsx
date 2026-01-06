import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
} from "@/components/ui/message"
import { cn } from "@/lib/utils"
import type { UIMessage as MessageAISDK } from "@ai-sdk/react"
import { CheckIcon, CopyIcon } from "@phosphor-icons/react"
// import { getSources } from "./get-sources"
import { useState } from "react"
import { getToolName, isToolUIPart } from "ai"
import MultiModels from "../tools/multimodels"
import { MyUIMessage } from "@/types/api.types"
import { Reasoning, ReasoningContent, ReasoningTrigger } from "@/components/ui/reasoning"

type MessageAssistantProps = {
  message: MyUIMessage
  isLast?: boolean
  hasScrollAnchor?: boolean
  parts?: MessageAISDK["parts"]
  status?: string //"streaming" | "ready" | "submitted" | "error"
  className?: string
}

export function MessageAssistant({
  message,
  isLast,
  hasScrollAnchor,
  parts,
  status,
  className,
}: MessageAssistantProps) {
  const [copied, setCopied] = useState(false)

  const { id } = message
  const textParts = parts?.filter((part) => part.type === "text") || []
  const content = textParts?.[0]?.text || ""
  const textNullOrEmpty = textParts?.length === 0 || textParts?.[0]?.text === ""
  const isLastStreaming = status === "streaming" && isLast

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 500)
  }

  return (
    <Message
      className={cn(
        "group flex w-full max-w-3xl flex-1 items-start gap-4 px-6 pb-2",
        hasScrollAnchor && "min-h-scroll-anchor",
        className
      )}
    >
      <div className={cn("flex min-w-full flex-col gap-2", isLast && "pb-8")}>
        {
          parts?.map((part, index) => {
            const key = `${id}-${index}`;
            if (part.type === "reasoning" && part.text) {
              return (
                <Reasoning key={key} isStreaming={status === "streaming"}>
                  <ReasoningTrigger>Thinking</ReasoningTrigger>
                  <ReasoningContent
                    markdown
                    className="ml-2 border-l-2 border-l-slate-200 px-2 pb-1 dark:border-l-slate-700">
                    {part.text}
                  </ReasoningContent>
                </Reasoning>
              )
            }
            if (part.type === "text") {
              return (
                <MessageContent
                  key={key}
                  className={cn(
                    "prose dark:prose-invert relative min-w-full bg-transparent p-0",
                    "prose-h1:scroll-m-20 prose-h1:text-2xl prose-h1:font-semibold prose-h2:mt-8 prose-h2:scroll-m-20 prose-h2:text-xl prose-h2:mb-3 prose-h2:font-medium prose-h3:scroll-m-20 prose-h3:text-base prose-h3:font-medium prose-h4:scroll-m-20 prose-h5:scroll-m-20 prose-h6:scroll-m-20 prose-strong:font-medium prose-table:block prose-table:overflow-y-auto"
                  )}
                >
                  {part.text}
                </MessageContent>
              )
            }
            if (isToolUIPart(part)) {
              if (part.type === "tool-multipleModels") {
                return (
                  <MultiModels
                    key={key}
                    wkey={key}
                    toolPart={part as any}
                  />
                )
              }
            }
            return null
          })
        }

        {Boolean(isLastStreaming || textNullOrEmpty) ? null : (
          <MessageActions
            className={cn(
              "-ml-2 flex gap-0 opacity-0 transition-opacity group-hover:opacity-100"
            )}
          >
            <MessageAction
              tooltip={copied ? "Copied!" : "Copy text"}
              side="bottom"
            >
              <button
                className="hover:bg-accent/60 text-muted-foreground hover:text-foreground flex size-7.5 items-center justify-center rounded-full bg-transparent transition"
                aria-label="Copy text"
                onClick={copyToClipboard}
                type="button"
              >
                {copied ? (
                  <CheckIcon className="size-4" />
                ) : (
                  <CopyIcon className="size-4" />
                )}
              </button>
            </MessageAction>
          </MessageActions>
        )}
      </div>
    </Message>
  )
}
