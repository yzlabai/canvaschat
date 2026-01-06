import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { generateText } from "ai";
import { gateway } from "@/lib/gateway";
import { generateImageForNode, startVideoGenerationForNode } from "@/services/fal";
import { resolveModelForSlot } from "@/services/ai-models";
import {
  getUserCredits,
  decreaseCredits,
  increaseCredits,
  CreditsTransType,
  CreditsAmount,
} from "@/services/credit";

const STORAGE_BUCKET = "yangen";
const MEDIA_URL_EXPIRATION = 10 * 60 * 60; // 10 hours in seconds

// GET /api/yan/ideas/media?nodeId=... - Fetch media items for a node
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userUuid = session?.user?.uuid;

    if (!userUuid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const nodeId = request.nextUrl.searchParams.get("nodeId");

    if (!nodeId) {
      return NextResponse.json(
        { error: "nodeId query parameter is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const fetchMediaItems = () =>
      supabase
        .from("idea_node_media")
        .select(
          "id, media_url, media_type, title, description, is_primary, display_order, created_at, generation_status, error_message, status, thumbnail_url, duration, width, height, format, mime_type"
        )
        .eq("node_id", nodeId)
        .eq("user_uuid", userUuid)
        .eq("status", "shown")
        .order("is_primary", { ascending: false })
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });

  let items: any[] = [];

    const refreshMediaItems = async () => {
      const { data: refreshedMedia, error: refreshError } = await fetchMediaItems();
      if (refreshError) {
        console.error("Failed to refresh media after auto generation:", refreshError);
        return;
      }
      items = refreshedMedia ?? [];
    };

    const fetchNodeData = async () => {
      const { data: nodeData, error: nodeError } = await supabase
        .from("idea_nodes")
        .select("*")
        .eq("id", nodeId)
        .eq("user_uuid", userUuid)
        .single();

      if (nodeError) {
        console.error("Failed to fetch idea node for media generation:", nodeError);
        return null;
      }

      if (!nodeData) {
        console.warn("Idea node not found for automatic media generation");
        return null;
      }

      return nodeData;
    };

    const composeImagePrompt = async (nodeData: any) => {
      let prompt = (nodeData.content || nodeData.title || "").trim();

      if (prompt) {
        return prompt;
      }

      try {
        const fastModel = await resolveModelForSlot("default_fast");
        const promptResult = await generateText({
          model: gateway(fastModel.name),
          prompt: `Generate a detailed image description based on the following idea content. The description should be vivid and suitable for AI image generation models. Only provide the simply and clear description without any additional text.
Idea Content: ${nodeData.content || nodeData.title || ""}`,
        });
        prompt = promptResult.text?.trim() || "";
      } catch (promptError) {
        console.error("Failed to generate fallback image prompt:", promptError);
      }

      return prompt || "Illustrative scene";
    };

    const composeVideoPrompt = async (nodeData: any) => {
      let prompt = (nodeData.content || nodeData.title || "").trim();

      if (!prompt) {
        try {
          const fastModel = await resolveModelForSlot("default_fast");
          const promptResult = await generateText({
            model: gateway(fastModel.name),
            prompt: `Generate a richly detailed cinematic video prompt inspired by the following idea content. The prompt should be suitable for an AI video generation model and describe the scene, lighting, mood, and key elements. Provide only the prompt text.
Idea Content: ${nodeData.content || nodeData.title || ""}`,
          });
          prompt = promptResult.text?.trim() ?? "";
        } catch (promptError) {
          console.error("Failed to generate fallback video prompt:", promptError);
        }
      }

      return prompt || "Cinematic visualization of the idea";
    };

    const tryAutoGenerateImage = async (nodeData: any) => {
      const imageCost = CreditsAmount.ImageGenerationCost;
      const userCredits = await getUserCredits(userUuid);

      if ((userCredits.left_credits || 0) < imageCost) {
        console.warn("Insufficient credits for automatic image generation");
        return false;
      }

      const prompt = await composeImagePrompt(nodeData);
      const options = {
        num_images: 1,
      } as const;

      let creditsDeducted = false;

      try {
        await decreaseCredits({
          user_uuid: userUuid,
          trans_type: CreditsTransType.ImageGeneration,
          credits: imageCost,
        });
        creditsDeducted = true;

        const imageModel = await resolveModelForSlot("text_image");

        await generateImageForNode(
          userUuid,
          imageModel.name,
          prompt,
          nodeData,
          options
        );

        return true;
      } catch (generationError) {
        console.error("Automatic image generation failed:", generationError);

        if (creditsDeducted) {
          try {
            await increaseCredits({
              user_uuid: userUuid,
              trans_type: CreditsTransType.SystemAdd,
              credits: imageCost,
            });
          } catch (refundError) {
            console.error(
              "Failed to refund credits after auto generation failure:",
              refundError
            );
          }
        }

        return false;
      }
    };

    const tryAutoGenerateVideo = async (nodeData: any) => {
      const videoCost = CreditsAmount.VideoGenerationCost;
      const userCredits = await getUserCredits(userUuid);

      if ((userCredits.left_credits || 0) < videoCost) {
        console.warn("Insufficient credits for automatic video generation");
        return false;
      }

      const prompt = await composeVideoPrompt(nodeData);
      if (!prompt) {
        return false;
      }

      let creditsDeducted = false;

      try {
        await decreaseCredits({
          user_uuid: userUuid,
          trans_type: CreditsTransType.VideoGeneration,
          credits: videoCost,
        });
        creditsDeducted = true;

        await startVideoGenerationForNode(
          userUuid,
          "fal-ai/sora-2/text-to-video",
          { prompt },
          nodeData,
          {
            metadata: {
              autoGenerated: true,
              source: "ideas/media/auto",
              nodeType: nodeData.node_type,
            },
          }
        );

        return true;
      } catch (generationError) {
        console.error("Automatic video generation failed:", generationError);

        if (creditsDeducted) {
          try {
            await increaseCredits({
              user_uuid: userUuid,
              trans_type: CreditsTransType.SystemAdd,
              credits: videoCost,
            });
          } catch (refundError) {
            console.error(
              "Failed to refund credits after automatic video failure:",
              refundError
            );
          }
        }

        return false;
      }
    };

    const ensureMediaForNode = async () => {
      const nodeData = await fetchNodeData();
      if (!nodeData) {
        return;
      }

      const nodeType = (nodeData.node_type ?? nodeData.category ?? "")
        .toString()
        .toLowerCase();
      const prefersVideo = nodeType.includes("video");

      let generated = false;

      if (prefersVideo) {
        generated = await tryAutoGenerateVideo(nodeData);
      }

      if (!generated) {
        generated = await tryAutoGenerateImage(nodeData);
      }

      if (generated) {
        await refreshMediaItems();
      }
    };

    const { data: mediaData, error } = await fetchMediaItems();

    if (error) {
      console.error("Failed to fetch node media records:", error);
      return NextResponse.json(
        { error: "Failed to fetch node media records" },
        { status: 500 }
      );
    }
    items = mediaData ?? [];

    if (items.length === 0) {
      try {
        await ensureMediaForNode();
      } catch (autoGenerationError) {
        console.error(
          "Unexpected error during automatic media generation:",
          autoGenerationError
        );
      }
    }

    if (items.length === 0) {
      return NextResponse.json({
        mediaItems: [],
        primaryMediaId: null,
        count: 0,
      });
    }

    const pathEntries = items.map((item, index) => ({
      path: item.media_url,
      index,
    }));

    const resolvableEntries = pathEntries.filter(({ path }) =>
      typeof path === "string" && path.trim().length > 0 && !path.endsWith(".pending")
    );

    const signedUrlByIndex = new Map<number, string | null>();

    if (resolvableEntries.length > 0) {
      const { data: signedUrls, error: signedUrlError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrls(
          resolvableEntries.map((entry) => entry.path),
          MEDIA_URL_EXPIRATION
        );

      if (signedUrlError) {
        console.error("Failed to create signed URLs for media:", signedUrlError);
        return NextResponse.json(
          { error: "Failed to create signed URLs for media" },
          { status: 500 }
        );
      }

      signedUrls?.forEach((record, idx) => {
        const originalIndex = resolvableEntries[idx]?.index;
        if (typeof originalIndex === "number") {
          signedUrlByIndex.set(originalIndex, record?.signedUrl ?? null);
        }
      });
    }

    const mediaItems = items.map((item, index) => {
      const signedUrl = signedUrlByIndex.get(index) ?? null;
      const generationStatus = (
        item.generation_status || "generated"
      ).toLowerCase();
      // const signedUrl = signedUrlByIndex.get(index) ?? null;

      return {
        id: item.id,
        url: signedUrl,
        storagePath: item.media_url,
        type: item.media_type,
        title: item.title,
        description: item.description,
        isPrimary: item.is_primary,
        displayOrder: item.display_order,
        createdAt: item.created_at,
        generationStatus,
        errorMessage: item.error_message,
        thumbnailUrl: item.thumbnail_url,
        duration: item.duration,
        width: item.width,
        height: item.height,
        format: item.format,
        mimeType: item.mime_type,
        status: item.status,
      };
    });

    const primaryMediaId =
      mediaItems.find((item) => item.isPrimary)?.id ?? null;

    return NextResponse.json({
      mediaItems,
      primaryMediaId,
      count: mediaItems.length,
    });
  } catch (error) {
    console.error("Unexpected error fetching node media:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  const userUuid = session?.user?.uuid;

  if (!userUuid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const mediaId = request.nextUrl.searchParams.get("media_id")?.trim();

  if (!mediaId) {
    return NextResponse.json({ error: "media_id is required" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  const { data: mediaRecord, error: mediaError } = await supabase
    .from("idea_node_media")
    .select("*")
    .eq("id", mediaId)
    .eq("user_uuid", userUuid)
    .single();

  if (mediaError) {
    console.error("Failed to load media record for deletion", mediaError);
    return NextResponse.json({ error: "Failed to load media record" }, { status: 500 });
  }

  if (!mediaRecord) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  const normalizedStatus = (mediaRecord.generation_status || "").toString().toLowerCase();
  if (normalizedStatus !== "failed") {
    return NextResponse.json({ error: "Only failed media can be removed" }, { status: 409 });
  }

  const storagePath = mediaRecord.media_url as string | null;
  let storageDeleted = false;

  if (storagePath && !storagePath.endsWith(".pending")) {
    const { error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([storagePath]);

    if (storageError) {
      console.error("Failed to remove media asset from storage", storageError);
    } else {
      storageDeleted = true;
    }
  }

  const { error: updateError } = await supabase
    .from("idea_node_media")
    .update({
      status: "deleted",
      is_primary: false,
      updated_at: now,
    })
    .eq("id", mediaId)
    .eq("user_uuid", userUuid);

  if (updateError) {
    console.error("Failed to mark media as deleted", updateError);
    return NextResponse.json({ error: "Failed to update media record" }, { status: 500 });
  }

  const nodeId = mediaRecord.node_id as string | null;
  if (!nodeId) {
    return NextResponse.json({ success: true, deleted: mediaId, storageDeleted });
  }

  const { data: remainingMedia, error: remainingError } = await supabase
    .from("idea_node_media")
    .select("id, media_type, is_primary")
    .eq("node_id", nodeId)
    .eq("user_uuid", userUuid)
    .eq("status", "shown")
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  if (remainingError) {
    console.error("Failed to load remaining media after deletion", remainingError);
  }

  const remaining = remainingMedia ?? [];
  let primaryMediaId = remaining.find((item) => item.is_primary)?.id ?? null;

  if (!primaryMediaId && remaining.length > 0) {
    primaryMediaId = remaining[0].id;
    const { error: promoteError } = await supabase
      .from("idea_node_media")
      .update({ is_primary: true, updated_at: now })
      .eq("id", primaryMediaId)
      .eq("user_uuid", userUuid);

    if (promoteError) {
      console.error("Failed to promote media to primary", promoteError);
    }
  }

  const hasImages = remaining.some((item) => item.media_type === "image");
  const hasVideos = remaining.some((item) => item.media_type === "video");

  const { error: nodeUpdateError } = await supabase
    .from("idea_nodes")
    .update({
      media_count: remaining.length,
      primary_media_id: primaryMediaId,
      has_images: hasImages,
      has_videos: hasVideos,
      updated_at: now,
    })
    .eq("id", nodeId)
    .eq("user_uuid", userUuid);

  if (nodeUpdateError) {
    console.error("Failed to update idea node after media deletion", nodeUpdateError);
  }

  return NextResponse.json({
    success: true,
    deleted: mediaId,
    storageDeleted,
    remaining_count: remaining.length,
    primary_media_id: primaryMediaId,
    has_images: hasImages,
    has_videos: hasVideos,
  });
}
