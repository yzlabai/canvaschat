"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SiGithub, SiGoogle } from "react-icons/si";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { signIn } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

function SignFormContent({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  // Check if we're processing a magic link
  useEffect(() => {
    const token = searchParams.get("token");
    const emailParam = searchParams.get("email");
    const provider = searchParams.get("provider");
    const error = searchParams.get("error");

    if (error) {
      toast.error(error.replace(/[_%]/g, " "));
      return;
    }

    if (token && emailParam && provider === "magic-link") {
      // Auto-submit the magic link credentials
      signIn("magic-link", {
        email: emailParam,
        token: token,
        redirect: true,
        callbackUrl: "/",
      });
    }
  }, [searchParams]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsEmailSent(true);
        toast.success("Magic link sent! Check your email.");
      } else {
        toast.error(data.error || "Failed to send magic link");
      }
    } catch (error) {
      console.error("Magic link error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="text-center">
          <CardDescription>
            Please enter your email to receive a magic link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {/* Magic Link Email Form */}
            {!isEmailSent ? (
              <form onSubmit={handleEmailSubmit} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Magic Link"}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="rounded-lg bg-green-50 p-4 text-green-800 border border-green-200">
                  <p className="font-medium">Magic link sent!</p>
                  <p className="text-sm">Check your email and click the link to sign in.</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEmailSent(false);
                    setEmail("");
                  }}
                  className="w-full"
                >
                  Send another link
                </Button>
              </div>
            )}

            {/* OAuth Providers */}
            {(process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true" || 
              process.env.NEXT_PUBLIC_AUTH_GITHUB_ENABLED === "true") && (
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            )}

            <div className="flex flex-col gap-4">
              {process.env.NEXT_PUBLIC_AUTH_GOOGLE_ENABLED === "true" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => signIn("google")}
                >
                  <SiGoogle className="w-4 h-4" />
                  Sign in with Google
                </Button>
              )}
              {process.env.NEXT_PUBLIC_AUTH_GITHUB_ENABLED === "true" && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => signIn("github")}
                >
                  <SiGithub className="w-4 h-4" />
                  Sign in with GitHub
                </Button>
              )}
            </div>
          </div>
          <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary  ">
            By clicking the button, you agree to our{" "}
            <a href="/terms-of-service" target="_blank">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy-policy" target="_blank">
              Privacy Policy
            </a>
            .
          </div>
        </CardContent>
      </Card>
      
    </>
  );
}

export default function SignForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <Suspense fallback={
      <Card>
        <CardHeader className="text-center">
          <CardDescription>
            Loading...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-10 bg-gray-200 rounded mb-4"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    }>
      <SignFormContent className={className} {...props} />
    </Suspense>
  );
}
