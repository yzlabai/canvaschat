import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  ideaSessions,
  ideaNodes,
  ideaNodeConnections,
  ideaNodeMedia,
} from "@/db/schema";
import { and, asc, eq, inArray, notInArray } from "drizzle-orm";

const HIDDEN_STATUSES = ["archived", "deleted"] as const;
const NODE_LIMIT = 200;

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const querySessionId = url.searchParams.get("id");

    if (!querySessionId) {
      return NextResponse.json(
        { error: "Missing idea id" },
        { status: 400 }
      );
    }
    console.log("Shared idea id:", querySessionId);

    const database = db();

    const [idea] = await database
      .select({
        id: ideaSessions.id,
        title: ideaSessions.title,
        description: ideaSessions.description,
        story_image_style: ideaSessions.story_image_style,
        story_image_prompt: ideaSessions.story_image_prompt,
        root_node_id: ideaSessions.root_node_id,
        status: ideaSessions.status,
        type: ideaSessions.type,
        started_at: ideaSessions.started_at,
        last_activity_at: ideaSessions.last_activity_at,
        completed_at: ideaSessions.completed_at,
        is_shared: ideaSessions.is_shared,
        collaborators: ideaSessions.collaborators,
        tags: ideaSessions.tags,
        created_at: ideaSessions.created_at,
        updated_at: ideaSessions.updated_at,
      })
      .from(ideaSessions)
      .where(eq(ideaSessions.id, querySessionId))
      .limit(1);

    if (!idea || !idea.is_shared) {
      return NextResponse.json(
        { error: "Shared canvas not available" },
        { status: 404 }
      );
    }

    const nodes = await database
      .select({
        id: ideaNodes.id,
        session_id: ideaNodes.session_id,
        node_type: ideaNodes.node_type,
        title: ideaNodes.title,
        content: ideaNodes.content,
        summary: ideaNodes.summary,
        category: ideaNodes.category,
        media_count: ideaNodes.media_count,
        has_images: ideaNodes.has_images,
        has_videos: ideaNodes.has_videos,
        has_audio: ideaNodes.has_audio,
        primary_media_id: ideaNodes.primary_media_id,
        color: ideaNodes.color,
        priority: ideaNodes.priority,
        position_x: ideaNodes.position_x,
        position_y: ideaNodes.position_y,
        parent_node_id: ideaNodes.parent_node_id,
        dependency_nodes: ideaNodes.dependency_nodes,
        created_by: ideaNodes.created_by,
        status: ideaNodes.status,
        tags: ideaNodes.tags,
        created_at: ideaNodes.created_at,
        updated_at: ideaNodes.updated_at,
      })
      .from(ideaNodes)
      .where(
        and(
          eq(ideaNodes.session_id, querySessionId),
          notInArray(ideaNodes.status, [...HIDDEN_STATUSES])
        )
      )
      .orderBy(asc(ideaNodes.created_at))
      .limit(NODE_LIMIT);

    const nodeIds = nodes.map((node) => node.id);

    if (nodeIds.length > 0) {
      const mediaRows = await database
        .select({
          id: ideaNodeMedia.id,
          node_id: ideaNodeMedia.node_id,
          media_url: ideaNodeMedia.media_url,
          media_type: ideaNodeMedia.media_type,
          is_primary: ideaNodeMedia.is_primary,
          display_order: ideaNodeMedia.display_order,
        })
        .from(ideaNodeMedia)
        .where(
          and(
            eq(ideaNodeMedia.session_id, querySessionId),
            inArray(ideaNodeMedia.node_id, nodeIds)
          )
        )
        .orderBy(asc(ideaNodeMedia.display_order));

      nodes.forEach((node) => {
        if (node.media_count > 0) {
          (node as any).medias = mediaRows.filter(
            (media) => media.node_id === node.id
          );
        }
      });
    }

    let connections: Array<{
      id: string;
      session_id: string;
      source_node_id: string;
      target_node_id: string;
      connection_type: string | null;
      label: string | null;
      description: string | null;
      created_by: string | null;
      status: string | null;
      metadata: string | null;
      created_at: Date | null;
      updated_at: Date | null;
      line_style?: string | null;
      line_color?: string | null;
      line_width?: number | null;
    }> = [];

    if (nodeIds.length > 0) {
      connections = await database
        .select({
          id: ideaNodeConnections.id,
          session_id: ideaNodeConnections.session_id,
          source_node_id: ideaNodeConnections.source_node_id,
          target_node_id: ideaNodeConnections.target_node_id,
          connection_type: ideaNodeConnections.connection_type,
          label: ideaNodeConnections.label,
          description: ideaNodeConnections.description,
          created_by: ideaNodeConnections.created_by,
          status: ideaNodeConnections.status,
          metadata: ideaNodeConnections.metadata,
          created_at: ideaNodeConnections.created_at,
          updated_at: ideaNodeConnections.updated_at,
          line_style: ideaNodeConnections.line_style,
          line_color: ideaNodeConnections.line_color,
          line_width: ideaNodeConnections.line_width,
        })
        .from(ideaNodeConnections)
        .where(
          and(
            eq(ideaNodeConnections.session_id, querySessionId),
            inArray(ideaNodeConnections.source_node_id, nodeIds),
            inArray(ideaNodeConnections.target_node_id, nodeIds),
            notInArray(ideaNodeConnections.status, [...HIDDEN_STATUSES])
          )
        )
        .orderBy(asc(ideaNodeConnections.created_at));
    }

    return NextResponse.json({
      idea: idea,
      nodes,
      connections,
    });
  } catch (error) {
    console.error("Failed to load shared idea", error);
    return NextResponse.json(
      { error: "Failed to load shared idea" },
      { status: 500 }
    );
  }
}
