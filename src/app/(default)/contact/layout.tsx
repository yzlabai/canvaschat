import { ReactNode } from "react";

import { buildStaticMetadata } from "@/lib/seo";

export const metadata = buildStaticMetadata("/contact");

const siteUrl = (process.env.NEXT_PUBLIC_WEB_URL ?? "https://canvas.chat").replace(/\/$/, "");

const contactStructuredData = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  url: `${siteUrl}/contact`,
  mainEntity: {
    "@type": "Organization",
    name: "CanvasChat",
    url: siteUrl,
    contactPoint: [
      {
        "@type": "ContactPoint",
        email: "info@yzlab.cn",
        telephone: "+86 133 9712 5912",
        contactType: "customer support",
        areaServed: "Worldwide",
        availableLanguage: ["English"],
      },
    ],
  },
} satisfies Record<string, unknown>;

export default function ContactLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactStructuredData) }}
      />
      {children}
    </>
  );
}
