"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronsUpDown, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import Icon from "@/components/icon";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { useAppContext } from "@/contexts/app";
import { Account } from "@/types/base";
import { Fragment } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type SidebarUserProps = {
  account?: Account;
  menuButtonClass?: string;
};

const defaultMenuButtonClass =
  "rounded-none  bg-slate-800/90 text-slate-100 font-semibold tracking-[0.12em] uppercase px-4 py-3 transition duration-150 ease-linear focus-visible:ring-2 focus-visible:ring-primary/70";

const iconButtonClass =
  "rounded-none border-4 border-black bg-primary text-slate-900 p-2 shadow-[3px_3px_0_rgba(2,6,23,0.9)] transition-transform duration-150 hover:-translate-y-0.5";

export default function SidebarUser({ account, menuButtonClass }: SidebarUserProps) {
  const { user, setShowSignModal } = useAppContext();
  const { isMobile, open } = useSidebar();

  const buttonClass = defaultMenuButtonClass;
  const totalAccountItems = account?.items?.length ?? 0;

  if (!user) {
    return open ? (
      <div className="flex h-full items-center justify-center px-4 py-4">
        <Button
          className="w-full rounded-none border-4 border-black bg-primary px-6 py-4 text-lg font-black uppercase tracking-[0.12em] text-slate-900 shadow-[4px_4px_0_rgba(2,6,23,0.9)] hover:bg-primary/80"
          onClick={() => setShowSignModal(true)}
        >
          Sign In
        </Button>
      </div>
    ) : (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            className={cn(iconButtonClass, "cursor-pointer justify-center")}
            asChild
          >
            <SidebarTrigger className="size-6" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu className="gap-4">
      {!open && (
        <SidebarMenuItem>
          <SidebarMenuButton
            className={cn(iconButtonClass, "cursor-pointer justify-center")}
            asChild
          >
            <SidebarTrigger className="size-6" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn(
                buttonClass,
                "!h-auto gap-3 text-left normal-case tracking-normal hover:-translate-y-0"
              )}
            >
              <Avatar className="h-8 w-8 rounded-lg bg">
                <AvatarImage src={user?.avatar_url} alt={user?.nickname} />
                <AvatarFallback className="rounded-lg bg-amber-300 text-black">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.nickname}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-none border-4 border-black bg-slate-900/95 text-slate-100 shadow-[4px_4px_0_rgba(15,23,42,0.9)]"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user?.avatar_url} alt={user?.nickname} />
                  <AvatarFallback className="rounded-lg bg-amber-300 text-black">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user?.nickname}</span>
                  <span className="truncate text-xs">{user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {account?.items?.map((item, index) => (
                <Fragment key={index}>
                  <DropdownMenuItem className="cursor-pointer">
                    <Link
                      href={item.url as any}
                      target={item.target}
                      className="flex w-full items-center gap-3"
                    >
                      {item.icon && <Icon name={item.icon} />}
                      {item.title}
                    </Link>
                  </DropdownMenuItem>
                  {index < totalAccountItems - 1 && <DropdownMenuSeparator />}
                </Fragment>
              ))}
              <DropdownMenuItem className="cursor-pointer" onClick={() => signOut()}>
                <LogOut />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
