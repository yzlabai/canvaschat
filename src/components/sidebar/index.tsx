"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import Nav from "./nav";
import { Sidebar as SidebarType } from "@/types/sidebar";
import Image from "next/image";
import SidebarUser from "./user";
import Footer from "./footer";
import { Library } from "./library";
import { BottomNav } from "./bottom_nav";
import Link from "next/link";

export default function DashboardSidebar({
  sidebar,
  ...props
}: React.ComponentProps<typeof Sidebar> & { sidebar: SidebarType }) {

  const panelClass =
    "border-4 border-black bg-slate-900/95 text-slate-100 shadow-[6px_6px_0_rgba(15,23,42,0.9)] rounded-none";

  const menuButtonBase =
    "rounded-none  border-black bg-slate-800/90 text-slate-100 font-semibold tracking-[0.12em] uppercase px-4 py-3 shadow-[4px_4px_0_rgba(15,23,42,0.9)] transition duration-150 ease-linear hover:-translate-y-0.5 hover:bg-primary/80 hover:text-white focus-visible:ring-2 focus-visible:ring-primary/80";

  return (
    <Sidebar
      collapsible="offcanvas"
      className="bg-black"
      {...props}
    >
      <div
        className={`${panelClass} flex h-full flex-col gap-0 `}
        style={{ imageRendering: "pixelated" }}
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="rounded-none p-4 font-black uppercase hover:bg-amber-300 focus-visible:ring-2 focus-visible:ring-primary/80"
              >
                <Link
                  href={sidebar.brand?.url as any}
                  className="flex items-center gap-3"
                >
                  {sidebar.brand?.logo && (
                    <Image
                      src={sidebar.brand?.logo?.src as any}
                      alt={sidebar.brand?.title as string}
                      width={32}
                      height={32}
                      className="border border-black"
                    />
                  )}
                  <span className="text-lg font-black uppercase tracking-[0.14em]">
                    {sidebar.brand?.title}
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="flex flex-1 flex-col gap-6 overflow-y-auto px-0 py-6">
          {sidebar.nav && <Nav nav={sidebar.nav} menuButtonClass={menuButtonBase} />}
          {sidebar.library && (
            <Library library={sidebar.library} menuButtonClass={menuButtonBase} />
          )}
          {sidebar.bottomNav && (
            <BottomNav
              nav={sidebar.bottomNav}
              className="mt-auto"
              menuButtonClass={menuButtonBase}
            />
          )}
        </SidebarContent>
        <SidebarFooter>
          <SidebarUser account={sidebar.account} menuButtonClass={menuButtonBase} />
          {sidebar?.social && <Footer social={sidebar.social} />}
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}
