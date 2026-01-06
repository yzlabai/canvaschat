import type { yanConversations, yanMessages } from "@/db/schema"

// Base types from the database schema
export type YanConversation = typeof yanConversations.$inferSelect
export type YanMessage = typeof yanMessages.$inferSelect
export type NewYanConversation = typeof yanConversations.$inferInsert
export type NewYanMessage = typeof yanMessages.$inferInsert

// Frontend-specific types
export interface ConversationWithStats extends YanConversation {
  message_count?: number
  last_message_preview?: string
}

export interface MessageWithMetadata extends YanMessage {
  isLoading?: boolean
  error?: string
}

// Legacy types for backward compatibility (exported for existing code)
export type Message = YanMessage
