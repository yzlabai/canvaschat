import type { SupportedAIModelRecord } from "@/services/admin";

export function serializeSupportedModel(model: SupportedAIModelRecord) {
  return {
    id: model.id,
    name: model.name,
    model: model.model,
    provider: model.provider,
    abilities: model.abilities,
    description: model.description,
    is_active: model.is_active,
    metadata: model.metadata,
    created_at: model.created_at ? model.created_at.toISOString() : null,
    updated_at: model.updated_at ? model.updated_at.toISOString() : null,
  };
}
