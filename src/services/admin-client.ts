// Client-side admin service for making API calls
// This replaces direct database access for client components

export interface UserListItem {
  id: number;
  uuid: string;
  email: string;
  nickname: string | null;
  avatar_url: string | null;
  locale: string | null;
  signin_type: string | null;
  signin_provider: string | null;
  created_at: Date | null;
  updated_at: Date | null;
  signin_ip: string | null;
  last_login: Date | null;
  total_conversations: number;
  status: 'active' | 'suspended' | 'deleted';
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  topSigninProvider: string;
}

export interface DashboardOverview {
  totalUsers: number;
  activeUsers: number;
}

export interface UserDetails {
  user: UserListItem;
  recentConversations: any[];
  credits: any[];
}

export interface UsersListResponse {
  users: UserListItem[];
  total: number;
  totalPages: number;
}

export interface SupportedAIModel {
  id: number;
  name: string;
  model: string;
  provider: string;
  abilities: string[];
  description: string | null;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SaveSupportedAIModelPayload {
  name: string;
  model: string;
  provider: string;
  abilities?: string[];
  description?: string | null;
  is_active?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface AIModelConfig {
  id: number;
  slot: string;
  identifier: string;
  model: string;
  provider: string;
  label: string | null;
  description: string | null;
  abilities: string[];
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  priority: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface SaveAIModelConfigPayload {
  slot: string;
  identifier: string;
  model: string;
  provider: string;
  label?: string | null;
  description?: string | null;
  abilities?: string[];
  is_active?: boolean;
  priority?: number | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Fetch users list with pagination and filtering
 */
export async function fetchUsersList(
  page: number = 1,
  pageSize: number = 20,
  search: string = "",
  sortColumn: string = "created_at",
  sortDirection: 'asc' | 'desc' = 'desc'
): Promise<UsersListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    search,
    sortColumn,
    sortDirection,
  });

  const response = await fetch(`/api/admin/users?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  
  return response.json();
}

/**
 * Fetch user statistics
 */
export async function fetchUserStats(): Promise<UserStats> {
  const response = await fetch('/api/admin/users/stats');
  
  if (!response.ok) {
    throw new Error('Failed to fetch user stats');
  }
  
  return response.json();
}

/**
 * Fetch dashboard overview
 */
export async function fetchDashboardOverview(): Promise<DashboardOverview> {
  const response = await fetch('/api/admin/dashboard');
  
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard overview');
  }
  
  return response.json();
}

/**
 * Fetch user details by ID
 */
export async function fetchUserDetails(userId: number): Promise<UserDetails> {
  const response = await fetch(`/api/admin/users/${userId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch user details');
  }
  
  return response.json();
}

export async function fetchSupportedAIModels(): Promise<SupportedAIModel[]> {
  const response = await fetch('/api/admin/ai-models/catalog');

  if (!response.ok) {
    throw new Error('Failed to fetch supported AI models');
  }

  const payload = await response.json();
  const items = Array.isArray(payload)
    ? payload
    : payload?.data ?? payload?.models ?? [];

  return items.map(normalizeSupportedAIModel);
}

export async function createSupportedAIModel(
  payload: SaveSupportedAIModelPayload
): Promise<SupportedAIModel> {
  const response = await fetch('/api/admin/ai-models/catalog', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to create supported AI model');
  }

  const data = await response.json();
  const item = Array.isArray(data) ? data[0] : data?.data ?? data;
  return normalizeSupportedAIModel(item);
}

export async function updateSupportedAIModel(
  id: number,
  payload: SaveSupportedAIModelPayload
): Promise<SupportedAIModel> {
  const response = await fetch(`/api/admin/ai-models/catalog/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to update supported AI model');
  }

  const data = await response.json();
  const item = Array.isArray(data) ? data[0] : data?.data ?? data;
  return normalizeSupportedAIModel(item);
}

export async function deleteSupportedAIModel(id: number): Promise<void> {
  const response = await fetch(`/api/admin/ai-models/catalog/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete supported AI model');
  }
}

export async function fetchAIModelConfigs(): Promise<AIModelConfig[]> {
  const response = await fetch('/api/admin/ai-models');

  if (!response.ok) {
    throw new Error('Failed to fetch AI model configurations');
  }

  const payload = await response.json();
  const items = Array.isArray(payload)
    ? payload
    : payload?.data ?? payload?.configs ?? [];

  return items.map(normalizeAIModelConfig);
}

export async function createAIModelConfig(
  payload: SaveAIModelConfigPayload
): Promise<AIModelConfig> {
  const response = await fetch('/api/admin/ai-models', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to create AI model configuration');
  }

  const data = await response.json();
  const item = Array.isArray(data) ? data[0] : data?.data ?? data;
  return normalizeAIModelConfig(item);
}

export async function updateAIModelConfig(
  id: number,
  payload: SaveAIModelConfigPayload
): Promise<AIModelConfig> {
  const response = await fetch(`/api/admin/ai-models/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to update AI model configuration');
  }

  const data = await response.json();
  const item = Array.isArray(data) ? data[0] : data?.data ?? data;
  return normalizeAIModelConfig(item);
}

export async function deleteAIModelConfig(id: number): Promise<void> {
  const response = await fetch(`/api/admin/ai-models/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete AI model configuration');
  }
}

function normalizeAIModelConfig(raw: any): AIModelConfig {
  return {
    id: Number(raw?.id ?? 0),
    slot: String(raw?.slot ?? raw?.config_key ?? ''),
    identifier: String(raw?.identifier ?? raw?.name ?? ''),
    model: String(raw?.model ?? raw?.model_name ?? ''),
    provider: raw?.provider ? String(raw.provider) : '',
    label: raw?.label ?? raw?.display_name ?? null,
    description: raw?.description ?? null,
    abilities: ensureStringArray(raw?.abilities),
    is_active: typeof raw?.is_active === 'boolean'
      ? raw.is_active
      : Boolean(raw?.is_active ?? true),
    metadata: normalizeMetadata(raw?.metadata),
    priority:
      raw?.priority !== undefined && raw?.priority !== null
        ? Number(raw.priority)
        : null,
    created_at: raw?.created_at ?? null,
    updated_at: raw?.updated_at ?? null,
  };
}

function ensureStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === 'string') as string[];
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => typeof item === 'string') as string[];
      }
    } catch (error) {
      // ignore JSON parse error and fall back to comma split
    }
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeMetadata(value: unknown): Record<string, unknown> | null {
  if (!value) return null;
  if (typeof value === 'object') {
    return value as Record<string, unknown>;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown>;
      }
    } catch (error) {
      return null;
    }
  }

  return null;
}

function normalizeSupportedAIModel(raw: any): SupportedAIModel {
  return {
    id: Number(raw?.id ?? 0),
    name: String(raw?.name ?? ''),
    model: String(raw?.model ?? ''),
    provider: String(raw?.provider ?? ''),
    abilities: ensureStringArray(raw?.abilities),
    description: raw?.description ?? null,
    is_active:
      typeof raw?.is_active === 'boolean'
        ? raw.is_active
        : Boolean(raw?.is_active ?? true),
    metadata: normalizeMetadata(raw?.metadata),
    created_at: raw?.created_at ?? null,
    updated_at: raw?.updated_at ?? null,
  };
}