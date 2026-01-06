/**
 * User-related type definitions aligned with database schema
 * These interfaces correspond to the database tables and provide
 * type safety for user data throughout the application.
 */
import { ProviderType } from "next-auth/providers";

/**
 * Enum for sign-in types
 */
export type SignInType = 'email' | 'oauth' | 'magic-link';

/**
 * Enum for OAuth providers
 */
export type SignInProvider = 'google' | 'github' | 'microsoft' | 'apple';

/**
 * Enum for credit transaction types
 */
export type CreditTransactionType = 'purchase' | 'usage' | 'refund' | 'bonus' | 'subscription' | 'expired';

/**
 * Main user interface corresponding to the `users` table in the database
 * Represents a registered user account in the system
 */
export interface User {
  /** Primary key - auto-generated identity integer */
  id?: number;
  
  /** Unique user identifier - UUID string, used for external references */
  uuid?: string;
  
  /** User's email address - required for account identification */
  email: string;
  
  /** Account creation timestamp */
  created_at?: string | Date;
  
  /** User's display name/nickname */
  nickname?: string;
  
  /** URL to user's profile avatar image */
  avatar_url?: string;
  
  /** User's preferred locale/language (e.g., 'en', 'zh-CN') */
  locale?: string;
  
  /** Type of sign-in method used */
  signin_type?: ProviderType | SignInType;
  
  /** IP address from last sign-in for security tracking */
  signin_ip?: string;
  
  /** OAuth provider name */
  signin_provider?: string;
  
  /** OpenID identifier from OAuth provider */
  signin_openid?: string;
  
  /** Last profile update timestamp */
  updated_at?: string | Date;
  
  /** User's credit information - aggregated from credits table */
  credits?: UserCredits;
  
  /** User's referral invite code for affiliate system */
  invite_code?: string;
  
  /** UUID of the user who invited this user */
  invited_by?: string;
  
  /** Whether user is part of affiliate program */
  is_affiliate?: boolean;
}

/**
 * User credit information aggregated from multiple sources
 * This is a computed interface that combines data from credits and orders tables
 * to provide a comprehensive view of user's credit status
 */
export interface UserCredits {
  /** One-time purchased credits that don't expire monthly */
  one_time_credits?: number;
  
  /** Monthly subscription credits that reset each billing cycle */
  monthly_credits?: number;
  
  /** Total credits available to the user (one_time + monthly) */
  total_credits?: number;
  
  /** Number of credits already consumed by the user */
  used_credits?: number;
  
  /** Remaining credits available for use */
  left_credits: number;
  
  /** Free trial or promotional credits given to user */
  free_credits?: number;
}

/**
 * Credit transaction record corresponding to the `credits` table
 * Represents individual credit movements (additions/deductions)
 */
export interface CreditTransaction {
  /** Primary key - auto-generated identity integer */
  id?: number;
  
  /** Unique transaction number for audit trail */
  trans_no: string;
  
  /** Transaction creation timestamp */
  created_at?: string | Date;
  
  /** UUID of the user this transaction affects */
  user_uuid: string;
  
  /** Type of transaction */
  trans_type: CreditTransactionType;
  
  /** Credit amount (positive for additions, negative for deductions) */
  credits: number;
  
  /** Optional memo for tracking source */
  memo?: string;
  
  /** When these credits expire */
  expired_at?: string | Date;
}

/**
 * Verification token for email magic links
 * Corresponds to the `verification_tokens` table
 */
export interface VerificationToken {
  /** Primary key - auto-generated identity integer */
  id?: number;
  
  /** Email address being verified */
  identifier: string;
  
  /** Unique verification token */
  token: string;
  
  /** When this token expires */
  expires: string | Date;
  
  /** Token creation timestamp */
  created_at: string | Date;
}

/**
 * Utility types for better type safety
 */

/** User creation payload (omits auto-generated fields) */
export type CreateUserPayload = Omit<User, 'id' | 'uuid' | 'created_at' | 'updated_at' | 'credits'> & {
  email: string;
};

/** User update payload (only updatable fields) */
export type UpdateUserPayload = Partial<Pick<User, 'nickname' | 'avatar_url' | 'locale'>>;

/** Credit transaction creation payload (omits auto-generated fields) */
export type CreateCreditTransactionPayload = Omit<CreditTransaction, 'id' | 'created_at'>;

/** User with populated credits information */
export type UserWithCredits = User & {
  credits: UserCredits;
};

/** User summary for display purposes (limited fields for privacy) */
export type UserSummary = Pick<User, 'uuid' | 'email' | 'nickname' | 'avatar_url' | 'created_at'>;

/**
 * Database relationship helpers
 */

/** User with their credit transactions */
export interface UserWithCreditTransactions extends User {
  creditTransactions?: CreditTransaction[];
}

/** Complete user profile with all related data */
export interface CompleteUserProfile extends User {
  creditTransactions?: CreditTransaction[];
  credits: UserCredits;
}
