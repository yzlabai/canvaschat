import { fal } from "@fal-ai/client";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { z } from "zod";

const supabase_bucket = "yangen";
const MAX_MEDIA_URL_EXPIRATION = 10 * 60 * 60; // 10 hours in seconds

export const FalResult = z.object({
  images: z.tuple([z.object({ url: z.string() })]),
});

const FalVideoArrayResult = z.object({
  videos: z
    .array(
      z.object({
        url: z.string(),
        thumbnail: z.string().optional(),
        cover: z.string().optional(),
        preview: z.string().optional(),
        preview_image: z.string().optional(),
        mime_type: z.string().optional(),
        format: z.string().optional(),
        duration: z.number().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
      })
    )
    .min(1),
});

const FalVideoSingleResult = z.object({
  video: z.union([
    z.object({
      url: z.string(),
      thumbnail: z.string().optional(),
      mime_type: z.string().optional(),
      format: z.string().optional(),
      duration: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
    }),
    z.string(),
  ]),
  thumbnail: z.string().optional(),
});

const FalVideoUrlResult = z.object({
  url: z.string(),
  thumbnail: z.string().optional(),
  mime_type: z.string().optional(),
  format: z.string().optional(),
  duration: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

const FalVideoOutputResult = z.object({
  output: z
    .array(
      z.object({
        url: z.string(),
        thumbnail: z.string().optional(),
        mime_type: z.string().optional(),
        format: z.string().optional(),
        duration: z.number().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
      })
    )
    .min(1),
});

type VideoVariant = z.infer<typeof FalVideoArrayResult>["videos"][number] & {
  mime_type?: string;
  format?: string;
  duration?: number;
  width?: number;
  height?: number;
};

type NormalizedVideoResult = {
  url: string;
  thumbnail?: string;
  mimeType?: string;
  format?: string;
  duration?: number;
  width?: number;
  height?: number;
};

function pickVideoFromVariant(video: VideoVariant, fallbackThumbnail?: string): NormalizedVideoResult {
  return {
    url: video.url,
    thumbnail: video.thumbnail || video.preview_image || fallbackThumbnail || video.cover,
    mimeType: video.mime_type,
    format: video.format,
    duration: video.duration,
    width: video.width,
    height: video.height,
  };
}

function normalizeFalVideoResult(data: unknown): NormalizedVideoResult {
  const arrayResult = FalVideoArrayResult.safeParse(data);
  if (arrayResult.success) {
    return pickVideoFromVariant(arrayResult.data.videos[0]);
  }

  const singleResult = FalVideoSingleResult.safeParse(data);
  if (singleResult.success) {
    const video = singleResult.data.video;
    if (typeof video === "string") {
      return {
        url: video,
        thumbnail: singleResult.data.thumbnail,
      };
    }
    return pickVideoFromVariant(video, singleResult.data.thumbnail);
  }

  const urlResult = FalVideoUrlResult.safeParse(data);
  if (urlResult.success) {
    const { url, thumbnail, mime_type, format, duration, width, height } = urlResult.data;
    return {
      url,
      thumbnail,
      mimeType: mime_type,
      format,
      duration,
      width,
      height,
    };
  }

  const outputResult = FalVideoOutputResult.safeParse(data);
  if (outputResult.success) {
    return pickVideoFromVariant(outputResult.data.output[0]);
  }

  if (typeof data === "object" && data && "data" in data) {
    return normalizeFalVideoResult((data as Record<string, unknown>).data);
  }

  throw new Error("Unexpected FAL video result structure");
}

function guessExtensionFromUrl(url: string): string | undefined {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.([a-zA-Z0-9]+)(?:$|\?)/);
    return match?.[1]?.toLowerCase();
  } catch (error) {
    console.warn("Failed to infer extension from URL", error);
    return undefined;
  }
}

function mimeTypeFromExtension(extension?: string): string {
  switch (extension) {
    case "webm":
      return "video/webm";
    case "mov":
      return "video/quicktime";
    case "gif":
      return "image/gif";
    default:
      return "video/mp4";
  }
}

function toPositiveInteger(value?: number | null): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }
  return Math.max(0, Math.round(value));
}

/**
 * Generates an image using FAL AI service and saves it to the database
 * 
 * @param userId - The UUID of the user requesting the image generation
 * @param model - The FAL AI model to use for image generation (e.g., "fal-ai/flux-lora")
 * @param prompt - The text prompt describing the image to generate
 * @param nodeData - Node data object containing id, session_id, and current media counts/metadata
 * @param options - Optional additional parameters for image generation
 * 
 * @returns Promise resolving to an object containing:
 *   - data: Raw FAL AI response data
 *   - url: Supabase storage path for the image
 *   - publicUrl: Public URL for accessing the image
 *   - mediaId: Database ID of the created media record
 * 
 * @throws Error if FAL_KEY is not configured, FAL AI request fails, or database operations fail
 * 
 * @example
 * // Image generation with database integration for story nodes
 * const result = await generateImageForNode(
 *   userId, 
 *   "fal-ai/flux-lora", 
 *   "A magical forest scene",
 *   nodeData
 * );
 */
export async function generateImageForNode(
  userId: string,
  model: string,
  prompt: string,
  nodeData: any,
  options?: any
) {
  if (!process.env.FAL_KEY) {
    throw new Error("FAL_KEY is not set in environment variables");
  }
  
  // Configure FAL AI client with API credentials
  fal.config({
    credentials: process.env.FAL_KEY || "",
  });
  
  try {
    // Step 1: Generate image using FAL AI service
    const result = await fal.subscribe(model, {
      input: {
        prompt,
        ...options,
      },
    });
    
    // Validate FAL AI response structure
    // the result is like { data: { images: [ { url: 'https://v3.fal.media/files/rabbit/......jpeg' } ], description: "Here's an image..." }, requestId: '...' }
    // TODO, use requestId to track the generation status
    if (!result) {
      throw new Error("No result from FAL");
    }
    const $result = FalResult.parse(result.data);
    const [{ url: imageUrl }] = $result.images;
    if (!imageUrl) {
      throw new Error("No image URL in FAL result");
    }
    
    // Step 2: Download the generated image from FAL's temporary storage
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error("Failed to download image from FAL");
    }
    const imageBuffer = await imageResponse.arrayBuffer().then(Buffer.from);
    
    // Step 3: Upload image to permanent Supabase storage
    const sp_img_url = `gen/images/${userId}/${Date.now()}-${Math.random().toString(16).substring(2, 8)}.jpeg`;
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.storage
      .from(supabase_bucket)
      .upload(sp_img_url, imageBuffer, {
        upsert: true,
        contentType: "image/jpeg",
      });
    if (error) {
      console.error("Supabase upload error:", error);
      throw new Error("Failed to upload image to storage");
    }

    // Step 4: Database integration for idea nodes
    // Update the database with media records using nodeData
    if (nodeData && nodeData.id && nodeData.session_id) {
      // Insert media record into idea_node_media table
      const { data: mediaData, error: mediaError } = await supabase
        .from("idea_node_media")
        .insert({
          node_id: nodeData.id,
          session_id: nodeData.session_id,
          user_uuid: userId,
          media_type: "image",
          media_url: sp_img_url,
          display_order: nodeData.media_count || 0, // Add as next item
          is_primary: (nodeData.media_count || 0) === 0, // Set as primary if it's the first media
          title: `Generated image for: ${nodeData.title}`,
          description: prompt, // Store the prompt as description
          file_size: 0, // We don't track file size for generated images
          generation_status: "generated",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (mediaError) {
        console.error("Error inserting media record:", mediaError);
        throw new Error("Failed to save media record");
      }

      // Update the parent idea node with media summary information
      const isFirstImage = (nodeData.media_count || 0) === 0;
      const { error: nodeError } = await supabase
        .from("idea_nodes")
        .update({
          media_count: (nodeData.media_count || 0) + 1,
          has_images: true,
          primary_media_id: isFirstImage ? mediaData.id : nodeData.primary_media_id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", nodeData.id)
        .eq("user_uuid", userId);

      if (nodeError) {
        console.error("Error updating node record:", nodeError);
        throw new Error("Failed to update node record");
      }

      // Generate public URL for frontend access
      const { data: publicUrlData } = await supabase.storage
        .from(supabase_bucket)
        .createSignedUrl(sp_img_url, MAX_MEDIA_URL_EXPIRATION);

      return {
        data: result.data || result,
        url: sp_img_url,
        publicUrl: publicUrlData?.signedUrl,
        mediaId: mediaData?.id,
      };
    }

    // Return basic result if nodeData is incomplete
    return {
      data: result.data || result,
      url: sp_img_url,
    };
  } catch (error) {
    console.error("Error generating image with FAL:", error);
    throw error;
  }
}

type VideoInput = {
  prompt?: string;
  [key: string]: unknown;
};

type VideoGenerationStatus = "queued" | "generating" | "generated" | "failed";

type StartVideoGenerationOptions = {
  webhookUrl?: string;
  metadata?: Record<string, unknown>;
};

type VideoGenerationMetadata = {
  falRequest?: {
    requestId: string;
    model: string;
    submittedAt: string;
    lastStatus?: string;
    lastCheckedAt?: string;
  };
  storage?: {
    basePath: string;
    path?: string;
    mimeType?: string;
    format?: string;
    size?: number;
  };
  source?: {
    prompt?: string;
    referenceImageUrl?: string;
  };
  userMetadata?: Record<string, unknown>;
  statusHistory?: Array<{ status: string; at: string }>;
  billing?: Record<string, unknown>;
  error?: {
    message: string;
    at: string;
  };
  [key: string]: unknown;
};

export type StartVideoGenerationResult = {
  mediaId: string;
  requestId: string;
  status: VideoGenerationStatus;
  storagePath: string;
  metadata: Record<string, unknown>;
};

export type RefreshVideoGenerationResult = {
  status: VideoGenerationStatus;
  mediaId: string;
  requestId?: string;
  storagePath?: string;
  signedUrl?: string;
  thumbnailUrl?: string | null;
  mimeType?: string | null;
  format?: string | null;
  duration?: number | null;
  width?: number | null;
  height?: number | null;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
  falStatus?: string;
};

const MAX_STATUS_HISTORY_LENGTH = 20;

function nowIso(): string {
  return new Date().toISOString();
}

function parseMediaMetadata(raw: unknown): VideoGenerationMetadata {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return parsed as VideoGenerationMetadata;
      }
    } catch (error) {
      console.warn("Failed to parse media metadata", error);
      return {};
    }
  }
  if (typeof raw === "object") {
    return raw as VideoGenerationMetadata;
  }
  return {};
}

function stringifyMetadata(metadata: VideoGenerationMetadata): string {
  try {
    return JSON.stringify(metadata ?? {});
  } catch (error) {
    console.warn("Failed to stringify media metadata", error);
    return "{}";
  }
}

function appendStatusHistory(metadata: VideoGenerationMetadata, status: string) {
  const entry = { status, at: nowIso() };
  const history = Array.isArray(metadata.statusHistory) ? [...metadata.statusHistory, entry] : [entry];
  metadata.statusHistory = history.slice(-MAX_STATUS_HISTORY_LENGTH);
}

function setFalRequestMetadata(metadata: VideoGenerationMetadata, requestId: string, model: string) {
  metadata.falRequest = {
    requestId,
    model,
    submittedAt: metadata.falRequest?.submittedAt ?? nowIso(),
    lastStatus: metadata.falRequest?.lastStatus,
    lastCheckedAt: metadata.falRequest?.lastCheckedAt,
  };
}

function updateFalRequestStatus(
  metadata: VideoGenerationMetadata,
  requestId: string,
  model: string,
  status: string
) {
  setFalRequestMetadata(metadata, requestId, model);
  if (metadata.falRequest) {
    metadata.falRequest.lastStatus = status;
    metadata.falRequest.lastCheckedAt = nowIso();
  }
}

function mapQueueStatus(status: unknown): VideoGenerationStatus {
  if (!status) {
    return "queued";
  }
  const normalized = String(status).toLowerCase();
  if (["completed", "succeeded", "success", "generated", "done"].includes(normalized)) {
    return "generated";
  }
  if (["failed", "error", "canceled", "cancelled", "failure"].includes(normalized)) {
    return "failed";
  }
  if (["processing", "running", "in_progress", "progress", "generating"].includes(normalized)) {
    return "generating";
  }
  return "queued";
}

function extractQueueStatus(response: Record<string, unknown> | null | undefined): string | undefined {
  if (!response || typeof response !== "object") return undefined;
  return (
    (response.status as string | undefined) ||
    (response.data as Record<string, unknown> | undefined)?.status?.toString() ||
    (response.queue_status as string | undefined) ||
    (response.state as string | undefined)
  );
}

function deriveBasePath(userId: string, requestId: string) {
  return `gen/videos/${userId}/${requestId}`;
}

export async function startVideoGenerationForNode(
  userId: string,
  model: "fal-ai/sora-2/text-to-video" | "fal-ai/sora-2/image-to-video",
  input: VideoInput,
  nodeData: any,
  options?: StartVideoGenerationOptions
): Promise<StartVideoGenerationResult> {
  if (!process.env.FAL_KEY) {
    throw new Error("FAL_KEY is not set in environment variables");
  }

  fal.config({
    credentials: process.env.FAL_KEY || "",
  });

  const queueSubmission = await fal.queue.submit(model, {
    input,
    webhookUrl: options?.webhookUrl,
  });

  const requestId = queueSubmission?.request_id;

  if (!requestId) {
    throw new Error("Failed to submit FAL video generation request");
  }

  const basePath = deriveBasePath(userId, requestId);
  const placeholderPath = `${basePath}.pending`;

  const referenceCandidate =
    input["image_url"] ??
    input["reference_image"] ??
    input["reference_image_url"] ??
    input["init_image"] ??
    input["video_input_image"];

  const metadata: VideoGenerationMetadata = {
    source: {
      prompt: typeof input.prompt === "string" ? input.prompt : undefined,
      referenceImageUrl: typeof referenceCandidate === "string" ? referenceCandidate : undefined,
    },
    storage: {
      basePath,
    },
  };

  if (options?.metadata) {
    metadata.userMetadata = options.metadata;
  }

  setFalRequestMetadata(metadata, requestId, model);
  appendStatusHistory(metadata, "queued");

  const supabase = await createServerSupabaseClient();

  const displayOrder = nodeData?.media_count || 0;
  const isFirstMedia = displayOrder === 0;

  const { data: insertedMedia, error: mediaError } = await supabase
    .from("idea_node_media")
    .insert({
      node_id: nodeData.id,
      session_id: nodeData.session_id,
      user_uuid: userId,
      media_type: "video",
      media_url: placeholderPath,
      thumbnail_url: null,
      duration: null,
      width: null,
      height: null,
      format: null,
      mime_type: null,
      file_size: null,
      display_order: displayOrder,
      is_primary: isFirstMedia,
      title: `Generated video for: ${nodeData.title ?? "Idea"}`,
      description: typeof input.prompt === "string" ? input.prompt : "Generating video",
      generation_status: "queued",
      error_message: null,
      metadata: stringifyMetadata(metadata),
      created_at: nowIso(),
      updated_at: nowIso(),
    })
    .select()
    .single();

  if (mediaError) {
    console.error("Error inserting placeholder video media record:", mediaError);
    throw new Error("Failed to create placeholder media record");
  }

  const { error: nodeError } = await supabase
    .from("idea_nodes")
    .update({
      media_count: displayOrder + 1,
      has_videos: true,
      primary_media_id: isFirstMedia ? insertedMedia.id : nodeData.primary_media_id,
      updated_at: nowIso(),
    })
    .eq("id", nodeData.id)
    .eq("user_uuid", userId);

  if (nodeError) {
    console.error("Error updating node after queuing video generation:", nodeError);
    throw new Error("Failed to update node record for queued video");
  }

  return {
    mediaId: insertedMedia.id,
    requestId,
    status: "queued",
    storagePath: placeholderPath,
    metadata,
  };
}

/**
 * Refresh the generation status for a queued video and synchronize the local media record.
 *
 * This method is intentionally organized into clear early-return checkpoints:
 *   1. Load the media record and metadata (fail fast if missing).
 *   2. Handle trivial cases (missing FAL metadata or already generated assets).
 *   3. Poll FAL for queue status and react to failures/updates.
 *   4. When generation completes, fetch the final asset, persist it, and return.
 */
export async function refreshVideoGenerationForMedia(
  mediaId: string,
  userId: string
): Promise<RefreshVideoGenerationResult> {
  const supabase = await createServerSupabaseClient();

  // ---------------------------------------------------------------------------
  // 1) Load current media record and decode metadata
  // ---------------------------------------------------------------------------
  const { data: mediaRecord, error: mediaError } = await supabase
    .from("idea_node_media")
    .select("*")
    .eq("id", mediaId)
    .eq("user_uuid", userId)
    .single();

  if (mediaError) {
    console.error("Failed to fetch media record for refresh:", mediaError);
    throw new Error("Failed to fetch media record");
  }

  if (!mediaRecord) {
    throw new Error("Media record not found");
  }

  const metadata = parseMediaMetadata(mediaRecord.metadata);
  const requestId = metadata.falRequest?.requestId;
  const model = metadata.falRequest?.model as
    | "fal-ai/sora-2/text-to-video"
    | "fal-ai/sora-2/image-to-video"
    | undefined;
  const currentStatus = (mediaRecord.generation_status as VideoGenerationStatus) || "queued";
  const falKey = process.env.FAL_KEY;

  // Helper to shape the response consistently while allowing overrides.
  const respond = (
    status: VideoGenerationStatus,
    overrides: Partial<RefreshVideoGenerationResult> = {}
  ): RefreshVideoGenerationResult => ({
    status,
    mediaId,
    requestId,
    storagePath: overrides.storagePath ?? mediaRecord.media_url,
    metadata,
    ...overrides,
  });

  // Helper: mark the media as failed, persist metadata, and return immediately.
  const markFailure = async (message: string, falStatus?: string) => {
    metadata.error = { message, at: nowIso() };
    appendStatusHistory(metadata, "failed");
    if (requestId && model) {
      updateFalRequestStatus(metadata, requestId, model, "failed");
    }

    const { data: failedMedia } = await supabase
      .from("idea_node_media")
      .update({
        generation_status: "failed",
        error_message: message,
        metadata: stringifyMetadata(metadata),
        updated_at: nowIso(),
      })
      .eq("id", mediaId)
      .eq("user_uuid", userId)
      .select()
      .single();

    return respond("failed", {
      storagePath: failedMedia?.media_url ?? mediaRecord.media_url,
      errorMessage: message,
      falStatus,
    });
  };

  // Helper: persist metadata changes without interrupting execution flow.
  const updateMediaMetadata = async (update: Record<string, unknown>) => {
    const { error } = await supabase
      .from("idea_node_media")
      .update({
        ...update,
        metadata: stringifyMetadata(metadata),
        updated_at: nowIso(),
      })
      .eq("id", mediaId)
      .eq("user_uuid", userId);

    if (error) {
      console.error("Failed to update media status", error);
    }
  };

  // ---------------------------------------------------------------------------
  // 2) Short-circuit scenarios where we already know the answer
  // ---------------------------------------------------------------------------
  if (!requestId || !model) {
    console.warn("Missing FAL request metadata for media", mediaId);
    return respond(currentStatus, {
      errorMessage: mediaRecord.error_message ?? undefined,
    });
  }

  if (currentStatus === "generated") {
    const { data: signedUrlData } = await supabase.storage
      .from(supabase_bucket)
      .createSignedUrl(mediaRecord.media_url, MAX_MEDIA_URL_EXPIRATION);

    return respond("generated", {
      signedUrl: signedUrlData?.signedUrl,
      thumbnailUrl: mediaRecord.thumbnail_url,
      mimeType: mediaRecord.mime_type,
      format: mediaRecord.format,
      duration: mediaRecord.duration,
      width: mediaRecord.width,
      height: mediaRecord.height,
    });
  }

  if (!falKey) {
    throw new Error("FAL_KEY is not set in environment variables");
  }

  fal.config({
    credentials: falKey || "",
  });

  // ---------------------------------------------------------------------------
  // 3) Poll FAL queue for the latest status
  // ---------------------------------------------------------------------------
  let queueStatusResponse: Record<string, unknown> | undefined;

  try {
    queueStatusResponse = (await fal.queue.status(model, {
      requestId,
      logs: false,
    })) as unknown as Record<string, unknown>;
    console.log("FAL queue status response:", queueStatusResponse);
  } catch (error: any) {
    const statusCode = error?.response?.status || error?.status;
    if (statusCode && [404, 425, 429, 503].includes(statusCode)) {
      return respond(currentStatus);
    }

    console.error("Error retrieving FAL queue status:", error);
    return markFailure(error?.message || "Unknown FAL queue error", "failed");
  }

  const falStatus = extractQueueStatus(queueStatusResponse);
  const normalizedStatus = mapQueueStatus(falStatus);
  updateFalRequestStatus(metadata, requestId, model, falStatus || normalizedStatus);

  if (normalizedStatus === "failed") {
    const errorMessage =
      (queueStatusResponse?.error as string | undefined) ||
      ((queueStatusResponse?.data as Record<string, unknown> | undefined)?.error as string | undefined) ||
      "Video generation failed";
    return markFailure(errorMessage, falStatus);
  }

  if (normalizedStatus !== currentStatus) {
    appendStatusHistory(metadata, normalizedStatus);
    await updateMediaMetadata({ generation_status: normalizedStatus });
  } else {
    await updateMediaMetadata({});
  }

  if (normalizedStatus !== "generated") {
    return respond(normalizedStatus, { falStatus });
  }

  // ---------------------------------------------------------------------------
  // 4) Generation succeeded – download asset, store in Supabase, and respond
  // ---------------------------------------------------------------------------
  let queueResult: any;
  try {
    queueResult = await fal.queue.result(model, {
      requestId,
    });
  } catch (error: any) {
    const statusCode = error?.response?.status || error?.status;
    console.error("FAL queue result error details:", error?.body || error?.response?.body);

    if (statusCode && [404, 503].includes(statusCode)) {
      console.warn("FAL queue result not ready yet", { statusCode, error });
      appendStatusHistory(metadata, "generating");
      updateFalRequestStatus(metadata, requestId, model, "asset_pending");

      await updateMediaMetadata({ generation_status: "generating" });
      return respond("generating", { falStatus });
    }

    console.error("Failed to fetch FAL queue result:", error);
    return markFailure(error?.message || "Unable to retrieve FAL result", falStatus);
  }

  const normalizedResult = normalizeFalVideoResult(queueResult?.data ?? queueResult);

  if (!normalizedResult?.url) {
    return markFailure("No video URL returned from FAL queue", falStatus);
  }

  const videoResponse = await fetch(normalizedResult.url);
  console.log("Fetched video URL, response status:", videoResponse.status);
  if (!videoResponse.ok) {
    return markFailure(`Failed to download video from FAL: ${videoResponse.status}`, falStatus);
  }

  const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

  const extension =
    normalizedResult.format?.toLowerCase() ||
    guessExtensionFromUrl(normalizedResult.url) ||
    "mp4";
  const mimeType = normalizedResult.mimeType || mimeTypeFromExtension(extension);

  const basePath = metadata.storage?.basePath || deriveBasePath(userId, requestId);
  const finalPath = `${basePath}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(supabase_bucket)
    .upload(finalPath, videoBuffer, {
      upsert: true,
      contentType: mimeType,
    });

  if (uploadError) {
    console.error("Supabase video upload error:", uploadError);
    return markFailure("Failed to upload video to storage", falStatus);
  }

  metadata.storage = {
    ...(metadata.storage ?? {}),
    basePath,
    path: finalPath,
    mimeType,
    format: extension,
    size: videoBuffer.length,
  };

  delete metadata.error;
  appendStatusHistory(metadata, "generated");

  const { data: updatedMedia, error: updateError } = await supabase
    .from("idea_node_media")
    .update({
      media_url: finalPath,
      thumbnail_url: normalizedResult.thumbnail ?? null,
      duration: toPositiveInteger(normalizedResult.duration),
      width: toPositiveInteger(normalizedResult.width),
      height: toPositiveInteger(normalizedResult.height),
      format: extension,
      mime_type: mimeType,
      file_size: videoBuffer.length,
      generation_status: "generated",
      error_message: null,
      metadata: stringifyMetadata(metadata),
      updated_at: nowIso(),
    })
    .eq("id", mediaId)
    .eq("user_uuid", userId)
    .select()
    .single();

  if (updateError) {
    console.error("Failed to finalize video media record:", updateError);
    throw new Error("Failed to finalize video media record");
  }

  const { data: signedUrlData } = await supabase.storage
    .from(supabase_bucket)
    .createSignedUrl(finalPath, MAX_MEDIA_URL_EXPIRATION);

  return respond("generated", {
    storagePath: finalPath,
    signedUrl: signedUrlData?.signedUrl,
    thumbnailUrl: updatedMedia.thumbnail_url ?? normalizedResult.thumbnail ?? null,
    mimeType,
    format: extension,
    duration: updatedMedia.duration ?? toPositiveInteger(normalizedResult.duration),
    width: updatedMedia.width ?? toPositiveInteger(normalizedResult.width),
    height: updatedMedia.height ?? toPositiveInteger(normalizedResult.height),
    falStatus,
  });
}
