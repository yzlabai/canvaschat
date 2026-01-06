import type { MyUIMessage } from "@/types/api.types"

export async function fetchClient(input: RequestInfo, init?: RequestInit) {
  const csrf = document.cookie
    .split("; ")
    .find((c) => c.startsWith("csrf_token="))
    ?.split("=")[1]

  return fetch(input, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      "x-csrf-token": csrf || "",
      "Content-Type": "application/json",
    },
  })
}

// Get all messages for a conversation
export async function getMessagesFromDb(conversationId: string): Promise<MyUIMessage[]> {
  try {
    const response = await fetchClient(
      `/api/yan/messages?conversationId=${encodeURIComponent(conversationId)}`
    )
    
    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.messages || []
  } catch (error) {
    console.error("Failed to fetch messages:", error)
    return []
  }
}

// Delete all messages from a conversation
export async function deleteMessagesFromDb(conversationId: string): Promise<boolean> {
  try {
    const response = await fetchClient("/api/yan/messages", {
      method: "DELETE",
      body: JSON.stringify({ conversationId }),
    })

    if (!response.ok) {
      throw new Error(`Failed to delete messages: ${response.statusText}`)
    }

    return true
  } catch (error) {
    console.error("Failed to delete messages:", error)
    return false
  }
}

// Create a new message
export async function createMessage(
  conversationId: string,
  content: string,
  role: string,
  metadata?: any
): Promise<MyUIMessage | null> {
  try {
    const response = await fetchClient("/api/yan/messages/create", {
      method: "POST",
      body: JSON.stringify({
        conversationId,
        content,
        role,
        metadata,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create message: ${response.statusText}`)
    }

    const data = await response.json()
    return data.message
  } catch (error) {
    console.error("Failed to create message:", error)
    return null
  }
}

// Backward compatibility function with the same name as the old API
export { deleteMessagesFromDb as clearMessagesForConversation }

// Backward compatibility functions for existing code
export { getMessagesFromDb as getMessages }
export { deleteMessagesFromDb as deleteMessages }
export { createMessage as createNewMessage }
