import { NextRequest } from "next/server";
import { redirect } from "next/navigation";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return redirect("/auth/signin?error=Invalid%20magic%20link");
  }

  // Redirect to sign-in page with token and email as parameters
  // The sign-in form will handle the magic link verification
  const signinUrl = `/auth/signin?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}&provider=magic-link`;
  
  return redirect(signinUrl);
}
