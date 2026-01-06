import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { generateText } from "ai";
import { gateway } from "@/lib/gateway";
import { generateImageForNode } from "@/services/fal";
import { resolveModelForSlot } from "@/services/ai-models";
import {
  getUserCredits,
  decreaseCredits,
  increaseCredits,
  CreditsTransType,
  CreditsAmount,
} from "@/services/credit";

const STYLE_PROMPTS: Record<string, string> = {
  cinematic:
    "Cinematic lighting with dramatic composition and realistic textures",
  watercolor:
    "Rendered as a delicate watercolor painting with soft brush strokes and pastel tones",
  "line-art":
    "Minimalist line art illustration with clean monochrome outlines and graphic styling",
  anime:
    "Vibrant anime illustration with expressive characters and bold cel shading",
  surreal:
    "Surreal dreamlike imagery with imaginative elements and ethereal atmosphere",
};

// POST /api/yan/ideas/gen/image - Generate an image for a node
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.uuid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json();
  const { node_id, prompt, style } = body ?? {};

  // Validate request data
  if (!node_id) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  if (prompt && typeof prompt !== "string") {
    return NextResponse.json(
      { error: "Prompt must be a string if provided" },
      { status: 400 }
    );
  }

  if (style && typeof style !== "string") {
    return NextResponse.json(
      { error: "Style must be a string if provided" },
      { status: 400 }
    );
  }

  // Define image generation cost
  const imageCost = CreditsAmount.ImageGenerationCost;
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("idea_nodes")
    .select("*")
    .eq("id", node_id)
    .eq("user_uuid", session.user.uuid)
    .single();

  if (error) {
    console.error("Error fetching idea node:", error);
    return NextResponse.json(
      { error: "Failed to fetch idea node" },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ error: "Idea node not found" }, { status: 404 });
  }

  const { data: pendingMedia, error: pendingError } = await supabase
    .from("idea_node_media")
    .select("id, generation_status, media_type")
    .eq("node_id", node_id)
    .eq("user_uuid", session.user.uuid)
    .eq("status", "shown")
    .in("generation_status", ["queued", "generating"])
    .limit(1);

  if (pendingError) {
    console.error("Error checking pending media before image generation", pendingError);
    return NextResponse.json({ error: "Failed to validate media status" }, { status: 500 });
  }

  if (pendingMedia && pendingMedia.length > 0) {
    return NextResponse.json(
      { error: "Finish the current media generation before starting a new one." },
      { status: 409 }
    );
  }

  // Check user credits before generating new image
  const userCredits = await getUserCredits(session.user.uuid);
  if ((userCredits.left_credits || 0) < imageCost) {
    return NextResponse.json(
      { error: `Insufficient credits. Need ${imageCost} credits for image generation.` },
      { status: 400 }
    );
  }

  // Deduct credits before generation
  await decreaseCredits({
    user_uuid: session.user.uuid,
    trans_type: CreditsTransType.ImageGeneration,
    credits: imageCost,
  });
  console.log(`Deducted ${imageCost} credits from user ${session.user.uuid} for image generation`);
  // Options for image generation, according to fal service
  const options = {
    // image_size: "landscape_4_3", no applicable for nano banana
    num_images: 1,
  }
  const normalizedPrompt = typeof prompt === "string" ? prompt.trim() : "";
  const normalizedStyle = typeof style === "string" ? style.trim().toLowerCase() : "";
  const styleDescriptor =
    normalizedStyle && STYLE_PROMPTS[normalizedStyle]
      ? STYLE_PROMPTS[normalizedStyle]
      : "";
  const humanizedStyle = normalizedStyle
    ? normalizedStyle.replace(/[-_]+/g, " ")
    : "";
  const resolvedStyleDescriptor =
    styleDescriptor || (humanizedStyle ? `Rendered in ${humanizedStyle} style` : "");

  let imagePrompt = normalizedPrompt;

  if (!imagePrompt) {
    const fastModel = await resolveModelForSlot("default_fast");
    const promptResult = await generateText({
      model: gateway(fastModel.name),
      prompt: `Generate a detailed image description based on the following idea content. The description should be vivid and suitable for AI image generation models. Only provide the simply and clear description without any additional text.
Idea Content: ${data.content || data.title}`,
    });
    imagePrompt = promptResult.text?.trim();
  }

  if (!imagePrompt) {
    imagePrompt = data.content || data.title || "Illustrative scene";
  }
  if (resolvedStyleDescriptor) {
    const sanitizedPrompt = imagePrompt.replace(/\s+/g, " ").trim();
    const promptEndsWithPeriod = /[\.\!?]$/.test(sanitizedPrompt);
    imagePrompt = `${sanitizedPrompt}${promptEndsWithPeriod ? "" : "."} ${resolvedStyleDescriptor}.`;
  }
  try {
    const imageModel = await resolveModelForSlot("text_image");
    // Call the service to generate the image (now handles all database operations)
    const result = await generateImageForNode(
      session.user.uuid,
      imageModel.name,
      imagePrompt,
      data,
      options,
    );
    
    return NextResponse.json({ 
      image: result.publicUrl, 
      storage_path: result.url,
      data: result.data,
      media_id: result.mediaId,
      message: "Image generated and saved successfully"
    });
  } catch (error) {
    console.error("Error generating image:", error);
    
    // Refund credits if image generation failed
    try {
      await increaseCredits({
        user_uuid: session.user.uuid,
        trans_type: "system_add", // Use system_add for refunds
        credits: imageCost,
      });
      console.log(`Refunded ${imageCost} credits to user ${session.user.uuid} due to image generation failure`);
    } catch (refundError) {
      console.error("Failed to refund credits:", refundError);
      // Log but don't fail the response - user should contact support
    }
    
    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
