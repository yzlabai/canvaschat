import { SupabaseClient } from "@supabase/supabase-js"

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "http://localhost:3000"

export const API_ROUTE_CHAT = "/api/yan/chat"
export const API_ROUTE_CREATE_GUEST = "/api/create-guest"
export const API_ROUTE_UPDATE_CHAT_MODEL = "/api/update-chat-model"
export const API_ROUTE_CSRF = "/api/csrf"


export async function fetchClient(input: RequestInfo, init?: RequestInit) {
  const csrf = document.cookie
    .split("; ")
    .find((c) => c.startsWith("csrf_token="))
    ?.split("=")[1]

  return fetch(input, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      "x-csrf-token": csrf || "",
      "Content-Type": "application/json",
    },
  })
}

export class UsageLimitError extends Error {
  code: string
  constructor(message: string) {
    super(message)
    this.code = "DAILY_LIMIT_REACHED"
  }
}

/**
 * Checks the user's daily usage and increments both overall and daily counters.
 * Resets the daily counter if a new day (UTC) is detected.
 * Uses the `anonymous` flag from the user record to decide which daily limit applies.
 *
 * @param supabase - Your Supabase client.
 * @param userId - The ID of the user.
 * @returns The remaining daily limit.
 */
export async function checkRateLimits(
  userId: string,
  isAuthenticated: boolean
) {
  try {
    const res = await fetchClient(
      `/api/rate-limits?userId=${userId}&isAuthenticated=${isAuthenticated}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    )
    const responseData = await res.json()
    if (!res.ok) {
      throw new Error(
        responseData.error ||
          `Failed to check rate limits: ${res.status} ${res.statusText}`
      )
    }
    return responseData
  } catch (err) {
    console.error("Error checking rate limits:", err)
    throw err
  }
}

/**
 * Updates the model for an existing chat
 */
export async function updateChatModel(chatId: string, model: string) {
  try {
    const res = await fetchClient(API_ROUTE_UPDATE_CHAT_MODEL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, model }),
    })
    const responseData = await res.json()

    if (!res.ok) {
      throw new Error(
        responseData.error ||
          `Failed to update chat model: ${res.status} ${res.statusText}`
      )
    }

    return responseData
  } catch (error) {
    console.error("Error updating chat model:", error)
    throw error
  }
}

/**
 * Signs in user with Google OAuth via Supabase
 */
export async function signInWithGoogle(supabase: SupabaseClient) {
  try {
    const isDev = process.env.NODE_ENV === "development"

    // Get base URL dynamically (will work in both browser and server environments)
    const baseUrl = isDev
      ? "http://localhost:3000"
      : typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_VERCEL_URL
          ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
          : APP_DOMAIN

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${baseUrl}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    })

    if (error) {
      throw error
    }

    // Return the provider URL
    return data
  } catch (err) {
    console.error("Error signing in with Google:", err)
    throw err
  }
}
