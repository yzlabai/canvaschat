import type { AIModelConfigRecord } from "@/services/admin";

export function serializeAIModelConfig(config: AIModelConfigRecord) {
  return {
    id: config.id,
    slot: config.slot,
    identifier: config.identifier,
    model: config.model,
    provider: config.provider,
    label: config.label,
    description: config.description,
    abilities: config.abilities,
    is_active: config.is_active,
    priority: config.priority,
    metadata: config.metadata,
    created_at: config.created_at ? config.created_at.toISOString() : null,
    updated_at: config.updated_at ? config.updated_at.toISOString() : null,
  };
}
