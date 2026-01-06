export type AI_MODEL = {
    name: string;
    model: string;
    provider: string;
    abilities: string[];
    description: string;
};

export const MODEL_SLOT_KEYS = [
    "default",
    "default_fast",
    "default_agent",
    "default_search",
    "default_search_agent",
    "text_image",
    "text_to_video",
    "image_edit",
    "image_to_video",
] as const;

export type ModelSlotKey = typeof MODEL_SLOT_KEYS[number];

export const DEFAULT_MODEL: AI_MODEL = {
    name: "google/gemini-2.5-flash-lite",
    model: "gemini-2.5-flash-lite",
    provider: "google",
    abilities: ["chat", "text-generation"],
    description: "Google's Gemini 2.5 Flash Lite model"
};
export const DEFAULT_FAST_MODEL: AI_MODEL = {
    name: "google/gemini-2.5-flash-lite",
    model: "gemini-2.5-flash-lite",
    provider: "google",
    abilities: ["chat", "text-generation"],
    description: "Google's Gemini 2.5 Flash Lite model"
};
export const DEFAULT_AGENT_MODEL: AI_MODEL = {
    name: "openai/gpt-5-mini",
    model: "gpt-5-mini",
    provider: "openai",
    abilities: ["chat", "text-generation", "image-generation"],
    description: "OpenAI's GPT-5 Mini model"
};

export const DEFAULT_SEARCH_MODEL: AI_MODEL = {
    name: "perplexity/sonar",
    model: "sonar",
    provider: "perplexity",
    abilities: ["search"],
    description: "Perplexity's Sonar model for search"
};

export const DEFAULT_SEARCH_AGENT_MODEL: AI_MODEL = {
    name: "perplexity/sonar-reasoning",
    model: "sonar-reasoning",
    provider: "perplexity",
    abilities: ["search"],
    description: "Perplexity's Sonar Reasoning model for search"
};

export const SUPPORTED_MODELS: AI_MODEL[] = [
    {
        name: "google/gemini-2.5-pro",
        model: "gemini-2.5-pro",
        provider: "google",
        abilities: ["chat", "text-generation", "image-generation"],
        description: "Google's Gemini 2.5 Pro model"
    },
    {
        name: "google/gemini-2.5-flash",
        model: "gemini-2.5-flash",
        provider: "google",
        abilities: ["chat", "text-generation", "image-generation"],
        description: "Google's Gemini 2.5 Flash model"
    },
    {
        name: "openai/gpt-5",
        model: "gpt-5",
        provider: "openai",
        abilities: ["chat", "text-generation", "image-generation"],
        description: "OpenAI's GPT-5 model"
    },
    {
        name: "openai/gpt-5-mini",
        model: "gpt-5-mini",
        provider: "openai",
        abilities: ["chat", "text-generation", "image-generation"],
        description: "OpenAI's GPT-5 Mini model"
    },
    {
        name: "openai/gpt-5-nano",
        model: "gpt-5-nano",
        provider: "openai",
        abilities: ["chat", "text-generation", "image-generation"],
        description: "OpenAI's GPT-5 Nano model"
    },
    {
        name: "anthropic/claude-3.5-sonnet",
        model: "claude-3.5-sonnet",
        provider: "anthropic",
        abilities: ["chat", "text-generation"],
        description: "Anthropic's Claude 3.5 Sonnet model"
    },
    {
        name: "anthropic/claude-3.7-sonnet",
        model: "claude-3.7-sonnet",
        provider: "anthropic",
        abilities: ["chat", "text-generation"],
        description: "Anthropic's Claude 3.7 Sonnet model"
    },
    {
        name: "anthropic/claude-4-sonnet",
        model: "claude-4-sonnet",
        provider: "anthropic",
        abilities: ["chat", "text-generation"],
        description: "Anthropic's Claude 4 Sonnet model"
    },
    {
        name: "anthropic/claude-4-opus",
        model: "claude-4-opus",
        provider: "anthropic",
        abilities: ["chat", "text-generation"],
        description: "Anthropic's Claude 4 Opus model"
    },
    {
        name: "xai/grok-4",
        model: "grok-4",
        provider: "xai",
        abilities: ["chat", "text-generation"],
        description: "XAI's Grok 4 model"
    },
    {
        name: "moonshotai/kimi-k2",
        model: "kimi-k2",
        provider: "moonshotai",
        abilities: ["chat", "text-generation"],
        description: "MoonshotAI's Kimi K2 model"
    },
    {
        name: "deepseek/deepseek-v3.1",
        model: "deepseek-v3.1",
        provider: "deepseek",
        abilities: ["chat", "text-generation"],
        description: "DeepSeek's DeepSeek V3.1 model"
    },
    {
        name: "deepseek/deepseek-v3.1-thinking",
        model: "deepseek-v3.1-thinking",
        provider: "deepseek",
        abilities: ["chat", "text-generation"],
        description: "DeepSeek's DeepSeek V3.1 thinking model"
    }
]

export const DEFAULT_TEXT_IMAGE_MODEL: AI_MODEL = {
    name: "fal-ai/nano-banana",
    model: "nano-banana",
    provider: "fal-ai",
    abilities: ["text-to-image"],
    description: "Fal AI's Nano Banana model"
};

export const DEFAULT_TEXT_TO_VIDEO_MODEL: AI_MODEL = {
    name: "fal-ai/sora-2/text-to-video",
    model: "sora-2/text-to-video",
    provider: "fal-ai",
    abilities: ["text-to-video"],
    description: "Fal AI's Sora 2 text-to-video model"
};

export const DEFAULT_IMAGE_EDIT_MODEL: AI_MODEL = {
    name: "fal-ai/nano-banana/edit",
    model: "nano-banana/edit",
    provider: "fal-ai",
    abilities: ["image-edit"],
    description: "Fal AI's Nano Banana Edit model"
}

export const DEFAULT_IMAGE_TO_VIDEO_MODEL: AI_MODEL = {
    name: "fal-ai/sora-2/image-to-video",
    model: "sora-2/image-to-video",
    provider: "fal-ai",
    abilities: ["image-to-video"],
    description: "Fal AI's Sora 2 image-to-video model"
};

export const MODEL_SLOT_DEFAULTS: Record<ModelSlotKey, AI_MODEL> = {
    default: DEFAULT_MODEL,
    default_fast: DEFAULT_FAST_MODEL,
    default_agent: DEFAULT_AGENT_MODEL,
    default_search: DEFAULT_SEARCH_MODEL,
    default_search_agent: DEFAULT_SEARCH_AGENT_MODEL,
    text_image: DEFAULT_TEXT_IMAGE_MODEL,
    text_to_video: DEFAULT_TEXT_TO_VIDEO_MODEL,
    image_edit: DEFAULT_IMAGE_EDIT_MODEL,
    image_to_video: DEFAULT_IMAGE_TO_VIDEO_MODEL,
};