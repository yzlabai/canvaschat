import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { MessageService } from "@/lib/chat-store/messages/api-server"

// GET /api/yan/messages - Get messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.uuid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversationId")

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      )
    }

    const messages = await MessageService.getMessagesForConversation(
      conversationId,
      session.user.uuid
    )

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Failed to fetch messages:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/yan/messages - Delete all messages from a conversation
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.uuid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { conversationId } = await request.json()

    if (!conversationId) {
      return NextResponse.json(
        { error: "Conversation ID is required" },
        { status: 400 }
      )
    }

    const success = await MessageService.deleteMessagesFromConversation(
      conversationId,
      session.user.uuid
    )

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete messages" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete messages:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
