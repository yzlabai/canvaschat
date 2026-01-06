"use server";

import { createClient } from "@supabase/supabase-js";

// Create server-side Supabase client for trigger environment
export const createServerSupabaseClient = async () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // Use service role key for server-side operations
  );
}

