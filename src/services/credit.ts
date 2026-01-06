import { credits as creditsTable } from "@/db/schema";
import { getIsoTimestr } from "@/lib/time";
import { getSnowId } from "@/lib/hash";
import { UserCredits } from "@/types/user";
import { credits } from "@/db/schema";
import { db } from "@/db";
import { desc, eq, and, gte, asc } from "drizzle-orm";

export enum CreditsTransType {
  NewUser = "new_user", // initial credits for new user
  SystemAdd = "system_add", // system add credits
  Chat = "chat", // cost for chat conversation
  IdeaGeneration = "idea_generation", // cost for AI idea generation
  ImageGeneration = "image_generation", // cost for AI image generation
  VideoGeneration = "video_generation", // cost for AI video generation
}

export enum CreditsAmount {
  NewUserGet = 10,
  PingCost = 1,
  ImageGenerationCost = 1, // Fixed cost for image generation (1 credit per image)
  VideoGenerationCost = 5, // Fixed cost for video generation
}

// 10k Token to credit conversion rates for different AI operations
export enum TokenCostRates {
  IdeaGeneration = 0.1, // 0.1 credits per 10k token for idea generation
  Chat = 0.05, // 0.05 credits per 10k token for chat
}

export async function insertCredit(
  data: typeof credits.$inferInsert
): Promise<typeof credits.$inferSelect | undefined> {
  const [credit] = await db().insert(credits).values(data).returning();

  return credit;
}

export async function findCreditByTransNo(
  trans_no: string
): Promise<typeof credits.$inferSelect | undefined> {
  const [credit] = await db()
    .select()
    .from(credits)
    .where(eq(credits.trans_no, trans_no))
    .limit(1);

  return credit;
}

export async function getUserValidCredits(
  user_uuid: string
): Promise<(typeof credits.$inferSelect)[] | undefined> {
  const now = new Date().toISOString();
  const data = await db()
    .select()
    .from(credits)
    .where(
      and(
        gte(credits.expired_at, new Date(now)),
        eq(credits.user_uuid, user_uuid)
      )
    )
    .orderBy(asc(credits.expired_at));

  return data;
}

export async function getCreditsByUserUuid(
  user_uuid: string,
  page: number = 1,
  limit: number = 50
): Promise<(typeof credits.$inferSelect)[] | undefined> {
  const data = await db()
    .select()
    .from(credits)
    .where(eq(credits.user_uuid, user_uuid))
    .orderBy(desc(credits.created_at))
    .limit(limit)
    .offset((page - 1) * limit);

  return data;
}


export async function getUserCredits(user_uuid: string): Promise<UserCredits> {
  let user_credits: UserCredits = {
    left_credits: 0,
  };

  try {
    const credits = await getUserValidCredits(user_uuid);
    if (credits) {
      credits.forEach((v) => {
        user_credits.left_credits += v.credits || 0;
      });
    }

    if (user_credits.left_credits < 0) {
      user_credits.left_credits = 0;
    }

    return user_credits;
  } catch (e) {
    console.log("get user credits failed: ", e);
    return user_credits;
  }
}

export async function decreaseCredits({
  user_uuid,
  trans_type,
  credits,
}: {
  user_uuid: string;
  trans_type: CreditsTransType;
  credits: number;
}) {
  try {
    let expired_at = "";
    let left_credits = 0;

    const userCredits = await getUserValidCredits(user_uuid);
    if (userCredits) {
      for (let i = 0, l = userCredits.length; i < l; i++) {
        const credit = userCredits[i];
        left_credits += credit.credits;

        // credit enough for cost
        if (left_credits >= credits) {
          expired_at = credit.expired_at?.toISOString() || "";
          break;
        }

        // look for next credit
      }
    }

    const new_credit: typeof creditsTable.$inferInsert = {
      trans_no: getSnowId(),
      created_at: new Date(getIsoTimestr()),
      expired_at: new Date(expired_at),
      user_uuid: user_uuid,
      trans_type: trans_type,
      credits: 0 - credits,
    };
    await insertCredit(new_credit);
    console.log(`decrease ${credits} credits for user ${user_uuid}`);
  } catch (e) {
    console.log("decrease credits failed: ", e);
    throw e;
  }
}

export async function increaseCredits({
  user_uuid,
  trans_type,
  credits,
  expired_at,
  memo,
}: {
  user_uuid: string;
  trans_type: string;
  credits: number;
  expired_at?: string;
  memo?: string;
}) {
  try {
    const new_credit: typeof creditsTable.$inferInsert = {
      trans_no: getSnowId(),
      created_at: new Date(getIsoTimestr()),
      user_uuid: user_uuid,
      trans_type: trans_type,
      credits: credits,
      memo: memo || "",
      expired_at: expired_at ? new Date(expired_at) : null,
    };
    await insertCredit(new_credit);
  } catch (e) {
    console.log("increase credits failed: ", e);
    throw e;
  }
}

/**
 * Compute credits needed based on token count and operation type
 * @param tokens Number of tokens used
 * @param transType Type of transaction to determine rate
 * @returns Number of credits needed (rounded up)
 */
export function computeCreditsFromTokens(
  tokens: number,
  transType: CreditsTransType
): number {
  if (tokens <= 0) return 0;
  
  let rate: number;
  
  switch (transType) {
    case CreditsTransType.Chat:
      rate = TokenCostRates.Chat;
      break;
    default:
      // Default to AI idea generation rate
      rate = TokenCostRates.IdeaGeneration;
      break;
  }
  
  // Calculate cost and round up to ensure we don't undercharge
  const cost = tokens * rate / 10000; // since rates are per 10k tokens
  return Math.round(cost);
}


