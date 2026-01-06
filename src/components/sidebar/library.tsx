"use client";

import { IconDots } from "@tabler/icons-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Library as LibraryType } from "@/types/base";
import Icon from "@/components/icon";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

type LibraryProps = {
  library: LibraryType;
  menuButtonClass?: string;
};

const defaultMenuButtonClass =
  "rounded-none border-4 border-black bg-slate-800/90 text-slate-100 font-semibold tracking-[0.12em] uppercase px-4 py-3 shadow-[4px_4px_0_rgba(15,23,42,0.9)] transition duration-150 ease-linear hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary/70";

export function Library({ library, menuButtonClass }: LibraryProps) {
  const pathname = usePathname();
  const buttonClass = menuButtonClass ?? defaultMenuButtonClass;

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="rounded-none border-4 border-black bg-slate-800/90 px-4 py-2 font-black uppercase tracking-[0.18em] text-primary shadow-[3px_3px_0_rgba(15,23,42,0.9)]">
        {library.title}
      </SidebarGroupLabel>
      <SidebarMenu>
        {library.items?.map((item, index) => (
          <SidebarMenuItem key={index}>
            <SidebarMenuButton
              tooltip={item.title}
              className={cn(
                buttonClass,
                "justify-start",
                item.is_active || pathname.endsWith(item.url as string)
                  ? "!bg-primary !text-slate-900 hover:!bg-primary/90 hover:!text-slate-900"
                  : "hover:bg-slate-800/80"
              )}
            >
              <Link
                href={(item.url || "") as any}
                target={item.target}
                className="flex w-full items-center gap-3"
              >
                {item.icon && <Icon name={item.icon} />}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}

        {library.more && (
          <SidebarMenuItem>
            <SidebarMenuButton
              className={cn(
                buttonClass,
                "justify-start bg-slate-800/80 text-slate-300 hover:bg-slate-700/80"
              )}
            >
              <IconDots className="text-sidebar-foreground/70" />
              <span>{library.more.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
