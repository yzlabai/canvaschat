import "@/app/globals.css";
import { AppContextProvider } from "@/contexts/app";
import { Metadata } from "next";
import { NextAuthSessionProvider } from "@/auth/session";
import { ThemeProvider } from "@/providers/theme";
import { Toaster } from "@/components/ui/sonner";
import SignModal from "@/components/sign/modal";
import Analytics from "@/components/google-analytics";

const FALLBACK_WEB_URL = "https://canvas.chat";
const siteName = "CanvasChat";
const siteTagline = "Chat on Canvas, Generate Ideas with AI";
const siteDescription =
  "CanvasChat lets you chat on an interactive canvas, visualize conversations, and generate ideas with AI. Built for creative thinkers, researchers, and teams.";

const normalizeSiteUrl = (value?: string | null): string => {
  if (!value) {
    return FALLBACK_WEB_URL;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return FALLBACK_WEB_URL;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/$/, "");
  }

  return `https://${trimmed.replace(/^\/+/, "").replace(/\/$/, "")}`;
};

const siteUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_WEB_URL);
const ogImageUrl = `${siteUrl}/logo.png`;

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}#organization`,
      name: siteName,
      url: siteUrl,
      logo: ogImageUrl,
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}#website`,
      url: siteUrl,
      name: siteName,
      description: siteDescription,
      publisher: {
        "@id": `${siteUrl}#organization`,
      },
    },
  ],
} satisfies Record<string, unknown>;

export async function generateMetadata(): Promise<Metadata> {
  const defaultTitle = `${siteName} – ${siteTagline}`;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      template: "%s | CanvasChat",
      default: defaultTitle,
    },
    description: siteDescription,
    keywords: [
      "AI canvas",
      "chat on canvas",
      "idea generation",
      "visual brainstorming",
      "AI workspace",
      "CanvasChat",
      "collaborative intelligence",
      "AI workspace",
      "LLM tooling",
    ],
    category: "technology",
    openGraph: {
      title: defaultTitle,
      description: siteDescription,
      url: siteUrl,
      siteName,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: ogImageUrl,
          width: 512,
          height: 512,
          alt: `${siteName} logo`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: defaultTitle,
      description: siteDescription,
      images: [ogImageUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
        "max-video-preview": -1,
      },
    },
    creator: siteName,
    publisher: siteName,
    authors: [
      {
        name: `${siteName} Team`,
        url: siteUrl,
      },
    ],
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleAdsenseCode = process.env.NEXT_PUBLIC_GOOGLE_ADCODE || "";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#0f172a" />
        {googleAdsenseCode && (
          <meta name="google-adsense-account" content={googleAdsenseCode} />
        )}
        <link rel="icon" href="/favicon.ico" />
        <link rel="alternate" hrefLang="x-default" href={siteUrl} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>
        <NextAuthSessionProvider>
          <AppContextProvider>
            <ThemeProvider>
              {children}
              <Toaster position="top-center" richColors />
              <SignModal />
            </ThemeProvider>
          </AppContextProvider>
        </NextAuthSessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
