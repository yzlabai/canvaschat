import { users } from "@/db/schema";
import { db } from "@/db";
import { desc, eq, gte, inArray } from "drizzle-orm";

export async function insertUser(
  data: typeof users.$inferInsert
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db().insert(users).values(data).returning();

  return user;
}

export async function findUserByEmail(
  email: string
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db()
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user;
}

export async function findUserByUuid(
  uuid: string
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db()
    .select()
    .from(users)
    .where(eq(users.uuid, uuid))
    .limit(1);

  return user;
}

export async function getUsers(
  page: number = 1,
  limit: number = 50
): Promise<(typeof users.$inferSelect)[] | undefined> {
  const offset = (page - 1) * limit;

  const data = await db()
    .select()
    .from(users)
    .orderBy(desc(users.created_at))
    .limit(limit)
    .offset(offset);

  return data;
}

export async function getUsersByUuids(
  user_uuids: string[]
): Promise<(typeof users.$inferSelect)[] | undefined> {
  const data = await db()
    .select()
    .from(users)
    .where(inArray(users.uuid, user_uuids));

  return data;
}

export async function getUserUuidsByEmail(
  email: string
): Promise<string[] | undefined> {
  const data = await db()
    .select({ uuid: users.uuid })
    .from(users)
    .where(eq(users.email, email));

  return data.map((user) => user.uuid);
}

export async function getUsersTotal(): Promise<number> {
  const total = await db().$count(users);

  return total;
}
//TODO need fix error
export async function getUserCountByDate(
  startTime: string
): Promise<Map<string, number> | undefined> {
  // Parse start time; fallback to 30 days ago if invalid
  const parsed = new Date(startTime);
  const fromDate = isNaN(parsed.getTime())
    ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    : parsed;
  // Normalize to start of day UTC to avoid partial day skew
  fromDate.setUTCHours(0, 0, 0, 0);

  const data = await db()
    .select({ created_at: users.created_at })
    .from(users)
    .where(gte(users.created_at, fromDate))
    .orderBy(desc(users.created_at));

  // Build counts by YYYY-MM-DD
  const dateCountMap = new Map<string, number>();
  for (const item of data) {
    if (!item.created_at) continue; // safety
    const date = item.created_at.toISOString().split("T")[0];
    dateCountMap.set(date, (dateCountMap.get(date) || 0) + 1);
  }
  return dateCountMap;
}


export async function updateUserInfo(
  user_uuid: string,
  updates: Partial<typeof users.$inferInsert>
): Promise<typeof users.$inferSelect | undefined> {
  const [user] = await db()
    .update(users)
    .set({ ...updates, updated_at: new Date() })
    .where(eq(users.uuid, user_uuid))
    .returning();

  return user;
}
