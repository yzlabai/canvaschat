import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin-middleware";
import {
  deleteAIModelConfigEntry,
  updateAIModelConfigEntry,
  type UpdateAIModelConfigInput,
} from "@/services/admin";
import { serializeAIModelConfig } from "../serializer";

const updateSchema = z.object({
  slot: z.string().min(1).optional(),
  identifier: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  provider: z.string().min(1).optional(),
  label: z.string().max(255).nullable().optional(),
  description: z.string().nullable().optional(),
  abilities: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
  priority: z.number().int().nullable().optional(),
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
      { error: "Invalid configuration ID" },
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

    const normalized: UpdateAIModelConfigInput = {};

    if (payload.slot !== undefined) normalized.slot = payload.slot;
    if (payload.identifier !== undefined)
      normalized.identifier = payload.identifier;
    if (payload.model !== undefined) normalized.model = payload.model;
    if (payload.provider !== undefined) normalized.provider = payload.provider;
    if (payload.label !== undefined) normalized.label = payload.label;
    if (payload.description !== undefined)
      normalized.description = payload.description;
    if (payload.abilities !== undefined) normalized.abilities = payload.abilities;
    if (payload.is_active !== undefined)
      normalized.isActive = payload.is_active;
    if (payload.priority !== undefined) normalized.priority = payload.priority;
    if (payload.metadata !== undefined) normalized.metadata = payload.metadata;

    const updated = await updateAIModelConfigEntry(id, normalized);

    if (!updated) {
      return NextResponse.json(
        { error: "AI model configuration not found" },
        { status: 404 }
      );
    }

  return NextResponse.json({ data: serializeAIModelConfig(updated) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request payload", issues: error.format() },
        { status: 400 }
      );
    }

  console.error(`Failed to update AI model config ${params.id}`, error);
    return NextResponse.json(
      { error: "Failed to update AI model configuration" },
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
      { error: "Invalid configuration ID" },
      { status: 400 }
    );
  }

  try {
    const deleted = await deleteAIModelConfigEntry(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "AI model configuration not found" },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`Failed to delete AI model config ${params.id}`, error);
    return NextResponse.json(
      { error: "Failed to delete AI model configuration" },
      { status: 500 }
    );
  }
});
