import { db } from '@/db';
import { 
  ideaSessions,
  ideaNodes, 
  ideaNodeConnections 
} from '@/db/schema';
import { 
  IdeaSession,
  IdeaNodeData, 
  IdeaNodeConnection,
  CreateIdeaNodeRequest,
  CreateNodeConnectionRequest,
  IdeaNode,
  NodeType,
  CreateNodeResult
} from '@/types/ideas';
import { eq, and, asc, sql, inArray } from 'drizzle-orm';
import { generateText } from 'ai';
import { gateway } from '@/lib/gateway';
import { resolveModelForSlot } from '@/services/ai-models';
import { getUserCredits, decreaseCredits, CreditsTransType, computeCreditsFromTokens } from '@/services/credit';

// ============================================================================
// IDEA SESSIONS
// ============================================================================

export async function getIdeaSession(
  ideaSessionId: string, 
  userUuid: string
): Promise<IdeaSession | null> {
  const database = db();
  const ideas = await database
    .select()
    .from(ideaSessions)
    .where(and(
      eq(ideaSessions.id, ideaSessionId),
      eq(ideaSessions.user_uuid, userUuid)
    ))
    .limit(1);
    
  return ideas[0] as IdeaSession || null;
}

// ============================================================================
// IDEA NODES
// ============================================================================
/**
 * Creates a new idea node by user. Returns the created node and edges if any.
 * @param userUuid The UUID of the user creating the node.
 * @param data The data for the new idea node.
 * @returns The created idea node and connection if parent exists.
 */
interface CreateIdeaNodeResult {
  node: IdeaNodeData;
  connection?: IdeaNodeConnection;
}
export async function createIdeaNode(
  userUuid: string,
  data: CreateIdeaNodeRequest
): Promise<CreateIdeaNodeResult> {
  const database = db();
  
  // Calculate root_distance if not provided
  let rootDistance = data.root_distance || 0;
  
  if (data.parent_node_id && rootDistance === 0) {
    // Get parent node's root_distance to calculate child's distance
    const [parentNode] = await database
      .select({ root_distance: ideaNodes.root_distance })
      .from(ideaNodes)
      .where(eq(ideaNodes.id, data.parent_node_id))
      .limit(1);
    
    if (parentNode) {
      rootDistance = parentNode.root_distance + 1;
    }
  }
  
  // Create the node first
  const [node] = await database.insert(ideaNodes).values({
    // Allow client-provided id to enable optimistic ID sync
    id: (data as any).id,
    session_id: data.session_id,
    user_uuid: userUuid,
    title: data.title,
    content: data.content,
    root_distance: rootDistance,
    node_type: data.node_type || 'idea',
    position_x: data.position_x || 0,
    position_y: data.position_y || 0,
    parent_node_id: data.parent_node_id,
    created_by: data.created_by || 'user',
  }).returning();
  
  // If there's a parent node, create the connection records
  let connection;
  if (data.parent_node_id && node) {
    try {
      // Create explicit connection record in ideaNodeConnections table
      [connection] = await database.insert(ideaNodeConnections).values({
        session_id: data.session_id,
        user_uuid: userUuid,
        source_node_id: data.parent_node_id,
        target_node_id: node.id,
        connection_type: 'parent-child',
        strength: 100, // Strong parent-child connection
        direction: 'bidirectional',
        created_by: 'user',
        ai_suggested: false,
        status: 'active',
        validated: true
      }).returning();
    } catch (connectionError) {
      console.error('Error creating node connections:', connectionError);
      // Node creation succeeded but connection failed - this is acceptable
    }
  }

  return {node, connection  } as {node: IdeaNodeData, connection?: IdeaNodeConnection};
}

export async function getSessionNodes(
  ideaSessionId: string,
  userUuid: string,
  includeArchived: boolean = false
): Promise<IdeaNode[]> {
  const database = db();
  const conditions = [
    eq(ideaNodes.session_id, ideaSessionId),
    eq(ideaNodes.user_uuid, userUuid)
  ];
  
  if (!includeArchived) {
    conditions.push(eq(ideaNodes.status, 'active'));
  }
  
  const nodes = await database
    .select()
    .from(ideaNodes)
    .where(and(...conditions))
    .orderBy(asc(ideaNodes.created_at));
  
  // Convert to canvas-compatible format
  return nodes.map((node: any): IdeaNode => ({
    ...node,
    x: node.position_x,
    y: node.position_y,
    type: node.node_type as NodeType,
    created_by: node.created_by,
  })) as IdeaNode[];
}

export async function deleteNodes(
  nodeIds: string[],
  userUuid: string
): Promise<number> {
  const database = db();
  const result = await database
    .update(ideaNodes)
    .set({
      status: 'deleted',
      updated_at: new Date(),
    })
    .where(and(
      eq(ideaNodes.user_uuid, userUuid),
      inArray(ideaNodes.id, nodeIds)
    ));

  return result.count;
}

// ============================================================================
// NODE CONNECTIONS
// ============================================================================

export async function createNodeConnection(
  userUuid: string,
  data: CreateNodeConnectionRequest
): Promise<IdeaNodeConnection> {
  const database = db();
  const [connection] = await database.insert(ideaNodeConnections).values({
    session_id: data.session_id,
    user_uuid: userUuid,
    source_node_id: data.source_node_id,
    target_node_id: data.target_node_id,
    connection_type: data.connection_type || 'related',
    label: data.label,
    description: data.description,
    created_by: data.created_by || 'user',
  }).returning();

  return connection as IdeaNodeConnection;
}

export async function getSessionConnections(
  ideaSessionId: string,
  userUuid: string
): Promise<IdeaNodeConnection[]> {
  const database = db();
  const connections = await database
    .select()
    .from(ideaNodeConnections)
    .where(and(
      eq(ideaNodeConnections.session_id, ideaSessionId),
      eq(ideaNodeConnections.user_uuid, userUuid),
      eq(ideaNodeConnections.status, 'active')
    ));
    
  return connections as IdeaNodeConnection[];
}

/**
 * Accept an AI suggestion and mark it as user-chosen, then generate next level suggestions
 */
export async function acceptAISuggestion(
  userUuid: string,
  nodeId: string,
  generateNext: boolean = true
): Promise<{ acceptedNode: IdeaNodeData; nextSuggestions?: IdeaNodeData[] }> {
  const database = db();
  
  // Mark the selected node as user-accepted
  const [acceptedNode] = await database
    .update(ideaNodes)
    .set({
      status: 'accepted',
      updated_at: new Date()
    })
    .where(and(
      eq(ideaNodes.id, nodeId),
      eq(ideaNodes.user_uuid, userUuid)
    ))
    .returning();
  
  if (!acceptedNode) {
    throw new Error('Node not found or unauthorized');
  }
  
  // Optionally archive other AI suggestions at the same distance and parent
  await database
    .update(ideaNodes)
    .set({
      status: 'archived',
      updated_at: new Date()
    })
    .where(and(
      eq(ideaNodes.session_id, acceptedNode.session_id),
      eq(ideaNodes.user_uuid, userUuid),
      eq(ideaNodes.root_distance, acceptedNode.root_distance),
      eq(ideaNodes.parent_node_id, acceptedNode.parent_node_id || ''),
      eq(ideaNodes.created_by, 'ai'),
      eq(ideaNodes.status, 'active'),
      sql`${ideaNodes.id} != ${nodeId}` // Exclude the accepted node
    ));
  
  let nextSuggestions: IdeaNodeData[] = [];
  
  if (generateNext) {
    // TODO: This would integrate with your AI system to generate next level suggestions
    // For now, we'll return the accepted node without generating new suggestions
    // nextSuggestions = await generateAISuggestionsForNode(userUuid, acceptedNode);
  }
  
  return {
    acceptedNode: acceptedNode as IdeaNodeData,
    nextSuggestions
  };
}

/**
 * Generate AI child suggestions for a given parent node
 */
export async function generateAIChildSuggestions(
  userUuid: string,
  parentNodeId: string,
): Promise<CreateNodeResult> {
  const database = db();
  
  // Get the parent node to determine its root distance
  const [parentNode] = await database
    .select()
    .from(ideaNodes)
    .where(and(
      eq(ideaNodes.id, parentNodeId),
      eq(ideaNodes.user_uuid, userUuid),
    ));
  
  if (!parentNode) {
    throw new Error('Parent node not found');
  }
  const ideaSessionId = parentNode.session_id;
  const parentContent = parentNode.content || 'No content';
  // Get the session context
  const idea = await getIdeaSession(ideaSessionId, userUuid);
  if (!idea) {
    throw new Error('Idea not found');
  }
  
  // Get all existing nodes in the session for context
  const existingNodes = await getSessionNodes(ideaSessionId, userUuid, false);
  
  // Get connections to understand relationships
  const connections = await database
    .select()
    .from(ideaNodeConnections)
    .where(and(
      eq(ideaNodeConnections.session_id, ideaSessionId),
      eq(ideaNodeConnections.user_uuid, userUuid)
    ));
  
  // Calculate next distance level
  const childDistance = parentNode.root_distance + 1;
  
  // Prepare context for AI
  const ideaContext = {
    title: idea.title || 'Untitled Session',
    description: idea.description || 'No description provided',
    totalNodes: existingNodes.length,
    sessionType: idea.metadata ? JSON.parse(idea.metadata)?.sessionType || 'brainstorm' : 'brainstorm'
  };
  
  const nodeStructure = existingNodes.map(node => ({
    id: node.id,
    title: node.title,
    content: node.content || '',
    type: node.node_type,
    distance: node.root_distance,
    parentId: node.parent_node_id
  }));
  
  const connectionStructure = connections.map(conn => ({
    from: conn.source_node_id,
    to: conn.target_node_id,
    type: conn.connection_type,
    label: conn.label
  }));
  
  // Create AI prompt with full context requesting structured objects
  const prompt = `You are an AI assistant helping with structured idea development. Generate EXACTLY 3 child idea objects for the given parent node.

Return a STRICT JSON array (no markdown, no commentary) of objects with this shape:
[
  {"title":"Two Words","content":"1-5 concise sentences expanding the idea with concrete nuance."},
  {"title":"Two Words","content":"..."},
  {"title":"Two Words","content":"..."}
]

Rules for title field:
- Exactly two meaningful words (no punctuation, no emojis, Title Case, <= 24 chars total if possible)
- Summarizes the angle of the child idea

Rules for content field:
- 1~5 sentences (max ~380 characters)
- Must elaborate how this branch deepens or diversifies the parent
- Avoid repeating the parent verbatim; add a distinct perspective or actionable framing

Session Context:
Title: ${ideaContext.title}
Description: ${ideaContext.description}
Session Type: ${ideaContext.sessionType}
Total Nodes: ${ideaContext.totalNodes}

Existing Nodes (trimmed):
${nodeStructure.slice(-25).map(node => `- (${node.distance}) ${node.title}`).join('\n')}

Parent Node:
Title: ${parentNode.title}
Content: ${parentContent}
Type: ${parentNode.node_type}
Distance: ${parentNode.root_distance}

Objectives:
1. Each child should explore a different facet / direction.
2. Avoid duplicating existing node titles.
3. Mix strategic, exploratory, and actionable angles if possible.
4. Be clear, concrete, and non-generic.

ONLY output the JSON array.`;

  console.log('AI Suggestion Prompt:', prompt);
  try {
    // Use AI SDK Gateway with the default agent model
  const fastModel = await resolveModelForSlot("default_fast");
  const suggestModel = gateway(fastModel.name);

    // Estimate tokens cost before generation (fallback: charge after generation)
    // For now, we charge after generation based on result.usage?.totalTokens
    const result = await generateText({
      model: suggestModel,
      prompt: prompt,
      temperature: 0.7,
      maxRetries: 2
    });

    // Get tokens used (default to 0 if not available)
    const tokensUsed = result.usage?.totalTokens || 0;
    // Compute credits needed using the new function
    const totalCost = computeCreditsFromTokens(tokensUsed, CreditsTransType.IdeaGeneration);
    console.log(`AI suggestion used ${tokensUsed} tokens, costing ${totalCost} credits.`);
    // Check user credits
    const userCredits = await getUserCredits(userUuid);
    if ((userCredits.left_credits || 0) < totalCost) {
      throw new Error("Insufficient credits to generate AI suggestions.");
    }

    // Decrease credits
    if (totalCost > 0) {
      await decreaseCredits({
        user_uuid: userUuid,
        trans_type: CreditsTransType.IdeaGeneration,
        credits: totalCost,
      });
    }

    // Parse AI response into structured suggestions
    interface RawSuggestion { title?: string; content?: string; }
    let raw: any;
    let structured: RawSuggestion[] = [];
    const text = result.text.trim();
    try {
      raw = JSON.parse(text);
      if (Array.isArray(raw)) {
        structured = raw.map((r: any) => {
          if (typeof r === 'string') {
            // Heuristic: split first colon or dash to form title/content
            const parts = r.split(/[:\-]\s+/);
            const maybeTitle = parts[0].trim().split(/\s+/).slice(0,2).join(' ');
            return { title: maybeTitle, content: r };
          }
          return { title: r.title, content: r.content };
        });
      }
    } catch (e) {
      console.error('AI JSON parse failed, using fallback shaping', e, text);
    }

    if (structured.length === 0) {
      structured = [
        { title: 'New Angle', content: `Explore the implications of "${parentContent.substring(0,40)}".` },
        { title: 'Alt Approach', content: `Consider an alternative perspective on "${parentContent.substring(0,40)}".` },
        { title: 'Practical Path', content: `Outline a practical implementation dimension of "${parentContent.substring(0,40)}".` }
      ];
    }

    // Normalize to exactly 3
    structured = structured.slice(0,3);
    while (structured.length < 3) {
      structured.push({ title: 'Extra Branch', content: `Additional exploration of ${parentNode.title}.` });
    }

    // Sanitize titles to two words Title Case
    const toTitleCase = (s: string) => s.replace(/[_-]+/g,' ').split(/\s+/).filter(Boolean).slice(0,2).map(w=> w.charAt(0).toUpperCase()+w.slice(1).toLowerCase()).join(' ');
    structured = structured.map(s => ({
      title: toTitleCase(s.title || 'Idea Branch'),
      content: (s.content || '').trim().substring(0,400)
    }));

    // Build all node data for batch insert
    const nodeInsertData = structured.map((item, i) => {
      const { title, content } = item;
      const baseX = parentNode.position_x + (i - 1) * 300;
      const baseY = parentNode.position_y + 300;

      return {
        session_id: ideaSessionId,
        user_uuid: userUuid,
        parent_node_id: parentNodeId,
        title: title || 'Idea Branch',
        content: content || title || 'Idea branch details',
        node_type: 'idea',
        position_x: baseX,
        position_y: baseY,
        root_distance: childDistance,
        created_by: 'ai',
        status: 'suggest',
        generation_tokens: tokensUsed,
        generation_cost_cents: 0,
      };
    });

    // Insert all nodes in one batch operation
    const createdSuggestions = await database
      .insert(ideaNodes)
      .values(nodeInsertData)
      .returning();

    // Build all connection data for batch insert
    const connectionInsertData = createdSuggestions.map(suggestion => ({
      user_uuid: userUuid,
      session_id: ideaSessionId,
      source_node_id: parentNodeId,
      target_node_id: suggestion.id,
      connection_type: 'suggests',
      created_by: 'ai',
      ai_suggested: true,
    }));

    // Insert all connections in one batch operation
    const createdConnections = await database
      .insert(ideaNodeConnections)
      .values(connectionInsertData)
      .returning();
    return {
      nodes: createdSuggestions as IdeaNodeData[],
      connections: createdConnections as IdeaNodeConnection[]
    };

  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    throw new Error('AI generation failed' + (error instanceof Error ? `: ${error.message}` : ''));
  }
}

/**
 * Generate story structure: 1 story node + 3 action nodes as children
 */
export async function generateStoryStructure(
  userUuid: string,
  parentNodeId: string,
): Promise<{ storyNode: IdeaNodeData; actionNodes: IdeaNodeData[]; connections: IdeaNodeConnection[] }> {
  const database = db();
  
  // Get the parent node
  const [parentNode] = await database
    .select()
    .from(ideaNodes)
    .where(and(
      eq(ideaNodes.id, parentNodeId),
      eq(ideaNodes.user_uuid, userUuid),
    ));
  
  if (!parentNode) {
    throw new Error('Parent node not found');
  }
  
  const ideaSessionId = parentNode.session_id;
  const parentContent = parentNode.content || 'No content';
  
  // Get the session context
  const idea = await getIdeaSession(ideaSessionId, userUuid);
  if (!idea) {
    throw new Error('Idea not found');
  }
  
  // Calculate next distance level
  const childDistance = parentNode.root_distance + 1;
  
  // Create AI prompt for story structure
  const prompt = `You are a creative storytelling AI. Based on the following story beginning, create 1 main story scenario and 3 action choices.

Story Beginning: "${parentContent}"

Generate EXACTLY 1 story scenario object and 3 action choice objects in this JSON format:
{
  "story": {"title": "Two Words", "content": "A detailed story scenario (2-3 sentences) that sets up the situation."},
  "actions": [
    {"title": "Action Name", "content": "Description of this action choice."},
    {"title": "Action Name", "content": "Description of this action choice."},
    {"title": "Action Name", "content": "Description of this action choice."}
  ]
}

Rules:
- Story title: Exactly two words, Title Case
- Story content: 2-3 sentences setting up a scenario with choices
- Action titles: 1-2 words describing the action
- Action content: 1 sentence describing what this action would accomplish
- Make the actions meaningfully different from each other
- Ensure the story creates engagement and meaningful choices

ONLY output the JSON object.`;

  console.log('Story Structure Prompt:', prompt);
  
  try {
    // Use AI SDK Gateway
  const fastModel = await resolveModelForSlot("default_fast");
  const suggestModel = gateway(fastModel.name);
    
    const result = await generateText({
      model: suggestModel,
      prompt: prompt,
      temperature: 0.8,
      maxRetries: 2
    });

    // Get tokens used
    const tokensUsed = result.usage?.totalTokens || 0;
    
    // Calculate costs
    const totalCost = computeCreditsFromTokens(tokensUsed, CreditsTransType.IdeaGeneration);
    
    // Check user credits
    const userCredits = await getUserCredits(userUuid);
    if ((userCredits.left_credits || 0) < totalCost) {
      throw new Error("Insufficient credits to generate story structure.");
    }

    // Decrease credits
    if (totalCost > 0) {
      await decreaseCredits({
        user_uuid: userUuid,
        trans_type: CreditsTransType.IdeaGeneration,
        credits: totalCost,
      });
    }

    // Parse AI response
    let parsed: any = {};
    let text = result.text.trim();
    // the text should be a JSON object, manully get the json part if there's extra text
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      text = text.substring(jsonStart, jsonEnd + 1);
    }

    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error('AI JSON parse failed for story structure', e, text);
      // Fallback structure
      parsed = {
        story: { title: "Story Begins", content: "Your adventure starts here. What will you do?" },
        actions: [
          { title: "Explore", content: "Look around and gather information." },
          { title: "Act", content: "Take immediate action to solve the problem." },
          { title: "Wait", content: "Observe and wait for the right moment." }
        ]
      };
    }

    // Sanitize and structure the data
    const storyData = {
      title: parsed.story?.title || "Story Begins",
      content: parsed.story?.content || "Your adventure starts here."
    };

    const actionData: Array<{title: string, content: string}> = (parsed.actions || []).slice(0, 3).map((action: any, i: number) => ({
      title: action.title || `Action ${i + 1}`,
      content: action.content || `Take action option ${i + 1}.`
    }));

    // Ensure we have exactly 3 actions
    while (actionData.length < 3) {
      actionData.push({
        title: `Option ${actionData.length + 1}`,
        content: `Consider this alternative approach.`
      });
    }

    // Create positions
    const storyX = parentNode.position_x;
    const storyY = parentNode.position_y + 300;
    
    const actionBaseX = storyX - 300;
    const actionY = storyY + 300;

    // Insert story node
    const [storyNode] = await database
      .insert(ideaNodes)
      .values({
        session_id: ideaSessionId,
        user_uuid: userUuid,
        parent_node_id: parentNodeId,
        title: storyData.title,
        content: storyData.content,
        node_type: 'story',
        position_x: storyX,
        position_y: storyY,
        root_distance: childDistance,
        created_by: 'ai',
        status: 'suggest',
        generation_tokens: tokensUsed,
        generation_cost_cents: 0,
      })
      .returning();

    // Insert action nodes
    const actionNodes = await database
      .insert(ideaNodes)
      .values(actionData.map((action: {title: string, content: string}, i: number) => ({
        session_id: ideaSessionId,
        user_uuid: userUuid,
        parent_node_id: storyNode.id,
        title: action.title,
        content: action.content,
        node_type: 'action',
        position_x: actionBaseX + (i * 300),
        position_y: actionY,
        root_distance: childDistance + 1,
        created_by: 'ai',
        status: 'suggest',
        generation_tokens: 0,
        generation_cost_cents: 0,
      })))
      .returning();

    // Create connections: parent -> story, story -> actions
    const connectionData = [
      {
        user_uuid: userUuid,
        session_id: ideaSessionId,
        source_node_id: parentNodeId,
        target_node_id: storyNode.id,
        connection_type: 'suggests',
        created_by: 'ai',
        ai_suggested: true,
      },
      ...actionNodes.map((actionNode: any) => ({
        user_uuid: userUuid,
        session_id: ideaSessionId,
        source_node_id: storyNode.id,
        target_node_id: actionNode.id,
        connection_type: 'suggests',
        created_by: 'ai',
        ai_suggested: true,
      }))
    ];

    const connections = await database
      .insert(ideaNodeConnections)
      .values(connectionData)
      .returning();

    return {
      storyNode: storyNode as IdeaNodeData,
      actionNodes: actionNodes as IdeaNodeData[],
      connections: connections as IdeaNodeConnection[]
    };

  } catch (error) {
    console.error('Error generating story structure:', error);
    throw new Error('Story structure generation failed' + (error instanceof Error ? `: ${error.message}` : ''));
  }
}

