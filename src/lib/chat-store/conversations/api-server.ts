import type { YanConversation, NewYanConversation } from "@/lib/chat-store/types"
import { db } from "@/db"
import { yanConversations } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"

// Server-side functions for use in API routes and server components
export class ConversationService {
  
  // Get all conversations for a user
  static async getConversationsForUser(userId: string): Promise<YanConversation[]> {
    console.log("Fetching conversations for user:", userId)
    try {
      const database = db()
      
      const conversations = await database
        .select()
        .from(yanConversations)
        .where(
          and(
            eq(yanConversations.user_uuid, userId),
            eq(yanConversations.status, "active")
          )
        )
        .orderBy(desc(yanConversations.last_message_at))

      return conversations
    } catch (error) {
      console.error("Failed to fetch conversations:", error)
      return []
    }
  }

  // Check if a conversation exists for a user
  static async checkConversationExists(
    conversationId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const database = db()

      const [conversation] = await database
        .select()
        .from(yanConversations)
        .where(
          and(
            eq(yanConversations.id, conversationId),
            eq(yanConversations.user_uuid, userId)
          )
        )
        .limit(1)

      return !!conversation
    } catch (error) {
      console.error("Failed to check conversation existence:", error)
      return false
    }
  }

  // Create a new conversation
  static async createConversation(
    userId: string,
    title: string,
    model?: string,
    systemPrompt?: string
  ): Promise<YanConversation | null> {
    try {
      const database = db()
      const now = new Date()

      const metadata = {
        ai_model: model || "gpt-3.5-turbo",
        system_prompt: systemPrompt,
      }

      const [conversation] = await database
        .insert(yanConversations)
        .values({
          user_uuid: userId,
          title,
          metadata: JSON.stringify(metadata),
          created_at: now,
          updated_at: now,
          last_message_at: now,
        })
        .returning()

      return conversation
    } catch (error) {
      console.error("Failed to create conversation:", error)
      return null
    }
  }

  // Update conversation title
  static async updateConversationTitle(
    conversationId: string,
    userId: string,
    title: string
  ): Promise<YanConversation | null> {
    try {
      const database = db()
      
      const [updatedConversation] = await database
        .update(yanConversations)
        .set({ 
          title,
          updated_at: new Date()
        })
        .where(
          and(
            eq(yanConversations.id, conversationId),
            eq(yanConversations.user_uuid, userId)
          )
        )
        .returning()

      return updatedConversation || null
    } catch (error) {
      console.error("Failed to update conversation title:", error)
      throw error
    }
  }

  // Update conversation model
  static async updateConversationModel(
    conversationId: string,
    userId: string,
    model: string
  ): Promise<YanConversation | null> {
    try {
      const database = db()
      
      // First, get the current conversation to preserve existing metadata
      const [currentConversation] = await database
        .select()
        .from(yanConversations)
        .where(
          and(
            eq(yanConversations.id, conversationId),
            eq(yanConversations.user_uuid, userId)
          )
        )
        .limit(1)
      
      if (!currentConversation) {
        throw new Error("Conversation not found")
      }

      // Parse existing metadata or create new object
      let metadata: any = {}
      try {
        metadata = currentConversation.metadata ? JSON.parse(currentConversation.metadata) : {}
      } catch (e) {
        metadata = {}
      }

      // Update the ai_model in metadata
      metadata.ai_model = model

      const [updatedConversation] = await database
        .update(yanConversations)
        .set({ 
          metadata: JSON.stringify(metadata),
          updated_at: new Date()
        })
        .where(
          and(
            eq(yanConversations.id, conversationId),
            eq(yanConversations.user_uuid, userId)
          )
        )
        .returning()

      return updatedConversation || null
    } catch (error) {
      console.error("Failed to update conversation model:", error)
      throw error
    }
  }

  // Delete conversation (soft delete)
  static async deleteConversation(
    conversationId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const database = db()
      
      const [deletedConversation] = await database
        .update(yanConversations)
        .set({ 
          status: "deleted",
          updated_at: new Date()
        })
        .where(
          and(
            eq(yanConversations.id, conversationId),
            eq(yanConversations.user_uuid, userId)
          )
        )
        .returning()

      return !!deletedConversation
    } catch (error) {
      console.error("Failed to delete conversation:", error)
      throw error
    }
  }

  // Get a specific conversation
  static async getConversation(
    conversationId: string,
    userId: string
  ): Promise<YanConversation | null> {
    try {
      const database = db()
      
      const [conversation] = await database
        .select()
        .from(yanConversations)
        .where(
          and(
            eq(yanConversations.id, conversationId),
            eq(yanConversations.user_uuid, userId),
            eq(yanConversations.status, "active")
          )
        )
        .limit(1)

      return conversation || null
    } catch (error) {
      console.error("Failed to fetch conversation:", error)
      return null
    }
  }

  // Get all conversations for a user (including non-active for admin purposes)
  static async getAllUserConversations(
    userId: string,
    includeDeleted: boolean = false
  ): Promise<YanConversation[]> {
    try {
      const database = db()
      
      const whereConditions = [eq(yanConversations.user_uuid, userId)]
      
      if (!includeDeleted) {
        whereConditions.push(eq(yanConversations.status, "active"))
      }
      
      const conversations = await database
        .select()
        .from(yanConversations)
        .where(and(...whereConditions))
        .orderBy(desc(yanConversations.created_at))

      return conversations
    } catch (error) {
      console.error("Failed to fetch all user conversations:", error)
      return []
    }
  }

  // Update last message timestamp
  static async updateLastMessageAt(
    conversationId: string,
    userId: string,
    timestamp?: Date
  ): Promise<boolean> {
    try {
      const database = db()
      
      const [updatedConversation] = await database
        .update(yanConversations)
        .set({ 
          last_message_at: timestamp || new Date(),
          updated_at: new Date()
        })
        .where(
          and(
            eq(yanConversations.id, conversationId),
            eq(yanConversations.user_uuid, userId)
          )
        )
        .returning()

      return !!updatedConversation
    } catch (error) {
      console.error("Failed to update last message timestamp:", error)
      return false
    }
  }
}
