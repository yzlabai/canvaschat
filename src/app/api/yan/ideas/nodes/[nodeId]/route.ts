import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { ideaNodes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// PATCH /api/yan/ideas/nodes/[nodeId] - Update node position or other properties
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { nodeId } = await params;

    const {
      position_x,
      position_y,
      title,
      content,
      node_type,
      status
    } = data;

    // Build update object with only provided fields
    const updateData: any = {};
    if (position_x !== undefined) updateData.position_x = position_x;
    if (position_y !== undefined) updateData.position_y = position_y;
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (node_type !== undefined) updateData.node_type = node_type;
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Add updated timestamp
    updateData.updated_at = new Date();

    // Update the node in database
    const database = db();
    const [updatedNode] = await database
      .update(ideaNodes)
      .set(updateData)
      .where(
        and(
          eq(ideaNodes.id, nodeId),
          eq(ideaNodes.user_uuid, session.user.uuid)
        )
      )
      .returning();

    if (!updatedNode) {
      return NextResponse.json(
        { error: 'Node not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedNode);

  } catch (error) {
    console.error('Error updating idea node:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/yan/ideas/nodes/[nodeId] - Get individual node
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { nodeId } = await params;

    const database = db();
    const [node] = await database
      .select()
      .from(ideaNodes)
      .where(
        and(
          eq(ideaNodes.id, nodeId),
          eq(ideaNodes.user_uuid, session.user.uuid)
        )
      );

    if (!node) {
      return NextResponse.json(
        { error: 'Node not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(node);

  } catch (error) {
    console.error('Error fetching idea node:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/yan/ideas/nodes/[nodeId] - Delete node
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { nodeId } = await params;
    const database = db();
    const [deletedNode] = await database
      .update(ideaNodes)
      .set({ 
        status: 'deleted',
        archived_at: new Date(),
        updated_at: new Date()
      })
      .where(
        and(
          eq(ideaNodes.id, nodeId),
          eq(ideaNodes.user_uuid, session.user.uuid)
        )
      )
      .returning();

    if (!deletedNode) {
      return NextResponse.json(
        { error: 'Node not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Node deleted successfully' });

  } catch (error) {
    console.error('Error deleting idea node:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
