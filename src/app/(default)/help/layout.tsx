import { ReactNode } from "react";

import { buildStaticMetadata } from "@/lib/seo";

export const metadata = buildStaticMetadata("/help");

const siteUrl = (process.env.NEXT_PUBLIC_WEB_URL ?? "https://canvas.chat").replace(/\/$/, "");

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I start a chat on the canvas in CanvasChat?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Create a new canvas from the dashboard, choose the AI models you want to collaborate with, and start chatting to generate and organize ideas visually.",
      },
    },
    {
      "@type": "Question",
      name: "Which AI providers can I connect to CanvasChat?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "CanvasChat supports OpenAI, Anthropic, Google, and other leading models. You can connect your own API keys in the workspace settings.",
      },
    },
    {
      "@type": "Question",
      name: "Can teams collaborate inside CanvasChat?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Shared workspaces, conversation history, and idea canvases let teams visualize ideas together and keep context synced across sessions.",
      },
    },
  ],
  url: `${siteUrl}/help`,
} satisfies Record<string, unknown>;

export default function HelpLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      {children}
    </>
  );
}
