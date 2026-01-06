import {
  pgTable,
  serial,
  varchar,
  text,
  boolean,
  integer,
  real,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Users table
export const users = pgTable(
  "users",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    uuid: varchar({ length: 255 }).notNull().unique(),
    email: varchar({ length: 255 }).notNull(),
    created_at: timestamp({ withTimezone: true }),
    nickname: varchar({ length: 255 }),
    avatar_url: varchar({ length: 255 }),
    locale: varchar({ length: 50 }),
    signin_type: varchar({ length: 50 }),
    signin_ip: varchar({ length: 255 }),
    signin_provider: varchar({ length: 50 }),
    signin_openid: varchar({ length: 255 }),
    updated_at: timestamp({ withTimezone: true }),
  },
  (table) => [
    uniqueIndex("email_provider_unique_idx").on(
      table.email,
      table.signin_provider
    ),
  ]
);

// Credits table
export const credits = pgTable("credits", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  trans_no: varchar({ length: 255 }).notNull().unique(),
  created_at: timestamp({ withTimezone: true }),
  user_uuid: varchar({ length: 255 }).notNull(),
  trans_type: varchar({ length: 50 }).notNull(),
  credits: integer().notNull(),
  expired_at: timestamp({ withTimezone: true }),
  memo: varchar({ length: 255 }), // Optional memo for tracking credit source
});

export const aiModelConfigs = pgTable(
  "ai_model_configs",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    slot: varchar({ length: 100 }).notNull(),
    identifier: varchar({ length: 255 }).notNull(),
    model: varchar({ length: 255 }).notNull(),
    provider: varchar({ length: 100 }).notNull(),
    label: varchar({ length: 255 }),
    description: text(),
    abilities: text(),
    is_active: boolean().notNull().default(true),
    priority: integer().default(0),
    metadata: text(),
    created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ai_model_configs_slot_idx").on(table.slot),
  ]
);

export const aiModels = pgTable(
  "ai_models",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    model: varchar({ length: 255 }).notNull(),
    provider: varchar({ length: 100 }).notNull(),
    abilities: text(),
    description: text(),
    is_active: boolean().notNull().default(true),
    metadata: text(),
    created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("ai_models_name_idx").on(table.name),
  ]
);

// Verification tokens table for email magic links
export const verificationTokens = pgTable("verification_tokens", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  identifier: varchar({ length: 255 }).notNull(), // email
  token: varchar({ length: 255 }).notNull().unique(),
  expires: timestamp({ withTimezone: true }).notNull(),
  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// YAN Conversations table - User conversations with YAN AI agent
export const yanConversations = pgTable("yan_conversations", {
  id: uuid().primaryKey().notNull().defaultRandom(), // Using UUID as primary key
  user_uuid: varchar({ length: 255 }).notNull(), // Reference to users table
  title: varchar({ length: 500 }).notNull(), // Conversation title
  status: varchar({ length: 50 }).notNull().default("active"), // active, archived, deleted

  // Statistics
  total_messages: integer().notNull().default(0), // Total message count
  total_tokens_used: integer().notNull().default(0), // Total token usage
  total_cost: integer().notNull().default(0), // Total cost (in cents)
  
  metadata: text(), // JSON format for storing additional info like settings, context, etc.
  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  last_message_at: timestamp({ withTimezone: true }), // Last message time, used for sorting
});

// YAN Messages table - Simplified to store core message data
export const yanMessages = pgTable("yan_messages", {
  id: uuid().primaryKey().notNull().defaultRandom(), // Using UUID as primary key
  conversation_id: varchar({ length: 255 }).notNull(), // Reference to yan_conversations
  user_uuid: varchar({ length: 255 }).notNull(), // Message owner user
  role: varchar({ length: 20 }).notNull(), // user, assistant, system, tool
  content: text(),

  // Core message fields
  sequence_number: integer().notNull(), // Message order in conversation
  
  // Status and execution info
  message_status: varchar({ length: 50 }).notNull().default("completed"), // pending, streaming, completed, failed, cancelled
  finish_reason: varchar({ length: 50 }), // stop, length, tool_calls, content_filter, etc.
  error_message: text(), // Error info if failed
  
  // Model information
  model_provider: varchar({ length: 100 }), // openai, google, anthropic, etc.
  model: varchar({ length: 100 }), // Model name like gpt-4o
  
  // Performance metrics
  request_tokens: integer().default(0),
  response_tokens: integer().default(0),
  total_tokens: integer().default(0),
  generation_time_ms: integer(),
  cost_amount: integer().default(0), // Cost in cents
  
  // Metadata
  metadata: text(), // JSON for additional data (attachments, settings, etc.)
  
  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  deleted_at: timestamp({ withTimezone: true }), // Soft delete
});

export const dailyBriefCache = pgTable(
  "daily_brief_cache",
  {
    id: uuid().primaryKey().notNull().defaultRandom(),
    user_uuid: varchar({ length: 255 }).notNull(),
    timezone: varchar({ length: 100 }).notNull().default("UTC"),
    brief: text().notNull(),
    has_conversations: boolean().notNull().default(false),
    has_news: boolean().notNull().default(false),
    generated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
    created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("daily_brief_cache_user_timezone_idx").on(
      table.user_uuid,
      table.timezone
    ),
  ]
);

// YAN Message Parts table - Store individual parts of a message
export const yanMessageParts = pgTable("yan_message_parts", {
  id: uuid().primaryKey().notNull().defaultRandom(),
  message_id: uuid().notNull(), // Foreign key to yanMessages
  
  // Part identification
  part_index: integer().notNull(), // Order of the part in the message
  type: varchar({ length: 100 }).notNull(), // text, reasoning, tool-deepResearch, tool-multipleModels, etc.
  
  // Content based on type
  text: text(), // For text and reasoning parts
  
  // Tool-related fields (for tool-* types)
  tool_name: varchar({ length: 100 }), // Tool name for tool calls
  tool_call_id: varchar({ length: 255 }), // Unique ID for tool call
  tool_state: varchar({ length: 20 }), // 'call', 'result', 'error'
  tool_input: text(), // JSON - Tool input parameters
  tool_output: text(), // JSON - Tool execution result
  tool_error: text(), // Error message if tool failed
  
  // Generic data field for custom part types
  data: text(), // JSON - For any additional data specific to the part type
  
  // Metadata
  metadata: text(), // JSON - Additional metadata for the part
  
  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// Multi-model evaluation task table
export const multimodeltask = pgTable("multimodeltask", {
  id: uuid().primaryKey().notNull().defaultRandom(), // Task ID (UUID)
  // Model name list (JSON string, e.g. ["openai/gpt-4o", "anthropic/claude-3.5-sonnet"])
  models: text().notNull(),
  user_uuid: varchar({ length: 255 }).notNull(), // Initiating user
  // Prompt used for evaluation
  prompt: text().notNull(),
  // Trigger run ID (e.g. Trigger.dev run id)
  trigger_run_id: varchar({ length: 255 }),
  // Task status: pending, running, completed, failed
  status: varchar({ length: 50 }).notNull().default("pending"),
  trigger_tag: text(),

  // Execution information
  started_at: timestamp({ withTimezone: true }), // Start time
  completed_at: timestamp({ withTimezone: true }), // Completion time
  duration_ms: integer(), // Execution duration (milliseconds)
  
  // Evaluation summary
  summary: text(),
  // Task metadata (JSON string)
  metadata: text(),
  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// LLM answer records for a multi-model evaluation
export const llmanswer = pgTable("llmanswer", {
  id: uuid().primaryKey().notNull().defaultRandom(), // Answer ID (UUID)
  // Associated evaluation task ID
  multimodeltask: uuid().notNull(),
  // Model name used (e.g. openai/gpt-4o)
  model: varchar({ length: 255 }),
  // Prompt used for this answer (redundant storage for traceability)
  prompt: text().notNull(),
  // Model response content
  response: text().notNull(),
  // Token usage (total or aggregate)
  total_cost: integer().notNull().default(0),
  // More granular token usage information
  request_tokens: integer().notNull().default(0), // Input token count
  response_tokens: integer().notNull().default(0), // Output token count
  total_tokens: integer().notNull().default(0), // Total tokens (usually equals request_tokens + response_tokens)
  // Granular usage/cost information (JSON string, optional)
  usage_info: text(),
  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// Deep Research task table
export const deepresearchtask = pgTable("deepresearchtask", {
  id: uuid().primaryKey().notNull().defaultRandom(), // Task ID (UUID)
  user_uuid: varchar({ length: 255 }).notNull(), // Initiating user
  topic: text().notNull(), // Research topic/query prompt
  trigger_run_id: varchar({ length: 255 }), // Associated Trigger.dev run ID
  trigger_tag: text(),
  status: varchar({ length: 50 }).notNull().default("pending"), // pending, running, completed, failed
  tool_call_id: varchar({ length: 255 }), // Tool call ID
  // Research parameters
  depth: integer().notNull().default(2), // Research depth
  breadth: integer().notNull().default(2), // Research breadth
  
  // Research results
  summary: text(), // Research summary
  content: text(), // Complete research content
  sources: text(), // JSON format, stores research source links
  
  // Execution information
  started_at: timestamp({ withTimezone: true }), // Start time
  completed_at: timestamp({ withTimezone: true }), // Completion time
  duration_ms: integer(), // Execution duration (milliseconds)
  
  // Cost information
  total_tokens_used: integer().notNull().default(0), // Total token usage
  total_cost: integer().notNull().default(0), // Total cost (in cents)
  
  // Metadata
  metadata: text(), // JSON format, stores additional information
  error_message: text(), // Error message (if failed)
  
  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// Trigger.dev run tracking table
export const triggerrun = pgTable("triggerrun", {
  id: uuid().primaryKey().notNull().defaultRandom(), // Internal unique ID
  trigger_run_id: varchar({ length: 255 }).notNull().unique(), // Trigger.dev run ID
  task_identifier: varchar({ length: 255 }).notNull(), // Task identifier, e.g. "deepresearchtask"
  task_id: uuid(), // Foreign key to specific task table (if applicable)
  user_uuid: varchar({ length: 255 }), // Triggering user (if any)
  status: varchar({ length: 50 }).notNull(), // triggered, pending, running, completed, failed, cancelled
  payload: text(), // JSON format, task input data (e.g. { foo: "bar" })
  result: text(), // JSON format, task execution result
  error_message: text(), // Error message (if failed)

  master_run_id: varchar({ length: 255 }), // Master run ID, used to associate multiple tasks in the same workflow, mutually exclusive with user_id

  // Execution time information
  started_at: timestamp({ withTimezone: true }), // Start execution time
  completed_at: timestamp({ withTimezone: true }), // Completion time
  duration_ms: integer(), // Execution duration (milliseconds)
  
  // Trigger information
  trigger_source: varchar({ length: 100 }), // Trigger source, e.g. "api", "webhook", "manual", "scheduled"
  trigger_context: text(), // JSON format, trigger context information
  
  // Metadata
  metadata: text(), // JSON format, stores other relevant information
  tags: text(), // JSON array format, used for classification and search
  
  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// IDEAS DEVELOPMENT SYSTEM TABLES
// ============================================================================

// Idea Sessions table - User idea development sessions
export const ideaSessions = pgTable("idea_sessions", {
  id: uuid().primaryKey().notNull().defaultRandom(), // Session ID (UUID)
  user_uuid: varchar({ length: 255 }).notNull(), // Session owner
  title: varchar({ length: 500 }), // Session title (AI-generated or user-set)
  description: text(), // Session description or initial prompt
  root_node_id: uuid(), // Reference to the root idea node for this session
  type: varchar({ length: 50 }).notNull().default("brainstorm"), // brainstorm, story, chat
  story_image_style: varchar({ length: 100 }), // Default image style for story mode
  story_image_prompt: text(), // Default custom prompt for story images
  
  // Session status
  status: varchar({ length: 50 }).notNull().default("active"), // active, paused, completed, archived
  
  // Statistics
  total_idea_nodes: integer().notNull().default(0), // Total idea nodes generated
  total_ai_interactions: integer().notNull().default(0), // Total AI interactions
  
  // Cost tracking
  total_tokens_used: integer().notNull().default(0), // Total tokens consumed
  total_cost_cents: integer().notNull().default(0), // Total cost in cents
  
  // Session timeline
  started_at: timestamp({ withTimezone: true }).notNull().defaultNow(), // Session start time
  last_activity_at: timestamp({ withTimezone: true }), // Last user activity
  completed_at: timestamp({ withTimezone: true }), // Session completion time
  
  // Collaboration and sharing
  is_shared: boolean().notNull().default(false), // Whether session is shared
  collaborators: text(), // JSON array of collaborator UUIDs
  
  // Metadata
  tags: text(), // JSON array of session tags
  metadata: text(), // JSON object for additional data
  
  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

// Idea Nodes table - Store individual idea nodes on the canvas
export const ideaNodes = pgTable("idea_nodes", {
  id: uuid().primaryKey().notNull().defaultRandom(), // Node ID (UUID)
  session_id: uuid().notNull(), // Reference to idea_sessions
  user_uuid: varchar({ length: 255 }).notNull(), // Node owner
  
  // Node content
  title: varchar({ length: 500 }).notNull(), // Node title/headline
  content: text(), // Detailed node content
  summary: varchar({ length: 1000 }), // Brief summary for display
  
  // Node classification
  root_distance: integer().notNull().default(0), // Distance from root node (0 for root)
  node_type: varchar({ length: 50 }).notNull().default("idea"), // idea, story, action, note, task, chat
  category: varchar({ length: 100 }), // User-defined or AI-suggested category
  priority: varchar({ length: 20 }).notNull().default("medium"), // low, medium, high, critical
  
  // Visual properties
  position_x: real().notNull().default(0), // X coordinate on canvas
  position_y: real().notNull().default(0), // Y coordinate on canvas
  color: varchar({ length: 50 }).notNull().default("blue"), // Node color theme
  size: varchar({ length: 20 }).notNull().default("medium"), // small, medium, large
  
  // Primary media (for quick display/thumbnail)
  primary_media_id: uuid(), // Reference to primary media item
  media_count: integer().notNull().default(0), // Total number of media items
  has_images: boolean().notNull().default(false), // Quick flag for images
  has_videos: boolean().notNull().default(false), // Quick flag for videos
  has_audio: boolean().notNull().default(false), // Quick flag for audio
  
  // Node relationships
  parent_node_id: uuid(), // Reference to parent node (for hierarchical ideas)
  connected_nodes: text(), // JSON array of connected node IDs
  dependency_nodes: text(), // JSON array of nodes this depends on
  
  // Generation information
  created_by: varchar({ length: 50 }).notNull().default("user"), // user, ai, system
  generation_prompt: text(), // Prompt used to generate this node
  
  // AI metadata
  ai_confidence: integer(), // AI confidence in this idea (0-100)
  ai_reasoning: text(), // AI's reasoning for generating this node
  suggested_connections: text(), // JSON array of AI-suggested connections
  
  // Node status
  status: varchar({ length: 50 }).notNull().default("active"), // generating, suggest, accept, reject, active, archived, deleted
  
  // Interaction tracking
  view_count: integer().notNull().default(0), // How many times viewed
  edit_count: integer().notNull().default(0), // How many times edited
  last_viewed_at: timestamp({ withTimezone: true }), // Last view time
  last_edited_at: timestamp({ withTimezone: true }), // Last edit time
  
  // Collaboration
  collaborator_notes: text(), // JSON object of collaborator notes
  shared_with: text(), // JSON array of user UUIDs shared with
  
  // Cost tracking (for AI-generated nodes)
  generation_tokens: integer().notNull().default(0), // Tokens used to generate
  generation_cost_cents: integer().notNull().default(0), // Cost to generate in cents
  
  // Metadata
  tags: text(), // JSON array of tags
  metadata: text(), // JSON object for additional data
  
  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  archived_at: timestamp({ withTimezone: true }), // Soft delete timestamp
});

// Idea Node Media table - Store multiple media items per node
export const ideaNodeMedia = pgTable("idea_node_media", {
  id: uuid().primaryKey().notNull().defaultRandom(), // Media item ID
  node_id: uuid().notNull(), // Reference to idea_nodes
  session_id: uuid().notNull(), // Reference to idea_sessions for easier querying
  user_uuid: varchar({ length: 255 }).notNull(), // Media uploader/creator
  
  // Media identification
  media_type: varchar({ length: 50 }).notNull(), // image, video, audio, document
  file_name: varchar({ length: 500 }), // Original filename
  display_order: integer().notNull().default(0), // Order for display (0 = primary)
  is_primary: boolean().notNull().default(false), // Primary media for the node
  
  // Media URLs and sources
  media_url: varchar({ length: 1000 }).notNull(), // Main media URL
  thumbnail_url: varchar({ length: 1000 }), // Thumbnail/preview URL
  preview_url: varchar({ length: 1000 }), // Medium-size preview URL
  
  // Alternative sources/formats
  media_sources: text(), // JSON array of different formats/qualities
  
  // Media metadata
  file_size: integer(), // File size in bytes
  duration: integer(), // Duration in seconds (for video/audio)
  width: integer(), // Width in pixels (for images/videos)
  height: integer(), // Height in pixels (for images/videos)
  format: varchar({ length: 50 }), // File format (jpg, mp4, mp3, etc.)
  mime_type: varchar({ length: 100 }), // MIME type
  
  // Content description
  title: varchar({ length: 500 }), // Media title/caption
  description: text(), // Detailed description
  alt_text: varchar({ length: 500 }), // Alt text for accessibility
  
  // Advanced features
  captions: text(), // JSON object for captions/subtitles
  transcript: text(), // Auto-generated or manual transcript
  tags: text(), // JSON array of media tags
  status: varchar({ length: 50 }).notNull().default("shown"), // shown, hidden, deleted
  
  // Processing status
  generation_status: varchar({ length: 50 }).notNull().default("queued"), // queued, generating, generated, failed
  error_message: text(), // Error message if processing failed
  
  // Analytics
  view_count: integer().notNull().default(0), // View/play count
  last_accessed: timestamp({ withTimezone: true }), // Last access time
  
  // Metadata
  metadata: text(), // JSON object for additional metadata
  
  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  deleted_at: timestamp({ withTimezone: true }), // Soft delete
});

// Idea Node Connections table - Store explicit connections between nodes
export const ideaNodeConnections = pgTable("idea_node_connections", {
  id: uuid().primaryKey().notNull().defaultRandom(), // Connection ID
  session_id: uuid().notNull(), // Reference to idea_sessions
  user_uuid: varchar({ length: 255 }).notNull(), // Connection creator
  
  // Connection endpoints
  source_node_id: uuid().notNull(), // Source node ID
  target_node_id: uuid().notNull(), // Target node ID
  
  // Connection properties
  connection_type: varchar({ length: 50 }).notNull().default("related"), // related, depends_on, leads_to, conflicts, supports
  strength: integer().notNull().default(50), // Connection strength (0-100)
  direction: varchar({ length: 20 }).notNull().default("bidirectional"), // bidirectional, source_to_target, target_to_source
  
  // Visual properties
  line_style: varchar({ length: 50 }).notNull().default("solid"), // solid, dashed, dotted
  line_color: varchar({ length: 50 }).notNull().default("gray"), // Connection line color
  line_width: integer().notNull().default(2), // Line width in pixels
  
  // Connection metadata
  label: varchar({ length: 200 }), // Optional connection label
  description: text(), // Description of the connection
  created_by: varchar({ length: 50 }).notNull().default("user"), // user, ai, system
  
  // AI analysis
  ai_suggested: boolean().notNull().default(false), // Whether AI suggested this connection
  ai_confidence: integer(), // AI confidence in this connection (0-100)
  ai_reasoning: text(), // AI's reasoning for the connection
  
  // Status
  status: varchar({ length: 50 }).notNull().default("active"), // active, inactive, deleted
  validated: boolean().notNull().default(false), // Whether user validated this connection
  
  // Metadata
  metadata: text(), // JSON object for additional data
  
  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
