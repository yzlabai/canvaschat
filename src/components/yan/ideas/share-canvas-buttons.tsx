"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useShareIdea } from "@/contexts/share-idea-provider";
import { cn } from "@/lib/utils";
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

const ShareCanvasButtons = memo(function ShareCanvasButtons() {
  const {
    flowNodes,
    selectedNode,
    setSelectedNode,
    getNodeShortId,
    ideasessions,
    currentIdea,
  } = useShareIdea();

  const currentNode = useMemo(
    () => flowNodes.find((node) => node.id === selectedNode) ?? null,
    [flowNodes, selectedNode]
  );

  const parentId = useMemo(() => {
    if (!currentNode) return null;
    const parent = (currentNode.data as any)?.parent_node_id;
    return parent ? String(parent) : null;
  }, [currentNode]);

  const childNodes = useMemo(() => {
    if (!currentNode) return [] as typeof flowNodes;
    return flowNodes
      .filter((node) => (node.data as any)?.parent_node_id === currentNode.id)
      .sort((a, b) => {
        const aCreated = new Date((a.data as any)?.created_at ?? 0).getTime();
        const bCreated = new Date((b.data as any)?.created_at ?? 0).getTime();
        return aCreated - bCreated;
      });
  }, [currentNode, flowNodes]);

  const nextChildId = childNodes[0]?.id ?? null;
  const hasMultipleChildren = childNodes.length > 1;

  const childOptions = useMemo(
    () =>
      childNodes.map((node) => {
        const shortId = getNodeShortId(node.id) ?? String(node.id).slice(0, 6);
        const rawContent = String((node.data as any)?.content ?? "").trim();
        const preview = rawContent
          ? rawContent.length > 80
            ? `${rawContent.slice(0, 80)}…`
            : rawContent
          : "(No content)";
        const title =
          typeof (node.data as any)?.title === "string"
            ? ((node.data as any)?.title as string).trim()
            : "";
        return {
          id: String(node.id),
          title: title.length ? title : undefined,
          shortId,
          preview,
        };
      }),
    [childNodes, getNodeShortId]
  );

  const [isChildSelectorOpen, setIsChildSelectorOpen] = useState(false);
  const popoverContentId = useMemo(
    () => (currentNode ? `share-child-selector-${currentNode.id}` : "share-child-selector"),
    [currentNode]
  );
  const focusTimeoutRef = useRef<number | null>(null);
  const [isNodeSelectorOpen, setIsNodeSelectorOpen] = useState(false);
  const nodeSelectorContentId = useMemo(
    () => (currentNode ? `share-node-selector-${currentNode.id}` : "share-node-selector"),
    [currentNode]
  );
  const nodeSelectorFocusRef = useRef<number | null>(null);

  const handleNavigate = useCallback(
    (targetId: string | null) => {
      if (!targetId) return;
      setSelectedNode(targetId);
    },
    [setSelectedNode]
  );

  const currentLabel = useMemo(() => {
    if (!currentNode) return null;
    const data = currentNode.data as any;
    const title = typeof data?.title === "string" ? data.title.trim() : "";
    if (title) return title;
    const content = typeof data?.content === "string" ? data.content.trim() : "";
    if (content) {
      return content.length > 80 ? `${content.slice(0, 80)}…` : content;
    }
    return getNodeShortId(currentNode.id) ?? String(currentNode.id).slice(0, 6);
  }, [currentNode, getNodeShortId]);

  const nodeOptions = useMemo(() => {
    return flowNodes
      .map((node) => {
        const data = node.data as any;
        const title =
          typeof data?.title === "string" && data.title.trim().length
            ? data.title.trim()
            : null;
        const content = typeof data?.content === "string" ? data.content.trim() : "";
        const label = title
          ? title
          : content
          ? content.length > 80
            ? `${content.slice(0, 80)}…`
            : content
          : getNodeShortId(node.id) ?? String(node.id).slice(0, 6);
        const shortId = getNodeShortId(node.id) ?? String(node.id).slice(0, 6);
        const createdAt = new Date((data?.created_at ?? 0) as string | number).getTime();
        return {
          id: String(node.id),
          label,
          shortId,
          title: title ?? undefined,
          createdAt,
        };
      })
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [flowNodes, getNodeShortId]);

  const disableNavigation = !currentNode;

  const currentSession = useMemo(() => {
    if (!ideasessions.length) return null;
    if (!currentIdea) return ideasessions[0] ?? null;
    return ideasessions.find((session) => session.id === currentIdea) ?? ideasessions[0] ?? null;
  }, [ideasessions, currentIdea]);

  const retroBarClass =
    "pointer-events-auto flex flex-wrap items-center gap-3 border-4 border-black bg-slate-900/95 px-5 py-3 text-slate-100 shadow-[6px_6px_0_rgba(15,23,42,0.9)] backdrop-blur rounded-none";
  const retroButtonClass =
    "h-10 w-10 rounded-none border-2 border-black bg-slate-800/80 text-slate-100 shadow-[3px_3px_0_rgba(15,23,42,0.9)] hover:bg-slate-700 disabled:opacity-60 disabled:shadow-none";
  const retroLabelClass =
    "min-w-[160px] max-w-[280px] truncate rounded-none border-2 border-dashed border-slate-500 bg-slate-900/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-100 shadow-[3px_3px_0_rgba(15,23,42,0.9)] hover:bg-slate-900/80";

  const handleSelectChild = useCallback(
    (targetId: string) => {
      handleNavigate(targetId);
      setIsChildSelectorOpen(false);
    },
    [handleNavigate]
  );

  const handleSelectNode = useCallback(
    (targetId: string) => {
      handleNavigate(targetId);
      setIsNodeSelectorOpen(false);
    },
    [handleNavigate]
  );

  useEffect(() => {
    if (!hasMultipleChildren && isChildSelectorOpen) {
      setIsChildSelectorOpen(false);
    }
  }, [hasMultipleChildren, isChildSelectorOpen]);

  useEffect(() => {
    if (!isChildSelectorOpen) return;
    focusTimeoutRef.current = window.setTimeout(() => {
      const container = document.querySelector<HTMLElement>(
        `[data-share-child-selector="${popoverContentId}"]`
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

    return () => {
      if (focusTimeoutRef.current) {
        window.clearTimeout(focusTimeoutRef.current);
        focusTimeoutRef.current = null;
      }
    };
  }, [isChildSelectorOpen, popoverContentId]);

  useEffect(() => {
    if (!isNodeSelectorOpen) return;
    nodeSelectorFocusRef.current = window.setTimeout(() => {
      const container = document.querySelector<HTMLElement>(
        `[data-share-node-selector="${nodeSelectorContentId}"]`
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

    return () => {
      if (nodeSelectorFocusRef.current) {
        window.clearTimeout(nodeSelectorFocusRef.current);
        nodeSelectorFocusRef.current = null;
      }
    };
  }, [isNodeSelectorOpen, nodeSelectorContentId]);

  if (!flowNodes.length) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4">
      <div className={cn(retroBarClass, disableNavigation && "opacity-80")}
      >
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(retroButtonClass, "flex items-center justify-center")}
                  disabled={!currentSession}
                  aria-label="Show idea info"
                >
                  <Info className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent sideOffset={6}>Idea info</TooltipContent>
          </Tooltip>
          <PopoverContent
            className="w-[320px] border-4 border-black bg-slate-900/95 text-slate-100 shadow-[6px_6px_0_rgba(15,23,42,0.9)] rounded-none"
            align="start"
            sideOffset={10}
          >
            <div className="space-y-2 text-sm">
              <p className="font-black uppercase tracking-[0.12em] text-primary">
                {currentSession?.title || "Untitled idea"}
              </p>
              {currentSession?.description ? (
                <p className="text-xs leading-relaxed text-slate-200">
                  {currentSession.description}
                </p>
              ) : (
                <p className="text-xs italic text-slate-400">No description provided.</p>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Go to parent node"
              title="Go to parent node"
              onClick={() => handleNavigate(parentId)}
              disabled={!parentId}
              className={retroButtonClass}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent sideOffset={6}>Previous</TooltipContent>
        </Tooltip>

        <Popover
          open={isNodeSelectorOpen}
          onOpenChange={(open) => {
            setIsNodeSelectorOpen(open);
            if (open) {
              setIsChildSelectorOpen(false);
            }
          }}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
              }}
              disabled={!flowNodes.length}
              className={cn(
                retroLabelClass,
                !currentNode && "border-slate-600 text-slate-400 hover:bg-slate-900/60"
              )}
              title={currentLabel ?? "Select a node"}
            >
              {currentLabel ?? "Select a node"}
            </button>
          </PopoverTrigger>
          <PopoverContent
            data-share-node-selector={nodeSelectorContentId}
            className="w-[320px] border-4 border-black bg-slate-200 p-0 text-slate-100 shadow-[6px_6px_0_rgba(15,23,42,0.9)] rounded-none"
            align="center"
            sideOffset={8}
          >
            <Command aria-label="Navigate nodes" className="bg-transparent">
              <CommandInput
                placeholder="Search nodes..."
                className="border-b border-slate-700 bg-slate-900/60"
              />
              <CommandList className="max-h-[320px]">
                <CommandEmpty>No nodes found.</CommandEmpty>
                <CommandGroup heading="Nodes">
                  {nodeOptions.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={`${option.shortId} ${option.label}`}
                      onSelect={() => handleSelectNode(option.id)}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-sm">{option.label}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Tooltip>
          {hasMultipleChildren ? (
            <Popover open={isChildSelectorOpen} onOpenChange={setIsChildSelectorOpen}>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Choose child node"
                    title="Choose child node"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    disabled={!nextChildId}
                    className={retroButtonClass}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
              </TooltipTrigger>
              <PopoverContent
                data-share-child-selector={popoverContentId}
                className="w-[280px] border-4 border-black bg-slate-200 p-0 text-slate-100 shadow-[6px_6px_0_rgba(15,23,42,0.9)] rounded-none"
                align="end"
                sideOffset={8}
              >
                <Command aria-label="Navigate child nodes" className="bg-transparent">
                  <CommandInput
                    placeholder="Search child nodes..."
                    className="border-b border-slate-700 bg-slate-900/60"
                  />
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
                              {option.title ?? option.preview}
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
                aria-label="Go to first child node"
                title="Go to first child node"
                onClick={() => handleNavigate(nextChildId)}
                disabled={!nextChildId}
                className={retroButtonClass}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
          )}
          <TooltipContent sideOffset={6}>Next</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
});

ShareCanvasButtons.displayName = "ShareCanvasButtons";

export default ShareCanvasButtons;
