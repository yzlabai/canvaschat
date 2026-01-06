import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { type CSSProperties, ReactNode } from "react";
import { Sidebar as SidebarType } from "@/types/sidebar";
import DashboardSidebar from "../sidebar";

export default function DashboardLayout({
  children,
  sidebar,
}: {
  children: ReactNode;
  sidebar: SidebarType;
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 60)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <DashboardSidebar variant="inset" sidebar={sidebar} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
