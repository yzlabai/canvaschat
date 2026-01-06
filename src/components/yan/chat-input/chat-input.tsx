"use client"

import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "@/components/ui/prompt-input"
import { Button } from "@/components/ui/button"
import { ArrowUpIcon, StopIcon } from "@phosphor-icons/react"
import { useCallback } from "react"
import { MultiModelButton } from "./multi-model-button"
import { CanvasChatStatus } from "@/lib/chat-store/provider"
import { HistoryTrigger } from "@/components/yan/history/history-trigger"

type ChatInputProps = {
  value: string
  onValueChange: (value: string) => void
  onSend: () => void
  isSubmitting?: boolean
  hasMessages?: boolean
  stop: () => void
  canvasStatus?: CanvasChatStatus
  ref?: React.Ref<HTMLTextAreaElement>
}

export function ChatInput({
  value,
  onValueChange,
  onSend,
  isSubmitting,
  stop,
  canvasStatus,
  ref,
}: ChatInputProps) {
  const isOnlyWhitespace = (text: string) => !/[^\s]/.test(text)

  const handleSend = useCallback(() => {
    if (isSubmitting) {
      return
    }

    if (canvasStatus === "loading") {
      stop()
      return
    }

    onSend()
  }, [isSubmitting, onSend, canvasStatus, stop])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (isSubmitting) {
        e.preventDefault()
        return
      }

      if (e.key === "Enter" && canvasStatus === "loading") {
        e.preventDefault()
        return
      }

      if (e.key === "Enter" && !e.shiftKey) {
        if (isOnlyWhitespace(value)) {
          return
        }

        e.preventDefault()
        onSend()
      }
    },
    [isSubmitting, onSend, canvasStatus, value]
  )

  return (
    <div className="relative flex w-full flex-col gap-4">
      <div className="order-1 flex justify-end px-2 md:order-1">
        <HistoryTrigger
          classNameTrigger="flex items-center gap-2 rounded-sm border border-primary/40 bg-background px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground shadow-[2px_2px_0_theme(colors.primary.DEFAULT)] transition hover:bg-primary hover:text-primary-foreground"
          label={<span>History</span>}
        />
      </div>
      <div className="relative order-2 px-2 pb-3 sm:pb-4 md:order-1">
        <PromptInput
          className="w-full overflow-hidden border-3 bg-background shadow-sm"
          maxHeight={200}
          value={value}
          onValueChange={onValueChange}
        >
          <PromptInputTextarea
            placeholder="Ask CanvasChat"
            onKeyDown={handleKeyDown}
            ref={ref}
            autoFocus
            className="p-3 text-base leading-[1.3] sm:text-base md:text-base"
          />
          <PromptInputActions className="mt-2 w-full justify-between p-2">
            <div className="flex gap-2">
              <MultiModelButton />
            </div>
            <PromptInputAction
              tooltip={canvasStatus === "loading" ? "Stop" : "Send"}
            >
              <Button
                size="sm"
                className="size-9 rounded-full transition-all duration-300 ease-out"
                disabled={!value || isSubmitting || isOnlyWhitespace(value)}
                type="button"
                onClick={handleSend}
                aria-label={canvasStatus === "loading" ? "Stop" : "Send message"}
              >
                {canvasStatus === "loading" ? (
                  <StopIcon className="size-4" />
                ) : (
                  <ArrowUpIcon className="size-4" />
                )}
              </Button>
            </PromptInputAction>
          </PromptInputActions>
        </PromptInput>
      </div>
    </div>
  )
}
