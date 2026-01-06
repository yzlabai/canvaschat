import type { MyUIMessage } from "@/types/api.types"
import { db } from "@/db"
import { yanMessages, yanConversations, yanMessageParts } from "@/db/schema"
import { eq, and, isNull, asc, desc } from "drizzle-orm"

// Server-side functions for use in API routes and server components
export class MessageService {
  
  // Get all messages for a conversation with their parts
  static async getMessagesForConversation(
    conversationId: string,
    userId: string
  ): Promise<any[]> {
    try {
      const database = db()
      
      // First get the messages
      const messages = await database
        .select({
          id: yanMessages.id,
          role: yanMessages.role,
          created_at: yanMessages.created_at,
          metadata: yanMessages.metadata,
          conversation_id: yanMessages.conversation_id,
          sequence_number: yanMessages.sequence_number,
          message_status: yanMessages.message_status,
          finish_reason: yanMessages.finish_reason,
          model: yanMessages.model,
          total_tokens: yanMessages.total_tokens,
        })
        .from(yanMessages)
        .where(
          and(
            eq(yanMessages.conversation_id, conversationId),
            eq(yanMessages.user_uuid, userId),
            isNull(yanMessages.deleted_at)
          )
        )
        .orderBy(asc(yanMessages.sequence_number))

      // For each message, get its parts
      const messagesWithParts = await Promise.all(
        messages.map(async (message) => {
          const parts = await database
            .select()
            .from(yanMessageParts)
            .where(eq(yanMessageParts.message_id, message.id))
            .orderBy(asc(yanMessageParts.part_index))

          // Convert parts to UI format
          const uiParts = parts.map(part => {
            if (part.type === 'text' || part.type === 'reasoning') {
              return {
                type: part.type,
                text: part.text || '',
              }
            }
            
            // Handle tool parts
            if (part.type.startsWith('tool-')) {
              return {
                type: part.type,
                state: part.tool_state as 'call' | 'result' | 'error',
                input: part.tool_input ? JSON.parse(part.tool_input) : undefined,
                output: part.tool_output ? JSON.parse(part.tool_output) : undefined,
                errorText: part.tool_error,
                ...(part.data ? JSON.parse(part.data) : {}),
              }
            }
            
            // Handle custom parts
            return {
              type: part.type,
              ...(part.data ? JSON.parse(part.data) : {}),
            }
          })

          // Extract text content from text parts for the content field
          const textContent = uiParts
            .filter(p => p.type === 'text')
            .map(p => p.text)
            .join('\n')

          return {
            id: String(message.id),
            role: message.role,
            content: textContent,
            parts: uiParts,
            createdAt: message.created_at?.getTime(),
            metadata: {
              createdAt: message.created_at?.getTime(),
              model: message.model || undefined,
              totalTokens: message.total_tokens || undefined,
              messageStatus: message.message_status,
              finishReason: message.finish_reason,
              ...(message.metadata ? JSON.parse(message.metadata) : {}),
            },
          }
        })
      )

      return messagesWithParts
    } catch (error) {
      console.error("Failed to fetch messages:", error)
      return []
    }
  }

  // Delete all messages from a conversation (soft delete)
  static async deleteMessagesFromConversation(
    conversationId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const database = db()
      
      // First verify the user owns this conversation
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
      
      if (!conversation) {
        console.log("Conversation not found or user doesn't have access")
        return false
      }

      // Get all message IDs in this conversation
      const messageIds = await database
        .select({ id: yanMessages.id })
        .from(yanMessages)
        .where(
          and(
            eq(yanMessages.conversation_id, conversationId),
            isNull(yanMessages.deleted_at)
          )
        )

      // Delete all message parts for these messages
      if (messageIds.length > 0) {
        for (const messageId of messageIds) {
          await database
            .delete(yanMessageParts)
            .where(eq(yanMessageParts.message_id, messageId.id))
        }
      }

      // Soft delete all messages in the conversation
      await database
        .update(yanMessages)
        .set({ 
          deleted_at: new Date()
        })
        .where(
          and(
            eq(yanMessages.conversation_id, conversationId),
            isNull(yanMessages.deleted_at)
          )
        )

      return true
    } catch (error) {
      console.error("Failed to delete messages:", error)
      return false
    }
  }

  // Create a new message in a conversation
  static async createMessage(msg: typeof yanMessages.$inferInsert): Promise<any> {
    try {
      const database = db()
      
      // First verify the user owns this conversation
      const [conversation] = await database
        .select()
        .from(yanConversations)
        .where(
          and(
            eq(yanConversations.id, msg.conversation_id),
            eq(yanConversations.user_uuid, msg.user_uuid)
          )
        )
        .limit(1)
      
      if (!conversation) {
        console.log("Conversation not found or user doesn't have access")
        return null
      }

      // Get the next sequence number
      const [lastMessage] = await database
        .select({ sequence_number: yanMessages.sequence_number })
        .from(yanMessages)
        .where(eq(yanMessages.conversation_id, msg.conversation_id))
        .orderBy(desc(yanMessages.sequence_number))
        .limit(1)

      msg.sequence_number = (lastMessage?.sequence_number || 0) + 1

      const [newMessage] = await database
        .insert(yanMessages)
        .values(msg)
        .returning()

      if (!newMessage) {
        return null
      }

      return {
        ...newMessage,
        id: String(newMessage.id),
        createdAt: new Date(newMessage.created_at || ""),
        metadata: newMessage.metadata ? JSON.parse(newMessage.metadata) : undefined,
      }
    } catch (error) {
      console.error("Failed to create message:", error)
      return null
    }
  }

  // Create a new message with parts structure
  static async createMessageWithParts(
    conversationId: string,
    userId: string,
    role: 'user' | 'assistant' | 'system' | 'tool',
    content?: string,
    parts?: Array<any>,
    metadata?: any,
    additionalFields?: Partial<typeof yanMessages.$inferInsert>
  ): Promise<any> {
    try {
      const database = db()
      
      // First verify the user owns this conversation
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
      
      if (!conversation) {
        console.log("Conversation not found or user doesn't have access")
        return null
      }

      // Get the next sequence number
      const [lastMessage] = await database
        .select({ sequence_number: yanMessages.sequence_number })
        .from(yanMessages)
        .where(eq(yanMessages.conversation_id, conversationId))
        .orderBy(desc(yanMessages.sequence_number))
        .limit(1)

      const sequenceNumber = (lastMessage?.sequence_number || 0) + 1

      // Extract text content from parts if content is not provided
      let finalContent = content
      if (!finalContent && parts && parts.length > 0) {
        finalContent = parts
          .filter(part => part.type === 'text' || part.type === 'reasoning')
          .map(part => part.text || '')
          .join('\n')
          .trim()
      }

      // Create the main message
      const msg: typeof yanMessages.$inferInsert = {
        conversation_id: conversationId,
        user_uuid: userId,
        role,
        content: finalContent || null,
        sequence_number: sequenceNumber,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        created_at: new Date(),
        updated_at: new Date(),
        ...additionalFields,
      }

      const [newMessage] = await database
        .insert(yanMessages)
        .values(msg)
        .returning()

      if (!newMessage) {
        console.error("Failed to create message")
        return null
      }

      let createdParts: any[] = []

      // Create message parts if provided
      if (parts && parts.length > 0) {
        const partsToInsert = parts.map((part, index) => {
          const basePart = {
            message_id: newMessage.id,
            part_index: index,
            type: part.type || 'text',
            created_at: new Date(),
            updated_at: new Date(),
          }

          // Handle different part types
          if (part.type === 'text' || part.type === 'reasoning') {
            return {
              ...basePart,
              text: part.text || '',
            }
          }
          
          // Handle tool parts
          if (part.type && part.type.startsWith('tool-')) {
            return {
              ...basePart,
              tool_name: part.type.replace('tool-', ''),
              tool_call_id: part.toolCallId || part.id,
              tool_state: part.state,
              tool_input: part.input ? JSON.stringify(part.input) : undefined,
              tool_output: part.output ? JSON.stringify(part.output) : undefined,
              tool_error: part.errorText,
              data: part.data ? JSON.stringify(part.data) : undefined,
            }
          }
          
          // Handle custom parts - store everything in data field
          const { type, ...restData } = part
          return {
            ...basePart,
            data: JSON.stringify(restData),
          }
        })

        try {
          const insertedParts = await database
            .insert(yanMessageParts)
            .values(partsToInsert)
            .returning()

          // Convert inserted parts back to UI format
          createdParts = insertedParts.map(part => {
            if (part.type === 'text' || part.type === 'reasoning') {
              return {
                type: part.type,
                text: part.text || '',
              }
            }
            
            // Handle tool parts
            if (part.type.startsWith('tool-')) {
              return {
                type: part.type,
                state: part.tool_state as 'call' | 'result' | 'error',
                input: part.tool_input ? JSON.parse(part.tool_input) : undefined,
                output: part.tool_output ? JSON.parse(part.tool_output) : undefined,
                errorText: part.tool_error,
                ...(part.data ? JSON.parse(part.data) : {}),
              }
            }
            
            // Handle custom parts
            return {
              type: part.type,
              ...(part.data ? JSON.parse(part.data) : {}),
            }
          })
        } catch (partError) {
          console.error("Failed to create message parts:", partError)
          // Rollback the message creation
          await database
            .update(yanMessages)
            .set({ deleted_at: new Date() })
            .where(eq(yanMessages.id, newMessage.id))
          return null
        }
      }

      // Return the created message with parts
      return {
        id: String(newMessage.id),
        role: newMessage.role,
        content: newMessage.content || '',
        parts: createdParts,
        createdAt: newMessage.created_at?.getTime(),
        metadata: {
          createdAt: newMessage.created_at?.getTime(),
          model: newMessage.model || undefined,
          totalTokens: newMessage.total_tokens || undefined,
          messageStatus: newMessage.message_status,
          finishReason: newMessage.finish_reason,
          ...(newMessage.metadata ? JSON.parse(newMessage.metadata) : {}),
        },
      }
    } catch (error) {
      console.error("Failed to create message with parts:", error)
      return null
    }
  }

  // Update a message and its parts
  static async updateMessage(
    messageId: string,
    conversationId: string,
    userId: string,
    content?: string,
    parts?: Array<any>,
    metadata?: any
  ): Promise<boolean> {
    try {
      const database = db()
      
      // First verify the user owns this conversation
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
      
      if (!conversation) {
        console.log("Conversation not found or user doesn't have access")
        return false
      }

      const updateData: any = {
        updated_at: new Date()
      }
      if (metadata !== undefined) updateData.metadata = JSON.stringify(metadata)

      const [updatedMessage] = await database
        .update(yanMessages)
        .set(updateData)
        .where(
          and(
            eq(yanMessages.id, messageId),
            eq(yanMessages.conversation_id, conversationId),
            isNull(yanMessages.deleted_at)
          )
        )
        .returning()

      if (!updatedMessage) {
        return false
      }

      // Update parts if provided
      if (parts !== undefined) {
        // Delete existing parts
        await database
          .delete(yanMessageParts)
          .where(eq(yanMessageParts.message_id, messageId))

        // Insert new parts
        if (parts.length > 0) {
          const partsToInsert = parts.map((part, index) => {
            const basePart = {
              message_id: messageId,
              part_index: index,
              type: part.type || 'text',
              created_at: new Date(),
              updated_at: new Date(),
            }

            // Handle different part types
            if (part.type === 'text' || part.type === 'reasoning') {
              return {
                ...basePart,
                text_content: part.text || '',
              }
            }
            
            // Handle tool parts
            if (part.type && part.type.startsWith('tool-')) {
              return {
                ...basePart,
                tool_name: part.type.replace('tool-', ''),
                tool_call_id: part.toolCallId || part.id,
                tool_state: part.state,
                tool_input: part.input ? JSON.stringify(part.input) : undefined,
                tool_output: part.output ? JSON.stringify(part.output) : undefined,
                tool_error: part.errorText,
                data: part.data ? JSON.stringify(part.data) : undefined,
              }
            }
            
            // Handle custom parts
            const { type, ...restData } = part
            return {
              ...basePart,
              data: JSON.stringify(restData),
            }
          })

          await database.insert(yanMessageParts).values(partsToInsert)
        }
      }

      return true
    } catch (error) {
      console.error("Failed to update message:", error)
      return false
    }
  }

  // Get a single message with its parts
  static async getMessageWithParts(
    messageId: string,
    conversationId: string,
    userId: string
  ): Promise<any | null> {
    try {
      const database = db()
      
      // First verify the user owns this conversation and get the message
      const [message] = await database
        .select({
          id: yanMessages.id,
          role: yanMessages.role,
          created_at: yanMessages.created_at,
          metadata: yanMessages.metadata,
          conversation_id: yanMessages.conversation_id,
          sequence_number: yanMessages.sequence_number,
          message_status: yanMessages.message_status,
          finish_reason: yanMessages.finish_reason,
          model: yanMessages.model,
          total_tokens: yanMessages.total_tokens,
        })
        .from(yanMessages)
        .where(
          and(
            eq(yanMessages.id, messageId),
            eq(yanMessages.conversation_id, conversationId),
            eq(yanMessages.user_uuid, userId),
            isNull(yanMessages.deleted_at)
          )
        )
        .limit(1)
      
      if (!message) {
        return null
      }

      // Get the message parts
      const parts = await database
        .select()
        .from(yanMessageParts)
        .where(eq(yanMessageParts.message_id, messageId))
        .orderBy(asc(yanMessageParts.part_index))

      // Convert parts to UI format
      const uiParts = parts.map(part => {
        if (part.type === 'text' || part.type === 'reasoning') {
          return {
            type: part.type,
            text: part.text || '',
          }
        }
        
        // Handle tool parts
        if (part.type.startsWith('tool-')) {
          return {
            type: part.type,
            state: part.tool_state as 'call' | 'result' | 'error',
            input: part.tool_input ? JSON.parse(part.tool_input) : undefined,
            output: part.tool_output ? JSON.parse(part.tool_output) : undefined,
            errorText: part.tool_error,
            ...(part.data ? JSON.parse(part.data) : {}),
          }
        }
        
        // Handle custom parts
        return {
          type: part.type,
          ...(part.data ? JSON.parse(part.data) : {}),
        }
      })

      // Extract text content from text parts for the content field
      const textContent = uiParts
        .filter(p => p.type === 'text')
        .map(p => p.text)
        .join('\n')

      return {
        id: String(message.id),
        role: message.role,
        content: textContent,
        parts: uiParts,
        createdAt: message.created_at?.getTime(),
        metadata: {
          createdAt: message.created_at?.getTime(),
          model: message.model || undefined,
          totalTokens: message.total_tokens || undefined,
          messageStatus: message.message_status,
          finishReason: message.finish_reason,
          ...(message.metadata ? JSON.parse(message.metadata) : {}),
        },
      }
    } catch (error) {
      console.error("Failed to get message with parts:", error)
      return null
    }
  }

  // Simplified method to create a message from a UI message object
  static async createFromUIMessage(
    uiMessage: {
      content?: string
      parts?: Array<any>
      role: 'user' | 'assistant' | 'system' | 'tool'
      metadata?: any
    },
    conversationId: string,
    userId: string,
    additionalFields?: Partial<typeof yanMessages.$inferInsert>
  ): Promise<any> {
    return this.createMessageWithParts(
      conversationId,
      userId,
      uiMessage.role,
      uiMessage.content,
      uiMessage.parts,
      uiMessage.metadata,
      additionalFields
    )
  }
}
