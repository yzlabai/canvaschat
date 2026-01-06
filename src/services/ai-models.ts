import { db } from "@/db";
import { aiModelConfigs } from "@/db/schema";
import { MODEL_SLOT_DEFAULTS, MODEL_SLOT_KEYS, type ModelSlotKey, type AI_MODEL } from "@/lib/aimodels";
import { eq, InferSelectModel } from "drizzle-orm";

type AiModelConfigRow = InferSelectModel<typeof aiModelConfigs>;

type ResolvedModelSource = "config" | "default";

export interface ResolvedAIModel extends AI_MODEL {
  slot: ModelSlotKey;
  label: string;
  metadata: Record<string, unknown> | null;
  source: ResolvedModelSource;
  configId?: number;
}

const CACHE_TTL_MS = 60_000;

const modelCache = new Map<ModelSlotKey, { expiresAt: number; value: ResolvedAIModel }>();

export async function resolveModelForSlot(
  slot: ModelSlotKey,
  options?: { revalidate?: boolean }
): Promise<ResolvedAIModel> {
  const now = Date.now();

  if (!options?.revalidate) {
    const cached = modelCache.get(slot);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }
  }

  const resolved = await loadModelForSlot(slot);
  modelCache.set(slot, { value: resolved, expiresAt: now + CACHE_TTL_MS });
  return resolved;
}

export async function getModelNameForSlot(
  slot: ModelSlotKey,
  options?: { revalidate?: boolean }
): Promise<string> {
  const model = await resolveModelForSlot(slot, options);
  return model.name;
}

export function invalidateModelCache(slot?: ModelSlotKey) {
  if (slot) {
    modelCache.delete(slot);
    return;
  }

  modelCache.clear();
}

export function isModelSlotKey(value: string): value is ModelSlotKey {
  return MODEL_SLOT_KEYS.includes(value as ModelSlotKey);
}

async function loadModelForSlot(slot: ModelSlotKey): Promise<ResolvedAIModel> {
  const fallback = MODEL_SLOT_DEFAULTS[slot];

  try {
    const database = db();
    const [row] = await database
      .select()
      .from(aiModelConfigs)
      .where(eq(aiModelConfigs.slot, slot))
      .limit(1);

    if (!row) {
      return toResolvedModel(fallback, slot, "default");
    }

    if (row.is_active === false) {
      return toResolvedModel(fallback, slot, "default");
    }

    return toResolvedModel(rowToModel(row, fallback), slot, "config", {
      configId: row.id,
      label: row.label ?? row.identifier ?? fallback.name,
      metadata: parseMetadata(row.metadata),
    });
  } catch (error) {
    console.error("Failed to resolve AI model from database", { slot, error });
    return toResolvedModel(fallback, slot, "default");
  }
}

function rowToModel(row: AiModelConfigRow, fallback: AI_MODEL): AI_MODEL {
  const abilities = parseStringArray(row.abilities);

  return {
    name: row.identifier || fallback.name,
    model: row.model || fallback.model,
    provider: row.provider || fallback.provider,
    abilities: abilities.length > 0 ? abilities : fallback.abilities,
    description: row.description ?? fallback.description,
  };
}

function toResolvedModel(
  model: AI_MODEL,
  slot: ModelSlotKey,
  source: ResolvedModelSource,
  extras?: {
    configId?: number;
    label?: string;
    metadata?: Record<string, unknown> | null;
  }
): ResolvedAIModel {
  return {
    ...model,
    slot,
    source,
    configId: extras?.configId,
    label: extras?.label ?? model.name,
    metadata: extras?.metadata ?? null,
  };
}

function parseStringArray(value: string | null): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
  } catch (error) {
    // Ignore JSON parse error and fall back to comma-separated parsing
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is string => item.length > 0);
}

function parseMetadata(value: string | null): Record<string, unknown> | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
  } catch (error) {
    console.error("Failed to parse AI model metadata", error);
  }

  return null;
}

export function getFallbackModel(slot: ModelSlotKey): ResolvedAIModel {
  return toResolvedModel({ ...MODEL_SLOT_DEFAULTS[slot] }, slot, "default");
}
