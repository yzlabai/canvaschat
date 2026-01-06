import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { ConversationService } from "@/lib/chat-store/conversations/api-server"

// GET /api/yan/conversations - Get all conversations for a user
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.uuid
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const conversations = await ConversationService.getConversationsForUser(userId)

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("Failed to fetch conversations:", error)
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    )
  }
}

// POST /api/yan/conversations - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.uuid
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, model, systemPrompt } = await request.json()

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const conversation = await ConversationService.createConversation(
      userId,
      title,
    )

    if (!conversation) {
      return NextResponse.json(
        { error: "Failed to create conversation" },
        { status: 500 }
      )
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error("Failed to create conversation:", error)
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    )
  }
}
