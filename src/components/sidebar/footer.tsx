"use client";

import { useSidebar } from "@/components/ui/sidebar";

import Icon from "@/components/icon";
import { Social as SocialType } from "@/types/base";
import ThemeToggle from "@/components/theme/toggle";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export default function ({ social }: { social: SocialType }) {
  const { open } = useSidebar();

  const handleTabChange = (value: string) => {
    console.log(value);
  };

  return (
    <>
      {open ? (
        <div
          className="mx-auto flex w-full items-center justify-center gap-4 border-t-4 border-black bg-slate-900/80 px-4 py-4 text-slate-200 shadow-[4px_4px_0_rgba(15,23,42,0.9)]"
          style={{ imageRendering: "pixelated" }}
        >
          {social?.items?.map((item, idx: number) => (
            <div className="cursor-pointer transition hover:-translate-y-0.5 hover:text-primary" key={idx}>
              <Link
                href={item.url as any}
                target={item.target || "_self"}
                className="cursor-pointer"
              >
                {item.icon && <Icon name={item.icon} className="text-xl" />}
              </Link>
            </div>
          ))}
          <Separator orientation="vertical" className="h-6 bg-black" />
          <ThemeToggle />
        </div>
      ) : null}
    </>
  );
}
