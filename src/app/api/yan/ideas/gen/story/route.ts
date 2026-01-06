import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateStoryStructure } from '@/services/ideas';

// POST /api/yan/ideas/gen/story - Generate story structure: 1 story node + 3 action nodes
export async function POST(
  request: NextRequest,
) {
  try {
    const session = await auth();
    if (!session?.user?.uuid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const data = await request.json();
    const { parentNodeId } = data;

    if (!parentNodeId) {
      return NextResponse.json(
        { error: 'Parent node ID is required' },
        { status: 400 }
      );
    }

    const { storyNode, actionNodes, connections } = await generateStoryStructure(
      session.user.uuid,
      parentNodeId,
    );

    return NextResponse.json({
      storyNode,
      actionNodes,
      connections,
      parentNodeId
    });

  } catch (error) {
    console.error('Error generating story structure:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}