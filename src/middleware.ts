import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

const AUTH_SIGNIN_PATH = "/auth/signin";

export default async function middleware(request: NextRequest) {
  // Check if the request is for a protected route under /yan
  const pathname = request.nextUrl.pathname;

  // Check if path starts with /yan
  const isProtectedRoute = pathname.startsWith('/yan');
  
  if (isProtectedRoute) {
    try {
      // Get the session
      const session = await auth();
      
      if (!session || !session.user) {
        // If no session, redirect to sign-in page
        const signInUrl = new URL(AUTH_SIGNIN_PATH, request.url);
        // Add the current path as a callback URL so user can return after login
        signInUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(signInUrl);
      }
    } catch (error) {
      // If there's an error with auth (e.g., missing secret), redirect to sign-in
      console.error('Auth middleware error:', error);
      const signInUrl = new URL(AUTH_SIGNIN_PATH, request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      signInUrl.searchParams.set('error', 'Authentication error');
      return NextResponse.redirect(signInUrl);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/((?!privacy-policy|terms-of-service|api/|_next|_vercel|yan|.*\\..*).*)",
  ],
};
