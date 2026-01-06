import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { ConversationService } from "@/lib/chat-store/conversations/api-server"

// PUT /api/yan/conversations/[id] - Update a conversation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.uuid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const conversationId = id
    const { title, model } = await request.json()

    let updatedConversation

    if (title !== undefined && model !== undefined) {
      // If both title and model are provided, we need to do them separately
      // since our service methods handle them individually
      updatedConversation = await ConversationService.updateConversationTitle(
        conversationId,
        session.user.uuid,
        title
      )
      
      if (updatedConversation) {
        updatedConversation = await ConversationService.updateConversationModel(
          conversationId,
          session.user.uuid,
          model
        )
      }
    } else if (title !== undefined) {
      updatedConversation = await ConversationService.updateConversationTitle(
        conversationId,
        session.user.uuid,
        title
      )
    } else if (model !== undefined) {
      updatedConversation = await ConversationService.updateConversationModel(
        conversationId,
        session.user.uuid,
        model
      )
    } else {
      return NextResponse.json(
        { error: "No update data provided" },
        { status: 400 }
      )
    }

    if (!updatedConversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ conversation: updatedConversation })
  } catch (error) {
    console.error("Failed to update conversation:", error)
    return NextResponse.json(
      { error: "Failed to update conversation" },
      { status: 500 }
    )
  }
}

// DELETE /api/yan/conversations/[id] - Delete (soft delete) a conversation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.uuid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const conversationId = id
    
    const success = await ConversationService.deleteConversation(
      conversationId,
      session.user.uuid
    )

    if (!success) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete conversation:", error)
    return NextResponse.json(
      { error: "Failed to delete conversation" },
      { status: 500 }
    )
  }
}

// GET /api/yan/conversations/[id] - Get a specific conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.uuid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const conversationId = id
    
    const conversation = await ConversationService.getConversation(
      conversationId,
      session.user.uuid
    )

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error("Failed to fetch conversation:", error)
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 }
    )
  }
}
