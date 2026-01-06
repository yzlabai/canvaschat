import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { ideaNodes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// POST /api/yan/ideas/nodes/[nodeId]/action - Update node status
export async function POST(
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
      status
    } = data;

    // Build update object with only provided fields
    const updateData: any = {};
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

    // If this is accepting an AI suggestion, we might want to return additional data
    // for handling sibling suggestions and generating next steps
    let responseData: any = updatedNode;
    // when story mode, we want to find and reject sibling suggestions
    if (status === 'accept' && updatedNode.created_by === 'ai' && updatedNode.node_type === 'story') {
      // Find sibling AI suggestions that should be rejected
      const siblingSuggestions = await database
        .update(ideaNodes)
        .set({ status: 'reject', updated_at: new Date() })
        .where(
          and(
            eq(ideaNodes.parent_node_id, updatedNode.parent_node_id || ''),
            eq(ideaNodes.user_uuid, session.user.uuid),
            eq(ideaNodes.created_by, 'ai'),
            eq(ideaNodes.status, 'suggest')
          )
        ).returning();

      // Filter out the accepted node
      const siblingsToReject = siblingSuggestions.filter(node => node.id !== nodeId);
      
      responseData = {
        ...updatedNode,
        siblingSuggestions: siblingsToReject.map(node => node.id)
      };
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error updating idea node:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
