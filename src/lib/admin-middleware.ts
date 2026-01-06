import { NextRequest, NextResponse } from "next/server";
import { checkAdminAccess } from "@/lib/admin";

/**
 * Middleware to protect admin API routes
 * Returns a NextResponse with 401/403 if access is denied, or null if access is allowed
 */
export async function withAdminAuth(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const { isAdmin, userEmail } = await checkAdminAccess();
    
    if (!userEmail) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required. Contact system administrator." },
        { status: 403 }
      );
    }
    
    // User is authenticated and is admin, proceed with the handler
    return await handler(request);
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Higher-order function to wrap API route handlers with admin authentication
 */
export function requireAdmin<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    return withAdminAuth(request, async (req) => handler(req, ...args));
  };
}