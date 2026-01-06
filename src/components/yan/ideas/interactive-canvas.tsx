"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  NodeTypes,
  ConnectionMode,
  EdgeTypes,
  ReactFlowProvider,
  useReactFlow,
  MiniMap,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import IdeaNodeComponent from "./idea-node";
import ChatNodeComponent from "./chat-node";
import StoryIdeaNodeComponent from "./story-node";
import ActionIdeaNodeComponent from "./action-node";
import TextNodeComponent from "./text-node";
import ImageNodeComponent from "./image-node";
import VideoNodeComponent from "./video-node";
import { CanvasEmptyState } from "./canvas-empty-state";
import { IdeaNode, NodeType } from "@/types/ideas";
import { useIdeas } from "@/contexts/ideas-provider";
import { AddNodeDialog } from "./add-node-dialog";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CanvasChatInput } from "./canvas-chat-input";
import { HeaderSidebarTrigger } from "@/components/yan/layout/header-sidebar-trigger";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3X3,
  Share2,
  Users,
  Link as LinkIcon,
  Copy,
  Check,
} from "lucide-react";

// Custom node component for React Flow
function CustomIdeaNode({
  data,
  selected,
}: {
  data: IdeaNode;
  selected?: boolean;
}) {
  return <IdeaNodeComponent node={data} isSelected={selected || false} />;
}

// Chat node component - specialized for chat interactions
function ChatNode({ data, selected }: { data: IdeaNode; selected?: boolean }) {
  return <ChatNodeComponent node={data} isSelected={selected || false} />;
}

// Story node component - enhanced for narrative scenarios
function StoryIdeaNode({
  data,
  selected,
}: {
  data: IdeaNode;
  selected?: boolean;
}) {
  return <StoryIdeaNodeComponent node={data} isSelected={selected || false} />;
}

// Action node component - distinct styling for actionable items
function ActionIdeaNode({
  data,
  selected,
}: {
  data: IdeaNode;
  selected?: boolean;
}) {
  return <ActionIdeaNodeComponent node={data} isSelected={selected || false} />;
}

function TextIdeaNode({
  data,
  selected,
}: {
  data: IdeaNode;
  selected?: boolean;
}) {
  return <TextNodeComponent node={data} isSelected={selected || false} />;
}

function ImageIdeaNode({
  data,
  selected,
}: {
  data: IdeaNode;
  selected?: boolean;
}) {
  return <ImageNodeComponent node={data} isSelected={selected || false} />;
}

function VideoIdeaNode({
  data,
  selected,
}: {
  data: IdeaNode;
  selected?: boolean;
}) {
  return <VideoNodeComponent node={data} isSelected={selected || false} />;
}

function CustomIdeaEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
}: any) {
  return (
    <g>
      <line
        x1={sourceX}
        y1={sourceY}
        x2={targetX}
        y2={targetY}
        style={{
          stroke: "#94a3b8",
          strokeWidth: 2,
          strokeDasharray: "5,5",
          ...style,
        }}
      />
    </g>
  );
}

// Define node types for React Flow
const nodeTypes: NodeTypes = {
  idea: CustomIdeaNode,
  story: StoryIdeaNode,
  action: ActionIdeaNode,
  chat: ChatNode,
  text: TextIdeaNode,
  image: ImageIdeaNode,
  video: VideoIdeaNode,
};

// Define edge types for React Flow (using default types)
const edgeTypes: EdgeTypes = {
  ideaEdge: CustomIdeaEdge,
};

type CustomControlsProps = {
  autolayout: () => void;
  shareEnabled: boolean;
  shareAvailable: boolean;
  onToggleShare: (next: boolean) => void | Promise<void>;
  shareLink: string;
  watcherCount: number;
  isShareUpdating: boolean;
};

// Custom Controls Component
function CustomControls({
  autolayout,
  shareEnabled,
  shareAvailable,
  onToggleShare,
  shareLink,
  watcherCount,
  isShareUpdating,
}: CustomControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  useEffect(() => {
    if (copyState !== "copied") return;
    const timer = window.setTimeout(() => setCopyState("idle"), 2000);
    return () => window.clearTimeout(timer);
  }, [copyState]);

  const handleVisibilityChange = useCallback(
    (nextValue: boolean) => {
      if (!shareAvailable) {
        toast.error("Select an idea session to manage sharing.");
        return;
      }
      onToggleShare(nextValue);
    },
    [onToggleShare, shareAvailable]
  );

  const handleCopyLink = useCallback(async () => {
    if (!shareEnabled || !shareLink) {
      toast.error("Enable sharing to generate a link first.");
      return;
    }

    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error("Clipboard access is unavailable. Copy manually instead.");
      return;
    }

    try {
      await navigator.clipboard.writeText(shareLink);
      setCopyState("copied");
      toast.success("Share link copied to clipboard");
    } catch (error) {
      console.error("Failed to copy share link:", error);
      toast.error("Couldn't copy the share link. Try again or copy manually.");
    }
  }, [shareEnabled, shareLink]);

  const watchersLabel = shareEnabled
    ? watcherCount === 1
      ? "1 viewer"
      : `${watcherCount} viewers`
    : null;

  const watchersDetail = shareEnabled
    ? watcherCount > 0
      ? `${watcherCount === 1 ? "One person" : `${watcherCount} people`} currently have access.`
      : "No viewers yet — share the link to invite others."
    : "Sharing is off. Enable it to generate a link.";

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
      <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3 flex flex-col gap-3">
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 w-full justify-between gap-2 rounded-md text-xs font-medium transition-colors",
                shareEnabled
                  ? "border-blue-200 bg-blue-600 text-white hover:bg-blue-600/90"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-blue-50"
              )}
              disabled={!shareAvailable || isShareUpdating}
              title={shareEnabled ? "Sharing enabled" : "Sharing disabled"}
            >
              <span className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 space-y-4" align="end">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Canvas visibility
                </p>
                <p className="text-xs text-muted-foreground">
                  Control who can view this idea canvas with a shareable link.
                </p>
              </div>
              <Switch
                checked={shareEnabled}
                disabled={!shareAvailable || isShareUpdating}
                onCheckedChange={handleVisibilityChange}
                aria-label="Toggle idea canvas sharing"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="idea-share-link"
                className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              >
                Share link
              </Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Input
                    id="idea-share-link"
                    value={shareLink}
                    readOnly
                    disabled={!shareEnabled || !shareAvailable}
                    className="pr-10"
                  />
                  <LinkIcon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyLink}
                  disabled={
                    !shareEnabled ||
                    !shareAvailable ||
                    !shareLink ||
                    isShareUpdating
                  }
                  className="flex items-center gap-1"
                >
                  {copyState === "copied" ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span className="text-xs">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span className="text-xs">Copy</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Users className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{watchersDetail}</span>
            </div>

            {isShareUpdating ? (
              <p className="text-[11px] text-blue-600">
                Updating share settings…
              </p>
            ) : null}
          </PopoverContent>
        </Popover>
        {shareEnabled ? (
          <Badge
            variant="secondary"
            className="bg-white/90 text-slate-700"
          >
            <Users className="h-3 w-3" />
            <span>{watcherCount}</span>
          </Badge>
        ) : null}
        <div className="h-px bg-gray-200" />

        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-center p-0 hover:bg-blue-50"
            onClick={() => zoomIn()}
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-center p-0 hover:bg-blue-50"
            onClick={() => zoomOut()}
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full justify-center p-0 hover:bg-blue-50"
            onClick={() => fitView()}
            title="Fit View"
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-px bg-gray-200" />

        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-full justify-center p-0 hover:bg-green-50"
          onClick={autolayout}
          title="Auto Layout"
        >
          <Grid3X3 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function InteractiveCanvas() {
  const {
    // Canvas-specific state
    flowNodes,
    flowEdges,
    selectedNode,
    ideasessions,
    currentIdea,
    // Setters
    setReactFlowInstance,
    setSelectedNode,
    // React Flow specific handlers
    onNodesChange,
    onEdgesChange,
    onConnect,
    onNodesDelete,
    autolayout,
    updateIdeaSession,
  } = useIdeas();

  const currentSession = useMemo(
    () => ideasessions.find((session) => session.id === currentIdea) ?? null,
    [ideasessions, currentIdea]
  );

  const [shareLink, setShareLink] = useState("");
  const [isShareUpdating, setIsShareUpdating] = useState(false);

  const shareEnabled = currentSession?.is_shared ?? false;
  const shareAvailable = Boolean(currentSession?.id);

  const watcherCount = useMemo(() => {
    if (!shareEnabled) {
      return 0;
    }

    const rawCollaborators = currentSession?.collaborators;
    if (!rawCollaborators) {
      return 0;
    }

    try {
      const parsed = JSON.parse(rawCollaborators);
      if (Array.isArray(parsed)) {
        return parsed.length;
      }

      if (parsed && typeof parsed === "object") {
        if (Array.isArray(parsed.collaborators)) {
          return parsed.collaborators.length;
        }
        if (Array.isArray(parsed.viewers)) {
          return parsed.viewers.length;
        }
      }
    } catch (error) {
      console.warn("Failed to parse collaborators for share status:", error);
    }

    return 0;
  }, [currentSession, shareEnabled]);

  useEffect(() => {
    if (!currentSession) {
      setShareLink("");
      return;
    }

    const path = `/share/idea?id=${currentSession.id}`;
    const fallbackOrigin = process.env.NEXT_PUBLIC_APP_URL ?? "";

    if (typeof window !== "undefined" && window.location?.origin) {
      setShareLink(`${window.location.origin}${path}`);
      return;
    }

    if (fallbackOrigin) {
      setShareLink(`${fallbackOrigin}${path}`);
      return;
    }

    setShareLink(path);
  }, [currentSession]);

  const handleShareToggle = useCallback(
    async (nextValue: boolean) => {
      if (!currentSession) {
        return;
      }

      setIsShareUpdating(true);
      try {
        await updateIdeaSession(
          currentSession.id,
          { isShared: nextValue },
          {
            successMessage: nextValue
              ? "Sharing enabled for this canvas"
              : "Sharing disabled for this canvas",
          }
        );
      } catch (error) {
        // Error toast handled within updateIdeaSession
      } finally {
        setIsShareUpdating(false);
      }
    },
    [currentSession, updateIdeaSession]
  );

  // CanvasChatInput handles prompt and context selection.

  return (
    <div className="flex-1 overflow-hidden">
      <div className="h-full bg-gradient-to-br from-slate-50 to-blue-50 relative overflow-hidden">
        {/* Session & utility controls moved to IdeasHeader */}

        {/* React Flow Canvas */}
        <div className="w-full h-full">
          {/* Only render ReactFlow if we have nodes or if the flow nodes are initialized */}
          {flowNodes.length > 0 && (
            <ReactFlowProvider>
              <ReactFlow
                nodes={flowNodes}
                edges={flowEdges}
                connectionMode={ConnectionMode.Loose}
                onNodesDelete={onNodesDelete}
                onNodesChange={onNodesChange}
                onNodeClick={(event, node) => {
                  event.stopPropagation();
                  if (node.id == selectedNode) return;
                  setSelectedNode(node.id);
                }}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                nodesFocusable={true}
                edgesFocusable={false}
                disableKeyboardA11y={false}
                nodesDraggable={true}
                nodesConnectable={false}
                elementsSelectable={true}
                selectNodesOnDrag={false}
              >
                <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-1">
                  <HeaderSidebarTrigger />
                </div>
                <CustomControls
                  autolayout={autolayout}
                  shareEnabled={shareEnabled}
                  shareAvailable={shareAvailable}
                  onToggleShare={handleShareToggle}
                  shareLink={shareLink}
                  watcherCount={watcherCount}
                  isShareUpdating={isShareUpdating}
                />
                <Background />
              </ReactFlow>
            </ReactFlowProvider>
          )}

          {/* Empty State */}
          {flowNodes.length === 0 && (
            <div className="absolute inset-0 pointer-events">
              <CanvasEmptyState />
            </div>
          )}
        </div>

        {/* Add Node Dialog */}
        <AddNodeDialog />

        {/* Bottom Chat Input */}
        <CanvasChatInput />
      </div>
    </div>
  );
}
