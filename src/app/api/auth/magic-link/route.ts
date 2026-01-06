import { NextRequest, NextResponse } from "next/server";
import { createVerificationToken } from "@/services/verification";
import { sendMagicLinkEmail } from "@/services/email";
import { z } from "zod";

const EmailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = EmailSchema.parse(body);

    // Create verification token
    const token = await createVerificationToken(email);

    // Create magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";
    const magicLinkUrl = `${baseUrl}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

    // Send email
    const emailResult = await sendMagicLinkEmail({
      email,
      url: magicLinkUrl,
      host: request.headers.get("host") || "localhost:3000",
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Magic link sent to your email",
    });
  } catch (error) {
    console.error("Magic link request error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
