import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  ideaSessions,
  ideaNodes,
  ideaNodeConnections,
  ideaNodeMedia,
} from "@/db/schema";
import { eq, desc, and, inArray, notInArray } from "drizzle-orm";
import { gateway } from "@ai-sdk/gateway";
import { generateText } from "ai";
import { resolveModelForSlot } from "@/services/ai-models";
import type { StoryImageStyleValue } from "@/types/ideas";

const ALLOWED_STORY_STYLES: StoryImageStyleValue[] = [
  "cinematic",
  "watercolor",
  "line-art",
  "anime",
  "surreal",
];

// /api/yan/ideas post to create a new idea with root node
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userUuid = session?.user?.uuid;

    if (!userUuid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      description,
      type,
      position_x,
      position_y,
      storyImageStyle,
      storyImagePrompt,
    } = body;
    const normalizedStoryStyle: StoryImageStyleValue | null =
      type === "story"
        ? typeof storyImageStyle === "string" &&
          ALLOWED_STORY_STYLES.includes(
            storyImageStyle as StoryImageStyleValue
          )
          ? (storyImageStyle as StoryImageStyleValue)
          : ALLOWED_STORY_STYLES[0]
        : null;

    const normalizedStoryPrompt: string | null =
      type === "story" && typeof storyImagePrompt === "string"
        ? storyImagePrompt.trim().slice(0, 1000) || null
        : null;

    const userDescription =
      typeof description === "string"
        ? description.trim().slice(0, 500)
        : "";

    let ai_title = "New Idea";
    let ai_description = userDescription;

    try {
      const context = [] as string[];
      if (userDescription) {
        context.push(`Existing seed Idea: "${userDescription}"`);
      }
      if (type) context.push(`Type: "${type} mode"`);
      if (type === "chat") {
        context.push("Goal: Generate a concise chat session title.");
      }

      const contextStr =
        context.length > 0 ? `\nContext:\n${context.join("\n")}` : "";

      const prompt = `Generate a JSON object with title and description base on the following information:${contextStr}

Requirements:
- title: Concise and meaningful (max 5 words), no quotes around the value
- description: Brief explanation (max 5 sentences, under 300 chars), no quotes around the value
- If minimal context, create something creative and productive for brainstorming
- If story mode, make it an engaging narrative prompt
- If type is "chat", focus on naming the chat session in a succinct way

Return ONLY valid JSON in this exact format:
{"title": "Your Title Here", "description": "Your description here."}`;

      const fastModel = await resolveModelForSlot("default_fast");
      const { text } = await generateText({
        model: gateway(fastModel.name),
        prompt,
      });
      const aiText = text.trim();

      // Extract JSON from response
      let jsonStr = aiText;
      const firstBrace = aiText.indexOf("{");
      const lastBrace = aiText.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonStr = aiText.slice(firstBrace, lastBrace + 1);
      }

      try {
        const parsed = JSON.parse(jsonStr);

        if (parsed.title) {
          ai_title = parsed.title.trim().slice(0, 80);
        }
        if (parsed.description && type !== "chat") {
          ai_description = parsed.description.trim().slice(0, 500);
        }
      } catch (parseError) {
        console.error("Failed to parse AI JSON response:", parseError);
        throw new Error("Invalid AI response format");
      }
    } catch (e) {
      console.error("AI generation failed, using fallbacks", e);
      ai_title = type === "chat" ? "Chat Session" : "New Idea Session";
    }

    // Final fallback safety checks
    if (
      !ai_title ||
      typeof ai_title !== "string" ||
      ai_title.trim().length === 0
    ) {
      ai_title = "New Idea Session";
    }
    if (
      !ai_description ||
      typeof ai_description !== "string" ||
      ai_description.trim().length === 0
    ) {
      ai_description = "Brainstorming idea for creative ideation.";
    }

    const database = db();

    // Create idea and root node in a transaction
    const result = await database.transaction(async (tx) => {
      // First create the idea without root_node_id
      const [newIdea] = await tx
        .insert(ideaSessions)
        .values({
          user_uuid: userUuid,
          title: ai_title.trim(),
          description: ai_description.trim(),
          type: type,
          status: "active",
          started_at: new Date(),
          last_activity_at: new Date(),
          story_image_style: normalizedStoryStyle,
          story_image_prompt: normalizedStoryPrompt,
        })
        .returning();

      if (!newIdea) {
        throw new Error("Failed to create idea");
      }

      let root_node_type = "idea";
      if (type === "chat") root_node_type = "chat";
      else if (type === "story") root_node_type = "story";

      // Create the root idea node for this idea
      const [rootNode] = await tx
        .insert(ideaNodes)
        .values({
          session_id: newIdea.id,
          user_uuid: userUuid,
          title: ai_title.trim(),
          content:
            ai_description?.trim() || `Root node for: ${ai_title.trim()}`,
          node_type: root_node_type,
          category: "root",
          color: "purple",
          created_by: "user",
          status: "active",
          position_x: typeof position_x === "number" ? position_x : 0,
          position_y: typeof position_y === "number" ? position_y : 0,
        })
        .returning();

      if (!rootNode) {
        throw new Error("Failed to create root idea node");
      }

      // Update the idea with the root_node_id
      const [updatedIdea] = await tx
        .update(ideaSessions)
        .set({
          root_node_id: rootNode.id,
          total_idea_nodes: 1, // Initialize with 1 for the root node
        })
        .where(eq(ideaSessions.id, newIdea.id))
        .returning();

      return { idea: updatedIdea, rootNode };
    });

    return NextResponse.json(
      {
        ideaSession: result.idea,
        rootNode: result.rootNode,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating idea session:", error);
    return NextResponse.json(
      { error: "Failed to create idea session" },
      { status: 500 }
    );
  }
}
/**
 * Get all idea ideas and their associated nodes for the authenticated user
 * @param request
 * @returns
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userUuid = session?.user?.uuid;

    if (!userUuid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const database = db();
    const url = new URL(request.url);
    const querySessionId = url.searchParams.get("id");

    // 1) Load all user's idea sessions (excluding archived/deleted)
    const allIdeas = await database
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
      .where(
        and(
          notInArray(ideaSessions.status, ["archived", "deleted"]),
          eq(ideaSessions.user_uuid, userUuid)
        )
      )
      .orderBy(
        desc(ideaSessions.last_activity_at),
        desc(ideaSessions.updated_at)
      );

    // If user has no sessions
    if (!allIdeas || allIdeas.length === 0) {
      return NextResponse.json({ ideas: [], nodes: [], connections: [] });
    }

    // Determine which session to load nodes for: query id or latest
    let selectedIdea = allIdeas[0];
    if (querySessionId) {
      const found = allIdeas.find((s) => s.id === querySessionId);
      if (!found) {
        return NextResponse.json(
          { error: "Session not found or unauthorized" },
          { status: 404 }
        );
      }
      selectedIdea = found;
    }

    // 2) Fetch only the most recent 100 nodes for this session
    const MAX_NODES = 100;
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
          notInArray(ideaNodes.status, ["archived", "deleted"]),
          eq(ideaNodes.user_uuid, userUuid),
          eq(ideaNodes.session_id, selectedIdea.id)
        )
      )
      // Order by most recently created; adjust to updated_at if preferred
      .orderBy(desc(ideaNodes.created_at))
      .limit(MAX_NODES);

    // 3) Load media for nodes that have media_count > 0
    const nodesWithImages = nodes.filter((n) => n.media_count > 0).map((n) => n.id);
    if (nodesWithImages.length > 0) {
      const mediaItems = await database
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
            eq(ideaNodeMedia.status, "shown"),
            eq(ideaNodeMedia.user_uuid, userUuid),
            inArray(ideaNodeMedia.node_id, nodesWithImages)
          )
        )
        .orderBy(ideaNodeMedia.created_at);
      // Attach media items to corresponding nodes
      nodes.forEach((node) => {
        if (node.media_count > 0) {
          (node as any).medias = mediaItems.filter((m) => m.node_id === node.id);
        }
      });
    }

    // 4) Fetch connections only among the selected nodes for this session
    const nodeIds = nodes.map((n) => n.id);
    let connections: any[] = [];
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
        })
        .from(ideaNodeConnections)
        .where(
          and(
            notInArray(ideaNodeConnections.status, ["archived", "deleted"]),
            eq(ideaNodeConnections.user_uuid, userUuid),
            eq(ideaNodeConnections.session_id, selectedIdea.id),
            inArray(ideaNodeConnections.source_node_id, nodeIds),
            inArray(ideaNodeConnections.target_node_id, nodeIds)
          )
        )
        .orderBy(ideaNodeConnections.created_at);
    }

    return NextResponse.json({
      ideas: allIdeas,
      nodes: nodes ?? [],
      connections: connections ?? [],
    });
  } catch (error) {
    console.error("Error fetching idea ideas and nodes:", error);
    return NextResponse.json(
      { error: "Failed to fetch idea ideas and nodes" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    const userUuid = session?.user?.uuid;

    if (!userUuid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const sessionId = url.searchParams.get("id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const database = db();

    // First, verify the session belongs to the user
    const [existingSession] = await database
      .select({ id: ideaSessions.id })
      .from(ideaSessions)
      .where(
        and(
          eq(ideaSessions.id, sessionId),
          eq(ideaSessions.user_uuid, userUuid)
        )
      )
      .limit(1);

    if (!existingSession) {
      return NextResponse.json(
        { error: "Session not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete the session (cascade should handle related records)
    await database
      .delete(ideaSessions)
      .where(
        and(
          eq(ideaSessions.id, sessionId),
          eq(ideaSessions.user_uuid, userUuid)
        )
      );

    return NextResponse.json({
      message: "Idea session deleted successfully",
      sessionId,
    });
  } catch (error) {
    console.error("Error deleting idea session:", error);
    return NextResponse.json(
      { error: "Failed to delete idea session" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    const userUuid = session?.user?.uuid;

    if (!userUuid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      sessionId,
      title,
      description,
      status,
      tags,
      storyImageStyle,
      storyImagePrompt,
      isShared,
    } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const database = db();

    // First, verify the session belongs to the user
    const [existingSession] = await database
      .select({ id: ideaSessions.id, type: ideaSessions.type })
      .from(ideaSessions)
      .where(
        and(
          eq(ideaSessions.id, sessionId),
          eq(ideaSessions.user_uuid, userUuid)
        )
      )
      .limit(1);

    if (!existingSession) {
      return NextResponse.json(
        { error: "Session not found or unauthorized" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date(),
      last_activity_at: new Date(),
    };

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0) {
        return NextResponse.json(
          { error: "Title must be a non-empty string" },
          { status: 400 }
        );
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (status !== undefined) {
      if (!["active", "paused", "completed", "archived"].includes(status)) {
        return NextResponse.json(
          {
            error:
              "Invalid status. Must be one of: active, paused, completed, archived",
          },
          { status: 400 }
        );
      }
      updateData.status = status;

      // Set completed_at if status is completed
      if (status === "completed") {
        updateData.completed_at = new Date();
      }
    }

    if (tags !== undefined) {
      updateData.tags = tags ? JSON.stringify(tags) : null;
    }

    if (
      (storyImageStyle !== undefined || storyImagePrompt !== undefined) &&
      existingSession.type !== "story"
    ) {
      return NextResponse.json(
        {
          error: "Story image settings can only be updated for story sessions",
        },
        { status: 400 }
      );
    }

    if (isShared !== undefined) {
      if (typeof isShared !== "boolean") {
        return NextResponse.json(
          { error: "isShared must be a boolean" },
          { status: 400 }
        );
      }
      updateData.is_shared = isShared;
    }

    if (storyImageStyle !== undefined) {
      if (
        storyImageStyle === null ||
        storyImageStyle === ""
      ) {
        updateData.story_image_style = null;
      } else if (
        typeof storyImageStyle === "string" &&
        ALLOWED_STORY_STYLES.includes(
          storyImageStyle as StoryImageStyleValue
        )
      ) {
        updateData.story_image_style = storyImageStyle;
      } else {
        return NextResponse.json(
          {
            error: `Invalid story image style. Must be one of: ${ALLOWED_STORY_STYLES.join(
              ", "
            )}`,
          },
          { status: 400 }
        );
      }
    }

    if (storyImagePrompt !== undefined) {
      if (storyImagePrompt === null) {
        updateData.story_image_prompt = null;
      } else if (typeof storyImagePrompt === "string") {
        updateData.story_image_prompt =
          storyImagePrompt.trim().slice(0, 1000) || null;
      } else {
        return NextResponse.json(
          { error: "Story image prompt must be a string or null" },
          { status: 400 }
        );
      }
    }

    // Update the session
    const [updatedSession] = await database
      .update(ideaSessions)
      .set(updateData)
      .where(
        and(
          eq(ideaSessions.id, sessionId),
          eq(ideaSessions.user_uuid, userUuid)
        )
      )
      .returning();

    if (!updatedSession) {
      return NextResponse.json(
        { error: "Failed to update session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Idea session updated successfully",
      session: updatedSession,
    });
  } catch (error) {
    console.error("Error updating idea session:", error);
    return NextResponse.json(
      { error: "Failed to update idea session" },
      { status: 500 }
    );
  }
}
