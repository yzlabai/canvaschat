"use client";

import SignToggle from "@/components/sign/toggle";
// import ThemeToggle from "@/components/theme/toggle";
import Link from "next/link";

export default function Header() {
  return (
    <section className="py-3">
      <div className="container">
        <nav className="justify-between flex">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="CanvasChat"
                className="w-8"
              />
              <span className="text-xl text-primary font-bold">
                CanvasChat
              </span>
            </Link>
          </div>
          <div className="shrink-0 flex gap-2 items-center">
            {/* <ThemeToggle /> */}
            <SignToggle />
          </div>
        </nav>
      </div>
    </section>
  );
}
