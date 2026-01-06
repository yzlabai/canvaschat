"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { IdeaNodeConnection } from "@/types/ideas";
import { toast } from "sonner";
import {
  useNodesState,
  useEdgesState,
  Edge,
  Node,
  ReactFlowInstance,
} from "@xyflow/react";
import dagre from "dagre";
import { useSearchParams, usePathname } from "next/navigation";

 const genId = () =>
        typeof globalThis !== "undefined" &&
        (globalThis as any).crypto?.randomUUID
          ? (globalThis as any).crypto.randomUUID()
          : `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

// Reusable auto-layout function for nodes (optionally using explicit edges)
export function computeAutoLayout(nodes: Node[], edges?: Edge[]): { laidOutNodes: Node[], laidOutEdges: Edge[] } {
  console.log("Computing auto-layout for nodes:", nodes);
  console.log("With edges:", edges);
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const defaultNodeWidth = 350;
  const defaultNodeHeight = 350;

  dagreGraph.setGraph({
    rankdir: "LR",
    nodesep: 80,
    ranksep: 80,
    edgesep: 10,
    marginx: 20,
    marginy: 20,
  });

  nodes.forEach((node) => {
    const width = (node as any).measured?.width || defaultNodeWidth;
    const height = (node as any).measured?.height || defaultNodeHeight;
    dagreGraph.setNode(node.id, { width, height });
  });

  const deriveEdgesFromParents = (ns: Node[]): Edge[] => {
    const idSet = new Set(ns.map((n) => n.id));
    const derived: Edge[] = [] as Edge[];
    ns.forEach((n) => {
      const parentId = n.data?.parent_node_id as string | undefined;
      if (parentId && idSet.has(parentId)) {
        derived.push({
          id: genId(),
          source: parentId,
          target: n.id,
        } as Edge);
      }
    });
    return derived;
  };

  const edgesToUse =
    edges && edges.length > 0 ? edges : deriveEdgesFromParents(nodes);
  edgesToUse.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const laidOutNodes = nodes.map((node) => {
    const layoutNode = dagreGraph.node(node.id);
    const newPosition = layoutNode
      ? {
          x: layoutNode.x - layoutNode.width / 2,
          y: layoutNode.y - layoutNode.height / 2,
        }
      : node.position;
    return { ...node, position: newPosition };
  });
  const laidOutEdges = edgesToUse.map((edge) => ({ ...edge }));
  return {laidOutNodes, laidOutEdges};
}

type SharedIdeaSession = {
  id: string;
  title?: string | null;
  description?: string | null;
  type?: string | null;
  story_image_style?: string | null;
  story_image_prompt?: string | null;
  is_shared?: boolean | null;
};

interface ShareIdeasContextType {
  // State
  ideasessions: SharedIdeaSession[];
  currentIdea: string | null;
  connections: IdeaNodeConnection[];
  selectedNode: string | null;
  setSelectedNode: (id: string | null) => void;
  isLoading: boolean;
  promptLoading: boolean;
  promptValue: string;

  onNodesChange: (changes: any) => void;

  // Canvas-specific state
  isAddNodeDialogOpen: boolean;
  parentNodeId: string | null;
  reactFlowInstance: ReactFlowInstance | null;
  flowNodes: Node[];
  flowEdges: Edge[];
  reactFlowNodes: Node[];
  reactFlowEdges: Edge[];

  // Setters
  setCurrentIdea: (idea_id: string | null) => void;
  setIsAddNodeDialogOpen: (open: boolean) => void;
  setParentNodeId: (id: string | null) => void;
  setReactFlowInstance: (instance: ReactFlowInstance | null) => void;

  handleDialogClose: () => void;

  getNodeShortId: (nodeId: string) => string | null;
  hasChildren: (nodeId: string) => boolean;
  // Shared prompt input state
  setPromptValue: (v: string) => void;
  // Show chat input within a node toolbar
  activeChatInputNodeId: string | null;
  setActiveChatInputNodeId: (id: string | null) => void;

  updateNodeImageData: (
    nodeId: string,
    imageData: {
      has_images: boolean;
      primary_media_id?: string;
      media_count?: number;
      primary_image_url?: string;
    }
  ) => void;
}

const ShareIdeasContext = createContext<ShareIdeasContextType | undefined>(undefined);

export function useShareIdea() {
  const context = useContext(ShareIdeasContext);
  if (context === undefined) {
    throw new Error("useShareIdea must be used within a ShareIdeasProvider");
  }
  return context;
}

interface ShareIdeasProviderProps {
  children: React.ReactNode;
}

export function ShareIdeasProvider({ children }: ShareIdeasProviderProps) {
  // Sessions and data state
  const [ideasessions, setIdeaSessions] = useState<SharedIdeaSession[]>([]);
  const [currentIdea, setCurrentIdea] = useState<string | null>(null);
  const [dbNodes, setDbNodes] = useState<any[]>([]); // Raw DB nodes for reference

  const [connections, setConnections] = useState<IdeaNodeConnection[]>([]);
  const [selectedNode, setSelectedNodeState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptValue, setPromptValue] = useState("");
  const [activeChatInputNodeId, setActiveChatInputNodeId] = useState<
    string | null
  >(null);

  const [isAddNodeDialogOpen, setIsAddNodeDialogOpen] = useState(false);
  const [parentNodeId, setParentNodeId] = useState<string | null>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);

  const searchParams = useSearchParams();
  const pathname = usePathname();

  const sharedIdeaId = useMemo(() => {
    const queryId = searchParams?.get("id");
    if (queryId) {
      return queryId;
    }

    if (!pathname) {
      return null;
    }

    const segments = pathname.split("/").filter(Boolean);
    const ideaIndex = segments.indexOf("idea");
    if (ideaIndex !== -1 && ideaIndex + 1 < segments.length) {
      return segments[ideaIndex + 1];
    }

    return segments.at(-1) ?? null;
  }, [searchParams, pathname]);

  const getNodeIdeaType = useCallback(
    (ideaId: string): string => {
      const ideaSession = ideasessions.find((s) => s.id === ideaId);
      return ideaSession?.type || "brainstorm";
    },
    [ideasessions]
  );

  // Convert IdeaNode[] to React Flow Node[] TODO fix
  const reactFlowNodes = useMemo(() => {
    const flowNodes = dbNodes.map(
      (node): Node => ({
        id: node.id,
        type: node.node_type,
        position: { x: node.position_x || 0, y: node.position_y || 0 },
        data: {
          ...node,
          medias: node.medias || [],
          idea_type: getNodeIdeaType(node.session_id) || "brainstorm",
        },
      })
    );
    return flowNodes;
  }, [dbNodes]);

  // Convert connections to React Flow Edge[]
  const reactFlowEdges = useMemo(() => {
    const edges: Edge[] = [];
    const edgeSet = new Set<string>(); // To avoid duplicate edges

    // Create edges from explicit connections in the database
    connections.forEach((connection) => {
      const edgeId = `${connection.id}`;

      // Check if both dbNodes exist and edge doesn't already exist
      const sourceExists = dbNodes.some(
        (n) => n.id === connection.source_node_id
      );
      const targetExists = dbNodes.some(
        (n) => n.id === connection.target_node_id
      );

      if (sourceExists && targetExists && !edgeSet.has(edgeId)) {
        edges.push({
          id: edgeId,
          source: connection.source_node_id,
          target: connection.target_node_id,
          style: {
            strokeWidth: connection.line_width || 2,
            stroke: connection.line_color || "gray",
            strokeDasharray:
              connection.line_style === "dashed"
                ? "5,5"
                : connection.line_style === "dotted"
                  ? "2,2"
                  : undefined,
          },
          label: connection.label || undefined,
          type: "default",
        });
        edgeSet.add(edgeId);
      }
    });
    return edges;
  }, [dbNodes, connections]);

  const [flowNodes, setFlowNodes, onNodesChangeOriginal] =
    useNodesState(reactFlowNodes);
  const [flowEdges, setFlowEdges, onEdgesChange] =
    useEdgesState(reactFlowEdges);

  // Wrapper to select a node and reflect it in React Flow nodes
  const setSelectedNode = useCallback(
    (id: string | null) => {
      setSelectedNodeState(id);
      setFlowNodes((nds) =>
        nds.map((n) =>
          n.id === id ? { ...n, selected: true } : { ...n, selected: false }
        )
      );
      reactFlowInstance?.fitView({
        nodes: id ? [{ id }] : [],
        padding: 1,
        duration: 500,
      });
    },
    [reactFlowInstance]
  );

  // Initialize ideas and load data
  useEffect(() => {
    let cancelled = false;

    const loadSharedIdea = async () => {
      if (!sharedIdeaId) {
        setIdeaSessions([]);
        setCurrentIdea(null);
        setDbNodes([]);
        setConnections([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/share/idea?id=${encodeURIComponent(sharedIdeaId)}`
        );

        if (!response.ok) {
          throw new Error(`Failed to load shared idea (${response.status})`);
        }

        const payload = await response.json();
        const idea = payload?.idea ?? null;
        const nodes = Array.isArray(payload?.nodes) ? payload.nodes : [];
        const edges = Array.isArray(payload?.connections)
          ? payload.connections
          : [];

        if (cancelled) {
          return;
        }

        if (!idea) {
          setIdeaSessions([]);
          setCurrentIdea(null);
          setDbNodes(nodes);
          setConnections(edges);
          return;
        }

        setIdeaSessions([
          {
            id: idea.id,
            title: idea.title ?? null,
            description: idea.description ?? null,
            type: idea.type ?? "brainstorm",
            story_image_style: idea.story_image_style ?? null,
            story_image_prompt: idea.story_image_prompt ?? null,
            is_shared: idea.is_shared ?? true,
          },
        ]);
        setCurrentIdea(idea.id ?? null);
        setDbNodes(nodes);
        setConnections(edges);
        setSelectedNodeState(null);
      } catch (error) {
        if (!cancelled) {
          console.error("Error loading shared idea:", error);
          toast.error("Failed to load shared canvas.");
          setIdeaSessions([]);
          setCurrentIdea(null);
          setDbNodes([]);
          setConnections([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadSharedIdea();

    return () => {
      cancelled = true;
    };
  }, [sharedIdeaId]);


  const getRootDistance = useCallback(
    (node: Node): number => {
      let distance = 0;
      while (node.data?.parent_node_id) {
        distance++;
        node = flowNodes.find((n) => n.id === node.data.parent_node_id) || node;
      }
      return distance;
    },
    [flowNodes]
  );

  // Build a stable, human-friendly short id for a node.
  // Scheme (stable, order-independent):
  // - Prefix: "You" | "AI" from created_by
  // - Root distance: prefer node.data.root_distance, fallback to computed
  // - Short UUID token: deterministic substring from node UUID (order/layout independent)
  const getNodeShortId = useCallback(
    (nodeId: string): string | null => {
      const node = flowNodes.find((n) => n.id === nodeId);
      if (!node) return null;

      const prefix = node.data?.created_by === "user" ? "You" : "AI";

      // Determine root distance
      const rootDistance: number =
        typeof (node as any).data?.root_distance === "number"
          ? Number((node as any).data.root_distance)
          : getRootDistance(node);
      // Compact, deterministic short token derived from node UUID
      const uid = String(node.id).replace(/-/g, "");
      // Use head+tail to reduce collision chance while staying short
      const shortToken = `${uid.slice(0, 3)}${uid.slice(-3)}`.toLowerCase();
      return `${prefix}-${rootDistance}-${shortToken}`;
    },
    [flowNodes, getRootDistance]
  );

  // Check if a node has children
  const hasChildren = useCallback(
    (nodeId: string): boolean => {
      try {
        return (
          flowNodes?.some((n: any) => n?.data?.parent_node_id === nodeId) ||
          false
        );
      } catch {
        return false;
      }
    },
    [flowNodes]
  );


  // Update node image data (for image generation)
  const updateNodeImageData = useCallback(
    (
      nodeId: string,
      imageData: {
        has_images: boolean;
        primary_media_id?: string;
        media_count?: number;
        primary_image_url?: string;
      }
    ) => {
      setFlowNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                data: {
                  ...n.data,
                  has_images: imageData.has_images,
                  primary_media_id: imageData.primary_media_id,
                  media_count: imageData.media_count,
                  primary_image_url: imageData.primary_image_url,
                },
              }
            : n
        )
      );
    },
    []
  );

  const onNodesChange = useCallback(
    (changes: any) => {
      onNodesChangeOriginal(changes);
    },
    [onNodesChangeOriginal]
  );

  // Handle dialog close
  const handleDialogClose = useCallback(() => {
    setIsAddNodeDialogOpen(false);
    setParentNodeId(null);
  }, []);

  // Update flow nodes when props change
  useEffect(() => {
    setFlowNodes(reactFlowNodes);
  }, [reactFlowNodes, setFlowNodes]);

  // Update flow edges when props change
  useEffect(() => {
    setFlowEdges(reactFlowEdges);
  }, [reactFlowEdges, setFlowEdges]);

  const value: ShareIdeasContextType = {
    // State
    ideasessions,
    currentIdea,
    connections,
    selectedNode,
    setSelectedNode,
    isLoading,
    promptLoading,
    promptValue,

    onNodesChange,

    // Canvas-specific state
    isAddNodeDialogOpen,
    parentNodeId,
    reactFlowInstance,
    flowNodes,
    flowEdges,
    reactFlowNodes,
    reactFlowEdges,

    // Setters
    setCurrentIdea,
    setIsAddNodeDialogOpen,
    setParentNodeId,
    setReactFlowInstance,

    // Canvas-specific actions
    handleDialogClose,
    getNodeShortId,
    setPromptValue,
    activeChatInputNodeId,
    setActiveChatInputNodeId,

    updateNodeImageData,
    // Helpers
    hasChildren,
  };

  return (
    <ShareIdeasContext.Provider value={value}>{children}</ShareIdeasContext.Provider>
  );
}
