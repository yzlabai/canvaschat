"use client";

import React, {
  memo,
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  Message as MessageContainer,
  MessageAction,
  MessageActions,
  MessageContent,
} from "@/components/ui/message";
import { cn } from "@/lib/utils";
import { CheckIcon, CopyIcon } from "@phosphor-icons/react";
import { IdeaNode } from "@/types/ideas";
import { Handle, NodeToolbar, Position } from "@xyflow/react";
import { useIdeas } from "@/contexts/ideas-provider";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  GitFork,
  ChevronLeft,
  ChevronRight,
  Send,
  X,
  Clock3,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  PromptInput,
  PromptInputActions,
  PromptInputAction,
  PromptInputTextarea,
} from "@/components/ui/prompt-input";
import { useShareIdea } from "@/contexts/share-idea-provider";

interface ChatNodeProps {
  node: IdeaNode; // parent context node to attach chat messages under
  isSelected: boolean;
  isConnectable?: boolean;
  readOnly?: boolean;
}

type ChatNodeReadOnlyProps = {
  node: IdeaNode;
  isSelected: boolean;
};

const formatTimestampLabel = (dateLike: Date | string | undefined): string => {
  if (!dateLike) return "";
  const date = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
};

const ReadOnlyChatNodeView = memo(({ node, isSelected }: ChatNodeReadOnlyProps) => {
  const isUser = node.created_by === "user";
  const content = (node.content as string | undefined) || "";
  const createdAt = formatTimestampLabel(node.created_at as Date | string | undefined);
  const shortId = typeof node.id === "string" ? node.id.slice(0, 6) : "";
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!content) return;
    if (!navigator?.clipboard) {
      return;
    }
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
    } catch (error) {
      console.error("Failed to copy chat text:", error);
    }
  }, [content]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <>
      <div
        className={cn(
          "w-[360px] rounded-xl border border-slate-200 bg-white/95 p-3 shadow transition-all",
          isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""
        )}
      >
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-medium text-slate-600">
            {isUser ? "User" : "AI"}
            {shortId ? ` · ${shortId}` : ""}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3.5 w-3.5" />
            {createdAt}
          </span>
        </div>
        <MessageContainer className="mt-2 w-full px-0 pb-0">
          <div className="flex flex-col gap-2">
            <MessageContent
              markdown={!isUser}
              className={cn(
                "relative max-w-[340px] whitespace-pre-wrap rounded-xl p-3 text-sm shadow-sm",
                isUser ? "ml-auto bg-blue-600 text-white" : "mr-auto bg-slate-50"
              )}
            >
              {content || "(empty message)"}
            </MessageContent>
            <MessageActions className="flex justify-end">
              <MessageAction tooltip={copied ? "Copied" : "Copy"} side="left">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-800"
                  aria-label="Copy message"
                >
                  {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                </button>
              </MessageAction>
            </MessageActions>
          </div>
        </MessageContainer>
      </div>
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </>
  );
});

ReadOnlyChatNodeView.displayName = "ReadOnlyChatNodeView";

// A chat-style node that lets the user send a message (as a child idea node)
// under the given parent node, then triggers an AI response (as AI child node).
export default memo(function ChatNode({
  node,
  isSelected,
  isConnectable,
  readOnly = false,
}: ChatNodeProps) {
  if (readOnly) {
    return <ReadOnlyChatNodeView node={node} isSelected={isSelected} />;
  }
  const {
    getNodeShortId,
    hasChildren,
    flowNodes,
    setSelectedNode,
    promptValue,
    setPromptValue,
    promptLoading,
    activeChatInputNodeId,
    setActiveChatInputNodeId,
  } = readOnly ? useShareIdea() : useIdeas();
  const focusToolbarChatInput = readOnly
    ? () => {}
    : useIdeas().focusToolbarChatInput;
  const handleChatMessage = readOnly
    ? async () => {}
    : useIdeas().handleChatMessage;
  const handleChatAIOnlyReply = readOnly
    ? async () => {}
    : useIdeas().handleChatAIOnlyReply;

  const isUser = useMemo(() => node.created_by === "user", [node]);
  const content = node.content || "AI is thinking...";
  const isGenerating = useMemo(() => {
    const s = node.status;
    return s === "generating";
  }, [node]);
  // Whether the chat input box is active for this node
  const isChatInputActived = activeChatInputNodeId === node.id;
  const createdAt = node.created_at ? new Date(node.created_at) : null;
  const shortId = useMemo(
    () => getNodeShortId(node.id) || null,
    [node, getNodeShortId]
  );
  const hasChildrenMemo = useMemo(
    () => hasChildren(node.id),
    [hasChildren, node]
  );
  const [copied, setCopied] = useState(false);

  // Parent/child navigation targets
  const parentId = useMemo(() => {
    return node.parent_node_id || null;
  }, [node]);

  const childNodes = useMemo(() => {
    const currentId = node.id;
    const children = (flowNodes || []).filter(
      (n: any) => n?.data?.parent_node_id === currentId
    );
    if (!children.length) return [];
    return [...children].sort((a: any, b: any) => {
      const ac = a?.data?.created_at
        ? new Date(a.data.created_at).getTime()
        : 0;
      const bc = b?.data?.created_at
        ? new Date(b.data.created_at).getTime()
        : 0;
      if (ac !== bc) return ac - bc;
      return String(a.id).localeCompare(String(b.id));
    });
  }, [flowNodes, node.id]);

  const nextChildId = childNodes[0]?.id || null;
  const hasMultipleChildren = childNodes.length > 1;

  const childOptions = useMemo(() => {
    return childNodes.map((child: any) => {
      const shortId = getNodeShortId(child.id) || String(child.id).slice(0, 6);
      const rawContent = String(child?.data?.content || "").trim();
      const preview = rawContent
        ? rawContent.length > 80
          ? `${rawContent.slice(0, 80)}…`
          : rawContent
        : "(No content)";
      return {
        id: String(child.id),
        shortId,
        preview,
      };
    });
  }, [childNodes, getNodeShortId]);

  const [isChildSelectorOpen, setIsChildSelectorOpen] = useState(false);
  const popoverContentId = useMemo(
    () => `child-selector-${node.id}`,
    [node.id]
  );
  const maybeFocusTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (isChildSelectorOpen) {
      maybeFocusTimeoutRef.current = window.setTimeout(() => {
        const container = document.querySelector<HTMLElement>(
          `[data-child-selector="${popoverContentId}"]`
        );
        if (!container) return;
        const input = container.querySelector<HTMLElement>(
          "input[data-slot='command-input']"
        );
        if (input) {
          input.focus();
          return;
        }
        const firstItem = container.querySelector<HTMLElement>(
          "[data-slot='command-item']"
        );
        firstItem?.focus();
      }, 0);
    }
    return () => {
      if (maybeFocusTimeoutRef.current) {
        window.clearTimeout(maybeFocusTimeoutRef.current);
        maybeFocusTimeoutRef.current = null;
      }
    };
  }, [isChildSelectorOpen, popoverContentId]);

  const goToNode = useCallback(
    (targetId: string | null) => {
      if (!targetId) return;
      setSelectedNode(targetId);
    },
    [setSelectedNode]
  );

  const handleSelectChild = useCallback(
    (targetId: string) => {
      goToNode(targetId);
      setIsChildSelectorOpen(false);
    },
    [goToNode]
  );

  useEffect(() => {
    if (!hasMultipleChildren && isChildSelectorOpen) {
      setIsChildSelectorOpen(false);
    }
  }, [hasMultipleChildren, isChildSelectorOpen]);

  // Keyboard navigation: Alt+Left (or '[') for parent, Alt+Right (or ']') for first child
  useEffect(() => {
    if (!isSelected) return;
    const handler = (e: KeyboardEvent) => {
      const ae = document.activeElement as HTMLElement | null;
      const tag = (ae?.tagName || "").toLowerCase();
      const isTyping =
        ae?.isContentEditable || tag === "input" || tag === "textarea";
      if (isTyping) return;

      const left = e.key === "ArrowLeft" && e.altKey;
      const right = e.key === "ArrowRight" && e.altKey;
      const bracketLeft = e.key === "[";
      const bracketRight = e.key === "]";

      if ((left || bracketLeft) && parentId) {
        e.preventDefault();
        goToNode(parentId);
      } else if (right || bracketRight) {
        if (hasMultipleChildren) {
          e.preventDefault();
          if (!isChildSelectorOpen) {
            setIsChildSelectorOpen(true);
          }
        } else if (nextChildId) {
          e.preventDefault();
          goToNode(nextChildId);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    isSelected,
    parentId,
    nextChildId,
    goToNode,
    hasMultipleChildren,
    isChildSelectorOpen,
  ]);
  const isUserCreated = node.created_by === "user";
  // Auto-generate AI reply for the chat mode root node when it is first created (no child node)
  useEffect(() => {
    const isHasChildren = hasChildren(node.id);
    if (isUserCreated && !isHasChildren && !isGenerating) {
      handleChatAIOnlyReply(node.id);
    }
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(String(content || ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 500);
  };

  return (
    <div
      className={cn(
        "group relative rounded-xl p-1",
        isSelected && "ring-2 ring-blue-300 ring-offset-2"
      )}
    >
      <NodeToolbar isVisible={isSelected} position={Position.Bottom}>
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Previous (Alt+← or [)"
                  title="Previous (Alt+← or [)"
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNode(parentId);
                  }}
                  disabled={!parentId}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent sideOffset={6}>
                Previous (Alt+← or [)
              </TooltipContent>
            </Tooltip>

            <Button
              variant="outline"
              size="lg"
              aria-label={hasChildrenMemo ? "Fork" : "Chat"}
              title={hasChildrenMemo ? "Fork" : "Chat"}
              onClick={(e) => {
                e.stopPropagation();
                focusToolbarChatInput(isChatInputActived ? null : node.id);
              }}
            >
              {hasChildrenMemo ? (
                <>
                  <GitFork className="h-4 w-4" />
                  Fork
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </>
              )}
            </Button>

            <Tooltip>
              {hasMultipleChildren ? (
                <Popover
                  open={isChildSelectorOpen}
                  onOpenChange={(open) => setIsChildSelectorOpen(open)}
                >
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Choose child node (Alt+→ or ])"
                        title="Choose child node (Alt+→ or ])"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        disabled={!nextChildId}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <PopoverContent
                    data-child-selector={popoverContentId}
                    className="w-[320px] p-0"
                    align="end"
                    sideOffset={8}
                  >
                    <Command aria-label="Navigate child nodes">
                      <CommandInput placeholder="Search child nodes..." />
                      <CommandList>
                        <CommandEmpty>No matching child nodes.</CommandEmpty>
                        <CommandGroup heading="Child nodes">
                          {childOptions.map((option) => (
                            <CommandItem
                              key={option.id}
                              value={`${option.shortId} ${option.preview}`}
                              onSelect={() => handleSelectChild(option.id)}
                            >
                              <div className="flex min-w-0 flex-col">
                                <span className="text-sm font-medium text-foreground">
                                  {option.shortId}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">
                                  {option.preview}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Next (Alt+→ or ])"
                    title="Next (Alt+→ or ])"
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNode(nextChildId);
                    }}
                    disabled={!nextChildId}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
              )}
              <TooltipContent sideOffset={6}>Next (Alt+→ or ])</TooltipContent>
            </Tooltip>
          </div>
          {isChatInputActived && (
            <div className="w-[420px]">
              <PromptInput
                className="bg-white/90 backdrop-blur border border-gray-200 transition-colors focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 focus-within:shadow-2xl"
                value={promptValue}
                onValueChange={setPromptValue}
                onSubmit={async () => {
                  const content = (promptValue || "").trim();
                  if (!content || promptLoading) return;
                  await handleChatMessage(content, node.id);
                }}
              >
                <div className="flex items-center gap-2">
                  <PromptInputTextarea
                    className="w-full focus:outline-none caret-blue-600"
                    placeholder="Describe your next idea… Press Enter to send"
                    aria-label="Idea message"
                    disabled={promptLoading}
                    autoFocus
                  />
                  <PromptInputActions>
                    <PromptInputAction tooltip="Send (Enter)" side="top">
                      <Button
                        size="icon"
                        variant="default"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const content = (promptValue || "").trim();
                          if (!content || promptLoading) return;
                          await handleChatMessage(content, node.id);
                        }}
                        disabled={promptLoading || !(promptValue || "").trim()}
                        className="h-8 w-8"
                      >
                        {promptLoading ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </PromptInputAction>
                    <PromptInputAction tooltip="Close" side="top">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveChatInputNodeId(null);
                        }}
                        aria-label="Close chat input"
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </PromptInputAction>
                  </PromptInputActions>
                </div>
              </PromptInput>
            </div>
          )}
        </div>
      </NodeToolbar>
      <MessageContainer
        className={cn("flex w-full items-start px-0 pb-0", "justify-start")}
      >
        <div className={cn("flex w-full flex-col gap-1")}>
          {/* Small label */}
          <div
            className={cn(
              "px-1 text-[11px] text-gray-500",
              isUser ? "text-right" : "text-left"
            )}
          >
            {shortId ? ` · ${shortId}` : ""}
          </div>

          {/* Bubble */}
          <div className={cn("relative w-[350px]", "mr-auto")}>
            <MessageContent
              markdown={!isUser}
              className={cn(
                "relative max-w-[350px] whitespace-pre-wrap rounded-xl p-2 shadow-sm",
                isUser ? "bg-accent" : "bg-white border"
              )}
            >
              {content}
            </MessageContent>
            {isGenerating && (
              <span
                className="ml-2 inline-block align-middle h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-transparent"
                aria-label="Generating..."
              />
            )}
            {/* Timestamp and actions row */}
            <div className="mt-1 flex items-center justify-between px-1">
              <div className="text-[11px] text-gray-400">
                {createdAt ? createdAt.toLocaleString() : ""}
              </div>
              <MessageActions className="flex transition-opacity opacity-0 group-hover:opacity-100">
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
            </div>
          </div>
        </div>
      </MessageContainer>
      <Handle
        type="target"
        position={Position.Left}
        onConnect={(params) => console.log("handle onConnect", params)}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
      />
    </div>
  );
});
