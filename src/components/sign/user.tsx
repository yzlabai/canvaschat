"use client";

import * as React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { User } from "@/types/user";
import { signOut } from "next-auth/react";
import { NavItem } from "@/types/base";
import Link from "next/link";

export default function SignUser({ user }: { user: User }) {

  const dropdownItems: NavItem[] = [
    {
      title: user.nickname,
    },
    {
      title: "Account",
      url: "/yan/account",
    },
    {
      title: "Sign Out",
      onClick: () => signOut(),
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer">
          <AvatarImage src={user.avatar_url} alt={user.nickname} />
          <AvatarFallback>{user.nickname}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="mx-4 bg-background">
        {dropdownItems.map((item, index) => (
          <React.Fragment key={index}>
            <DropdownMenuItem
              key={index}
              className="flex justify-center cursor-pointer"
            >
              {item.url ? (
                <Link href={item.url as any} target={item.target}>
                  {item.title}
                </Link>
              ) : (
                <button onClick={item.onClick}>{item.title}</button>
              )}
            </DropdownMenuItem>
            {index !== dropdownItems.length - 1 && <DropdownMenuSeparator />}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
