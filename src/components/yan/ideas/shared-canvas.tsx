"use client";

import type { CSSProperties } from "react";
import {
  Background,
  ConnectionMode,
  Edge,
  EdgeTypes,
  Handle,
  Node,
  NodeTypes,
  Position,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { IdeaNode, NodeType } from "@/types/ideas";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import StoryIdeaNodeComponent from "./story-node";
import ChatNodeComponent from "./chat-node";
import {
  Lightbulb,
  MessageSquare,
  BookOpen,
  ListChecks,
  Sparkles,
  LucideIcon,
  FileText,
  Image as ImageIcon,
  Film,
} from "lucide-react";
import ActionNode from "./action-node";
import { useShareIdea } from "@/contexts/share-idea-provider";
import ShareCanvasButtons from "./share-canvas-buttons";
import TextNode from "./text-node";
import ImageNode from "./image-node";
import VideoNode from "./video-node";

const typeToIcon: Record<NodeType | "default", LucideIcon> = {
  idea: Lightbulb,
  chat: MessageSquare,
  story: BookOpen,
  action: ListChecks,
  note: Lightbulb,
  task: ListChecks,
  milestone: Sparkles,
  text: FileText,
  image: ImageIcon,
  video: Film,
  default: Lightbulb,
};

const typeAccentClasses: Record<NodeType | "default", string> = {
  idea: "bg-blue-500/10 text-blue-600",
  chat: "bg-emerald-500/10 text-emerald-600",
  story: "bg-purple-500/10 text-purple-600",
  action: "bg-orange-500/10 text-orange-600",
  note: "bg-slate-500/10 text-slate-600",
  task: "bg-rose-500/10 text-rose-600",
  milestone: "bg-amber-500/10 text-amber-600",
  text: "bg-slate-500/10 text-slate-600",
  image: "bg-indigo-500/10 text-indigo-600",
  video: "bg-violet-500/10 text-violet-600",
  default: "bg-blue-500/10 text-blue-600",
};

const statusStyles: Record<string, string> = {
  suggest: "bg-amber-100 text-amber-700 border border-amber-200",
  generating: "bg-purple-100 text-purple-700 border border-purple-200",
  accept: "bg-green-100 text-green-700 border border-green-200",
  reject: "bg-gray-100 text-gray-500 border border-gray-200",
};

const statusLabels: Record<string, string> = {
  suggest: "Suggestion",
  generating: "Generating…",
  accept: "Accepted",
  reject: "Rejected",
};

export type SharedNodeData = IdeaNode & {
  [key: string]: unknown;
};

type SharedIdeaCanvasProps = {
  nodes: Node<SharedNodeData>[];
  edges: Edge[];
};

function ReadOnlyIdeaNode({
  data,
  selected,
}: {
  data: IdeaNode;
  selected?: boolean;
}) {
  const nodeType = (data.node_type as NodeType) ?? "idea";
  const Icon = typeToIcon[nodeType] ?? typeToIcon.default;
  const accentClass = typeAccentClasses[nodeType] ?? typeAccentClasses.default;
  const title = data.title || "Untitled idea";
  const content = data.content?.trim();
  const statusClass = data.status ? statusStyles[data.status] : undefined;

  return (
    <>
      <div
        className={cn(
          "pointer-events-auto w-[260px] max-w-xs rounded-xl border-2 border-slate-200 bg-white/90 px-4 py-3 shadow transition-shadow",
          selected ? "ring-2 ring-blue-500 ring-offset-2" : "",
          data.created_by === "ai" ? "border-dashed" : ""
        )}
      >
        <div className="flex items-start gap-3 border-b border-slate-200 pb-2">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full",
              accentClass
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-slate-900">
              {title}
            </h3>
            {statusClass ? (
              <span
                className={cn(
                  "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                  statusClass
                )}
              >
                {data.status}
              </span>
            ) : null}
          </div>
        </div>
        {content ? (
          <div className="prose prose-xs mt-3 max-w-none text-slate-600">
            <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="mt-3 text-xs italic text-slate-400">No content yet.</p>
        )}
      </div>
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </>
  );
}

function ReadOnlyStoryNode({
  data,
  selected,
}: {
  data: SharedNodeData;
  selected?: boolean;
}) {
  return (
    <StoryIdeaNodeComponent
      node={data}
      isSelected={selected ?? false}
      readOnly
    />
  );
}

function ReadOnlyActionNode({
  data,
  selected,
}: {
  data: SharedNodeData;
  selected?: boolean;
}) {
  return <ActionNode node={data} isSelected={selected ?? false} readOnly />;
}

function ReadOnlyChatNode({
  data,
  selected,
}: {
  data: SharedNodeData;
  selected?: boolean;
}) {
  return (
    <ChatNodeComponent node={data} isSelected={selected ?? false} readOnly />
  );
}

function ReadOnlyTextNode({
  data,
  selected,
}: {
  data: SharedNodeData;
  selected?: boolean;
}) {
  return <TextNode node={data} isSelected={selected ?? false} readOnly />;
}

function ReadOnlyImageNode({
  data,
  selected,
}: {
  data: SharedNodeData;
  selected?: boolean;
}) {
  return <ImageNode node={data} isSelected={selected ?? false} readOnly />;
}

function ReadOnlyVideoNode({
  data,
  selected,
}: {
  data: SharedNodeData;
  selected?: boolean;
}) {
  return <VideoNode node={data} isSelected={selected ?? false} readOnly />;
}

function CustomIdeaEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
}: {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  style?: CSSProperties;
}) {
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

const nodeTypes: NodeTypes = {
  idea: ReadOnlyIdeaNode,
  story: ReadOnlyStoryNode,
  action: ReadOnlyActionNode,
  chat: ReadOnlyChatNode,
  note: ReadOnlyIdeaNode,
  task: ReadOnlyIdeaNode,
  milestone: ReadOnlyIdeaNode,
  image: ReadOnlyImageNode,
  video: ReadOnlyVideoNode,
  text: ReadOnlyTextNode,
};

const edgeTypes: EdgeTypes = {
  ideaEdge: CustomIdeaEdge,
};

export function SharedIdeaCanvas() {

    const {
      // Canvas-specific state
      flowNodes,
      flowEdges,
      selectedNode,
      // Setters
      setReactFlowInstance,
      setSelectedNode,
      // React Flow specific handlers
      onNodesChange,
    } = useShareIdea();

  console.log(flowNodes);
  if (flowNodes.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-sm text-slate-500">
        This canvas does not have any nodes yet.
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlowProvider>
        <div className="relative h-full w-full">
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            connectionMode={ConnectionMode.Loose}
            onNodesChange={onNodesChange}
            onNodeClick={(event, node) => {
              event.stopPropagation();
              if (node.id == selectedNode) return;
              setSelectedNode(node.id);
            }}
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
            <Background />
          </ReactFlow>
          <ShareCanvasButtons />
        </div>
      </ReactFlowProvider>
    </div>
  );
}
