import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface MagicLinkEmailProps {
  email: string;
  url: string;
  host: string;
}

export async function sendMagicLinkEmail({ email, url, host }: MagicLinkEmailProps) {
  // Development mode: log the magic link instead of sending email
  if (process.env.NODE_ENV === "development" || !process.env.RESEND_API_KEY) {
    console.log("📧 Magic Link Email (Development Mode)");
    console.log("To:", email);
    console.log("Magic Link:", url);
    console.log("Host:", host);
    console.log("────────────────────────────────────────");
    return { success: true, data: { id: "dev-mode" } };
  }

  try {
    const data = await resend!.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@mail.canvas.chat",
      to: [email],
      subject: `Sign in to ${process.env.NEXT_PUBLIC_PROJECT_NAME || "CanvasChat"}`,
      html: generateMagicLinkEmailHtml({ email, url, host }),
    });

    return { success: true, data };
  } catch (error) {
    console.error("Failed to send magic link email:", error);
    return { success: false, error };
  }
}

function generateMagicLinkEmailHtml({ email, url, host }: MagicLinkEmailProps) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign in to ${process.env.NEXT_PUBLIC_PROJECT_NAME || "CanvasChat"}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
        }
        .title {
            font-size: 28px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 10px;
        }
        .subtitle {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 32px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #1d4ed8;
        }
        .link-fallback {
            margin-top: 20px;
            padding: 15px;
            background-color: #f3f4f6;
            border-radius: 6px;
            word-break: break-all;
            font-size: 14px;
            color: #6b7280;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }
        .warning {
            margin-top: 20px;
            padding: 15px;
            background-color: #fef3cd;
            border-radius: 6px;
            border-left: 4px solid #f59e0b;
            font-size: 14px;
            color: #92400e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">${process.env.NEXT_PUBLIC_PROJECT_NAME || "CanvasChat"}</div>
        </div>
        
        <div class="title">Sign in to your account</div>
        <div class="subtitle">Hi there! Click the button below to sign in to your account.</div>
        
        <div style="text-align: center;">
            <a href="${url}" class="button">Sign in to ${process.env.NEXT_PUBLIC_PROJECT_NAME || "CanvasChat"}</a>
        </div>
        
        <div class="link-fallback">
            <strong>Or copy and paste this link into your browser:</strong><br>
            ${url}
        </div>
        
        <div class="warning">
            <strong>⚠️ Security Notice:</strong><br>
            • This link will expire in 24 hours<br>
            • If you didn't request this email, you can safely ignore it<br>
            • This link can only be used once
        </div>
        
        <div class="footer">
            <p>This email was sent to ${email}</p>
            <p>If you have any questions, please contact our support team.</p>
            <p>&copy; ${new Date().getFullYear()} ${process.env.NEXT_PUBLIC_PROJECT_NAME || "CanvasChat"}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
  `;
}
