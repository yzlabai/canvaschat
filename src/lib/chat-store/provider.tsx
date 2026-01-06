/**
 * ============================================================================
 * CANVAS CHAT PROVIDER - React Context for Chat State Management
 * ============================================================================
 * 
 * This provider manages the global state for the CanvasChat application,
 * handling both conversations and messages with persistent storage.
 * 
 * ARCHITECTURE OVERVIEW:
 * ├── React Context: Global state management across components
 * ├── URL-based Routing: conversationId extracted from [cid] param
 * ├── API Integration: RESTful endpoints for CRUD operations
 * └── Optimistic Updates: Immediate UI updates with server sync
 * 
 * KEY RESPONSIBILITIES:
 * - Conversation lifecycle management (create, read, update, delete)
 * - Message loading and caching for active conversations
 * - URL parameter parsing for conversation routing
 * - Error handling and user feedback via toast notifications
 * - Optimistic UI updates for better user experience
 * 
 * STATE STRUCTURE:
 * - conversations: List of user's conversations with metadata
 * - messages: Messages for the currently active conversation
 * - loading states: Track async operations for UI feedback
 * 
 * INTEGRATION POINTS:
 * - API Client: HTTP requests to /api/yan/* endpoints
 * - App Context: User authentication and global app state
 * - Next.js Router: URL parameter extraction and navigation
 * 
 */

"use client"

import { toast } from "sonner"
import { useParams, usePathname } from "next/navigation"
import { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode } from "react"
import { useAppContext } from "@/contexts/app"
import { useChat } from "@ai-sdk/react"
import { ChatRequestOptions, DefaultChatTransport, type ChatStatus } from "ai"
import { MESSAGE_MAX_LENGTH } from "@/lib/config"
import type { YanConversation } from "./types"
import type { MyUIMessage } from "@/types/api.types"

// Import API functions
import {
    createConversation,
    deleteConversation,
    getConversationsForUser,
    updateConversationTitle,
} from "./conversations/api-client"
import {
  deleteMessagesFromDb,
  getMessagesFromDb,
} from "./messages/api-client"

export type CanvasChatStatus = "idle" | "loading" | "error"

interface YanContextType {
  // Conversation session
  conversationId: string | null
  
  // Conversations management
  conversations: YanConversation[]
  isConversationsLoading: boolean
  refreshConversations: () => Promise<void>
  updateConversationTitle: (id: string, title: string) => Promise<void>
  deleteConversation: (
    id: string,
    currentConversationId?: string,
    redirect?: () => void
  ) => Promise<void>
  setConversations: React.Dispatch<React.SetStateAction<YanConversation[]>>
  createNewConversation: (
    title?: string,
  ) => Promise<YanConversation | undefined>
  resetConversations: () => Promise<void>
  getConversationById: (id: string) => YanConversation | undefined
  bumpConversation: (id: string) => Promise<void>
  setConversationId: React.Dispatch<React.SetStateAction<string | null>>

  // Messages management
  messages: MyUIMessage[]
  isMessagesLoading: boolean
  setMessages: React.Dispatch<React.SetStateAction<MyUIMessage[]>>
  refreshMessages: () => Promise<void>
  resetMessages: () => Promise<void>
  deleteMessages: () => Promise<void>
  clearAllConversationStates: () => void

  // Canvas AI Chat status
  canvasStatus: CanvasChatStatus
  setCanvasStatus: React.Dispatch<React.SetStateAction<CanvasChatStatus>>

  // AI Chat functionality (from useChat)
  status: ChatStatus
  error: Error | undefined
  stop: () => void
  sendMessage: (message: MyUIMessage, options?: ChatRequestOptions) => Promise<void>
  regenerate: () => void
  handleEdit: (id: string, newText: string) => void
  handleDelete: (id: string) => void
  onSend: (input: string) => Promise<void>

  // Multi-model mode management
  isMultiModelMode: boolean
  setIsMultiModelMode: React.Dispatch<React.SetStateAction<boolean>>
  selectedModels: string[]
  setSelectedModels: React.Dispatch<React.SetStateAction<string[]>>
  isMultiModelDialogOpen: boolean
  setIsMultiModelDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
  toggleMultiModelMode: () => void

  // Insufficient credits dialog management
  isInsufficientCreditsDialogOpen: boolean
  setIsInsufficientCreditsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const YanContext = createContext<YanContextType | null>(null)

export function useYan() {
  const context = useContext(YanContext)
  if (!context) throw new Error("useYan must be used within YanProvider")
  return context
}

/**
 * YanProvider Component - Main provider for chat state management
 * 
 * Manages global chat state including conversations and messages.
 * Automatically syncs with URL parameters for conversation routing.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap
 * @returns {JSX.Element} Provider component with context value
 */
export function YanProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // ========== CORE DEPENDENCIES ==========
  const { cid } = useParams()
  /** URL parameters from Next.js routing */
  const pathname = usePathname()
  /** Current authenticated user from app context */
  const { user } = useAppContext()
  /** User's unique identifier for database operations */
  const userId = user?.uuid
  
  // ========== URL PARAMETER EXTRACTION ==========
  /**
   * Extract conversationId from URL parameter
   * Handles both string and array formats from Next.js params
   */
  const initialConversationId = useMemo(() => {
    if (typeof cid === "string" && cid.length > 0) {
      return cid
    } else {
      return null
    } 
  }, [cid])

  // ========== STATE MANAGEMENT ==========
  /** Loading state for conversations fetching */
  const [isConversationsLoading, setIsConversationsLoading] = useState(true)
  /** List of user's conversations with metadata */
  const [conversations, setConversations] = useState<YanConversation[]>([])

  /** Messages for the currently active conversation */
  const [messages, setMessages] = useState<MyUIMessage[]>([])
  /** Loading state for messages fetching */
  const [isMessagesLoading, setIsMessagesLoading] = useState(true)

  /** Multi-model mode state */
  const [isMultiModelMode, setIsMultiModelMode] = useState(false)
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [isMultiModelDialogOpen, setIsMultiModelDialogOpen] = useState(false)

  /** Insufficient credits dialog state */
  const [isInsufficientCreditsDialogOpen, setIsInsufficientCreditsDialogOpen] = useState(false)

  const [conversationId, setConversationId] = useState<string | null>(initialConversationId)

  /** Canvas AI Chat status state */
  const [canvasStatus, setCanvasStatus] = useState<CanvasChatStatus>("idle")

  // ========== AI SDK INTEGRATION ==========
  /**
   * Error handler for AI SDK operations
   * Provides user-friendly error messages and logging
   */
  const handleError = useCallback((error: Error) => {
    console.error("Chat error:", error)
    console.error("Error message:", error.message)
    let errorMsg = error.message || "Something went wrong."
    
    try {
      const msg = JSON.parse(error.message || "{}")
      const { error: errorDetail, code } = msg
      
      // Handle insufficient credits error with dialog
      if (code === "INSUFFICIENT_CREDITS") {
        setIsInsufficientCreditsDialogOpen(true)
        return
      }
      
      if (errorDetail) {
        toast.error(errorDetail)
        return
      }
    } catch {
      // If JSON parsing fails, continue with default error handling
    }

    // Handle common error cases
    if (errorMsg === "An error occurred" || errorMsg === "fetch failed") {
      errorMsg = "Something went wrong. Please try again."
    }

    toast.error(errorMsg)
  }, [setIsInsufficientCreditsDialogOpen])

  /**
   * AI SDK's useChat hook
   * Manages real-time streaming, optimistic updates, and message state
   */
  const { 
    messages: aiMessages, 
    error, 
    status, 
    stop, 
    sendMessage: aiSendMessage, 
    regenerate, 
    setMessages: setAiMessages 
  } = useChat<MyUIMessage>({
    // @ts-ignore - Temporary type assertion for AI SDK version compatibility
    transport: new DefaultChatTransport({
      api: "/api/yan/chat", // Our custom chat API endpoint
      prepareSendMessagesRequest({ messages, id, body }) {
        return {
          body: {
            id,
            messages,
            message: messages.at(-1), // Only send the last message for context
            ...body,
          },
        };
      },
    }),
    onError: handleError,
  })

  // ========== MESSAGE SYNCHRONIZATION ==========
  /**
   * Critical: Sync provider messages with useChat messages
   * 
   * This effect bridges the gap between:
   * - Persistent messages (from database via YanProvider)
   * - Transient messages (from AI SDK's useChat)
   */
  useEffect(() => {
    // When we have AI messages from streaming, update provider messages
    if (aiMessages.length > 0 && aiMessages.length !== messages.length) {
      console.log("Updating provider messages from AI SDK:", aiMessages)
      setMessages(aiMessages as MyUIMessage[])
    }
  }, [aiMessages, conversationId])

  /**
   * Sync provider messages to AI SDK when conversation changes
   */
  useEffect(() => {    
    // Only set AI messages if:
    // 1. We have a valid conversationId (not null)
    // 2. Messages are not currently loading (avoid race conditions)
    // 3. We have provider messages from database
    // 4. AI messages are empty or different (fresh load, not mid-conversation)
    if (conversationId && !isMessagesLoading && messages.length > 0 && aiMessages.length === 0) {
      console.log("Setting AI messages from provider:", messages)
      setAiMessages(messages)
    }
  }, [conversationId, isMessagesLoading, messages, setAiMessages, aiMessages.length])

  /**
   * Update canvasStatus based on ChatStatus
   */
  useEffect(() => {
    if (status === "streaming" || status === "submitted" || isMessagesLoading) {
      setCanvasStatus("loading")
    } else if (status === "error") {
      setCanvasStatus("error")
    } else {
      setCanvasStatus("idle")
    }
  }, [status, isMessagesLoading])

  // ========== MESSAGE HANDLERS ==========
  /**
   * Delete a message from the current conversation
   */
  const handleDelete = useCallback(
    (id: string) => {
      const updatedMessages = messages.filter((message) => message.id !== id)
      setMessages(updatedMessages)
      setAiMessages(updatedMessages)
    },
    [messages, setMessages, setAiMessages]
  )

  /**
   * Edit a message content
   */
  const handleEdit = useCallback(
    (id: string, newText: string) => {
      const updatedMessages = messages.map((message) =>
        message.id === id ? { ...message, content: newText } : message
      )
      setMessages(updatedMessages)
      setAiMessages(updatedMessages)
    },
    [messages, setMessages, setAiMessages]
  )

  // ========== CONVERSATION MANAGEMENT ==========
  /**
   * Create new conversation with optimistic UI updates
   * Creates optimistic conversation locally while syncing with server
   * @param title - Optional title for the conversation
   * @returns Promise resolving to the created conversation or undefined on error
   */
  const createNewConversation = async (
    title?: string,
  ) => {
    if (!userId) {
      toast.error("User not authenticated")
      return
    }

    const prev = [...conversations]

    const optimisticId = `optimistic-${Date.now().toString()}`
    const now = new Date()
    const optimisticConversation = {
      id: optimisticId,
      conversation_id: optimisticId,
      user_uuid: userId,
      title: title || "New Conversation",
      status: "active",
      total_messages: 0,
      total_tokens_used: 0,
      total_cost: 0,
      metadata: null,
      created_at: now,
      updated_at: now,
      last_message_at: now,
    }
    setConversations((prev) => [optimisticConversation, ...prev])

    try {
      const newConversation = await createConversation(
        title || "New Conversation"
      )

      if (newConversation) {
        setConversations((prev) => [
          newConversation,
          ...prev.filter((c) => c.id !== optimisticId),
        ])
        return newConversation
      } else {
        throw new Error("Failed to create conversation")
      }
    } catch {
      setConversations(prev)
      toast.error("Failed to create conversation")
    }
  }

  /**
   * Ensure a conversation exists for the message
   * 
   * Flow:
   * 1. If conversationId exists (from URL), use it
   * 2. If no conversation, create a new one
   * 3. Update browser URL to reflect conversation
   * 
   * @param messageContent - The message content (used for conversation title)
   * @returns conversationId or null if failed
   */
  const ensureChatExists = async (messageContent: string) => {
    if (conversationId) {
      console.log("Using existing chat from URL:", conversationId)
      return conversationId
    }
    try {
      const newChat = await createNewConversation(
        messageContent, // Use input as conversation title
      )
      if (!newChat) return null
      // Update URL to reflect new conversation
      window.history.pushState(null, "", `/yan/c/${newChat.id}`)
      return newChat.id
    } catch (err: unknown) {
      // Parse and display user-friendly error messages
      let errorMessage = "Something went wrong."
      try {
        const errorObj = err as { message?: string }
        if (errorObj.message) {
          const parsed = JSON.parse(errorObj.message)
          errorMessage = parsed.error || errorMessage
        }
      } catch {
        const errorObj = err as { message?: string }
        errorMessage = errorObj.message || errorMessage
      }
      toast.error(errorMessage)
      return null
    }
  }

  // ========== MESSAGE SUBMISSION ==========
  /**
   * Main message submission handler
   * 
   * Flow:
   * 1. Validate input and prepare for submission
   * 2. Ensure conversation exists (create if needed)
   * 3. Send message via AI SDK (handles optimistic updates and streaming)
   * 4. Handle errors and restore state if needed
   */
  const onSend = useCallback(async (input: string) => {
    try {
      // Ensure we have a conversation to send the message to
      const currentConversationId = await ensureChatExists(input)
      console.log("Current chat ID:", currentConversationId)

      // Validate message length
      if (input.length > MESSAGE_MAX_LENGTH) {
        toast.error(`The message you submitted was too long, please submit something shorter. (Max ${MESSAGE_MAX_LENGTH} characters)`)
        return
      }

      // Prepare request options for the API
      const options: ChatRequestOptions = {
        body: {
          conversationId: currentConversationId, // Target conversation
          isMultiModelMode,                      // Multi-model mode flag
          selectedModels: isMultiModelMode ? selectedModels : undefined, // Selected models if in multi-model mode
        },
      }
      
      // Create message object in AI SDK format
      const message: MyUIMessage = {
        id: crypto.randomUUID(),    // Unique message ID
        role: "user",               // Message sender
        content: input,             // Message text content
        parts: [                    // AI SDK required format
          {
            type: "text",
            text: input,
          },
        ],
      }
      console.log("Sending message:", message)
      // Send message via AI SDK (handles optimistic updates and streaming)
      await aiSendMessage(message, options)
      console.log("Message sent successfully:", message)
    } catch (error) {
      console.error("Failed to send message:", error)
      toast.error("Failed to send message")
    }
  }, [
    conversationId,
    ensureChatExists,
    aiSendMessage,
    isMultiModelMode,
    selectedModels,
  ])

  /**
   * Wrapper for AI SDK sendMessage function
   */
  const sendMessage = useCallback(async (message: MyUIMessage, options?: ChatRequestOptions) => {
    await aiSendMessage(message, options)
  }, [aiSendMessage])

  // ========== EFFECT HOOKS ==========
  
  /**
   * Helper function to clear all conversation-specific states
   * Centralizes state cleanup to ensure consistency
   */
  const clearAllConversationStates = useCallback(() => {
    // Stop any ongoing AI streaming
    stop()
    
    // Clear messages
    setMessages([])
    setAiMessages([])
    
    // Reset multi-model mode states
    setIsMultiModelMode(false)
    setSelectedModels([])
    setIsMultiModelDialogOpen(false)
    
    // Reset insufficient credits dialog
    setIsInsufficientCreditsDialogOpen(false)
  }, [stop, setAiMessages])

  /**
   * Load conversations when user authentication changes
   * Triggered whenever userId changes (login/logout)
   */
  useEffect(() => {
    console.log('userId changes in <YanProvider>:', userId)
    if (!userId) return

    const loadConversations = async () => {
      setIsConversationsLoading(true)
      try {
        const fresh = await getConversationsForUser()
        setConversations(fresh)
      } finally {
        setIsConversationsLoading(false)
      }
    }

    loadConversations()
  }, [userId])

  useEffect(() => {
      // This effect runs whenever the pathname changes
      if(pathname.includes('/yan/c/')) {
        // Extract the conversationId from the URL
        const parts = pathname.split('/')
        const cidIndex = parts.indexOf('c') + 1
        const newConversationId = parts[cidIndex] || null
        if (newConversationId !== conversationId) {
          setConversationId(newConversationId);
        }
      } else {
        setConversationId(null);
        // no conversationId, reset all states when leaving conversations
        clearAllConversationStates()
      }
      // You can perform any actions here based on the new URL
    }, [pathname, conversationId, clearAllConversationStates]); // Depend on 'pathname' to re-run the effect on changes

  /**
   * Load messages when conversation changes
   * Triggered when user navigates to different conversation URL
   */
  useEffect(() => {
    console.log("conversationId changed in <YanProvider>:", conversationId)
    
    if (conversationId === null) {
      clearAllConversationStates()
      setIsMessagesLoading(false)
      return
    }
    const loadMessages = async () => {
      setIsMessagesLoading(true)

      try {
        const fresh = await getMessagesFromDb(conversationId)
        if (fresh.length === 0 && messages.length > 0) {
          // If we have messages but no fresh ones, it means it's a new conversation
          // need those messages on the page
          console.warn("It is a new conversation:", conversationId)
        } else {
          setMessages(fresh)
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error)
      } finally {
        setIsMessagesLoading(false)
      }
    }

    loadMessages()
  }, [conversationId, clearAllConversationStates])

  // ========== API FUNCTIONS ==========
  /**
   * Refresh conversations list from server
   * Used when conversations might have been modified externally
   */
  const refreshConversations = async () => {
    if (!userId) return

    const fresh = await getConversationsForUser()
    setConversations(fresh)
  }

  /**
   * Update conversation title with optimistic UI updates
   * Updates local state immediately, then syncs with server
   */
  const updateConversationTitleFn = async (id: string, title: string) => {
    const prev = [...conversations]
    const updatedConversationWithNewTitle = prev.map((c) =>
      c.id === id ? { ...c, title, updated_at: new Date() } : c
    )
    const sorted = updatedConversationWithNewTitle.sort(
      (a, b) => +new Date(b.updated_at || "") - +new Date(a.updated_at || "")
    )
    setConversations(sorted)
    try {
      const success = await updateConversationTitle(id, title)
      if (!success) {
        throw new Error("Failed to update title")
      }
    } catch {
      setConversations(prev)
      toast.error("Failed to update title")
    }
  }

  /**
   * Delete conversation with optimistic UI updates
   * Removes from local state immediately, handles rollback on error
   * @param id - Conversation ID to delete
   * @param currentConversationId - Current conversation ID for redirect logic
   * @param redirect - Function to call for navigation after deletion
   */
  const deleteConversationFn = async (
    id: string,
    currentConversationId?: string,
    redirect?: () => void
  ) => {
    const prev = [...conversations]
    setConversations((prev) => prev.filter((c) => c.id !== id))

    try {
      const success = await deleteConversation(id)
      if (!success) {
        throw new Error("Failed to delete conversation")
      }
      if (id === currentConversationId && redirect) redirect()
    } catch {
      setConversations(prev)
      toast.error("Failed to delete conversation")
    }
  }

  /**
   * Reset conversations state
   * Used for logout or state cleanup
   */
  const resetConversations = async () => {
    setConversations([])
  }

  /**
   * Find conversation by ID
   * Helper function for accessing specific conversation data
   */
  const getConversationById = (id: string) => {
    const conversation = conversations.find((c) => c.id === id || c.id === id)
    return conversation
  }

  /**
   * Bump conversation to top of list
   * Updates timestamp and moves conversation to first position
   * Used when new messages are added to a conversation
   */
  const bumpConversation = async (id: string) => {
    const prev = [...conversations]
    const updatedConversationWithNewUpdatedAt = prev.map((c) =>
      c.id === id ? { ...c, updated_at: new Date(), last_message_at: new Date() } : c
    )
    const sorted = updatedConversationWithNewUpdatedAt.sort(
      (a, b) => +new Date(b.updated_at || "") - +new Date(a.updated_at || "")
    )
    setConversations(sorted)
  }

  // ========== MESSAGE FUNCTIONS ==========
  /**
   * Refresh messages for current conversation
   * Used to sync with server after external changes
   */
  const refreshMessages = async () => {
    if (!conversationId) return

    try {
      const fresh = await getMessagesFromDb(conversationId)
      setMessages(fresh)
    } catch {
      toast.error("Failed to refresh messages")
    }
  }

  /**
   * Delete all messages in current conversation
   * Optimistically clears UI, then syncs with server
   */
  const deleteMessages = async () => {
    if (!conversationId) return

    try {
      setMessages([])
      const success = await deleteMessagesFromDb(conversationId)
      if (!success) {
        toast.error("Failed to delete messages")
      }
    } catch (error) {
      console.error("Failed to delete messages:", error)
      toast.error("Failed to delete messages")
    }
  }

  /**
   * Reset messages state
   * Used for navigation or state cleanup
   */
  const resetMessages = async () => {
    setMessages([])
  }

  // ========== MULTI-MODEL MODE MANAGEMENT ==========
  /**
   * Toggle multi-model mode and open dialog if enabling
   */
  const toggleMultiModelMode = useCallback(() => {
    // When enabling multi-model mode, open the dialog to select models
    setIsMultiModelDialogOpen(true)

  }, [isMultiModelMode])

  // ========== CONTEXT PROVIDER ==========
  /**
   * Provide all chat state and functions to child components
   * Organized by feature areas for better maintainability
   */
  return (
    <YanContext.Provider
      value={{
        // Conversation session
        conversationId,
        
        // Conversations management
        conversations,
        isConversationsLoading,
        refreshConversations,
        updateConversationTitle: updateConversationTitleFn,
        deleteConversation: deleteConversationFn,
        setConversations,
        createNewConversation,
        resetConversations,
        getConversationById,
        bumpConversation,
        setConversationId,

        // Messages management
        messages,
        isMessagesLoading,
        setMessages,
        refreshMessages,
        resetMessages,
        deleteMessages,
        clearAllConversationStates,

        // Canvas AI Chat status
        canvasStatus,
        setCanvasStatus,

        // AI Chat functionality (from useChat)
        status,
        error,
        stop,
        sendMessage,
        regenerate,
        handleEdit,
        handleDelete,
        onSend,

        // Multi-model mode management
        isMultiModelMode,
        setIsMultiModelMode,
        selectedModels,
        setSelectedModels,
        isMultiModelDialogOpen,
        setIsMultiModelDialogOpen,
        toggleMultiModelMode,

        // Insufficient credits dialog management
        isInsufficientCreditsDialogOpen,
        setIsInsufficientCreditsDialogOpen,
      }}
    >
      {children}
    </YanContext.Provider>
  )
}
/**
 * ============================================================================
 * USAGE EXAMPLES AND BEST PRACTICES
 * ============================================================================
 * 
 * BASIC USAGE:
 * ```tsx
 * function App() {
 *   return (
 *     <YanProvider>
 *       <ChatInterface />
 *     </YanProvider>
 *   )
 * }
 * 
 * function ChatInterface() {
 *   const { conversations, messages, createNewConversation } = useYan()
 *   // Use the context values...
 * }
 * ```
 * 
 * CONVERSATION MANAGEMENT:
 * - Use createNewConversation() to start new chats
 * - Use deleteConversation() with redirect for navigation
 * - Use updateConversationTitle() for renaming
 * - Use bumpConversation() when new messages arrive
 * 
 * MESSAGE HANDLING:
 * - Messages auto-load when conversationId changes
 * - Use refreshMessages() after external updates
 * - Use deleteMessages() to clear conversation history
 * 
 * ERROR HANDLING:
 * - All functions include try/catch with toast notifications
 * - Optimistic updates with rollback on API errors
 * - Loading states provided for UI feedback
 * 
 * URL INTEGRATION:
 * - conversationId automatically extracted from /yan/c/[cid] routes
 * - Messages load automatically when URL changes
 * - Provider handles conversation routing seamlessly
 */
