// Types for Ideas Development System

// ============================================================================
// STATUS AND ENUM TYPES
// ============================================================================

// Idea Session Status Types
export type SessionStatus = "active" | "paused" | "completed" | "archived";

// Node Status Types
export type NodeStatus =
  | "generating"
  | "done"
  | "suggest"
  | "accept"
  | "reject"
  | "active"
  | "archived"
  | "deleted"
  | "merged";

// AI Suggestion Status Types
export type SuggestionStatus = "suggest" | "accepted" | "rejected" | "archived";

// Task Status Types (for project management use case)
export type TaskStatus =
  | "todo"
  | "in-progress"
  | "completed"
  | "blocked"
  | "cancelled";

// Story Game Status (for interactive narrative use case)
export type StoryStatus =
  | "choice-pending"
  | "path-taken"
  | "path-alternative"
  | "story-outcome";

// Processing Status Types
export type ProcessingStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";
export type VoiceProcessingStatus =
  | "pending"
  | "transcribing"
  | "completed"
  | "failed";
export type TextProcessingStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";
export type MessageStatus =
  | "pending"
  | "streaming"
  | "completed"
  | "failed"
  | "cancelled";

// Node Types
export type NodeType =
  | "idea"
  | "chat"
  | "story"
  | "action"
  | "note"
  | "task"
  | "milestone"
  | "text"
  | "image"
  | "video";

// Connection Types
export type ConnectionType =
  | "related"
  | "depends_on"
  | "leads_to"
  | "conflicts"
  | "supports"
  | "suggests"
  | "implements"
  | "blocks";

// Priority Levels
export type Priority = "low" | "medium" | "high" | "critical";

// Size Options
export type Size = "small" | "medium" | "large";

// Creation Source
export type CreatedBy = "user" | "ai" | "system";

// Direction Types
export type Direction =
  | "bidirectional"
  | "source_to_target"
  | "target_to_source";

// Line Styles
export type LineStyle = "solid" | "dashed" | "dotted";

// Idea Types
export type IdeaSessionType =
  | "brainstorm"
  | "story"
  | "chat";

export type StoryImageStyleValue =
  | "cinematic"
  | "watercolor"
  | "line-art"
  | "anime"
  | "surreal";

// Input Methods
export type InputMethod =
  | "typing"
  | "paste"
  | "drag_drop"
  | "voice"
  | "file_upload";

// Context Types
export type ContextType =
  | "general"
  | "clarification"
  | "expansion"
  | "refinement"
  | "follow_up";

// Transcription Status
export type TranscriptionStatus = "completed" | "failed" | "partial";

// Layout Types
export type LayoutType =
  | "manual"
  | "auto"
  | "hierarchy"
  | "circular"
  | "force"
  | "tree";

// Character Stats (for RPG elements)
export interface CharacterStats {
  wisdom: number;
  intelligence: number;
  strength: number;
  charisma: number;
  luck: number;
  [key: string]: number; // Allow custom stats
}

// Relationship Tracking (for story games)
export interface RelationshipStatus {
  characterId: string;
  characterName: string;
  relationship: "ally" | "neutral" | "hostile" | "unknown";
  trust: number; // 0-10
  influence: number; // 0-10
}

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface IdeaSession {
  id: string;
  user_uuid: string;
  title?: string;
  description?: string;
  type: IdeaSessionType;
  story_image_style?: StoryImageStyleValue | null;
  story_image_prompt?: string | null;
  root_node_id: string;
  status: SessionStatus;
  total_idea_nodes: number;
  total_ai_interactions: number;
  total_tokens_used: number;
  total_cost_cents: number;
  started_at: Date;
  last_activity_at?: Date;
  completed_at?: Date;
  is_shared: boolean;
  collaborators?: string; // JSON array
  tags?: string; // JSON array
  metadata?: string; // JSON
  created_at: Date;
  updated_at: Date;
}

export interface IdeaNodeData {
  id: string;
  session_id: string;
  idea_type: string;
  user_uuid: string;
  title: string;
  content?: string;
  summary?: string;
  root_distance: number; // Distance from root node (0 for root)
  node_type: NodeType;
  category?: string;
  priority: Priority;
  position_x: number;
  position_y: number;
  color: string;
  size: Size;
  
  // Media fields
  primary_media_id?: string; // Reference to primary media item
  media_count: number; // Total number of media items
  has_images: boolean; // Quick flag for images
  has_videos: boolean; // Quick flag for videos
  has_audio: boolean; // Quick flag for audio
  primary_image_url?: string; // Public URL for primary image (for display)
  medias?: Array<{
    id: string;
    node_id: string;
    media_url: string;
    media_type: string;
    is_primary: boolean;
    display_order: number;
  }>; // Attached media items
  
  // Node relationships
  parent_node_id?: string;
  connected_nodes?: string; // JSON array of connected node IDs
  dependency_nodes?: string; // JSON array of nodes this depends on
  
  // Generation information
  created_by: CreatedBy;
  generation_prompt?: string;
  
  // AI metadata
  ai_confidence?: number;
  ai_reasoning?: string;
  suggested_connections?: string; // JSON array
  
  // Node status
  status: NodeStatus;
  
  // Interaction tracking
  view_count: number;
  edit_count: number;
  last_viewed_at?: Date;
  last_edited_at?: Date;
  
  // Collaboration
  collaborator_notes?: string; // JSON
  shared_with?: string; // JSON array
  
  // Cost tracking (for AI-generated nodes)
  generation_tokens: number;
  generation_cost_cents: number;
  
  // Metadata
  tags?: string; // JSON array
  metadata?: string; // JSON
  
  created_at: Date;
  updated_at: Date;
  archived_at?: Date;
}

export interface IdeaNodeConnection {
  id: string;
  session_id: string;
  user_uuid: string;
  source_node_id: string;
  target_node_id: string;
  connection_type: ConnectionType;
  strength: number;
  direction: Direction;
  line_style: LineStyle;
  line_color: string;
  line_width: number;
  label?: string;
  description?: string;
  created_by: CreatedBy;
  ai_suggested: boolean;
  ai_confidence?: number;
  ai_reasoning?: string;
  status: NodeStatus;
  validated: boolean;
  metadata?: string; // JSON
  created_at: Date;
  updated_at: Date;
}

export interface CreateNodeResult {
  nodes: IdeaNodeData[];
  connections: IdeaNodeConnection[];
  message?: string;
}

// Enhanced types for the canvas components
export interface IdeaNode extends Partial<IdeaNodeData> {
  id: string; // Make id required
  // Additional properties for canvas display
  x: number; // Alias for position_x
  y: number; // Alias for position_y
  // Merged from legacy local component IdeaNode type
  connections?: string[]; // Local, lightweight connection references (client-side only)
}

// AI chat/message related types (merged from component-local types)
export interface AIMessage {
  id: string;
  type: "message" | "suggestion" | "question";
  content: string;
  timestamp: Date;
  isFromUser: boolean;
}

// Canvas-specific types
export interface CanvasData {
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  layout: LayoutType;
  theme: string;
  showMinimap: boolean;
  showControls: boolean;
  settings: {
    autoSave: boolean;
    collaborationMode: boolean;
    aiSuggestions: boolean;
  };
}

export interface CreateIdeaNodeRequest {
  id?: string;
  session_id: string;
  title: string;
  content?: string;
  node_type?: NodeType;
  position_x?: number;
  position_y?: number;
  parent_node_id?: string;
  root_distance?: number;
  created_by?: CreatedBy;
}


export interface CreateNodeConnectionRequest {
  session_id: string;
  source_node_id: string;
  target_node_id: string;
  connection_type?: ConnectionType;
  label?: string;
  description?: string;
  created_by?: CreatedBy;
}

// Utility types for parsing JSON fields
export interface ParsedCanvasData extends CanvasData {}

export interface ParsedCollaborators {
  user_uuid: string;
  role: "viewer" | "editor" | "owner";
  invited_at: Date;
  accepted_at?: Date;
}

export interface ParsedDeviceInfo {
  browser: string;
  os: string;
  device_type: "desktop" | "mobile" | "tablet";
  microphone?: string;
  sample_rate?: number;
}

export interface ParsedSegments {
  text: string;
  start_time: number;
  end_time: number;
  confidence: number;
  speaker?: number;
}

export interface ParsedTopicTags {
  tag: string;
  confidence: number;
  category?: string;
}

export interface ParsedSuggestedActions {
  action: string;
  type: "create_node" | "connect_nodes" | "categorize" | "research";
  confidence: number;
  parameters?: Record<string, any>;
}

// API Response Types
export interface GetIdeasResponse {
  sessions: IdeaSession[];
  nodes: IdeaNodeData[];
  connections: IdeaNodeConnection[];
}

// ============================================================================
// UTILITY TYPES FOR BETTER TYPE SAFETY
// ============================================================================

// Union types for quick status checks
export type ActiveStatuses = Extract<
  NodeStatus,
  "active" | "suggest" | "generating"
>;
export type InactiveStatuses = Extract<
  NodeStatus,
  "archived" | "deleted" | "reject"
>;
export type PendingStatuses = Extract<
  ProcessingStatus,
  "pending" | "processing"
>;
export type CompletedStatuses = Extract<
  ProcessingStatus,
  "completed" | "failed" | "cancelled"
>;

// Node type categories
export type CreativeNodeTypes = Extract<NodeType, "idea" | "question" | "note">;
export type ActionNodeTypes = Extract<
  NodeType,
  "action" | "task" | "milestone"
>;
export type StoryNodeTypes = Extract<
  NodeType,
  "story-choice" | "story-outcome"
>;

// Status transition maps for validation
export type StatusTransitions = {
  [K in NodeStatus]: NodeStatus[];
};

// Default status values for different contexts
export const DEFAULT_STATUSES = {
  node: "active" as NodeStatus,
  session: "active" as SessionStatus,
  processing: "pending" as ProcessingStatus,
  suggestion: "suggest" as SuggestionStatus,
  task: "todo" as TaskStatus,
  story: "choice-pending" as StoryStatus,
} as const;

// Priority weights for sorting
export const PRIORITY_WEIGHTS = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
} as const;

// Color mappings for different statuses and types
export const STATUS_COLORS = {
  // Node statuses
  active: "blue",
  suggest: "yellow",
  accept: "green",
  reject: "red",
  archived: "gray",
  generating: "purple",

  // Task statuses
  todo: "orange",
  "in-progress": "blue",
  completed: "green",
  blocked: "red",
  cancelled: "gray",

  // Story statuses
  "choice-pending": "cyan",
  "path-taken": "green",
  "path-alternative": "gray",
  "story-outcome": "purple",
} as const;

// Validation helpers
export type ValidNodeTypeForStatus<T extends NodeStatus> = T extends "suggest"
  ? CreativeNodeTypes
  : NodeType;

export type ValidStatusForNodeType<T extends NodeType> =
  T extends StoryNodeTypes
    ? StoryStatus
    : T extends ActionNodeTypes
      ? TaskStatus | NodeStatus
      : NodeStatus;

// Helper type for creating type-safe status updates
export interface StatusUpdate<T extends NodeType> {
  nodeId: string;
  nodeType: T;
  newStatus: ValidStatusForNodeType<T>;
  reason?: string;
  timestamp: Date;
}
