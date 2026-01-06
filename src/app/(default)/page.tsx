import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { buildStaticMetadata } from "@/lib/seo";

export const metadata = buildStaticMetadata("/");

export default function LandingPage() {
  const gridOverlayStyle = {
    backgroundImage:
      "linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)",
    backgroundSize: "48px 48px",
  } as const;

  const panelClass =
    "border-4 border-black bg-slate-900/95 px-8 py-10 text-slate-100 shadow-[6px_6px_0_0_rgba(15,23,42,0.9)] rounded-none";

  return (
    <div className="min-h-screen bg-white text-slate-900" style={gridOverlayStyle}>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto text-center space-y-10">
          <div className={`${panelClass} bg-slate-900/90`}>
            <h1 className="text-4xl text-primary md:text-6xl font-black uppercase tracking-[0.08em] drop-shadow-[4px_4px_0_rgba(2,6,23,0.8)]">
              Chat on Canvas
            </h1>
            <p className="mt-6 text-lg md:text-2xl text-slate-200 leading-relaxed max-w-3xl mx-auto">
              Generate Ideas with AI
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center" style={{ imageRendering: "pixelated" }}>
              <Button
                size="lg"
                className="h-auto px-10 py-5 text-lg font-bold uppercase rounded-none border-4 border-black bg-primary text-white shadow-[4px_4px_0_rgba(2,6,23,0.9)] hover:bg-primary/80"
                asChild
              >
                <Link href="/yan">
                  Press Start <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                className="h-auto px-10 py-5 text-lg font-bold uppercase rounded-none border-4 border-black bg-slate-100 text-slate-900 shadow-[4px_4px_0_rgba(2,6,23,0.9)] hover:bg-slate-200"
                asChild
              >
                <Link href="/explore">
                  Explore Ideas <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3" style={{ imageRendering: "pixelated" }}>
            {[{
              label: "Fast Chat",
              value: "01",
              description: "Hyper-responsive dialogue",
            },
            {
              label: "Ideas Canvas",
              value: "02",
              description: "Space for creative thinking",
            },
            {
              label: "Long Research",
              value: "03",
              description: "Automatic knowledge tracking",
            }].map((item) => (
              <div
                key={item.label}
                className={`${panelClass} bg-slate-900 text-left font-mono uppercase text-xs tracking-[0.28em]`}
              >
                <p className="text-sm text-green-300">Mission {item.value}</p>
                <h2 className="mt-3 text-xl text-yellow-300">{item.label}</h2>
                <p className="mt-2 text-sm text-slate-300 normal-case tracking-normal">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className={`${panelClass} bg-slate-900 text-center`}>
          <CardContent className="space-y-8">
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-[0.14em] text-slate-100">
              Insert Coin to Continue Your Quest
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center" style={{ imageRendering: "pixelated" }}>
              <Button
                size="lg"
                className="h-auto px-10 py-5 text-lg font-bold uppercase rounded-none border-4 border-black bg-primary text-slate-200 shadow-[4px_4px_0_rgba(2,6,23,0.9)] hover:bg-primary/80"
                asChild
              >
                <Link href="/yan">
                  Continue Game <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-8">
          <footer className={`${panelClass} bg-slate-900/95 text-slate-200`}>
            <div className="flex flex-col items-center justify-between gap-10 text-center lg:flex-row lg:text-left">
              <div className="flex w-full max-w-96 shrink flex-col items-center justify-between gap-6 lg:items-start">
                <div className="flex items-center justify-center gap-3 lg:justify-start" style={{ imageRendering: "pixelated" }}>
                  <img
                    src="/logo.png"
                    alt="CanvasChat"
                    className="h-11 border-4 border-black shadow-[4px_4px_0_rgba(2,6,23,0.9)]"
                  />
                  <p className="text-3xl font-black uppercase tracking-[0.2em] text-slate-100">
                    CanvasChat
                  </p>
                </div>
                <p className="mt-6 text-sm text-slate-300">
                  Chat on canvas, generate ideas with AI—crafted for creative thinkers and visual builders.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 lg:gap-20 text-left">
                <div>
                  <p className="mb-6 font-black uppercase tracking-[0.18em] text-primary">Modes</p>
                  <ul className="space-y-4 text-sm">
                    <li className="font-medium hover:text-primary">
                      <a href="/yan#fast-chat">Fast Chat</a>
                    </li>
                    <li className="font-medium hover:text-primary">
                      <a href="/yan#ideas-canvas">Ideas Canvas</a>
                    </li>
                    <li className="font-medium hover:text-primary">
                      <a href="/yan#long-research">Long Research</a>
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="mb-6 font-black uppercase tracking-[0.18em] text-primary">Community</p>
                  <ul className="space-y-4 text-sm">
                    <li className="font-medium hover:text-primary">
                      <a href="/blog">Blog</a>
                    </li>
                    <li className="font-medium hover:text-primary">
                      <a href="/roadmap">Roadmap</a>
                    </li>
                    <li className="font-medium hover:text-primary">
                      <a href="/changelog">Changelog</a>
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="mb-6 font-black uppercase tracking-[0.18em] text-primary">Support</p>
                  <ul className="space-y-4 text-sm">
                    <li className="font-medium hover:text-primary">
                      <a href="/docs">Manual</a>
                    </li>
                    <li className="font-medium hover:text-primary">
                      <a href="/help">Help Center</a>
                    </li>
                    <li className="font-medium hover:text-primary">
                      <a href="/status">System Status</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="mt-10 flex flex-col justify-between gap-4 border-t-4 border-black pt-6 text-center text-sm font-medium text-slate-300 lg:flex-row lg:items-center lg:text-left">
              <p>
                © 2024 CanvasChat. All rights reserved. Contact: revessencehk@gmail.com
              </p>
              <ul className="flex justify-center gap-4 lg:justify-start">
                <li className="hover:text-primary">
                  <a href="/privacy-policy">Privacy</a>
                </li>
                <li className="hover:text-primary">
                  <a href="/terms-of-service">Terms</a>
                </li>
                <li className="hover:text-primary">
                  <a href="/cookies">Cookies</a>
                </li>
              </ul>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}
