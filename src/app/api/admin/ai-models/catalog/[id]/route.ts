import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-middleware";
import {
  deleteSupportedAIModel,
  updateSupportedAIModel,
  type UpdateSupportedAIModelInput,
} from "@/services/admin";
import { serializeSupportedModel } from "../serializer";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  provider: z.string().min(1).optional(),
  abilities: z.array(z.string()).optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.any()).nullable().optional(),
});

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const PUT = requireAdmin(async function (
  request: NextRequest,
  context: RouteContext
) {
  const params = await context.params;
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json(
      { error: "Invalid model ID" },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const payload = updateSchema.parse(body);

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: "No fields provided for update" },
        { status: 400 }
      );
    }

    const normalized: UpdateSupportedAIModelInput = {};
    if (payload.name !== undefined) normalized.name = payload.name;
    if (payload.model !== undefined) normalized.model = payload.model;
    if (payload.provider !== undefined) normalized.provider = payload.provider;
    if (payload.abilities !== undefined) normalized.abilities = payload.abilities;
    if (payload.description !== undefined) normalized.description = payload.description;
    if (payload.is_active !== undefined) normalized.isActive = payload.is_active;
    if (payload.metadata !== undefined) normalized.metadata = payload.metadata;

    const updated = await updateSupportedAIModel(id, normalized);

    if (!updated) {
      return NextResponse.json(
        { error: "AI model not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: serializeSupportedModel(updated) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request payload", issues: error.format() },
        { status: 400 }
      );
    }

  console.error(`Failed to update supported AI model ${params.id}`, error);
    return NextResponse.json(
      { error: "Failed to update supported AI model" },
      { status: 500 }
    );
  }
});

export const DELETE = requireAdmin(async function (
  _request: NextRequest,
  context: RouteContext
) {
  const params = await context.params;
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json(
      { error: "Invalid model ID" },
      { status: 400 }
    );
  }

  try {
    const deleted = await deleteSupportedAIModel(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "AI model not found" },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Failed to delete supported AI model ${params.id}`, error);
    return NextResponse.json(
      { error: "Failed to delete supported AI model" },
      { status: 500 }
    );
  }
});
