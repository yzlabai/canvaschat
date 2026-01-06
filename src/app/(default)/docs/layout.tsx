import { ReactNode } from "react";

import { buildStaticMetadata } from "@/lib/seo";

export const metadata = buildStaticMetadata("/docs");

export default function DocsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
