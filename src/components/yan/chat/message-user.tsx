"use client"

import {
  MorphingDialog,
  MorphingDialogClose,
  MorphingDialogContainer,
  MorphingDialogContent,
  MorphingDialogImage,
  MorphingDialogTrigger,
} from "@/components/motion-primitives/morphing-dialog"
import {
  MessageAction,
  MessageActions,
  Message as MessageContainer,
  MessageContent,
} from "@/components/ui/message"
import { cn } from "@/lib/utils"
import { CheckIcon, CopyIcon, TrashIcon } from "@phosphor-icons/react"
import Image from "next/image"
import { ReactNode, useRef, useState } from "react"

const getTextFromDataUrl = (dataUrl: string) => {
  const base64 = dataUrl.split(",")[1]
  return base64
}

export type MessageUserProps = {
  content: string
  hasScrollAnchor?: boolean
  attachments?: Array<{
    name?: string
    url: string
    contentType?: string
  }>
  onEdit: (id: string, newText: string) => void
  onDelete: (id: string) => void
  id: string
  className?: string
}

export function MessageUser({
  content,
  hasScrollAnchor,
  attachments,
  onEdit,
  onDelete,
  id,
  className,
}: MessageUserProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 500)
  }
  const handleDelete = () => {
    onDelete(id)
  }

  return (
    <MessageContainer
      className={cn(
        "group flex w-full max-w-3xl flex-col items-end gap-0.5 px-6 pb-2",
        hasScrollAnchor && "min-h-scroll-anchor",
        className
      )}
    >
      {attachments?.map((attachment, index) => (
        <div
          className="flex flex-row gap-2"
          key={`${attachment.name}-${index}`}
        >
          {attachment.contentType?.startsWith("image") ? (
            <MorphingDialog
              transition={{
                type: "spring",
                stiffness: 280,
                damping: 18,
                mass: 0.3,
              }}
            >
              <MorphingDialogTrigger className="z-10">
                <Image
                  className="mb-1 w-40 rounded-md"
                  key={attachment.name}
                  src={attachment.url}
                  alt={attachment.name || "Attachment"}
                  width={160}
                  height={120}
                />
              </MorphingDialogTrigger>
              <MorphingDialogContainer>
                <MorphingDialogContent className="relative rounded-lg">
                  <MorphingDialogImage
                    src={attachment.url}
                    alt={attachment.name || ""}
                    className="max-h-[90vh] max-w-[90vw] object-contain"
                  />
                </MorphingDialogContent>
                <MorphingDialogClose className="text-primary" />
              </MorphingDialogContainer>
            </MorphingDialog>
          ) : attachment.contentType?.startsWith("text") ? (
            <div className="text-primary mb-3 h-24 w-40 overflow-hidden rounded-md border p-2 text-xs">
              {getTextFromDataUrl(attachment.url)}
            </div>
          ) : null}
        </div>
      ))}
      <MessageContent
        className="bg-accent relative max-w-[70%] rounded-xl px-5 py-2.5"
        markdown={false}
        ref={contentRef}
        components={{
          code: ({ children }: { children: ReactNode }) => <>{children}</>,
          pre: ({ children }: { children: ReactNode }) => <>{children}</>,
          h1: ({ children }: { children: ReactNode }) => <p>{children}</p>,
          h2: ({ children }: { children: ReactNode }) => <p>{children}</p>,
          h3: ({ children }: { children: ReactNode }) => <p>{children}</p>,
          h4: ({ children }: { children: ReactNode }) => <p>{children}</p>,
          h5: ({ children }: { children: ReactNode }) => <p>{children}</p>,
          h6: ({ children }: { children: ReactNode }) => <p>{children}</p>,
          p: ({ children }: { children: ReactNode }) => <p>{children}</p>,
          li: ({ children }: { children: ReactNode }) => <p>- {children}</p>,
          ul: ({ children }: { children: ReactNode }) => <>{children}</>,
          ol: ({ children }: { children: ReactNode }) => <>{children}</>,
        }}
      >
        {content}
      </MessageContent>
      <MessageActions className="flex gap-0 opacity-0 transition-opacity duration-0 group-hover:opacity-100">
        <MessageAction tooltip={copied ? "Copied!" : "Copy text"} side="bottom">
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
        <MessageAction tooltip="Delete" side="bottom">
          <button
            className="hover:bg-accent/60 text-muted-foreground hover:text-foreground flex size-7.5 items-center justify-center rounded-full bg-transparent transition"
            aria-label="Delete"
            onClick={handleDelete}
            type="button"
          >
            <TrashIcon className="size-4" />
          </button>
        </MessageAction>
      </MessageActions>
    </MessageContainer>
  )
}
