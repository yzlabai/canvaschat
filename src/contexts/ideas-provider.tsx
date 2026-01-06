"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  IdeaSession,
  NodeType,
  IdeaSessionType,
  StoryImageStyleValue,
} from "@/types/ideas";
import { IdeaNodeConnection } from "@/types/ideas";
import { toast } from "sonner";
import {
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  ReactFlowInstance,
} from "@xyflow/react";
import dagre from "dagre";

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

type AddChildNodeData = {
  content: string;
  type: NodeType;
  position?: { x: number; y: number };
  parentNodeId: string;
};

type CreateNodeInputData = {
  title?: string;
  content: string;
  type: NodeType;
  parentNodeId?: string;
};

type CreateSessionInputData = {
  title?: string;
  description: string;
  type: IdeaSessionType;
  storyImageStyle?: StoryImageStyleValue;
  storyImagePrompt?: string | null;
};

type VideoGenerationResult = {
  status: string;
  mediaId?: string;
  pollUrl?: string;
  videoUrl?: string;
  message?: string;
  requestId?: string;
  storagePath?: string;
};

interface IdeasContextType {
  // State
  ideasessions: IdeaSession[];
  currentIdea: string | null;
  connections: IdeaNodeConnection[];
  selectedNode: string | null;
  setSelectedNode: (id: string | null) => void;
  isLoading: boolean;
  promptLoading: boolean;
  promptValue: string;

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
  autolayout: () => void;

  // React Flow specific handlers
  onNodesDelete: (nodes: Node[]) => void;
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (params: Connection) => void;

  // Actions
  createNewIdea: (data: CreateSessionInputData) => Promise<IdeaSession | null>;
  addNewNode: (nodeData: AddChildNodeData) => Promise<string | undefined>;
  switchIdeaSession: (idea_id: string) => Promise<void>;
  updateIdeaSession: (
    sessionId: string,
    updates: {
      storyImageStyle?: StoryImageStyleValue | null;
      storyImagePrompt?: string | null;
      isShared?: boolean;
      collaborators?: Array<Record<string, any>> | string[] | null;
    },
    options?: {
      successMessage?: string | null;
      suppressSuccessToast?: boolean;
    }
  ) => Promise<void>;

  // Canvas-specific actions
  handleAddChildNode: (parentNodeId: string) => Promise<void>;
  handleCreateNode: (data: CreateNodeInputData) => Promise<void>;
  handleDialogClose: () => void;
  handleChatMessage: (
    prompt: string,
    parentNodeId: string | null
  ) => Promise<void>;
  handleChatAIOnlyReply: (parentNodeId: string) => Promise<void>;
  getNodeShortId: (nodeId: string) => string | null;
  hasChildren: (nodeId: string) => boolean;
  // Shared prompt input state
  setPromptValue: (v: string) => void;
  // Show chat input within a node toolbar
  activeChatInputNodeId: string | null;
  setActiveChatInputNodeId: (id: string | null) => void;
  focusToolbarChatInput: (nodeId: string | null) => void;

  // AI Suggestion Workflow
  acceptAISuggestion: (nodeId: string, generateNext?: boolean) => Promise<void>;
  rejectAISuggestion: (nodeId: string) => Promise<void>;
  markTaskCompleted: (nodeId: string) => Promise<void>;
  markTaskInProgress: (nodeId: string) => Promise<void>;
  markTaskBlocked: (nodeId: string) => Promise<void>;
  chooseStoryPath: (nodeId: string) => Promise<void>;
  markStoryAlternative: (nodeId: string) => Promise<void>;
  generateAIChildSuggestions: (parentNodeId: string) => Promise<void>;
  handleGenerateStoryAction: (parentNodeId: string) => Promise<void>;

  // AI Content Generation for specific node types
  generateTextContent: (nodeId: string) => Promise<void>;
  generateImageContent: (nodeId: string, prompt?: string, style?: string) => Promise<void>;
  generateVideoContent: (
    nodeId: string,
    prompt?: string,
    style?: string
  ) => Promise<VideoGenerationResult | null>;

  // Node editing for user-created nodes
  updateNodeTitle: (nodeId: string, title: string) => Promise<void>;
  updateNodeContent: (nodeId: string, content: string) => Promise<void>;
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

const IdeasContext = createContext<IdeasContextType | undefined>(undefined);

export function useIdeas() {
  const context = useContext(IdeasContext);
  if (context === undefined) {
    throw new Error("useIdeas must be used within an IdeasProvider");
  }
  return context;
}

interface IdeasProviderProps {
  children: React.ReactNode;
}

export function IdeasProvider({ children }: IdeasProviderProps) {
  // Sessions and data state
  const [ideasessions, setIdeaSessions] = useState<IdeaSession[]>([]);
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
    const initializeIdeas = async () => {
      try {
        setIsLoading(true);

        // Load existing ideas and their nodes
        const response = await fetch("/api/yan/ideas");
        if (response.ok) {
          const {
            ideas: existingIdeas,
            nodes: allNodes,
            connections: allConnections,
          } = (await response.json()) || {
            ideas: [],
            nodes: [],
            connections: [],
          };

          setIdeaSessions(existingIdeas);
          setConnections(allConnections);
          setDbNodes(allNodes);

          // Select first session if available
          if (existingIdeas.length > 0) {
            setCurrentIdea(existingIdeas[0].id);
          }
        } else {
          // No ideasessions exist, create initial empty state
          setDbNodes([]);
        }
      } catch (error) {
        console.error("Error initializing ideas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeIdeas();
  }, []);

  // Create a new idea session
  const createNewIdea = useCallback(
    async ({
      description = "",
      type = "brainstorm",
      storyImageStyle,
      storyImagePrompt,
    }: CreateSessionInputData) => {
      const position_x = 0;
      const position_y = 0;
      try {
        const response = await fetch("/api/yan/ideas", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            description,
            type,
            position_x,
            position_y,
            storyImageStyle,
            storyImagePrompt,
          }),
        });

        if (response.ok) {
          const sessionData = await response.json();
          const { ideaSession, rootNode } = sessionData;

          setIdeaSessions((prev) => [...prev, ideaSession]);

          // Create UI root node from the API response
          if (rootNode) {
            const uiRootNode: Node = {
              id: rootNode.id,
              data: {
                ...rootNode,
                title: rootNode.title,
                content: rootNode.content,
                node_type: rootNode.node_type,
                session_id: ideaSession.id,
                root_distance: 0,
                idea_type: ideaSession.type,
              },
              type: rootNode.node_type,
              selected: true,
              position: {
                x: rootNode.position_x || 0,
                y: rootNode.position_y || 0,
              },
            };
            setFlowNodes([uiRootNode]);
          }

          setCurrentIdea(ideaSession.id);
          setSelectedNode(`${ideaSession.root_node_id}`);

          return ideaSession;
        }
      } catch (error) {
        console.error("Error creating new session:", error);
      }
      return null;
    },
    [ideasessions.length]
  );

  const updateIdeaSession = useCallback(
    async (
      sessionId: string,
      updates: {
        storyImageStyle?: StoryImageStyleValue | null;
        storyImagePrompt?: string | null;
        isShared?: boolean;
        collaborators?: Array<Record<string, any>> | string[] | null;
      },
      options?: {
        successMessage?: string | null;
        suppressSuccessToast?: boolean;
      }
    ) => {
      if (!sessionId) {
        toast.error("Missing session id");
        return;
      }

      const payload: Record<string, unknown> = { sessionId };
      if (Object.prototype.hasOwnProperty.call(updates, "storyImageStyle")) {
        payload.storyImageStyle = updates.storyImageStyle ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(updates, "storyImagePrompt")) {
        payload.storyImagePrompt = updates.storyImagePrompt ?? null;
      }
      if (Object.prototype.hasOwnProperty.call(updates, "isShared")) {
        payload.isShared = updates.isShared;
      }
      if (Object.prototype.hasOwnProperty.call(updates, "collaborators")) {
        payload.collaborators = updates.collaborators;
      }

      const { successMessage, suppressSuccessToast } = options ?? {};

      try {
        const response = await fetch("/api/yan/ideas", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.error || "Failed to update idea session");
        }

        const updatedSession = data?.session;
        if (updatedSession) {
          setIdeaSessions((prev) =>
            prev.map((session) =>
              session.id === sessionId ? { ...session, ...updatedSession } : session
            )
          );
        }

        if (!suppressSuccessToast) {
          toast.success(successMessage ?? "Idea settings updated");
        }
      } catch (error) {
        console.error("Failed to update idea session:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to update idea session"
        );
        throw error;
      }
    },
    [setIdeaSessions]
  );

  /**
   * Add a child node to a specified parent node
   */
  const addNewNode = useCallback(
    async (nodeData: {
      title?: string;
      content: string;
      type: NodeType;
      position?: { x: number; y: number };
      parentNodeId: string;
    }) => {
      const { title, content, type, position, parentNodeId } = nodeData;
      const parentNode = flowNodes.find((n) => n.id === parentNodeId);
      if (!currentIdea && !parentNode) {
        toast.error("No session selected to add the idea node");
        return;
      }
      const ideaSession = parentNode?.data.session_id;
      if (!ideaSession) {
        toast.error("No session found for the parent node");
        return;
      }

      try {
        // Create idea node directly (not AI generated)
        const nodeResponse = await fetch(`/api/yan/ideas/nodes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            session_id: ideaSession,
            title: title || "",
            content: content,
            node_type: type,
            parent_node_id: parentNodeId,
            created_by: "user",
            position_x: position?.x || 0,
            position_y: position?.y || 0,
          }),
        });

        if (nodeResponse.ok) {
          const { node: dbNode, connection } = await nodeResponse.json();
          const newUINode: Node = {
            id: dbNode.id,
            data: {
              ...dbNode,
            },
            position: position || {
              x: dbNode.position_x,
              y: dbNode.position_y,
            },
            type: dbNode.node_type,
            selected: false,
          };

          // Prepare updated edges including the new connection
          const updatedEdges = addEdge(
            {
              id: connection.id,
              source: connection.source_node_id,
              target: connection.target_node_id,
            },
            flowEdges
          );

          // Compute auto-layout with the pending nodes and updated edges
          const pendingNodes: Node[] = [...flowNodes, newUINode];
          const { laidOutNodes, laidOutEdges } = computeAutoLayout(pendingNodes, updatedEdges);

          // Update edges first, then nodes with laid-out positions
          setFlowEdges(laidOutEdges);
          setFlowNodes(laidOutNodes);
          
          // Return the created node ID
          return dbNode.id;
        }
      } catch (error) {
        console.error("Error creating node:", error);
        toast.error("Failed to create idea node. Please try again.");
      }
    },
    [currentIdea, flowNodes]
  );

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

  const focusToolbarChatInput = useCallback((nodeId: string | null) => {
    if (nodeId) setSelectedNode(nodeId);
    setActiveChatInputNodeId(nodeId);
  }, []);

  // ============================================================================
  // AI SUGGESTION WORKFLOW METHODS
  // ============================================================================

  const generateAIChildSuggestions = useCallback(
    async (parentNodeId: string): Promise<void> => {
      const parentNode = flowNodes.find((node) => node.id === parentNodeId);
      if (!parentNode) {
        toast.error("Parent node not found");
        return;
      }
      try {
        const response = await fetch(`/api/yan/ideas/gen`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            parentNodeId,
          }),
        });

        if (response.ok) {
          const { suggestions, connections: newConnections } =
            await response.json();

          // Convert API response to Node format
          const newSuggestionNodes: Node[] = suggestions.map((node: any) => ({
            id: node.id,
            data: node,
            type: node.node_type,
            position: { x: node.position_x || 0, y: node.position_y || 0 },
            color: "bg-yellow-100 border-yellow-400", // AI suggestions have special color
          }));
          const newEdges = newConnections.map((conn: any) => ({
            id: conn.id,
            source: conn.source_node_id,
            target: conn.target_node_id,
          }));
          
          const {laidOutNodes, laidOutEdges} = computeAutoLayout(
            [...flowNodes, ...newSuggestionNodes],
            [...flowEdges, ...newEdges]
          );

          // Add the new suggestion nodes to state
          setFlowNodes(laidOutNodes);
          setFlowEdges(laidOutEdges);

          toast.success(
            `Generated ${suggestions.length} AI suggestions for the selected node`
          );
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to generate AI suggestions");
        }
      } catch (error) {
        console.error("Error generating AI child suggestions:", error);
        toast.error("Failed to generate AI suggestions");
      }
    },
    [flowNodes]
  );

  const handleGenerateStoryAction = useCallback(
    async (
      parentNodeId: string,
      parentSiblingIds?: string[]
    ): Promise<void> => {
      const parentNode = flowNodes.find((node) => node.id === parentNodeId);
      if (!parentNode) {
        toast.error("Parent node not found");
        return;
      }
      console.log("Generating story structure from node:", parentNodeId);
      try {
        const response = await fetch(`/api/yan/ideas/gen/story`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            parentNodeId,
          }),
        });

        if (response.ok) {
          const { storyNode, actionNodes, connections } = await response.json();

          // Convert API response to Node format - story node
          const newStoryNode: Node = {
            id: storyNode.id,
            data: storyNode,
            type: storyNode.node_type,
            position: {
              x: storyNode.position_x || 0,
              y: storyNode.position_y || 0,
            },
          };

          // Convert action nodes
          const newActionNodes: Node[] = actionNodes.map((node: any) => ({
            id: node.id,
            data: node,
            type: node.node_type,
            position: { x: node.position_x || 0, y: node.position_y || 0 },
          }));

          // Prepare new edges from response
          const newEdges = connections.map((conn: any) => ({
            id: conn.id,
            source: conn.source_node_id,
            target: conn.target_node_id,
          }));
          // check for sibling story choices and console.log their status and change their status to reject.
          parentSiblingIds?.map((id) => {
            const sibling = flowNodes.find((node) => node.id === id);
            if (sibling) {
              // Change status to "reject" if it's currently "suggest"
              if (sibling.data.status === "suggest") {
                sibling.data.status = "reject";
              }
            }
          });
          // check for parent node and console log its status and change its status to accept.
          const parent = flowNodes.find((node) => node.id === parentNodeId);
          if (parent) {
            // Change status to "accept" if it's currently "suggest"
            if (parent.data.status === "suggest") {
              parent.data.status = "accept";
            }
          }
          // Compute auto-layout including both existing and new nodes/edges
          const pendingNodes: Node[] = [
            ...flowNodes,
            newStoryNode,
            ...newActionNodes,
          ];
          const pendingEdges: Edge[] = [...flowEdges, ...newEdges];
          const { laidOutNodes, laidOutEdges } = computeAutoLayout(pendingNodes, pendingEdges);
          // Update edges then nodes with laid out positions
          setFlowEdges(laidOutEdges);
          setFlowNodes(laidOutNodes);

          // save positions to db
          saveNodePositions(laidOutNodes);

          toast.success("Your story journey begins! Choose your path...");
          // select the new story node
          setSelectedNode(storyNode.id);
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to generate story structure");
        }
      } catch (error) {
        console.error("Error generating story structure:", error);
        toast.error("Failed to generate story structure");
      }
    },
    [flowNodes, flowEdges]
  );

  const acceptAISuggestion = useCallback(
    async (nodeId: string, generateNext: boolean = true): Promise<void> => {
      const nodeToAccept = flowNodes.find((node) => node.id === nodeId);
      if (!nodeToAccept) {
        toast.error("Node not found");
        return;
      }

      if (nodeToAccept.data.created_by !== "ai") {
        toast.error("Only AI-generated suggestions can be accepted");
        return;
      }

      try {
        // setIsGenerating(true);
        // Update the accepted node status in local state first
        setFlowNodes((prev) =>
          prev.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    status: "accept",
                    color: "bg-green-100 border-green-400",
                  },
                }
              : node
          )
        );

        // Use the correct API endpoint to update node status
        const response = await fetch(`/api/yan/ideas/nodes/${nodeId}/action`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "accept",
          }),
        });

        if (response.ok) {
          // Generate next level AI suggestions if requested
          if (generateNext) {
            await generateAIChildSuggestions(nodeId);
          }

          toast.success("AI suggestion accepted!");
        } else {
          // Revert the status change if API call failed
          setFlowNodes((prev) =>
            prev.map((node) =>
              node.id === nodeId
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      status: "suggest",
                      color: "bg-yellow-100 border-yellow-400",
                    },
                  }
                : node
            )
          );
          toast.error("Failed to accept AI suggestion");
        }
      } catch (error) {
        console.error("Error accepting AI suggestion:", error);
        // Revert the status change if error occurred
        setFlowNodes((prev) =>
          prev.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    status: "suggest",
                    color: "bg-yellow-100 border-yellow-400",
                  },
                }
              : node
          )
        );
        toast.error("Failed to accept AI suggestion");
      } finally {
        // setIsGenerating(false);
      }
    },
    [flowNodes, generateAIChildSuggestions]
  );

  const rejectAISuggestion = useCallback(
    async (nodeId: string): Promise<void> => {
      const nodeToReject = flowNodes.find((node) => node.id === nodeId);
      if (!nodeToReject) {
        toast.error("Node not found");
        return;
      }

      if (nodeToReject.data.created_by !== "ai") {
        toast.error("Only AI-generated suggestions can be rejected");
        return;
      }

      try {
        // Update the node status to "reject" with gray ghost style in local state
        setFlowNodes((prev) =>
          prev.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    status: "reject",
                    color: "bg-gray-50 border-gray-200 opacity-50",
                  },
                }
              : node
          )
        );

        // API call to persist rejection using the same endpoint pattern
        const response = await fetch(`/api/yan/ideas/nodes/${nodeId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: "reject" }),
        });

        if (!response.ok) {
          console.warn(
            "Failed to persist rejection to server, but continuing locally"
          );
        }

        toast.success("AI suggestion rejected");
      } catch (error) {
        console.error("Error rejecting AI suggestion:", error);
        // Revert the status change if error occurred
        setFlowNodes((prev) =>
          prev.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    status: "suggest",
                    color: "bg-yellow-100 border-yellow-400",
                  },
                }
              : node
          )
        );
        toast.error("Failed to reject AI suggestion");
      }
    },
    [flowNodes]
  );

  // Task state updates
  const updateNodeStatus = useCallback(
    async (
      nodeId: string,
      status: "todo" | "in-progress" | "completed" | "blocked"
    ) => {
      setFlowNodes((prev) =>
        prev.map((n) => (n.id === nodeId ? { ...n, status: status as any } : n))
      );
      // TODO: persist via API (PATCH /api/yan/ideas/node/:id)
    },
    []
  );

  const markTaskCompleted = useCallback(
    async (nodeId: string) => {
      await updateNodeStatus(nodeId, "completed");
    },
    [updateNodeStatus]
  );
  const markTaskInProgress = useCallback(
    async (nodeId: string) => {
      await updateNodeStatus(nodeId, "in-progress");
    },
    [updateNodeStatus]
  );
  const markTaskBlocked = useCallback(
    async (nodeId: string) => {
      await updateNodeStatus(nodeId, "blocked");
    },
    [updateNodeStatus]
  );

  // Story path handlers
  const chooseStoryPath = useCallback(
    async (nodeId: string) => {
      const nodeToChoose = flowNodes.find((node) => node.id === nodeId);
      if (!nodeToChoose) {
        toast.error("Node not found");
        return;
      }

      const siblingStoryChoices = flowNodes.filter(
        (node) =>
          node.id !== nodeId &&
          node.data.parent_node_id === nodeToChoose.data.parent_node_id &&
          node.data.node_type === "action"
      );
      try {
        // Set sibling story choices as rejected
        setFlowNodes((prev) =>
          prev.map((node) => {
            if (siblingStoryChoices.some((sibling) => sibling.id === node.id)) {
              return {
                ...node,
                data: {
                  ...node.data,
                  status: "reject",
                },
              };
            } else if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  status: "accept",
                },
              };
            }
            return node;
          })
        );
        // Use the same API endpoint to update node status
        const response = await fetch(`/api/yan/ideas/nodes/${nodeId}/action`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "accept",
          }),
        });

        if (response.ok) {
          // Handle successful response
          toast.success("Story path chosen!");
          // generate next part of the story
          await handleGenerateStoryAction(
            nodeId,
            siblingStoryChoices.map((s) => s.id)
          );
        } else {
          throw new Error("Failed to choose story path");
        }
      } catch (error) {
        console.error("Error choosing story path:", error);
        // Revert the status change if error occurred
        setFlowNodes((prev) =>
          prev.map((node) => {
            if (siblingStoryChoices.some((sibling) => sibling.id === node.id)) {
              return {
                ...node,
                data: {
                  ...node.data,
                  status: "suggest",
                },
              };
            } else if (node.id === nodeId) {
              return {
                ...node,
                data: {
                  ...node.data,
                  status: "suggest",
                },
              };
            }
            return node;
          })
        );
        toast.error("Failed to choose story path");
      }
    },
    [flowNodes]
  );

  const markStoryAlternative = useCallback(
    async (nodeId: string) => {
      const nodeToReject = flowNodes.find((node) => node.id === nodeId);
      if (!nodeToReject) {
        toast.error("Node not found");
        return;
      }

      try {
        // Update the node status to "reject" in local state first
        setFlowNodes((prev) =>
          prev.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    status: "reject",
                  },
                }
              : node
          )
        );

        // Use the same API endpoint to update node status
        const response = await fetch(`/api/yan/ideas/nodes/${nodeId}/action`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "reject",
          }),
        });

        if (response.ok) {
          toast.success("Story alternative marked");
        } else {
          // Revert the status change if API call failed
          setFlowNodes((prev) =>
            prev.map((node) =>
              node.id === nodeId
                ? {
                    ...node,
                    data: {
                      ...node.data,
                      status: nodeToReject.data.status, // Revert to original status
                    },
                  }
                : node
            )
          );
          toast.error("Failed to mark story alternative");
        }
      } catch (error) {
        console.error("Error marking story alternative:", error);
        // Revert the status change if error occurred
        setFlowNodes((prev) =>
          prev.map((node) =>
            node.id === nodeId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    status: nodeToReject.data.status, // Revert to original status
                  },
                }
              : node
          )
        );
        toast.error("Failed to mark story alternative");
      }
    },
    [flowNodes]
  );

  // Node editing functions for user-created nodes
  const updateNodeTitle = useCallback(
    async (nodeId: string, title: string) => {
      const node = flowNodes.find((n) => n.id === nodeId);
      if (!node) {
        toast.error("Node not found");
        return;
      }

      if (node.data.created_by === "ai") {
        toast.error("Cannot edit AI-generated nodes");
        return;
      }

      setFlowNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, title } } : n
        )
      );
      try {
        const response = await fetch(`/api/yan/ideas/nodes/${nodeId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title }),
        });
        if (response.ok) {
          toast.success("Node title updated");
        } else {
          toast.error("Failed to update node title");
        }
      } catch (error) {
        console.error("Failed to update node title:", error);
      }
    },
    [flowNodes]
  );

  const updateNodeContent = useCallback(
    async (nodeId: string, content: string) => {
      const node = flowNodes.find((n) => n.id === nodeId);
      if (!node) {
        toast.error("Node not found");
        return;
      }

      if (node.data.created_by === "ai") {
        toast.error("Cannot edit AI-generated nodes");
        return;
      }

      setFlowNodes((prev) =>
        prev.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, content } } : n
        )
      );
      try {
        const response = await fetch(`/api/yan/ideas/nodes/${nodeId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        });
        if (response.ok) {
          toast.success("Node content updated");
        } else {
          toast.error("Failed to update node content");
        }
      } catch (error) {
        console.error("Failed to update node content:", error);
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

  // Generate AI text content for a text node
  const generateTextContent = useCallback(
    async (nodeId: string): Promise<void> => {
      const node = flowNodes.find((n) => n.id === nodeId);
      if (!node) {
        toast.error("Node not found");
        return;
      }

      try {
        toast.info("Generating text content with AI...");
        
        const response = await fetch(`/api/yan/ideas/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: node.data.title || "Generate detailed content for this topic",
            parentNodeId: nodeId,
            sessionId: currentIdea,
            mode: "content-only",
          }),
        });

        if (response.ok) {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let accumulatedText = "";

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = decoder.decode(value);
              const lines = chunk.split("\n");
              
              for (const line of lines) {
                if (line.startsWith("0:")) {
                  try {
                    const jsonStr = line.substring(2);
                    const data = JSON.parse(jsonStr);
                    if (data && typeof data === "string") {
                      accumulatedText += data;
                    }
                  } catch (e) {
                    // Skip invalid JSON
                  }
                }
              }
            }
          }

          if (accumulatedText) {
            await updateNodeContent(nodeId, accumulatedText);
            toast.success("Text content generated successfully!");
          }
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to generate text content");
        }
      } catch (error) {
        console.error("Error generating text content:", error);
        toast.error("Failed to generate text content");
      }
    },
    [flowNodes, currentIdea, updateNodeContent]
  );

  // Generate AI image for an image node
  const generateImageContent = useCallback(
    async (nodeId: string, prompt?: string, style?: string): Promise<void> => {
      const node = flowNodes.find((n) => n.id === nodeId);
      if (!node) {
        toast.error("Node not found");
        return;
      }

      try {
        toast.info("Generating image with AI...");
        
        const response = await fetch(`/api/yan/ideas/gen/image`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            node_id: nodeId,
            prompt: prompt || node.data.title || undefined,
            style: style || undefined,
          }),
        });

        if (response.ok) {
          const { image, media_id } = await response.json();
          
          // Update node content with the image URL
          await updateNodeContent(nodeId, image);
          
          // Update node image data
          updateNodeImageData(nodeId, {
            has_images: true,
            primary_media_id: media_id,
            media_count: ((node.data.media_count as number) || 0) + 1,
            primary_image_url: image,
          });
          
          toast.success("Image generated successfully!");
        } else {
          const error = await response.json();
          toast.error(error.error || "Failed to generate image");
        }
      } catch (error) {
        console.error("Error generating image:", error);
        toast.error("Failed to generate image");
      }
    },
    [flowNodes, updateNodeContent, updateNodeImageData]
  );

  // Generate AI video for a video node
  const generateVideoContent = useCallback(
    async (
      nodeId: string,
      prompt?: string,
      style?: string
    ): Promise<VideoGenerationResult | null> => {
      const node = flowNodes.find((n) => n.id === nodeId);
      if (!node) {
        toast.error("Node not found");
        return null;
      }

      const trimmedPrompt = prompt?.trim?.() ? prompt.trim() : undefined;
      const requestPayload: Record<string, unknown> = {
        node_id: nodeId,
      };

      if (trimmedPrompt) {
        requestPayload.prompt = trimmedPrompt;
      } else if (typeof node.data.title === "string" && node.data.title.trim()) {
        requestPayload.prompt = node.data.title.trim();
      }

      if (style) {
        requestPayload.style = style;
      }

      try {
        toast.info("Starting video generation... This may take a few minutes.");

        const response = await fetch(`/api/yan/ideas/gen/video`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
        });

        if (!response.ok) {
          let errorMessage = "Failed to generate video";
          try {
            const errorBody = await response.json();
            if (errorBody?.error) {
              errorMessage = String(errorBody.error);
            }
          } catch (parseError) {
            console.error("Failed to parse video generation error:", parseError);
          }
          toast.error(errorMessage);
          return null;
        }

        let data: any = null;
        try {
          data = await response.json();
        } catch (parseError) {
          console.error("Failed to parse video generation response:", parseError);
          data = {};
        }

        const result: VideoGenerationResult = {
          status: typeof data?.status === "string"
            ? data.status
            : data?.video_url
              ? "generated"
              : "queued",
          mediaId: typeof data?.media_id === "string" ? data.media_id : undefined,
          pollUrl: typeof data?.poll_url === "string" ? data.poll_url : undefined,
          videoUrl: typeof data?.video_url === "string" ? data.video_url : undefined,
          message: typeof data?.message === "string" ? data.message : undefined,
          requestId: typeof data?.request_id === "string" ? data.request_id : undefined,
          storagePath: typeof data?.storage_path === "string" ? data.storage_path : undefined,
        };

        const resolvedPrompt =
          trimmedPrompt ||
          (typeof node.data.content === "string" && node.data.content.trim()
            ? node.data.content.trim()
            : undefined) ||
          (typeof node.data.title === "string" && node.data.title.trim()
            ? node.data.title.trim()
            : undefined);

        setFlowNodes((prev) =>
          prev.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  data: {
                    ...n.data,
                    has_videos: true,
                    primary_media_id:
                      result.mediaId ?? (n.data?.primary_media_id as string | undefined),
                    generation_prompt:
                      resolvedPrompt ?? (n.data?.generation_prompt as string | undefined),
                  },
                }
              : n
          )
        );

        if (result.videoUrl) {
          await updateNodeContent(nodeId, result.videoUrl);
          toast.success("Video generated successfully!");
        } else {
          toast.success(
            result.message ||
              "Video generation started! It will be ready in a few minutes."
          );
        }

        return result;
      } catch (error) {
        console.error("Error generating video:", error);
        toast.error("Failed to generate video");
        return null;
      }
    },
    [flowNodes, setFlowNodes, updateNodeContent]
  );

  // ============================================================================
  // REACT FLOW CANVAS STATE MANAGEMENT
  // ============================================================================

  // Handler for adding child nodes
  const handleAddChildNode = useCallback(
    async (parentNodeId: string) => {
      // Find the parent node to position the child relative to it
      const parentNode = flowNodes.find((n) => n.id === parentNodeId);
      if (!parentNode) return;
      setParentNodeId(parentNodeId);
      setIsAddNodeDialogOpen(true);
    },
    [flowNodes]
  );

  // Save node positions to database
  const saveNodePositions = useCallback(async (updatedNodes: Node[]) => {
    try {
      const positionUpdates = updatedNodes.map((node) => ({
        id: node.id,
        position_x: Math.round(node.position.x),
        position_y: Math.round(node.position.y),
      }));

      const response = await fetch(`/api/yan/ideas/nodes/positions`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ positions: positionUpdates }),
      });

      if (response.ok) {
        console.log("Node positions saved:", positionUpdates);
      } else {
        console.error("Failed to save positions:", response.status);
      }
    } catch (error) {
      console.error("Failed to save node positions:", error);
    }
  }, []);
  const saveNodesDeleted = useCallback(async (deletedNodes: Node[]) => {
    try {
      const idsToDelete = deletedNodes.map((node) => node.id);
      const response = await fetch(`/api/yan/ideas/nodes`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: idsToDelete }),
      });
      if (response.ok) {
        console.log("Deleted nodes persisted:", idsToDelete);
      } else {
        console.error("Failed to delete nodes:", response.status);
      }
    } catch (error) {
      console.error("Failed to delete nodes:", error);
    }
  }, []);

  const autolayout = useCallback(() => {
    const { laidOutNodes, laidOutEdges } = computeAutoLayout(flowNodes, flowEdges);
    console.log("Auto-layout applied");
    console.log(laidOutNodes);

    const changedNodeIds: string[] = [];
    laidOutNodes.forEach((node, idx) => {
      const prev = flowNodes[idx];
      if (!prev) return;
      const dx = Math.abs((prev.position?.x ?? 0) - (node.position?.x ?? 0));
      const dy = Math.abs((prev.position?.y ?? 0) - (node.position?.y ?? 0));
      if (dx > 1 || dy > 1) changedNodeIds.push(node.id);
    });

    setFlowNodes(laidOutNodes);

    if (changedNodeIds.length > 0) {
      saveNodePositions(
        laidOutNodes.filter((n) => changedNodeIds.includes(n.id))
      );
    }
  }, [flowNodes, flowEdges, setFlowNodes, saveNodePositions]);

  // Enhanced onNodesChange handler with position saving
  const onNodesChange = useCallback(
    (changes: any) => {
      onNodesChangeOriginal(changes);
      // Debounce position saves to avoid too many API calls
      const positionChanges = changes.filter(
        (change: any) => change.type === "position" && change.dragging === false
      );

      if (positionChanges.length > 0) {
        // Save positions after a short delay
        setTimeout(() => {
          saveNodePositions(positionChanges);
        }, 500);
      }
    },
    [onNodesChangeOriginal, saveNodePositions]
  );

  const onNodesDelete = useCallback((deleted: Node[]) => {
    saveNodesDeleted(deleted);
  }, []);

  const onConnect = useCallback(
    (params: Connection) => setFlowEdges((eds) => addEdge(params, eds)),
    [setFlowEdges]
  );

  // Handle creating a new node
  const handleCreateNode = useCallback(
    async ({ title, content, type, parentNodeId }: CreateNodeInputData) => {
      if (!content.trim()) return;

      try {
        // Use the function from context with custom position
        // Note:  already handles the API call, so no need to force sync
        const newNodeId = await addNewNode({
          title: title,
          content: content,
          type: type,
          parentNodeId: parentNodeId!,
        });

        // Reset dialog state
        setIsAddNodeDialogOpen(false);
      } catch (error) {
        console.error("Failed to create node:", error);
      }
    },
    [addNewNode]
  );

  // Handle dialog close
  const handleDialogClose = useCallback(() => {
    setIsAddNodeDialogOpen(false);
    setParentNodeId(null);
  }, []);

  // Switch to another idea session: fetch its nodes from backend and clear previous ones
  const switchIdeaSession = useCallback(
    async (idea_id: string) => {
      if (!idea_id) return;
      if (currentIdea === idea_id) return; // no-op if already selected
      try {
        setIsLoading(true);

        // Clear existing nodes/connections immediately for visual switch
        setDbNodes([]);
        setConnections([]);
        setFlowNodes([]);
        setFlowEdges([]);

        const res = await fetch(
          `/api/yan/ideas?id=${encodeURIComponent(idea_id)}`
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          toast.error(err?.error || "Failed to load idea session");
          return;
        }

        const { ideas, nodes, connections } = (await res.json()) || {
          ideas: [],
          nodes: [],
          connections: [],
        };

        // Ensure the requested session exists in response
        const selected = ideas?.find((s: any) => s.id === idea_id);
        if (!selected) {
          toast.error("Session not found or unauthorized");
          return;
        }

        // Update all relevant states
        setIdeaSessions(ideas || []);
        setConnections(connections || []);
        setDbNodes(nodes || []);
        setCurrentIdea(idea_id);

        // Optionally focus root node if present among nodes
        const rootId = selected.root_node_id as string | null;
        if (rootId && (nodes || []).some((n: any) => n.id === rootId)) {
          setSelectedNode(rootId);
        } else {
          // If no root, select first node if available
          if ((nodes || []).length > 0) {
            setSelectedNode(nodes[0].id);
          } else {
            setSelectedNode(null);
          }
        }
      } catch (e) {
        console.error("Failed to switch idea session:", e);
        toast.error("Failed to switch idea session");
      } finally {
        setIsLoading(false);
      }
    },
    [
      currentIdea,
      setDbNodes,
      setConnections,
      setFlowNodes,
      setFlowEdges,
      setIdeaSessions,
      setCurrentIdea,
      setSelectedNode,
      setIsLoading,
    ]
  );

  // Handle send message in chat mode
  const handleChatMessage = useCallback(
    async (prompt: string, parentNodeId: string | null) => {
      if (!currentIdea || !parentNodeId || !prompt.trim()) {
        toast.error("Missing session, node, or prompt");
        return;
      }
      if (promptLoading) return;
      setPromptLoading(true);
      // Optimistically create local user + AI nodes and edges
      const parentNode = flowNodes.find((n) => n.id === parentNodeId);
      const baseX = parentNode?.position?.x || 0;
      const baseY = parentNode?.position?.y || 0;
      const sessionId = parentNode?.data?.session_id || currentIdea;
      // Generate stable UUIDs client-side for new nodes
      const userNodeId = genId();
      const aiNodeId = genId();

      const userNodeLocal: Node = {
        id: userNodeId,
        data: {
          id: userNodeId,
          session_id: sessionId,
          parent_node_id: parentNodeId,
          node_type: "chat",
          created_by: "user",
          title: "",
          content: prompt,
          status: "done",
        },
        type: "chat",
        position: { x: baseX, y: baseY },
        selected: false,
      };

      const aiNodeLocal: Node = {
        id: aiNodeId,
        data: {
          id: aiNodeId,
          session_id: sessionId,
          parent_node_id: userNodeId,
          node_type: "chat",
          created_by: "ai",
          title: "AI",
          content: "",
          status: "generating",
        },
        type: "chat",
        position: { x: baseX, y: baseY },
        selected: false,
      };

      const userEdgeLocal: Edge = {
        id: `e_${parentNodeId}_${userNodeId}`,
        source: parentNodeId,
        target: userNodeId,
      } as Edge;
      const aiEdgeLocal: Edge = {
        id: `e_${userNodeId}_${aiNodeId}`,
        source: userNodeId,
        target: aiNodeId,
      } as Edge;
      // use computeAutoLayout to adjust positions
      const pendingNodes: Node[] = [...flowNodes, userNodeLocal, aiNodeLocal];
      const pendingEdges: Edge[] = [...flowEdges, userEdgeLocal, aiEdgeLocal];
      const {laidOutNodes, laidOutEdges} = computeAutoLayout(pendingNodes, pendingEdges);

      setFlowNodes(laidOutNodes);
      setFlowEdges(laidOutEdges);
      const aiNode = laidOutNodes.find((n) => n.id === aiNodeId);
      const ainode_position = aiNode?.position || { x: baseX, y: baseY };

      // focus ai node
      setSelectedNode(aiNodeId);

      try {
        const response = await fetch("/api/yan/ideas/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: prompt,
            parentNodeId,
            userNodeId,
            aiNodeId,
          }),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err?.error || "Failed to send chat message");
        }
        // Stream AI response into AI node content
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let aiAccum = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          if (!chunk) continue;
          aiAccum += chunk;
          setFlowNodes((prev) => 
            prev.map((n) =>
              n.id === aiNodeId
                ? { ...n, position: ainode_position, data: { ...n.data, content: aiAccum } }
                : n
            )
          );
        }
        focusToolbarChatInput(null);
      } catch (err: any) {
        console.error("Chat send failed:", err);
        // Mark AI node as error
        setFlowNodes((prev) =>
          prev.map((n) =>
            n.id === aiNodeId
              ? { ...n, data: { ...n.data, status: "error" } }
              : n
          )
        );
        toast.error(err?.message || "Failed to send chat message");
      } finally {
        setFlowNodes((prev) =>
          prev.map((n) =>
            n.id === aiNodeId
              ? { ...n, position: ainode_position, data: { ...n.data, status: "done" }, selected: true }
              : { ...n, selected: false }
          )
        );
        setPromptLoading(false);
        setPromptValue("");
      }
    },
    [
      currentIdea,
      flowNodes,
      flowEdges,
      setFlowNodes,
      setFlowEdges,
      promptLoading,
    ]
  );

  // Handle AI-only reply in chat mode (no user node is created)
  const handleChatAIOnlyReply = useCallback(
    async (parentNodeId: string) => {
      if (!currentIdea || !parentNodeId) {
        toast.error("Missing session or parent node");
        return;
      }
      if (promptLoading) return;
      setPromptLoading(true);
      // Find parent node and base position
      const parentNode = flowNodes.find((n) => n.id === parentNodeId);
      const baseX = parentNode?.position?.x || 0;
      const baseY = parentNode?.position?.y || 0;
      const sessionId = parentNode?.data?.session_id || currentIdea;
      // Generate stable UUID for the AI node
      const aiNodeId = genId();
      const aiEdgeId = genId();
      const aiNodeLocal: Node = {
        id: aiNodeId,
        data: {
          id: aiNodeId,
          session_id: sessionId,
          parent_node_id: parentNodeId,
          node_type: "chat",
          created_by: "ai",
          title: "AI",
          content: "",
          status: "generating",
        },
        type: "chat",
        position: { x: baseX + 200, y: baseY },
        selected: false,
      };

      const aiEdgeLocal: Edge = {
        id: aiEdgeId,
        source: parentNodeId,
        target: aiNodeId,
      } as Edge;

      const pendingNodes: Node[] = [...flowNodes, aiNodeLocal];
      const pendingEdges: Edge[] = [...flowEdges, aiEdgeLocal];
      const { laidOutNodes, laidOutEdges } = computeAutoLayout(pendingNodes, pendingEdges);
      const aiNode = laidOutNodes.find((n) => n.id === aiNodeId);
      const ainode_position = aiNode?.position || { x: baseX, y: baseY };

      setFlowNodes(laidOutNodes);
      setFlowEdges(laidOutEdges);

      setSelectedNode(aiNodeId);

      try {
        const response = await fetch("/api/yan/ideas/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ aiOnly: true, parentNodeId, aiNodeId }),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}) as any);
          throw new Error(err?.error || "Failed to start AI reply");
        }
        // IDs are already known; no need to remap

        // Stream AI response
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let aiAccum = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (!chunk) continue;
          aiAccum += chunk;
          setFlowNodes((prev) =>
            prev.map((n) =>
              n.id === aiNodeId
                ? { ...n, position: ainode_position, data: { ...n.data, content: aiAccum } }
                : n
            )
          );
        }
        // focus ai node
        // setSelectedNode(aiNodeId);
      } catch (err: any) {
        console.error("AI-only chat failed:", err);
        setFlowNodes((prev) =>
          prev.map((n) =>
            n.id === aiNodeId
              ? { ...n, data: { ...n.data, status: "error" } }
              : n
          )
        );
        toast.error(err?.message || "Failed to start AI reply");
      } finally {
        setFlowNodes((prev) =>
          prev.map((n) =>
            n.id === aiNodeId
              ? { ...n, position: ainode_position, data: { ...n.data, status: "done" } }
              : n
          )
        );
        setPromptLoading(false);
      }
    },
    [
      currentIdea,
      flowNodes,
      flowEdges,
      setFlowNodes,
      setFlowEdges,
      promptLoading,
    ]
  );

  // Update flow nodes when props change
  useEffect(() => {
    setFlowNodes(reactFlowNodes);
  }, [reactFlowNodes, setFlowNodes]);

  // Update flow edges when props change
  useEffect(() => {
    setFlowEdges(reactFlowEdges);
  }, [reactFlowEdges, setFlowEdges]);

  const value: IdeasContextType = {
    // State
    ideasessions,
    currentIdea,
    connections,
    selectedNode,
    setSelectedNode,
    isLoading,
    promptLoading,
    promptValue,

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

    // React Flow specific handlers
    onNodesDelete,
    onNodesChange,
    onEdgesChange,
    onConnect,

    // Actions
    createNewIdea,
    addNewNode,
    switchIdeaSession,
    updateIdeaSession,

    // Canvas-specific actions
    autolayout,
    handleAddChildNode,
    handleCreateNode,
    handleDialogClose,
    handleChatMessage,
    handleChatAIOnlyReply,
    getNodeShortId,
    setPromptValue,
    activeChatInputNodeId,
    setActiveChatInputNodeId,
    focusToolbarChatInput,

    // AI Suggestion Workflow
    acceptAISuggestion,
    rejectAISuggestion,
    markTaskCompleted,
    markTaskInProgress,
    markTaskBlocked,
    chooseStoryPath,
    markStoryAlternative,
    generateAIChildSuggestions,
    handleGenerateStoryAction,

    // AI Content Generation for specific node types
    generateTextContent,
    generateImageContent,
    generateVideoContent,

    // Node editing for user-created nodes
    updateNodeTitle,
    updateNodeContent,
    updateNodeImageData,
    // Helpers
    hasChildren,
  };

  return (
    <IdeasContext.Provider value={value}>{children}</IdeasContext.Provider>
  );
}
