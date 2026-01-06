import type { YanConversation } from "@/lib/chat-store/types"

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

// Get all conversations for the current user
export async function getConversationsForUser(): Promise<YanConversation[]> {
  try {
    const response = await fetchClient("/api/yan/conversations")
    
    if (!response.ok) {
      throw new Error(`Failed to fetch conversations: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.conversations || []
  } catch (error) {
    console.error("Failed to fetch conversations:", error)
    return []
  }
}

// Create a new conversation
export async function createConversation(
  title: string,
): Promise<YanConversation | null> {
  try {
    const response = await fetchClient("/api/yan/conversations", {
      method: "POST",
      body: JSON.stringify({
        title,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create conversation: ${response.statusText}`)
    }

    const data = await response.json()
    return data.conversation
  } catch (error) {
    console.error("Failed to create conversation:", error)
    return null
  }
}

// Update conversation title
export async function updateConversationTitle(
  id: string,
  title: string
): Promise<boolean> {
  try {
    const response = await fetchClient(`/api/yan/conversations/${id}`, {
      method: "PUT",
      body: JSON.stringify({ title }),
    })

    if (!response.ok) {
      throw new Error(`Failed to update conversation title: ${response.statusText}`)
    }

    return true
  } catch (error) {
    console.error("Failed to update conversation title:", error)
    return false
  }
}

// Update conversation model
export async function updateConversationModel(
  id: string,
  model: string
): Promise<boolean> {
  try {
    const response = await fetchClient(`/api/yan/conversations/${id}`, {
      method: "PUT",
      body: JSON.stringify({ model }),
    })

    if (!response.ok) {
      throw new Error(`Failed to update conversation model: ${response.statusText}`)
    }

    return true
  } catch (error) {
    console.error("Failed to update conversation model:", error)
    return false
  }
}

// Delete a conversation (soft delete)
export async function deleteConversation(id: string): Promise<boolean> {
  try {
    const response = await fetchClient(`/api/yan/conversations/${id}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error(`Failed to delete conversation: ${response.statusText}`)
    }

    return true
  } catch (error) {
    console.error("Failed to delete conversation:", error)
    return false
  }
}

// Get a specific conversation
export async function getConversation(id: string): Promise<YanConversation | null> {
  try {
    const response = await fetchClient(`/api/yan/conversations/${id}`)
    
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Failed to fetch conversation: ${response.statusText}`)
    }
    
    const data = await response.json()
    return data.conversation
  } catch (error) {
    console.error("Failed to fetch conversation:", error)
    return null
  }
}
