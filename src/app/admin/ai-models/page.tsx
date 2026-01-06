"use client";

import type { KeyboardEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, RefreshCw, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

import {
  fetchAIModelConfigs,
  createAIModelConfig,
  updateAIModelConfig,
  fetchSupportedAIModels,
  createSupportedAIModel,
  updateSupportedAIModel,
  deleteSupportedAIModel,
  type AIModelConfig,
  type SupportedAIModel,
  type SaveAIModelConfigPayload,
  type SaveSupportedAIModelPayload,
} from "@/services/admin-client";
import {
  DEFAULT_AGENT_MODEL,
  DEFAULT_FAST_MODEL,
  DEFAULT_IMAGE_EDIT_MODEL,
  DEFAULT_IMAGE_TO_VIDEO_MODEL,
  DEFAULT_MODEL,
  DEFAULT_SEARCH_AGENT_MODEL,
  DEFAULT_SEARCH_MODEL,
  DEFAULT_TEXT_IMAGE_MODEL,
  DEFAULT_TEXT_TO_VIDEO_MODEL,
  type AI_MODEL,
} from "@/lib/aimodels";
import { cn } from "@/lib/utils";

const PRESET_MODELS: AI_MODEL[] = [
  DEFAULT_MODEL,
  DEFAULT_FAST_MODEL,
  DEFAULT_AGENT_MODEL,
  DEFAULT_SEARCH_MODEL,
  DEFAULT_SEARCH_AGENT_MODEL,
  DEFAULT_TEXT_IMAGE_MODEL,
  DEFAULT_TEXT_TO_VIDEO_MODEL,
  DEFAULT_IMAGE_EDIT_MODEL,
  DEFAULT_IMAGE_TO_VIDEO_MODEL,
];

type ModelSlotKey =
  | "default"
  | "default_fast"
  | "default_agent"
  | "default_search"
  | "default_search_agent"
  | "text_image"
  | "text_to_video"
  | "image_edit"
  | "image_to_video";

type SlotConfig = {
  key: ModelSlotKey;
  title: string;
  description: string;
  ability: string;
  defaultModel: AI_MODEL;
  helper?: string;
};

const MODEL_SLOTS: SlotConfig[] = [
  {
    key: "default",
    title: "Default Chat Model",
    description: "Primary conversational model used across the application.",
    ability: "chat",
    defaultModel: DEFAULT_MODEL,
    helper: "Used for most user requests and general chat operations.",
  },
  {
    key: "default_fast",
    title: "Fast Chat Model",
    description: "Low-latency model for quick responses and lightweight tasks.",
    ability: "chat",
    defaultModel: DEFAULT_FAST_MODEL,
    helper: "Great for quick follow-ups where speed matters more than reasoning depth.",
  },
  {
    key: "default_agent",
    title: "Agent Model",
    description: "Advanced model used by agent workflows that may require tool usage.",
    ability: "chat",
    defaultModel: DEFAULT_AGENT_MODEL,
  },
  {
    key: "default_search",
    title: "Search Model",
    description: "Retrieval-focused model for real-time information lookup.",
    ability: "search",
    defaultModel: DEFAULT_SEARCH_MODEL,
  },
  {
    key: "default_search_agent",
    title: "Search Agent Model",
    description: "Reasoning-enhanced search agent for complex research tasks.",
    ability: "search",
    defaultModel: DEFAULT_SEARCH_AGENT_MODEL,
  },
  {
    key: "text_image",
    title: "Text to Image Model",
    description: "Generates images from textual prompts.",
    ability: "text-to-image",
    defaultModel: DEFAULT_TEXT_IMAGE_MODEL,
  },
  {
    key: "text_to_video",
    title: "Text to Video Model",
    description: "Produces short videos from textual descriptions.",
    ability: "text-to-video",
    defaultModel: DEFAULT_TEXT_TO_VIDEO_MODEL,
  },
  {
    key: "image_edit",
    title: "Image Edit Model",
    description: "Allows editing and transformation of existing images.",
    ability: "image-edit",
    defaultModel: DEFAULT_IMAGE_EDIT_MODEL,
  },
  {
    key: "image_to_video",
    title: "Image to Video Model",
    description: "Animates still images into motion sequences.",
    ability: "image-to-video",
    defaultModel: DEFAULT_IMAGE_TO_VIDEO_MODEL,
  },
];

type SlotFormState = {
  id?: number;
  slot: ModelSlotKey;
  identifier: string;
  model: string;
  provider: string;
  label: string;
  description: string;
  abilities: string[];
  isActive: boolean;
  metadata?: Record<string, unknown> | null;
  updatedAt?: string;
};

type SlotStates = Record<ModelSlotKey, SlotFormState>;

const INITIAL_SLOT_STATES: SlotStates = MODEL_SLOTS.reduce<SlotStates>((acc, slot) => {
  const preset = slot.defaultModel;
  acc[slot.key] = {
    slot: slot.key,
    identifier: preset.name,
    model: preset.model,
    provider: preset.provider,
    label: preset.name,
    description: preset.description,
    abilities: [...preset.abilities],
    isActive: true,
    metadata: null,
  };
  return acc;
}, {} as SlotStates);

type SupportedModelFormState = {
  name: string;
  model: string;
  provider: string;
  description: string;
  abilities: string[];
  isActive: boolean;
  metadata: string;
};

const EMPTY_MODEL_FORM: SupportedModelFormState = {
  name: "",
  model: "",
  provider: "",
  description: "",
  abilities: [],
  isActive: true,
  metadata: "",
};

export default function AdminAIModelsPage() {
  const [slots, setSlots] = useState<SlotStates>(INITIAL_SLOT_STATES);
  const [loading, setLoading] = useState(true);
  const [savingSlot, setSavingSlot] = useState<ModelSlotKey | null>(null);
  const [supportedModels, setSupportedModels] = useState<SupportedAIModel[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<SupportedAIModel | null>(null);
  const [modelForm, setModelForm] = useState<SupportedModelFormState>(EMPTY_MODEL_FORM);
  const [abilityInput, setAbilityInput] = useState("");
  const [savingModel, setSavingModel] = useState(false);
  const [modelToDelete, setModelToDelete] = useState<SupportedAIModel | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const allModels = useMemo(() => {
    const normalizedFromCatalog = supportedModels
      .filter((model) => model.is_active)
      .map<AI_MODEL>((model) => ({
      name: model.name,
      model: model.model,
      provider: model.provider,
      abilities: Array.isArray(model.abilities) ? model.abilities : [],
      description: model.description ?? "",
      }));

    return dedupeModels([...normalizedFromCatalog, ...PRESET_MODELS]);
  }, [supportedModels]);

  const availableModelsByAbility = useMemo(() => {
    return MODEL_SLOTS.reduce<Record<ModelSlotKey, AI_MODEL[]>>((acc, slot) => {
      acc[slot.key] = allModels.filter((model) => model.abilities.includes(slot.ability));
      return acc;
    }, {} as Record<ModelSlotKey, AI_MODEL[]>);
  }, [allModels]);

  const abilitySuggestions = useMemo(() => {
    const set = new Set<string>();
    MODEL_SLOTS.forEach((slot) => set.add(slot.ability));
    supportedModels.forEach((model) => {
      model.abilities.forEach((ability) => set.add(ability));
    });
    return Array.from(set).sort();
  }, [supportedModels]);

  const catalogStats = useMemo(() => {
    const active = supportedModels.filter((model) => model.is_active).length;
    return {
      active,
      inactive: supportedModels.length - active,
    };
  }, [supportedModels]);

  const isModelFormValid = useMemo(() => {
    return (
      modelForm.name.trim().length > 0 &&
      modelForm.model.trim().length > 0 &&
      modelForm.provider.trim().length > 0
    );
  }, [modelForm.name, modelForm.model, modelForm.provider]);

  const resetModelForm = useCallback(() => {
    setModelForm(EMPTY_MODEL_FORM);
    setAbilityInput("");
  }, [createSupportedAIModel, fetchSupportedAIModels]);

  const handleModelSelect = useCallback(
    (slotKey: ModelSlotKey, identifier: string) => {
      const selected = allModels.find((model) => model.name === identifier);

      if (!selected) {
        toast.error("Selected model not found in catalog");
        return;
      }

      setSlots((prev) => ({
        ...prev,
        [slotKey]: {
          ...prev[slotKey],
          identifier: selected.name,
          model: selected.model,
          provider: selected.provider,
          label: selected.name,
          description: selected.description,
          abilities: [...selected.abilities],
        },
      }));
    },
    [allModels]
  );

  const handleResetSlot = useCallback((slotKey: ModelSlotKey) => {
    const slot = MODEL_SLOTS.find((item) => item.key === slotKey);
    if (!slot) return;

    const preset = slot.defaultModel;
    setSlots((prev) => ({
      ...prev,
      [slotKey]: {
        slot: slotKey,
        identifier: preset.name,
        model: preset.model,
        provider: preset.provider,
        label: preset.name,
        description: preset.description,
        abilities: [...preset.abilities],
        isActive: true,
        metadata: null,
      },
    }));
  }, []);

  const handleSaveSlot = useCallback(
    async (slotKey: ModelSlotKey) => {
      const slotState = slots[slotKey];
      if (!slotState) return;

      const payload: SaveAIModelConfigPayload = {
        slot: slotState.slot,
        identifier: slotState.identifier,
        model: slotState.model,
        provider: slotState.provider,
        label: slotState.label,
        description: slotState.description,
        abilities: slotState.abilities,
        is_active: slotState.isActive,
        metadata: slotState.metadata ?? null,
      };

      setSavingSlot(slotKey);
      try {
        const saved = slotState.id
          ? await updateAIModelConfig(slotState.id, payload)
          : await createAIModelConfig(payload);

        setSlots((prev) => ({
          ...prev,
          [slotKey]: {
            ...prev[slotKey],
            id: saved.id,
            identifier: saved.identifier,
            model: saved.model,
            provider: saved.provider,
            label: saved.label ?? saved.identifier,
            description: saved.description ?? prev[slotKey].description,
            abilities: saved.abilities ?? prev[slotKey].abilities,
            isActive: saved.is_active ?? prev[slotKey].isActive,
            metadata: saved.metadata ?? prev[slotKey].metadata ?? null,
            updatedAt: saved.updated_at ?? new Date().toISOString(),
          },
        }));

        toast.success(`${MODEL_SLOT_TITLES[slotKey]} updated`);
      } catch (error) {
        console.error("Failed to save AI model configuration", error);
        toast.error("Failed to save model configuration");
      } finally {
        setSavingSlot(null);
      }
    },
    [slots, createAIModelConfig, updateAIModelConfig]
  );

  const openCreateModelDialog = () => {
    setEditingModel(null);
    resetModelForm();
    setIsModelDialogOpen(true);
  };

  const openEditModelDialog = (model: SupportedAIModel) => {
    setEditingModel(model);
    setModelForm({
      name: model.name,
      model: model.model,
      provider: model.provider,
      description: model.description ?? "",
      abilities: Array.isArray(model.abilities)
        ? model.abilities.map((ability) => ability.trim())
        : [],
      isActive: model.is_active,
      metadata: model.metadata ? JSON.stringify(model.metadata, null, 2) : "",
    });
    setAbilityInput("");
    setIsModelDialogOpen(true);
  };

  const closeModelDialog = () => {
    setIsModelDialogOpen(false);
    setEditingModel(null);
    resetModelForm();
  };

  const updateModelForm = <K extends keyof SupportedModelFormState>(
    field: K,
    value: SupportedModelFormState[K]
  ) => {
    setModelForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const commitAbilityInput = useCallback(() => {
    const normalized = abilityInput.trim().toLowerCase();
    if (!normalized) return;

    setModelForm((prev) => {
      if (prev.abilities.includes(normalized)) {
        return prev;
      }
      return {
        ...prev,
        abilities: [...prev.abilities, normalized],
      };
    });
    setAbilityInput("");
  }, [abilityInput]);

  const handleAbilityKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commitAbilityInput();
    }
  };

  const removeAbility = (ability: string) => {
    setModelForm((prev) => ({
      ...prev,
      abilities: prev.abilities.filter((item) => item !== ability),
    }));
  };

  const ensurePresetModelsInCatalog = useCallback(async (existing: SupportedAIModel[]) => {
    const nameSet = new Set(existing.map((item) => item.name));
    const missingPresets = PRESET_MODELS.filter((preset) => !nameSet.has(preset.name));

    if (missingPresets.length === 0) {
      return existing;
    }

    for (const preset of missingPresets) {
      try {
        await createSupportedAIModel({
          name: preset.name,
          model: preset.model,
          provider: preset.provider,
          description: preset.description,
          abilities: preset.abilities,
          is_active: true,
        });
      } catch (error) {
        console.error(`Failed to seed supported model ${preset.name}`, error);
      }
    }

    try {
      const refreshed = await fetchSupportedAIModels();
      return [...refreshed].sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error("Failed to refresh supported AI models after seeding", error);
      return existing;
    }
  }, []);

  const handleConfirmDelete = async () => {
    if (!modelToDelete) return;

    setDeleteLoading(true);
    try {
      await deleteSupportedAIModel(modelToDelete.id);
      setSupportedModels((prev) =>
        prev.filter((item) => item.id !== modelToDelete.id)
      );
      setCatalogError(null);
      toast.success(`Removed ${modelToDelete.name}`);
      setModelToDelete(null);
      await loadInitialData({ refreshOnly: true });
    } catch (error) {
      console.error("Failed to delete supported AI model", error);
      toast.error("Failed to delete supported AI model");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSubmitModelForm = async () => {
    const trimmedName = modelForm.name.trim();
    const trimmedModel = modelForm.model.trim();
    const trimmedProvider = modelForm.provider.trim();

    if (!trimmedName || !trimmedModel || !trimmedProvider) {
      toast.error("Name, model identifier, and provider are required");
      return;
    }

    let parsedMetadata: Record<string, unknown> | undefined;
    if (modelForm.metadata.trim()) {
      try {
        parsedMetadata = JSON.parse(modelForm.metadata);
      } catch (error) {
        toast.error("Metadata must be valid JSON");
        return;
      }
    }

    const payload: SaveSupportedAIModelPayload = {
      name: trimmedName,
      model: trimmedModel,
      provider: trimmedProvider,
      description: modelForm.description.trim() || undefined,
      abilities: modelForm.abilities,
      is_active: modelForm.isActive,
      metadata: parsedMetadata,
    };

    setSavingModel(true);
    try {
      let saved: SupportedAIModel;
      if (editingModel) {
        saved = await updateSupportedAIModel(editingModel.id, payload);
      } else {
        saved = await createSupportedAIModel(payload);
      }

      setSupportedModels((prev) => {
        const next = editingModel
          ? prev.map((item) => (item.id === saved.id ? saved : item))
          : [...prev, saved];
        return next.sort((a, b) => a.name.localeCompare(b.name));
      });

      setCatalogError(null);

      toast.success(
        editingModel ? "Model updated successfully" : "Model created successfully"
      );

      await loadInitialData({ refreshOnly: true });

      closeModelDialog();
    } catch (error) {
      console.error("Failed to save supported AI model", error);
      toast.error("Failed to save supported AI model");
    } finally {
      setSavingModel(false);
    }
  };

  const loadInitialData = useCallback(async (options?: { refreshOnly?: boolean }) => {
    const refreshOnly = options?.refreshOnly ?? false;

    if (!refreshOnly) {
      setLoading(true);
    }
    setCatalogLoading(true);

    const [configsResult, catalogResult] = await Promise.allSettled([
      fetchAIModelConfigs(),
      fetchSupportedAIModels(),
    ]);

    if (catalogResult.status === "fulfilled") {
      let sorted = [...catalogResult.value].sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      if (!refreshOnly) {
        sorted = await ensurePresetModelsInCatalog(sorted);
      }

      setSupportedModels(sorted);
      setCatalogError(null);
    } else {
      console.error("Failed to load supported AI models", catalogResult.reason);
      setCatalogError("Failed to load supported AI models");
      toast.error("Failed to load supported AI models");
    }

    if (configsResult.status === "fulfilled") {
      const configs = configsResult.value;
      if (configs && configs.length > 0) {
        setSlots((prev) => {
          const merged = { ...prev };
          configs.forEach((config: AIModelConfig) => {
            const slotKey = config.slot as ModelSlotKey;
            if (!merged[slotKey]) {
              return;
            }
            merged[slotKey] = {
              id: config.id,
              slot: slotKey,
              identifier: config.identifier,
              model: config.model,
              provider: config.provider,
              label: config.label ?? config.identifier,
              description:
                config.description ?? merged[slotKey]?.description ?? "",
              abilities: config.abilities ?? merged[slotKey].abilities,
              isActive: config.is_active ?? merged[slotKey].isActive,
              metadata: config.metadata ?? merged[slotKey].metadata ?? null,
              updatedAt: config.updated_at ?? undefined,
            };
          });
          return merged;
        });
      }
    } else {
      console.error("Failed to load AI model configurations", configsResult.reason);
      toast.error("Failed to load AI model configurations");
    }

    if (!refreshOnly) {
      setLoading(false);
    }
    setCatalogLoading(false);
  }, [ensurePresetModelsInCatalog]);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Model Configuration</h1>
          <p className="text-muted-foreground">
            Manage which AI models power each capability of the platform.
          </p>
        </div>
      </div>

        <Dialog open={isModelDialogOpen} onOpenChange={(open) => (!open ? closeModelDialog() : setIsModelDialogOpen(true))}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingModel ? "Edit supported model" : "Add supported model"}
              </DialogTitle>
              <DialogDescription>
                Configure the underlying provider details and abilities exposed to administrators when selecting models.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="supported-model-name">Display name</Label>
                  <Input
                    id="supported-model-name"
                    value={modelForm.name}
                    onChange={(event) => updateModelForm("name", event.target.value)}
                    placeholder="openai/gpt-5-mini"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="supported-model-provider">Provider</Label>
                  <Input
                    id="supported-model-provider"
                    value={modelForm.provider}
                    onChange={(event) => updateModelForm("provider", event.target.value)}
                    placeholder="openai"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="supported-model-id">Model identifier</Label>
                <Input
                  id="supported-model-id"
                  value={modelForm.model}
                  onChange={(event) => updateModelForm("model", event.target.value)}
                  placeholder="gpt-5-mini"
                />
                <p className="text-xs text-muted-foreground">
                  Use the provider-specific identifier used when calling the API.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="supported-model-description">Description</Label>
                <Textarea
                  id="supported-model-description"
                  value={modelForm.description}
                  onChange={(event) => updateModelForm("description", event.target.value)}
                  placeholder="Short summary of this model's strengths"
                  rows={3}
                />
              </div>

              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="supported-model-abilities">Abilities</Label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      id="supported-model-abilities"
                      value={abilityInput}
                      onChange={(event) => setAbilityInput(event.target.value)}
                      onKeyDown={handleAbilityKeyDown}
                      placeholder="chat"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={commitAbilityInput}
                      disabled={!abilityInput.trim()}
                      className="sm:w-auto"
                    >
                      Add ability
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Press Enter or comma to add abilities. Abilities determine where the model can be used.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {modelForm.abilities.length > 0 ? (
                    modelForm.abilities.map((ability) => (
                      <Badge
                        key={`ability-${ability}`}
                        variant="outline"
                        className="flex items-center gap-1 px-2 py-1 text-xs capitalize"
                      >
                        {ability}
                        <button
                          type="button"
                          onClick={() => removeAbility(ability)}
                          className="rounded-full bg-muted px-1 text-[10px] leading-none text-muted-foreground transition hover:bg-muted-foreground/10 hover:text-foreground"
                          aria-label={`Remove ${ability}`}
                        >
                          ×
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      No abilities added yet.
                    </span>
                  )}
                </div>

                {abilitySuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {abilitySuggestions
                      .filter((suggestion) => !modelForm.abilities.includes(suggestion))
                      .map((suggestion) => (
                        <Button
                          key={`ability-suggestion-${suggestion}`}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs capitalize"
                          onClick={() =>
                            setModelForm((prev) => ({
                              ...prev,
                              abilities: prev.abilities.includes(suggestion)
                                ? prev.abilities
                                : [...prev.abilities, suggestion],
                            }))
                          }
                        >
                          + {suggestion}
                        </Button>
                      ))}
                  </div>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="supported-model-metadata">Metadata (JSON)</Label>
                <Textarea
                  id="supported-model-metadata"
                  value={modelForm.metadata}
                  onChange={(event) => updateModelForm("metadata", event.target.value)}
                  placeholder="{ &quot;apiVersion&quot;: &quot;2024-10-01&quot; }"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Optional advanced configuration stored as JSON.
                </p>
              </div>

              <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/40 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Model status</p>
                  <p className="text-xs text-muted-foreground">
                    Inactive models remain in the catalog but can't be assigned.
                  </p>
                </div>
                <Switch
                  checked={modelForm.isActive}
                  onCheckedChange={(checked) => updateModelForm("isActive", checked)}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={closeModelDialog}
                disabled={savingModel}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmitModelForm}
                disabled={savingModel || !isModelFormValid}
                className={cn("gap-2", savingModel && "cursor-wait")}
              >
                {savingModel && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingModel ? "Save changes" : "Create model"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={Boolean(modelToDelete)} onOpenChange={(open) => (!open ? setModelToDelete(null) : null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Remove supported model</DialogTitle>
              <DialogDescription>
                This model will no longer be available for administrators to assign. Existing slot assignments will remain unchanged.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2 text-sm text-muted-foreground">
              <p>
                Are you sure you want to delete <span className="font-medium text-foreground">{modelToDelete?.name}</span>?
              </p>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setModelToDelete(null)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className={cn("gap-2", deleteLoading && "cursor-wait")}
              >
                {deleteLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete model
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {MODEL_SLOTS.map((slot) => {
          const slotState = slots[slot.key];
          const models = availableModelsByAbility[slot.key] ?? [];
          const isSaving = savingSlot === slot.key;

          return (
            <Card key={slot.key} className="flex flex-col">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base font-semibold">
                    {slot.title}
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                    {slot.ability.replace(/-/g, " ")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Current: {slotState?.label ?? slotState?.identifier ?? "Not configured"}
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <Select
                  value={slotState?.identifier}
                  onValueChange={(value) => handleModelSelect(slot.key, value)}
                >
                  <SelectTrigger aria-label={`Select model for ${slot.title}`}>
                    <SelectValue placeholder="Choose a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.length === 0 && (
                      <SelectItem value="__none" disabled>
                        No compatible models available
                      </SelectItem>
                    )}
                    {models.map((model) => (
                      <SelectItem key={model.name} value={model.name}>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{model.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {model.provider}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="mt-auto flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResetSlot(slot.key)}
                    disabled={isSaving}
                    className="gap-1 text-xs"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Reset
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleSaveSlot(slot.key)}
                    disabled={isSaving || !slotState}
                    className={cn("gap-2", isSaving && "cursor-wait")}
                  >
                    {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Save
                  </Button>
                </div>

                {slotState?.updatedAt && (
                  <p className="text-[10px] text-muted-foreground">
                    Updated {new Date(slotState.updatedAt).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {loading && (
        <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Loading AI model configurations...
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <CardTitle>Supported model catalog</CardTitle>
            <p className="text-sm text-muted-foreground">
              Define the models administrators can assign to each capability slot.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void loadInitialData({ refreshOnly: true })}
              disabled={catalogLoading || loading}
              className="gap-2"
            >
              {catalogLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button type="button" className="gap-2" onClick={openCreateModelDialog}>
              <Plus className="h-4 w-4" />
              Add model
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {catalogLoading && supportedModels.length === 0 ? (
            <div className="rounded-md border border-dashed border-muted-foreground/20 bg-muted/30 p-4 text-sm text-muted-foreground">
              Loading supported models...
            </div>
          ) : supportedModels.length > 0 ? (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[160px]">Name</TableHead>
                    <TableHead className="min-w-[180px]">Model</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Abilities</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[160px]">Last updated</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supportedModels.map((model) => (
                    <TableRow key={model.id}>
                      <TableCell className="font-medium">{model.name}</TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                          {model.model}
                        </code>
                      </TableCell>
                      <TableCell className="capitalize">{model.provider}</TableCell>
                      <TableCell>
                        {model.abilities.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {model.abilities.map((ability) => (
                              <Badge key={`${model.id}-${ability}`} variant="secondary" className="text-xs capitalize">
                                {ability}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">n/a</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={model.is_active ? "outline" : "secondary"}
                          className={cn(
                            "border border-transparent px-2 py-0.5 text-xs",
                            model.is_active
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {model.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTimestamp(model.updated_at ?? model.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditModelDialog(model)}
                            aria-label={`Edit ${model.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => setModelToDelete(model)}
                            aria-label={`Delete ${model.name}`}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-muted-foreground/20 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              No supported models yet. Add your first model to make it available for selection.
            </div>
          )}

          {supportedModels.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">{catalogStats.active}</span> active
              </span>
              {catalogStats.inactive > 0 && (
                <span>
                  <span className="font-medium text-foreground">{catalogStats.inactive}</span> inactive
                </span>
              )}
            </div>
          )}

          {catalogError && (
            <p className="text-sm text-destructive">{catalogError}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const MODEL_SLOT_TITLES = MODEL_SLOTS.reduce<Record<ModelSlotKey, string>>((acc, slot) => {
  acc[slot.key] = slot.title;
  return acc;
}, {} as Record<ModelSlotKey, string>);

function formatTimestamp(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function dedupeModels(models: AI_MODEL[]): AI_MODEL[] {
  const seen = new Set<string>();
  const deduped: AI_MODEL[] = [];

  for (const model of models) {
    if (seen.has(model.name)) continue;
    seen.add(model.name);
    deduped.push(model);
  }

  return deduped;
}
