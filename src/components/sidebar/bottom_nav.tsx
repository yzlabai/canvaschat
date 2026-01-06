"use client";

import * as React from "react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Nav } from "@/types/base";
import Icon from "@/components/icon";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BottomNavProps = {
  nav: Nav;
  menuButtonClass?: string;
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>;

const defaultMenuButtonClass =
  "rounded-none border-4 border-black bg-slate-800/90 text-slate-100 font-semibold tracking-[0.12em] uppercase px-4 py-3 shadow-[4px_4px_0_rgba(15,23,42,0.9)] transition duration-150 ease-linear hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary/70";

export function BottomNav({
  nav,
  menuButtonClass,
  ...props
}: BottomNavProps) {
  const buttonClass = menuButtonClass ?? defaultMenuButtonClass;

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {nav.items?.map((item, index) => (
            <SidebarMenuItem key={index}>
              <SidebarMenuButton
                asChild
                className={cn(buttonClass, "justify-start hover:bg-slate-800/80")}
              >
                <Link href={item.url as any} target={item.target} className="flex w-full items-center gap-3">
                  {item.icon && <Icon name={item.icon} />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
