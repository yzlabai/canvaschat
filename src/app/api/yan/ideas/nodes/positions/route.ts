import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ideaNodes } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { auth } from '@/auth';

/**
 * PATCH /api/yan/ideas/nodes/positions
 * Bulk update node positions in the database
 */
export async function PATCH(
  request: NextRequest
) {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { positions } = await request.json();

    if (!Array.isArray(positions) || positions.length === 0) {
      return NextResponse.json(
        { error: 'Invalid positions data' },
        { status: 400 }
      );
    }

    // Validate position data structure
    for (const pos of positions) {
      if (!pos.id || typeof pos.position_x !== 'number' || typeof pos.position_y !== 'number') {
        return NextResponse.json(
          { error: 'Invalid position data format' },
          { status: 400 }
        );
      }
    }

    const nodeIds = positions.map((p: any) => p.id);

    // Verify all nodes belong to this session and user
    const existingNodes = await db()
      .select()
      .from(ideaNodes)
      .where(
        and(
          eq(ideaNodes.user_uuid, session.user.uuid),
          inArray(ideaNodes.id, nodeIds)
        )
      );
    if (existingNodes.length !== nodeIds.length) {
      console.log('Some nodes not found or do not belong to the user/session', existingNodes.length, nodeIds.length);
      return NextResponse.json(
        { error: 'Some nodes not found or unauthorized' },
        { status: 404 }
      );
    }

    // Batch update positions
    const updatePromises = positions.map((pos: any) =>
      db()
        .update(ideaNodes)
        .set({
          position_x: pos.position_x,
          position_y: pos.position_y,
          updated_at: new Date(),
        })
        .where(eq(ideaNodes.id, pos.id))
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ 
      success: true, 
      updated: positions.length 
    });

  } catch (error) {
    console.error('Error updating node positions:', error);
    return NextResponse.json(
      { error: 'Failed to update node positions' },
      { status: 500 }
    );
  }
}
