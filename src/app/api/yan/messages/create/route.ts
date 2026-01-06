import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { MessageService } from "@/lib/chat-store/messages/api-server"
import { ConversationService } from "@/lib/chat-store/conversations/api-server"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.uuid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { conversationId, content, role, metadata } = await request.json()

    if (!conversationId || !content || !role) {
      return NextResponse.json(
        { error: "Conversation ID, content, and role are required" },
        { status: 400 }
      )
    }
    // check if the conversation exists and belongs to the user
    const conversationExists = await ConversationService.checkConversationExists(
      conversationId,
      session.user.uuid
    )
    if (!conversationExists) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    const message = await MessageService.createMessage(
      {
        conversation_id: conversationId,
        user_uuid: session.user.uuid,
        content,
        role,
        metadata,
        sequence_number: 0, // This will be set by the database
      }
    )

    if (!message) {
      return NextResponse.json(
        { error: "Failed to create message" },
        { status: 500 }
      )
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error("Failed to create message:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
