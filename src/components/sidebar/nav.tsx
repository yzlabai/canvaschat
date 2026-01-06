"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Nav as NavType } from "@/types/base";
import Icon from "@/components/icon";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

type NavProps = {
  nav: NavType;
  menuButtonClass?: string;
};

const defaultMenuButtonClass =
  "rounded-none border-1 border-black bg-slate-800/90 text-slate-100 font-semibold tracking-[0.12em] uppercase transition duration-150 ease-linear hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary/70";

export default function Nav({ nav, menuButtonClass }: NavProps) {
  const pathname = usePathname();
  const buttonClass = menuButtonClass ?? defaultMenuButtonClass;

  return (
    <SidebarGroup>
      <SidebarGroupContent className="mt-6 flex flex-col gap-3">
        <SidebarMenu>
          {nav?.items?.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                className={cn(
                  buttonClass,
                  "justify-start",
                  item.is_active || pathname.endsWith(item.url as string)
                    ? "!bg-primary !text-slate-200 hover:!bg-primary/90 hover:!text-slate-200 active:!bg-primary active:!text-slate-900"
                    : "hover:bg-slate-800/80"
                )}
              >
                {item.url ? (
                  <Link
                    href={item.url as any}
                    target={item.target}
                    className="flex w-full items-center gap-3"
                  >
                    {item.icon && <Icon name={item.icon} />}
                    <span>{item.title}</span>
                  </Link>
                ) : (
                  <>
                    {item.icon && <Icon name={item.icon} />}
                    <span>{item.title}</span>
                  </>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
