import { UIMessage } from 'ai';
import { z } from 'zod';

// Define your metadata schema
export const messageMetadataSchema = z.object({
  createdAt: z.number().optional(),
  model: z.string().optional(),
  totalTokens: z.number().optional(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

// Tool Call related types
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string; // JSON string
  };
}

export interface ToolResult {
  toolCallId: string;
  result: any;
  isError?: boolean;
}

export interface MessageStep {
  text?: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  finishReason?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

// Enhanced message metadata for tool calls
export const enhancedMessageMetadataSchema = messageMetadataSchema.extend({
  toolCalls: z.array(z.object({
    id: z.string(),
    type: z.string(),
    function: z.object({
      name: z.string(),
      arguments: z.string(),
    }),
  })).optional(),
  toolResults: z.array(z.object({
    toolCallId: z.string(),
    result: z.any(),
    isError: z.boolean().optional(),
  })).optional(),
  steps: z.array(z.any()).optional(),
  finishReason: z.string().optional(),
  messageStatus: z.enum(['pending', 'streaming', 'completed', 'failed', 'cancelled']).optional(),
});

export type EnhancedMessageMetadata = z.infer<typeof enhancedMessageMetadataSchema>;

// Create a typed UIMessage
export type MyUIMessage = UIMessage<MessageMetadata> & {
  content?: string;
  parts?: Array<{
    type: string;
    text?: string;
    // Tool UI part properties
    state?: 'call' | 'result' | 'error';
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    errorText?: string;
    // Other possible part properties
    [key: string]: unknown;
  }>;
  toolInvocations?: Array<{ toolName: string; arguments: any[] }>;
  attachments?: Array<{
    url: string;
    name: string;
    type: string;
    size: number;
  }>;
  created_at?: number;
};

// Enhanced UIMessage for tool calls
export type EnhancedUIMessage = UIMessage<EnhancedMessageMetadata> & {
  content?: string;
  parts?: Array<{
    type: string;
    text?: string;
    // Tool UI part properties
    state?: 'call' | 'result' | 'error';
    input?: Record<string, unknown>;
    output?: Record<string, unknown>;
    errorText?: string;
    // Other possible part properties
    [key: string]: unknown;
  }>;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  steps?: MessageStep[];
  attachments?: Array<{
    url: string;
    name: string;
    type: string;
    size: number;
  }>;
};