import { db } from "@/db";
import { 
  users, 
  yanConversations, 
  yanMessages,
  credits,
  aiModelConfigs,
  aiModels,
  triggerrun
} from "@/db/schema";
import { sql, desc, eq, and, gte, lte, count, inArray, InferInsertModel, InferSelectModel } from "drizzle-orm";
import { invalidateModelCache } from "@/services/ai-models";

// Types for dashboard data
export interface DashboardOverview {
  totalUsers: number;
  activeUsers: number;
}

export interface RecentActivity {
  id: string;
  user: string;
  action: string;
  time: string;
}

export interface UserGrowthData {
  date: string;
  users: number;
}

export interface RevenueData {
  date: string;
  revenue: number;
}

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

/**
 * Get dashboard overview metrics
 */
export async function getDashboardOverview(): Promise<DashboardOverview> {
  const database = db();
  
  try {
    // Validate database connection
    if (!database) {
      throw new Error('Database connection not available');
    }

    // Get total users count
    const totalUsersResult = await database
      .select({ count: count() })
      .from(users);
    
    // Get active users (users who have had conversations in the last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeUsersResult = await database
      .selectDistinct({ user_uuid: yanConversations.user_uuid })
      .from(yanConversations)
      .where(gte(yanConversations.last_message_at, thirtyDaysAgo));

    // Validate results and provide fallbacks
    const totalUsers = totalUsersResult?.[0]?.count ?? 0;
    const activeUsers = activeUsersResult?.length ?? 0;

    return {
      totalUsers: Math.max(0, totalUsers),
      activeUsers: Math.max(0, activeUsers),
    };
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    // Return safe defaults instead of throwing
    return {
      totalUsers: 0,
      activeUsers: 0,
    };
  }
}

/**
 * Get recent user activities
 */
export async function getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
  const database = db();
  
  try {
    if (!database) {
      throw new Error('Database connection not available');
    }

    // Validate limit parameter
    const safeLimit = Math.max(1, Math.min(100, limit));

    // Get recent user registrations
    const recentUsers = await database
      .select({
        id: users.uuid,
        nickname: users.nickname,
        email: users.email,
        created_at: users.created_at,
      })
      .from(users)
      .orderBy(desc(users.created_at))
      .limit(Math.floor(safeLimit / 2));

    // Get recent conversations
    const recentConversations = await database
      .select({
        id: yanConversations.id,
        user_uuid: yanConversations.user_uuid,
        title: yanConversations.title,
        created_at: yanConversations.created_at,
      })
      .from(yanConversations)
      .orderBy(desc(yanConversations.created_at))
      .limit(Math.floor(safeLimit / 2));

    // Get user info for conversations
    const conversationUserUuids = recentConversations.map(c => c.user_uuid).filter(Boolean);
    let conversationUsers: Array<{
      uuid: string;
      nickname: string | null;
      email: string;
    }> = [];
    
    if (conversationUserUuids.length > 0) {
      conversationUsers = await database
        .select({
          uuid: users.uuid,
          nickname: users.nickname,
          email: users.email,
        })
        .from(users)
        .where(inArray(users.uuid, conversationUserUuids));
    }

    const userMap = new Map(conversationUsers.map(u => [u.uuid, u]));

    // Combine activities
    const activities: RecentActivity[] = [];

    // Add user registrations
    recentUsers.forEach(user => {
      if (user.id) {
        activities.push({
          id: user.id,
          user: user.nickname || user.email || 'Unknown User',
          action: 'Created account',
          time: getTimeAgo(user.created_at),
        });
      }
    });

    // Add conversation activities
    recentConversations.forEach(conversation => {
      if (conversation.id) {
        const user = userMap.get(conversation.user_uuid);
        activities.push({
          id: conversation.id,
          user: user?.nickname || user?.email || 'Unknown User',
          action: `Started conversation: ${conversation.title || 'Untitled'}`,
          time: getTimeAgo(conversation.created_at),
        });
      }
    });

    // Sort by most recent and limit
    activities.sort((a, b) => {
      const timeA = parseTimeAgo(a.time);
      const timeB = parseTimeAgo(b.time);
      return timeA - timeB;
    });

    return activities.slice(0, safeLimit);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    // Return empty array instead of throwing
    return [];
  }
}

/**
 * Get user growth data for charts
 */
export async function getUserGrowthData(days: number = 30): Promise<UserGrowthData[]> {
  const database = db();
  
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const growthData = await database
      .select({
        date: sql<string>`DATE(${users.created_at})`,
        count: count(),
      })
      .from(users)
      .where(gte(users.created_at, startDate))
      .groupBy(sql`DATE(${users.created_at})`)
      .orderBy(sql`DATE(${users.created_at})`);

    return growthData.map(item => ({
      date: item.date,
      users: item.count,
    }));
  } catch (error) {
    console.error('Error fetching user growth data:', error);
    throw new Error('Failed to fetch user growth data');
  }
}

/**
 * Get total statistics for the current month vs last month
 */
export async function getMonthlyStats() {
  const database = db();
  
  try {
    if (!database) {
      throw new Error('Database connection not available');
    }

    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // This month's users
    const thisMonthUsers = await database
      .select({ count: count() })
      .from(users)
      .where(gte(users.created_at, startOfThisMonth));

    // Last month's users
    const lastMonthUsers = await database
      .select({ count: count() })
      .from(users)
      .where(
        and(
          gte(users.created_at, startOfLastMonth),
          lte(users.created_at, endOfLastMonth)
        )
      );

    const thisMonthUserCount = thisMonthUsers?.[0]?.count ?? 0;
    const lastMonthUserCount = lastMonthUsers?.[0]?.count ?? 0;
    const userGrowthPercentage = lastMonthUserCount > 0 
      ? ((thisMonthUserCount - lastMonthUserCount) / lastMonthUserCount * 100)
      : 0;

    return {
      userGrowthPercentage: Math.round(userGrowthPercentage * 10) / 10,
      newUsersThisMonth: thisMonthUserCount,
    };
  } catch (error) {
    console.error('Error fetching monthly stats:', error);
    // Return safe defaults instead of throwing
    return {
      userGrowthPercentage: 0,
      newUsersThisMonth: 0,
    };
  }
}

// Helper functions
function getTimeAgo(date: Date | null): string {
  if (!date) return 'Unknown time';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString();
}

function parseTimeAgo(timeStr: string): number {
  if (timeStr === 'Just now') return 0;
  if (timeStr.includes('minutes ago')) {
    return parseInt(timeStr.split(' ')[0]);
  }
  if (timeStr.includes('hours ago')) {
    return parseInt(timeStr.split(' ')[0]) * 60;
  }
  if (timeStr.includes('days ago')) {
    return parseInt(timeStr.split(' ')[0]) * 60 * 24;
  }
  return 999999; // For dates, put them last
}

/**
 * Get paginated list of users with their statistics
 */
export async function getUsersList(
  page: number = 1,
  limit: number = 20,
  search?: string,
  sortBy: string = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc'
): Promise<{
  users: UserListItem[];
  total: number;
  totalPages: number;
  currentPage: number;
}> {
  const database = db();
  
  try {
    if (!database) {
      throw new Error('Database connection not available');
    }

    const offset = (page - 1) * limit;
    const safeLimit = Math.max(1, Math.min(100, limit));

    // Build the base query
    let whereConditions = [];
    
    if (search) {
      whereConditions.push(
        sql`(${users.email} ILIKE ${`%${search}%`} OR ${users.nickname} ILIKE ${`%${search}%`})`
      );
    }

    const whereClause = whereConditions.length > 0 
      ? and(...whereConditions)
      : undefined;

    // Get total count
    const totalResult = await database
      .select({ count: count() })
      .from(users)
      .where(whereClause);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / safeLimit);

    // Determine sort column
    const sortColumn = sortBy === 'email' ? users.email :
                      sortBy === 'nickname' ? users.nickname :
                      sortBy === 'updated_at' ? users.updated_at :
                      users.created_at;

    const orderBy = sortOrder === 'asc' ? sortColumn : desc(sortColumn);

    // Get users with their stats
    const usersResult = await database
      .select({
        id: users.id,
        uuid: users.uuid,
        email: users.email,
        nickname: users.nickname,
        avatar_url: users.avatar_url,
        locale: users.locale,
        signin_type: users.signin_type,
        signin_provider: users.signin_provider,
        created_at: users.created_at,
        updated_at: users.updated_at,
        signin_ip: users.signin_ip,
      })
      .from(users)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(safeLimit)
      .offset(offset);

    // Get additional stats for each user
    const userUuids = usersResult.map(u => u.uuid);

    // Get conversation stats
    const conversationStats = userUuids.length > 0 ? await database
      .select({
        user_uuid: yanConversations.user_uuid,
        total_conversations: count(),
        last_activity: sql<Date>`MAX(${yanConversations.last_message_at})`,
      })
      .from(yanConversations)
      .where(inArray(yanConversations.user_uuid, userUuids))
      .groupBy(yanConversations.user_uuid) : [];

    // Create maps for quick lookup
    const conversationStatsMap = new Map(conversationStats.map(stat => [
      stat.user_uuid,
      {
        total_conversations: stat.total_conversations,
        last_activity: stat.last_activity
      }
    ]));

    // Combine data
    const usersWithStats: UserListItem[] = usersResult.map(user => {
      const conversationStat = conversationStatsMap.get(user.uuid) || { total_conversations: 0, last_activity: null };

      return {
        id: user.id,
        uuid: user.uuid,
        email: user.email,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        locale: user.locale,
        signin_type: user.signin_type,
        signin_provider: user.signin_provider,
        created_at: user.created_at,
        updated_at: user.updated_at,
        signin_ip: user.signin_ip,
        last_login: conversationStat.last_activity,
        total_conversations: conversationStat.total_conversations,
        status: 'active' as const, // You can implement user status logic here
      };
    });

    return {
      users: usersWithStats,
      total,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error('Error fetching users list:', error);
    return {
      users: [],
      total: 0,
      totalPages: 0,
      currentPage: page,
    };
  }
}

/**
 * Get user statistics for the users management page
 */
export async function getUserStats(): Promise<UserStats> {
  const database = db();
  
  try {
    if (!database) {
      throw new Error('Database connection not available');
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get various user counts
    const [
      totalUsersResult,
      newUsersTodayResult,
      newUsersWeekResult,
      activeUsersResult,
      signinProvidersResult,
    ] = await Promise.all([
      // Total users
      database.select({ count: count() }).from(users),
      
      // New users today
      database
        .select({ count: count() })
        .from(users)
        .where(gte(users.created_at, todayStart)),
      
      // New users this week
      database
        .select({ count: count() })
        .from(users)
        .where(gte(users.created_at, weekStart)),
      
      // Active users (had conversations in last 30 days)
      database
        .selectDistinct({ user_uuid: yanConversations.user_uuid })
        .from(yanConversations)
        .where(gte(yanConversations.last_message_at, thirtyDaysAgo)),
      
      // Top signin providers
      database
        .select({
          provider: users.signin_provider,
          count: count(),
        })
        .from(users)
        .where(sql`${users.signin_provider} IS NOT NULL`)
        .groupBy(users.signin_provider)
        .orderBy(desc(count()))
        .limit(1),
    ]);

    const totalUsers = totalUsersResult[0]?.count || 0;
    const newUsersToday = newUsersTodayResult[0]?.count || 0;
    const newUsersThisWeek = newUsersWeekResult[0]?.count || 0;
    const activeUsers = activeUsersResult.length || 0;
    const topProvider = signinProvidersResult[0]?.provider || 'email';

    return {
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisWeek,
      topSigninProvider: topProvider,
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      newUsersToday: 0,
      newUsersThisWeek: 0,
      topSigninProvider: 'email',
    };
  }
}

/**
 * Get detailed information for a specific user
 */
export async function getUserDetails(userUuid: string) {
  const database = db();
  
  try {
    if (!database) {
      throw new Error('Database connection not available');
    }

    // Get user basic info
    const userResult = await database
      .select()
      .from(users)
      .where(eq(users.uuid, userUuid))
      .limit(1);

    if (!userResult.length) {
      throw new Error('User not found');
    }

    const user = userResult[0];

    // Get user's conversations
    const userConversations = await database
      .select()
      .from(yanConversations)
      .where(eq(yanConversations.user_uuid, userUuid))
      .orderBy(desc(yanConversations.created_at))
      .limit(10);

    // Get user's credits
    const userCredits = await database
      .select()
      .from(credits)
      .where(eq(credits.user_uuid, userUuid))
      .orderBy(desc(credits.created_at))
      .limit(10);

    return {
      user,
      conversations: userConversations,
      credits: userCredits,
    };
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
}

export interface AIModelConfigInput {
  slot: string;
  identifier: string;
  model: string;
  provider: string;
  label?: string | null;
  description?: string | null;
  abilities?: string[];
  isActive?: boolean;
  priority?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateAIModelConfigInput
  extends Partial<AIModelConfigInput> {}

export interface AIModelConfigRecord {
  id: number;
  slot: string;
  identifier: string;
  model: string;
  provider: string;
  label: string | null;
  description: string | null;
  abilities: string[];
  is_active: boolean;
  priority: number | null;
  metadata: Record<string, unknown> | null;
  created_at: Date | null;
  updated_at: Date | null;
}

type AiModelConfigRow = InferSelectModel<typeof aiModelConfigs>;

type AiModelRow = InferSelectModel<typeof aiModels>;

export interface SupportedAIModelRecord {
  id: number;
  name: string;
  model: string;
  provider: string;
  abilities: string[];
  description: string | null;
  is_active: boolean;
  metadata: Record<string, unknown> | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface SupportedAIModelInput {
  name: string;
  model: string;
  provider: string;
  abilities?: string[];
  description?: string | null;
  isActive?: boolean;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateSupportedAIModelInput
  extends Partial<SupportedAIModelInput> {}

export async function listSupportedAIModels(): Promise<SupportedAIModelRecord[]> {
  const database = db();

  const rows = await database
    .select()
    .from(aiModels)
    .orderBy(aiModels.name);

  return rows.map(deserializeSupportedAIModel);
}

export async function getSupportedAIModelByName(
  name: string
): Promise<SupportedAIModelRecord | null> {
  const database = db();

  const [row] = await database
    .select()
    .from(aiModels)
    .where(eq(aiModels.name, name))
    .limit(1);

  return row ? deserializeSupportedAIModel(row) : null;
}

export async function createSupportedAIModel(
  input: SupportedAIModelInput
): Promise<SupportedAIModelRecord> {
  const database = db();

  const [created] = await database
    .insert(aiModels)
    .values({
      name: input.name,
      model: input.model,
      provider: input.provider,
      abilities: serializeAbilities(input.abilities) ?? '[]',
      description: input.description ?? null,
      is_active: input.isActive ?? true,
      metadata: serializeMetadata(input.metadata),
      updated_at: new Date(),
    })
    .returning();

  return deserializeSupportedAIModel(created);
}

export async function updateSupportedAIModel(
  id: number,
  input: UpdateSupportedAIModelInput
): Promise<SupportedAIModelRecord | null> {
  const database = db();

  const updatePayload: Partial<InferInsertModel<typeof aiModels>> = {
    updated_at: new Date(),
  };

  if (input.name !== undefined) {
    updatePayload.name = input.name;
  }

  if (input.model !== undefined) {
    updatePayload.model = input.model;
  }

  if (input.provider !== undefined) {
    updatePayload.provider = input.provider;
  }

  if (input.abilities !== undefined) {
    updatePayload.abilities = serializeAbilities(input.abilities) ?? '[]';
  }

  if (input.description !== undefined) {
    updatePayload.description = input.description;
  }

  if (input.isActive !== undefined) {
    updatePayload.is_active = input.isActive;
  }

  if (input.metadata !== undefined) {
    updatePayload.metadata = serializeMetadata(input.metadata);
  }

  const [updated] = await database
    .update(aiModels)
    .set(updatePayload)
    .where(eq(aiModels.id, id))
    .returning();

  return updated ? deserializeSupportedAIModel(updated) : null;
}

export async function deleteSupportedAIModel(id: number): Promise<boolean> {
  const database = db();

  const deleted = await database
    .delete(aiModels)
    .where(eq(aiModels.id, id))
    .returning({ id: aiModels.id });

  return deleted.length > 0;
}

export async function listAIModelConfigs(): Promise<AIModelConfigRecord[]> {
  const database = db();

  const results = await database
    .select()
    .from(aiModelConfigs)
    .orderBy(aiModelConfigs.slot);

  return results.map(deserializeAIModelConfig);
}

export async function createAIModelConfigEntry(
  input: AIModelConfigInput
): Promise<AIModelConfigRecord> {
  const database = db();

  const [created] = await database
    .insert(aiModelConfigs)
    .values({
      slot: input.slot,
      identifier: input.identifier,
      model: input.model,
      provider: input.provider,
      label: input.label ?? null,
      description: input.description ?? null,
      abilities: serializeAbilities(input.abilities),
      is_active: input.isActive ?? true,
      priority: input.priority ?? 0,
      metadata: serializeMetadata(input.metadata),
      updated_at: new Date(),
    })
    .returning();

  const record = deserializeAIModelConfig(created);
  invalidateModelCache();
  return record;
}

export async function updateAIModelConfigEntry(
  id: number,
  input: UpdateAIModelConfigInput
): Promise<AIModelConfigRecord | null> {
  const database = db();

  const updatePayload: Partial<InferInsertModel<typeof aiModelConfigs>> = {
    updated_at: new Date(),
  };

  if (input.slot !== undefined) {
    updatePayload.slot = input.slot;
  }

  if (input.identifier !== undefined) {
    updatePayload.identifier = input.identifier;
  }

  if (input.model !== undefined) {
    updatePayload.model = input.model;
  }

  if (input.provider !== undefined) {
    updatePayload.provider = input.provider;
  }

  if (input.label !== undefined) {
    updatePayload.label = input.label;
  }

  if (input.description !== undefined) {
    updatePayload.description = input.description;
  }

  if (input.abilities !== undefined) {
    updatePayload.abilities = serializeAbilities(input.abilities);
  }

  if (input.isActive !== undefined) {
    updatePayload.is_active = input.isActive;
  }

  if (input.priority !== undefined) {
    updatePayload.priority = input.priority ?? 0;
  }

  if (input.metadata !== undefined) {
    updatePayload.metadata = serializeMetadata(input.metadata);
  }

  const [updated] = await database
    .update(aiModelConfigs)
    .set(updatePayload)
    .where(eq(aiModelConfigs.id, id))
    .returning();

  if (!updated) {
    return null;
  }

  const record = deserializeAIModelConfig(updated);
  invalidateModelCache();
  return record;
}

export async function deleteAIModelConfigEntry(id: number): Promise<boolean> {
  const database = db();

  const deleted = await database
    .delete(aiModelConfigs)
    .where(eq(aiModelConfigs.id, id))
    .returning({ id: aiModelConfigs.id });

  if (deleted.length > 0) {
    invalidateModelCache();
    return true;
  }

  return false;
}

function deserializeSupportedAIModel(row: AiModelRow): SupportedAIModelRecord {
  return {
    id: row.id,
    name: row.name,
    model: row.model,
    provider: row.provider,
    abilities: deserializeAbilities(row.abilities),
    description: row.description ?? null,
    is_active: row.is_active,
    metadata: deserializeMetadata(row.metadata),
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
  };
}

function deserializeAIModelConfig(row: AiModelConfigRow): AIModelConfigRecord {
  return {
    id: row.id,
    slot: row.slot,
    identifier: row.identifier,
    model: row.model,
    provider: row.provider,
    label: row.label ?? null,
    description: row.description ?? null,
    abilities: deserializeAbilities(row.abilities),
    is_active: row.is_active,
    priority: row.priority ?? null,
    metadata: deserializeMetadata(row.metadata),
    created_at: row.created_at ?? null,
    updated_at: row.updated_at ?? null,
  };
}

function serializeAbilities(abilities?: string[]): string | null {
  if (!abilities) return null;
  if (abilities.length === 0) return '[]';
  return JSON.stringify(abilities);
}

function deserializeAbilities(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === 'string') as string[];
    }
  } catch (error) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function serializeMetadata(
  metadata?: Record<string, unknown> | null
): string | null {
  if (metadata === undefined || metadata === null) {
    return null;
  }

  try {
    return JSON.stringify(metadata);
  } catch (error) {
    console.error('Failed to serialize AI model metadata', error);
    return null;
  }
}

function deserializeMetadata(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>;
    }
  } catch (error) {
    console.error('Failed to parse AI model metadata', error);
  }
  return null;
}