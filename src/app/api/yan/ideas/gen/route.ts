import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { generateAIChildSuggestions } from '@/services/ideas';

// POST /api/yan/ideas/gen - Generate AI child suggestions for a parent node
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

    const { nodes, connections } = await generateAIChildSuggestions(
      session.user.uuid,
      parentNodeId,
    );

    return NextResponse.json({
      suggestions: nodes,
      connections: connections,
      count: nodes.length,
      parentNodeId
    });

  } catch (error) {
    console.error('Error generating AI child suggestions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
