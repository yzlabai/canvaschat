"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowRight,
  BookOpen,
  Search,
  Code,
  MessageSquare,
  PlayCircle,
  Download,
  ExternalLink,
  ChevronRight,
  Lightbulb,
  Zap,
  Shield,
  Users
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const documentationSections = [
    {
      title: "Getting Started",
      description: "Learn the basics of using CanvasChat for visual AI chat and ideation",
      icon: PlayCircle,
      articles: [
        { title: "Quick Start Guide", description: "Get up and running in 5 minutes" },
        { title: "Your First Conversation", description: "Tips for effective AI research conversations" },
        { title: "Understanding AI Responses", description: "How to interpret and build on AI insights" },
        { title: "Setting Up Your Profile", description: "Customize your research preferences" }
      ]
    },
    {
      title: "Research Techniques",
      description: "Advanced methods for getting the most from AI-assisted research",
      icon: Lightbulb,
      articles: [
        { title: "Multi-Perspective Analysis", description: "Exploring topics from different viewpoints" },
        { title: "Deep Dive Conversations", description: "Techniques for comprehensive topic exploration" },
        { title: "Creative Problem Solving", description: "Using AI for innovative thinking" },
        { title: "Research Question Formulation", description: "Crafting effective research questions" }
      ]
    },
    {
      title: "Features & Tools",
      description: "Detailed guides for all CanvasChat features",
      icon: Zap,
      articles: [
        { title: "Conversation Management", description: "Organizing and navigating your research sessions" },
        { title: "AI Model Selection", description: "Choosing the right AI for your task" },
        { title: "Export & Sharing", description: "Saving and sharing your research insights" },
        { title: "Advanced Settings", description: "Customizing your AI interaction preferences" }
      ]
    },
    {
      title: "API Reference",
      description: "Technical documentation for developers",
      icon: Code,
      articles: [
        { title: "Authentication", description: "API keys and authentication methods" },
        { title: "Conversation API", description: "Programmatic access to AI conversations" },
        { title: "Webhooks", description: "Real-time notifications and integrations" },
        { title: "Rate Limits", description: "Understanding API usage limits" }
      ]
    },
    {
      title: "Account & Billing",
      description: "Managing your account and subscription",
      icon: Users,
      articles: [
        { title: "Account Settings", description: "Managing your profile and preferences" },
        { title: "Subscription Plans", description: "Understanding features and limits" },
        { title: "Billing & Payments", description: "Payment methods and billing cycles" },
        { title: "Usage Analytics", description: "Tracking your research activity" }
      ]
    },
    {
      title: "Privacy & Security",
      description: "Data protection and security practices",
      icon: Shield,
      articles: [
        { title: "Data Privacy", description: "How we protect your research data" },
        { title: "Security Features", description: "Encryption and security measures" },
        { title: "GDPR Compliance", description: "Data rights and compliance" },
        { title: "Data Retention", description: "How long we keep your data" }
      ]
    }
  ];

  const quickLinks = [
    { title: "API Quickstart", href: "/api/quickstart", icon: Code },
    { title: "Research Templates", href: "/templates", icon: BookOpen },
    { title: "Video Tutorials", href: "/tutorials", icon: PlayCircle },
    { title: "Community Forum", href: "/community", icon: MessageSquare }
  ];

  const popularArticles = [
    "How to ask better research questions",
    "Understanding AI model differences", 
    "Privacy and data security",
    "Exporting conversation transcripts",
    "Setting up API access"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
            <BookOpen className="h-4 w-4" />
            <span className="text-sm font-medium">Documentation</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            CanvasChat
            <span className="block text-primary">Documentation</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Everything you need to master AI-assisted research and get the most from CanvasChat
          </p>
          
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Quick Access
          </h2>
          <p className="text-xl text-muted-foreground">
            Jump to the most useful resources
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickLinks.map((link, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors group cursor-pointer">
              <CardHeader className="text-center">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <link.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {link.title}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Documentation Sections */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Browse Documentation
          </h2>
          <p className="text-xl text-muted-foreground">
            Comprehensive guides and references organized by topic
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {documentationSections.map((section, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <section.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{section.title}</CardTitle>
                    <CardDescription className="text-base">
                      {section.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {section.articles.map((article, articleIndex) => (
                    <div key={articleIndex} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                      <div className="flex-1">
                        <h4 className="font-medium group-hover:text-primary transition-colors">
                          {article.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {article.description}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Popular Articles */}
      <section className="container mx-auto px-4 py-16 bg-muted/20 rounded-xl my-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Popular Articles
          </h2>
          <p className="text-xl text-muted-foreground">
            Most accessed documentation this week
          </p>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <div className="space-y-3">
            {popularArticles.map((article, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-background rounded-lg border hover:border-primary/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <span className="text-primary font-bold text-sm">#{index + 1}</span>
                  <span className="group-hover:text-primary transition-colors">{article}</span>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Resources */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Developer Resources
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Build integrations and automate your research workflows with our comprehensive API documentation and SDKs.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                  <Code className="h-4 w-4 text-primary" />
                </div>
                <span>RESTful API with full conversation access</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                  <Download className="h-4 w-4 text-primary" />
                </div>
                <span>SDKs for Python, JavaScript, and more</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                  <PlayCircle className="h-4 w-4 text-primary" />
                </div>
                <span>Interactive examples and tutorials</span>
              </div>
            </div>
          </div>
          
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                  <Code className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">API Reference</h3>
                <p className="text-muted-foreground">
                  Complete API documentation with examples, authentication guides, and best practices.
                </p>
                <Button asChild>
                  <Link href="/api">
                    View API Docs <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Help & Support */}
      <section className="container mx-auto px-4 py-16">
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="text-center py-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Still Need Help?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Can't find what you're looking for? Our support team is here to help you succeed with CanvasChat.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-6 text-lg h-auto" asChild>
                <Link href="/contact">
                  Contact Support <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg h-auto" asChild>
                <Link href="/help">
                  Visit Help Center
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
