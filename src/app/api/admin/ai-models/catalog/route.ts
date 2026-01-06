import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-middleware";
import {
  createSupportedAIModel,
  listSupportedAIModels,
  type SupportedAIModelInput,
} from "@/services/admin";
import { serializeSupportedModel } from "./serializer";

const createSchema = z.object({
  name: z.string().min(1),
  model: z.string().min(1),
  provider: z.string().min(1),
  abilities: z.array(z.string()).optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.any()).nullable().optional(),
});

export const GET = requireAdmin(async function () {
  try {
  const models = await listSupportedAIModels();
  return NextResponse.json({ data: models.map(serializeSupportedModel) });
  } catch (error) {
    console.error("Failed to fetch supported AI models", error);
    return NextResponse.json(
      { error: "Failed to fetch supported AI models" },
      { status: 500 }
    );
  }
});

export const POST = requireAdmin(async function (request: NextRequest) {
  try {
    const body = await request.json();
    const payload = createSchema.parse(body);

    const normalized: SupportedAIModelInput = {
      name: payload.name,
      model: payload.model,
      provider: payload.provider,
      abilities: payload.abilities,
      description: payload.description ?? null,
      isActive: payload.is_active,
      metadata: payload.metadata ?? null,
    };

  const created = await createSupportedAIModel(normalized);
  return NextResponse.json({ data: serializeSupportedModel(created) }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request payload", issues: error.format() },
        { status: 400 }
      );
    }

    console.error("Failed to create supported AI model", error);
    return NextResponse.json(
      { error: "Failed to create supported AI model" },
      { status: 500 }
    );
  }
});

