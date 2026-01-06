import { db } from "@/db";
import { verificationTokens } from "@/db/schema";
import { eq, and, gt, lt } from "drizzle-orm";

export interface VerificationToken {
  identifier: string;
  token: string;
  expires: Date;
  created_at: Date;
}

/**
 * Generate a simple random token
 */
function generateSimpleToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  
  // Generate a 64-character random string
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Add timestamp to make it more unique
  return token + Date.now().toString(36);
}

/**
 * Create a verification token for email magic link
 */
export async function createVerificationToken(email: string): Promise<string> {
  // Generate a simple random token
  const token = generateSimpleToken();
  
  // Set expiration to 24 hours from now
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  // Delete any existing tokens for this email
  await db()
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, email));
  
  // Insert new token
  await db().insert(verificationTokens).values({
    identifier: email,
    token,
    expires,
    created_at: new Date(),
  });
  
  return token;
}

/**
 * Verify and consume a verification token
 */
export async function verifyAndConsumeToken(token: string): Promise<string | null> {
  const now = new Date();
  
  // Find the token that hasn't expired
  const tokenRecord = await db()
    .select()
    .from(verificationTokens)
    .where(
      and(
        eq(verificationTokens.token, token),
        gt(verificationTokens.expires, now)
      )
    )
    .limit(1);
  
  if (tokenRecord.length === 0) {
    return null; // Token not found or expired
  }
  
  const record = tokenRecord[0];
  
  // Delete the token (consume it)
  await db()
    .delete(verificationTokens)
    .where(eq(verificationTokens.token, token));
  
  return record.identifier; // Return the email
}

/**
 * Clean up expired tokens
 */
export async function cleanupExpiredTokens(): Promise<void> {
  const now = new Date();
  
  await db()
    .delete(verificationTokens)
    .where(
      lt(verificationTokens.expires, now) // Use lt for less than
    );
}
