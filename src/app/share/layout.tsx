import { ReactNode } from "react";
import type { Metadata } from "next";
import { APP_DOMAIN } from "@/lib/config";

const SHARE_SITE_NAME = "CanvasChat";
const SHARE_TITLE = "CanvasChat Shared Canvases";
const SHARE_DESCRIPTION =
  "Browse publicly shared idea canvases created with CanvasChat's AI-powered canvas workspace.";

export const metadata: Metadata = {
  title: {
    template: "%s | Shared Canvas | CanvasChat",
    default: SHARE_TITLE,
  },
  description: SHARE_DESCRIPTION,
  openGraph: {
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
    url: `${APP_DOMAIN}/share`,
    siteName: SHARE_SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SHARE_TITLE,
    description: SHARE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

interface LayoutProps {
  children: ReactNode;
}

export default async function Layout({ children }: LayoutProps) {

  return (
    <div className="flex h-dvh w-full overflow-hidden">{children}</div>
  );
}
