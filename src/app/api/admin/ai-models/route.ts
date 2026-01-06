import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-middleware";
import {
  createAIModelConfigEntry,
  listAIModelConfigs,
  type AIModelConfigInput,
} from "@/services/admin";
import { serializeAIModelConfig } from "./serializer";

const aiModelConfigSchema = z.object({
  slot: z.string().min(1),
  identifier: z.string().min(1),
  model: z.string().min(1),
  provider: z.string().min(1),
  label: z.string().max(255).nullable().optional(),
  description: z.string().nullable().optional(),
  abilities: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
  priority: z.number().int().nullable().optional(),
  metadata: z.record(z.any()).nullable().optional(),
});

export const GET = requireAdmin(async function () {
  try {
    const configs = await listAIModelConfigs();
    return NextResponse.json({ data: configs.map(serializeAIModelConfig) });
  } catch (error) {
    console.error("Failed to fetch AI model configs", error);
    return NextResponse.json(
      { error: "Failed to fetch AI model configurations" },
      { status: 500 }
    );
  }
});

export const POST = requireAdmin(async function (request: NextRequest) {
  try {
    const body = await request.json();
    const payload = aiModelConfigSchema.parse(body);

    const normalized: AIModelConfigInput = {
      slot: payload.slot,
      identifier: payload.identifier,
      model: payload.model,
      provider: payload.provider,
      label: payload.label ?? null,
      description: payload.description ?? null,
      abilities: payload.abilities,
      isActive: payload.is_active,
      priority: payload.priority ?? undefined,
      metadata: payload.metadata ?? null,
    };

  const created = await createAIModelConfigEntry(normalized);
  return NextResponse.json({ data: serializeAIModelConfig(created) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request payload", issues: error.format() },
        { status: 400 }
      );
    }

    console.error("Failed to create AI model config", error);
    return NextResponse.json(
      { error: "Failed to create AI model configuration" },
      { status: 500 }
    );
  }
});
