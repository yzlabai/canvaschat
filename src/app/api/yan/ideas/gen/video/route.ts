import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { generateText } from "ai";
import { gateway } from "@/lib/gateway";
import { resolveModelForSlot } from "@/services/ai-models";
import {
	CreditsAmount,
	CreditsTransType,
	decreaseCredits,
	getUserCredits,
	increaseCredits,
} from "@/services/credit";
import { refreshVideoGenerationForMedia, startVideoGenerationForNode } from "@/services/fal";

const STYLE_PROMPTS: Record<string, string> = {
	cinematic: "Cinematic lighting with dramatic composition and realistic textures",
	watercolor: "Rendered as a delicate watercolor painting with soft brush strokes and pastel tones",
	"line-art": "Minimalist line art illustration with clean monochrome outlines and graphic styling",
	anime: "Vibrant anime aesthetic with expressive characters and bold cel shading",
	surreal: "Surreal dreamlike imagery with imaginative elements and ethereal atmosphere",
};

const DEFAULT_VIDEO_MODEL = "fal-ai/sora-2/text-to-video" as const;
const IMAGE_TO_VIDEO_MODEL = "fal-ai/sora-2/image-to-video" as const;
const ALLOWED_VIDEO_MODELS = new Set<string>([DEFAULT_VIDEO_MODEL, IMAGE_TO_VIDEO_MODEL]);

type MutableVideoInput = {
	prompt?: string;
	[key: string]: unknown;
};

const IMAGE_REFERENCE_KEYS = [
	"image_url",
	"image",
	"reference_image",
	"reference_image_url",
	"init_image",
	"video_input_image",
];

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeStyleDescriptor(style?: string): string {
	if (!style) return "";
	const normalized = style.trim().toLowerCase();
	if (!normalized) return "";

	const mapped = STYLE_PROMPTS[normalized];
	if (mapped) {
		return mapped;
	}

	const humanized = normalized.replace(/[-_]+/g, " ");
	return humanized ? `Rendered in ${humanized} style` : "";
}

export async function POST(request: NextRequest) {
	const session = await auth();
	if (!session?.user?.uuid) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch (error) {
		console.error("Failed to parse request body for video generation", error);
		return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
	}

	if (!isRecord(body)) {
		return NextResponse.json({ error: "Request body must be an object" }, { status: 400 });
	}

	const {
		node_id,
		prompt,
		style,
		model,
		mode,
		input,
		reference_image_url, // optional reference image URL for image-to-video
		image_url, // optional fallback if reference_image_url is not provided
		webhook_url, // optional webhook URL for generation status callbacks
		metadata, // optional metadata object
	} = body;

	if (typeof node_id !== "string" || !node_id.trim()) {
		return NextResponse.json({ error: "node_id is required" }, { status: 400 });
	}

	const supabase = await createServerSupabaseClient();
	const { data: nodeData, error: nodeError } = await supabase
		.from("idea_nodes")
		.select("*")
		.eq("id", node_id.trim())
		.eq("user_uuid", session.user.uuid)
		.single();

	if (nodeError) {
		console.error("Error fetching idea node for video generation", nodeError);
		return NextResponse.json({ error: "Failed to fetch idea node" }, { status: 500 });
	}

	if (!nodeData) {
		return NextResponse.json({ error: "Idea node not found" }, { status: 404 });
	}

	const { data: pendingMedia, error: pendingError } = await supabase
		.from("idea_node_media")
		.select("id, generation_status, media_type")
		.eq("node_id", node_id.trim())
		.eq("user_uuid", session.user.uuid)
		.eq("status", "shown")
		.in("generation_status", ["queued", "generating"])
		.limit(1);

	if (pendingError) {
		console.error("Error checking pending media before video generation", pendingError);
		return NextResponse.json({ error: "Failed to validate media status" }, { status: 500 });
	}
    console.log("Pending media check result:", pendingMedia);

	if (pendingMedia && pendingMedia.length > 0) {
		return NextResponse.json(
			{ error: "Finish the current media generation before starting a new one." },
			{ status: 409 }
		);
	}

	const videoCost = CreditsAmount.VideoGenerationCost;
	const userCredits = await getUserCredits(session.user.uuid);
	if ((userCredits.left_credits || 0) < videoCost) {
		return NextResponse.json(
			{
				error: `Insufficient credits. Need ${videoCost} credits for video generation.`,
			},
			{ status: 400 }
		);
	}

	const requestedModel = typeof model === "string" ? model.trim() : "";
	if (requestedModel && !ALLOWED_VIDEO_MODELS.has(requestedModel)) {
		return NextResponse.json(
			{ error: `Unsupported video model: ${requestedModel}` },
			{ status: 400 }
		);
	}

	const normalizedMode = typeof mode === "string" ? mode.trim().toLowerCase() : "";

	let videoModel: typeof DEFAULT_VIDEO_MODEL | typeof IMAGE_TO_VIDEO_MODEL =
		normalizedMode === "image-to-video" ? IMAGE_TO_VIDEO_MODEL : DEFAULT_VIDEO_MODEL;

	if (requestedModel) {
		videoModel = requestedModel as typeof videoModel;
	}

	const usingImageToVideo = videoModel === IMAGE_TO_VIDEO_MODEL;

	const normalizedInput: MutableVideoInput = isRecord(input) ? { ...input } : {};

	if (typeof prompt === "string" && prompt.trim()) {
		normalizedInput.prompt = prompt.trim();
	}

	const normalizedReference =
		typeof reference_image_url === "string" && reference_image_url.trim()
			? reference_image_url.trim()
			: typeof image_url === "string" && image_url.trim()
				? image_url.trim()
				: "";

	if (normalizedReference) {
		normalizedInput.image_url = normalizedReference;
		normalizedInput.reference_image = normalizedReference;
		normalizedInput.reference_image_url = normalizedReference;
	}

	const styleDescriptor = typeof style === "string" ? normalizeStyleDescriptor(style) : "";

	if (!usingImageToVideo) {
		let videoPrompt =
			typeof normalizedInput.prompt === "string" && normalizedInput.prompt.trim()
				? normalizedInput.prompt.trim()
				: "";

		if (!videoPrompt) {
			const fastModel = await resolveModelForSlot("default_fast");
			const promptResult = await generateText({
				model: gateway(fastModel.name),
				prompt: `Generate a richly detailed cinematic video prompt inspired by the following idea content. The prompt should be suitable for an AI video generation model and describe the scene, lighting, mood, and key elements. Provide only the prompt text.
Idea Content: ${nodeData.content || nodeData.title}`,
			});
			videoPrompt = promptResult.text?.trim() ?? "";
		}

		if (!videoPrompt) {
			videoPrompt = nodeData.content || nodeData.title || "Cinematic visualization of the idea";
		}

		if (styleDescriptor) {
			const sanitizedPrompt = videoPrompt.replace(/\s+/g, " ").trim();
			const promptEndsWithPeriod = /[.!?]$/.test(sanitizedPrompt);
			videoPrompt = `${sanitizedPrompt}${promptEndsWithPeriod ? "" : "."} ${styleDescriptor}.`;
		}

		normalizedInput.prompt = videoPrompt;
	} else if (
		styleDescriptor &&
		typeof normalizedInput.prompt === "string" &&
		normalizedInput.prompt.trim()
	) {
		const sanitizedPrompt = normalizedInput.prompt.replace(/\s+/g, " ").trim();
		const promptEndsWithPeriod = /[.!?]$/.test(sanitizedPrompt);
		normalizedInput.prompt = `${sanitizedPrompt}${promptEndsWithPeriod ? "" : "."} ${styleDescriptor}.`;
	}

	if (!usingImageToVideo) {
		if (typeof normalizedInput.prompt !== "string" || !normalizedInput.prompt.trim()) {
			return NextResponse.json({ error: "Prompt is required for text-to-video generation" }, { status: 400 });
		}
	} else {
		const hasReferenceImage = IMAGE_REFERENCE_KEYS.some((key) => {
			const value = normalizedInput[key];
			return typeof value === "string" && value.trim().length > 0;
		});

		if (!hasReferenceImage) {
			return NextResponse.json(
				{
					error: "reference_image_url (or image_url) is required for image-to-video generation",
				},
				{ status: 400 }
			);
		}
	}

	const webhookUrl = typeof webhook_url === "string" && webhook_url.trim() ? webhook_url.trim() : undefined;
	const serviceMetadata: Record<string, unknown> = {
		mode: usingImageToVideo ? "image-to-video" : "text-to-video",
		billing: {
			credits: videoCost,
			debitedAt: new Date().toISOString(),
			refunded: false,
		},
	};

	if (isRecord(metadata)) {
		serviceMetadata.client = metadata;
	}

	await decreaseCredits({
		user_uuid: session.user.uuid,
		trans_type: CreditsTransType.VideoGeneration,
		credits: videoCost,
	});
	console.log(`Deducted ${videoCost} credits from user ${session.user.uuid} for video generation`);

	try {
		const startResult = await startVideoGenerationForNode(
			session.user.uuid,
			videoModel,
			normalizedInput,
			nodeData,
			{
				webhookUrl,
				metadata: serviceMetadata,
			}
		);

		return NextResponse.json({
			status: startResult.status,
			request_id: startResult.requestId,
			media_id: startResult.mediaId,
			storage_path: startResult.storagePath,
			poll_url: `/api/yan/ideas/gen/video?media_id=${startResult.mediaId}`,
			message: "Video generation queued",
		});
	} catch (error) {
		console.error("Error generating video:", error);

		try {
			await increaseCredits({
				user_uuid: session.user.uuid,
				trans_type: CreditsTransType.SystemAdd,
				credits: videoCost,
			});
			console.log(`Refunded ${videoCost} credits to user ${session.user.uuid} due to video generation failure`);
		} catch (refundError) {
			console.error("Failed to refund credits after video generation error", refundError);
		}

		return NextResponse.json({ error: "Failed to queue video generation" }, { status: 500 });
	}
}

export async function GET(request: NextRequest) {
	const session = await auth();
	if (!session?.user?.uuid) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const mediaId = searchParams.get("media_id")?.trim();

	if (!mediaId) {
		return NextResponse.json({ error: "media_id is required" }, { status: 400 });
	}

	try {
		const result = await refreshVideoGenerationForMedia(mediaId, session.user.uuid);
		let refunded = false;
		let metadata = result.metadata;

		if (result.status === "failed") {
			const supabase = await createServerSupabaseClient();
			const metadataRecord = isRecord(metadata) ? metadata : {};
			const userMeta = isRecord(metadataRecord.userMetadata)
				? { ...metadataRecord.userMetadata }
				: {};
			const billingMeta = isRecord(userMeta.billing) ? { ...userMeta.billing } : {};
			const alreadyRefunded = Boolean(billingMeta["refunded"]);

			if (!alreadyRefunded) {
				await increaseCredits({
					user_uuid: session.user.uuid,
					trans_type: CreditsTransType.SystemAdd,
					credits: CreditsAmount.VideoGenerationCost,
				});
				refunded = true;
				billingMeta["refunded"] = true;
				billingMeta["refundedAt"] = new Date().toISOString();
				userMeta["billing"] = billingMeta;
				metadataRecord.userMetadata = userMeta;
				metadata = metadataRecord;

				await supabase
					.from("idea_node_media")
					.update({
						metadata: JSON.stringify(metadataRecord),
						updated_at: new Date().toISOString(),
					})
					.eq("id", mediaId)
					.eq("user_uuid", session.user.uuid);
			}
		}

		return NextResponse.json({
			status: result.status,
			media_id: result.mediaId,
			request_id: result.requestId,
			storage_path: result.storagePath,
			signed_url: result.signedUrl,
			thumbnail: result.thumbnailUrl,
			mime_type: result.mimeType,
			format: result.format,
			duration: result.duration,
			width: result.width,
			height: result.height,
			error: result.errorMessage,
			metadata,
			fal_status: result.falStatus,
			refunded,
		});
	} catch (error) {
		console.error("Error refreshing video generation:", error);
		return NextResponse.json({ error: "Failed to refresh video generation" }, { status: 500 });
	}
}
