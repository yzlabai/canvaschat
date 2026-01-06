import type { Metadata, ResolvingMetadata } from "next";
import type { MetadataRoute } from "next";

export type StaticSeoConfig = {
  path: string;
  title: string;
  description: string;
  keywords?: string[];
  changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority?: MetadataRoute.Sitemap[number]["priority"];
  disableTemplate?: boolean;
};

export const staticSeoConfig: StaticSeoConfig[] = [
  {
    path: "/",
    title: "CanvasChat – Chat on Canvas, Generate Ideas with AI",
    description:
      "CanvasChat lets you chat on an interactive canvas, visualize conversations, and generate ideas with AI. Built for creative thinkers, researchers, and teams.",
    keywords: [
      "CanvasChat",
      "canvas chat",
      "AI canvas",
      "idea generation",
      "visual brainstorming",
      "AI workspace",
    ],
    changeFrequency: "weekly",
    priority: 1,
    disableTemplate: true,
  },
  {
    path: "/about",
    title: "About CanvasChat",
    description:
      "Learn the mission, values, and team behind CanvasChat, the AI-powered canvas platform for visual idea generation and collaborative chat.",
    keywords: ["about canvaschat", "ai canvas mission", "team", "company story"],
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/features",
    title: "CanvasChat Features",
    description:
      "Discover CanvasChat's interactive canvas, AI idea generation, and collaborative tools that help you visualize, organize, and develop ideas.",
    keywords: [
      "canvaschat features",
      "canvas features",
      "idea generation",
      "visual workspace",
    ],
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/explore",
    title: "Explore Shared Canvases",
    description:
      "Browse CanvasChat's public idea canvases curated by the community and see how creators use the canvas to develop ideas.",
    keywords: [
      "canvaschat explore",
      "public idea canvases",
      "ai brainstorming gallery",
      "shared canvas workspace",
    ],
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    path: "/explore",
    title: "Explore Shared CanvasChat Canvases",
    description:
      "Browse public CanvasChat idea canvases shared by the community and open any canvas to explore the full interactive workspace.",
    keywords: [
      "canvaschat explore",
      "public idea canvas",
      "shared canvas",
      "community gallery",
    ],
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    path: "/blog",
    title: "CanvasChat Blog",
    description:
      "Insights on canvas-based AI, visual thinking methodologies, and the future of human-AI collaboration from the CanvasChat team.",
    keywords: ["ai canvas blog", "visual thinking insights", "canvaschat blog"],
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    path: "/docs",
    title: "CanvasChat Documentation",
    description:
      "Explore CanvasChat documentation and quick-start guides to configure your canvas, manage workspaces, and collaborate with AI.",
    keywords: ["canvaschat docs", "documentation", "ai setup", "getting started"],
    changeFrequency: "weekly",
    priority: 0.6,
  },
  {
    path: "/help",
    title: "CanvasChat Help Center",
    description:
      "Access tutorials, troubleshooting tips, and best practices for using CanvasChat's AI canvas workspace effectively.",
    keywords: ["canvaschat support", "help center", "ai help", "faq"],
    changeFrequency: "weekly",
    priority: 0.6,
  },
  {
    path: "/roadmap",
    title: "CanvasChat Product Roadmap",
    description:
      "Track upcoming CanvasChat releases, canvas improvements, and AI tooling we are building next.",
    keywords: ["canvaschat roadmap", "product roadmap", "ai roadmap"],
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/changelog",
    title: "CanvasChat Changelog",
    description:
      "See the latest updates, fixes, and enhancements to the CanvasChat AI canvas platform.",
    keywords: ["canvaschat changelog", "release notes", "product updates"],
    changeFrequency: "weekly",
    priority: 0.6,
  },
  {
    path: "/status",
    title: "CanvasChat Status",
    description:
      "Check live service availability, uptime metrics, and historical incidents for the CanvasChat platform.",
    keywords: ["canvaschat status", "service status", "uptime", "incident history"],
    changeFrequency: "daily",
    priority: 0.5,
  },
  {
    path: "/careers",
    title: "CanvasChat Careers",
    description:
      "Join the CanvasChat team and build the next generation of canvas-based AI assistants and collaboration tools.",
    keywords: ["canvaschat careers", "ai jobs", "machine learning jobs"],
    changeFrequency: "monthly",
    priority: 0.4,
  },
  {
    path: "/contact",
    title: "Contact CanvasChat",
    description:
      "Reach the CanvasChat team for product questions, partnerships, or enterprise collaborations.",
    keywords: ["contact canvaschat", "support", "ai partnerships"],
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/cookies",
    title: "CanvasChat Cookie Policy",
    description:
      "Understand how CanvasChat uses cookies and similar technologies to deliver secure, personalized AI canvas experiences.",
    keywords: ["cookie policy", "privacy", "data usage"],
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    path: "/privacy-policy",
    title: "CanvasChat Privacy Policy",
    description:
      "Review how CanvasChat collects, stores, and protects personal data across the AI canvas platform and services.",
    keywords: ["privacy policy", "data protection", "gdpr"],
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    path: "/terms-of-service",
    title: "CanvasChat Terms of Service",
    description:
      "Read the CanvasChat Terms of Service covering acceptable use, user responsibilities, and platform guidelines.",
    keywords: ["terms of service", "tos", "user agreement"],
    changeFrequency: "yearly",
    priority: 0.3,
  },
];

export const seoConfigByPath = staticSeoConfig.reduce<Record<string, StaticSeoConfig>>(
  (acc, config) => {
    acc[config.path] = config;
    return acc;
  },
  {},
);

export const marketingPaths = staticSeoConfig.map((config) => config.path);

export function buildStaticMetadata(path: string, _parent?: ResolvingMetadata): Metadata {
  const config = seoConfigByPath[path];

  if (!config) {
    throw new Error(`Missing SEO config for path: ${path}`);
  }

  const title: Metadata["title"] = config.disableTemplate
    ? { absolute: config.title }
    : config.title;

  const canonical = path === "/" ? "/" : path;

  return {
    title,
    description: config.description,
    keywords: config.keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title: config.title,
      description: config.description,
      url: canonical,
    },
    twitter: {
      title: config.title,
      description: config.description,
    },
  };
}

export function getSitemapEntries() {
  return staticSeoConfig.filter((config) => config.priority !== undefined);
}
