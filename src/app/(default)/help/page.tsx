"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowRight,
  HelpCircle,
  Search,
  MessageSquare,
  Book,
  PlayCircle,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  Users,
  Lightbulb,
  Settings,
  CreditCard,
  Shield,
  Download,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const helpCategories = [
    {
      title: "Getting Started",
      description: "Learn the basics of using CanvasChat",
      icon: PlayCircle,
      articles: [
        "How to start your first conversation",
        "Understanding AI responses",
        "Tips for effective research questions",
        "Setting up your profile"
      ]
    },
    {
      title: "Account & Billing",
      description: "Manage your subscription and payments",
      icon: CreditCard,
      articles: [
        "Changing your subscription plan",
        "Understanding billing cycles", 
        "Payment methods and security",
        "Canceling your subscription"
      ]
    },
    {
      title: "Features & Tools",
      description: "Make the most of CanvasChat's capabilities",
      icon: Settings,
      articles: [
        "Using different AI models",
        "Conversation management",
        "Exporting and sharing conversations",
        "Advanced settings and preferences"
      ]
    },
    {
      title: "Privacy & Security",
      description: "Your data protection and privacy",
      icon: Shield,
      articles: [
        "Data privacy and security",
        "How we protect your conversations",
        "GDPR and data rights",
        "Account security best practices"
      ]
    },
    {
      title: "Research Techniques",
      description: "Advanced research methodologies",
      icon: Lightbulb,
      articles: [
        "Multi-perspective analysis techniques",
        "Deep dive conversation strategies",
        "Creative problem-solving methods",
        "Research best practices"
      ]
    },
    {
      title: "Troubleshooting",
      description: "Common issues and solutions",
      icon: HelpCircle,
      articles: [
        "Connection and loading issues",
        "AI response quality problems",
        "Account access troubles",
        "Browser compatibility"
      ]
    }
  ];

  const faqItems = [
    {
      question: "How is CanvasChat different from other AI chatbots?",
      answer: "CanvasChat is specifically designed for visual idea generation and canvas-based chat. Unlike general chatbots, we focus on helping you visualize conversations, organize ideas on a canvas, and develop creative thoughts collaboratively."
    },
    {
      question: "Is my conversation data private and secure?",
      answer: "Yes, we take privacy seriously. Your conversations are encrypted, never used to train other models, and you have full control over your data. We comply with GDPR and other privacy regulations."
    },
    {
      question: "Can I use CanvasChat for creative projects?",
      answer: "Absolutely! CanvasChat is designed to assist with creative brainstorming, idea development, visual thinking, and collaborative ideation. Many creators use it as a visual thinking partner."
    },
    {
      question: "What AI models does CanvasChat use?",
      answer: "We integrate multiple state-of-the-art AI models including GPT-4o, Claude 3.5, DeepSeek-R1, and Gemini Pro. You can choose different models based on your specific needs."
    },
    {
      question: "Can I export my conversations?",
      answer: "Yes, you can export your conversations in various formats including PDF, markdown, and plain text. This makes it easy to incorporate insights into your research or projects."
    },
    {
      question: "Is there a free trial or free plan?",
      answer: "We offer a free tier with limited conversations per month. This lets you experience CanvasChat's capabilities before choosing a paid plan for unlimited access."
    }
  ];

  const supportOptions = [
    {
      title: "Live Chat",
      description: "Get instant help from our AI assistant",
      icon: MessageSquare,
      availability: "24/7",
      action: "Start Chat",
      href: "/yan"
    },
    {
      title: "Email Support", 
      description: "Send us a detailed question",
      icon: Mail,
      availability: "Response within 24h",
      action: "Send Email",
      href: "mailto:info@yzlab.cn"
    },
    {
      title: "Community Forum",
      description: "Get help from other users",
      icon: Users,
      availability: "Community moderated",
      action: "Visit Forum",
      href: "/community"
    }
  ];

  const quickActions = [
    { title: "Reset Password", icon: Settings, href: "/reset-password" },
    { title: "Download Data", icon: Download, href: "/data-export" },
    { title: "Contact Support", icon: Mail, href: "/contact" },
    { title: "API Documentation", icon: Book, href: "/docs" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
            <HelpCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Help Center</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            How Can We
            <span className="block text-primary">Help You?</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Find answers, get support, and learn how to make the most of CanvasChat for your creative and visual thinking needs.
          </p>
          
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for help..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Quick Actions
          </h2>
          <p className="text-xl text-muted-foreground">
            Common tasks and helpful links
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors group cursor-pointer">
              <CardHeader className="text-center">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <action.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {action.title}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Help Categories */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Browse Help Topics
          </h2>
          <p className="text-xl text-muted-foreground">
            Find detailed guides organized by category
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {helpCategories.map((category, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <category.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{category.title}</CardTitle>
                    <CardDescription className="text-base">
                      {category.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {category.articles.map((article, articleIndex) => (
                    <div key={articleIndex} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                      <Book className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-sm group-hover:text-primary transition-colors">
                        {article}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/20 rounded-xl my-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground">
            Quick answers to common questions
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto space-y-6">
          {faqItems.map((faq, index) => (
            <Card key={index} className="border-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  {faq.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed pl-8">
                  {faq.answer}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Support Options */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Get Support
          </h2>
          <p className="text-xl text-muted-foreground">
            Multiple ways to get the help you need
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {supportOptions.map((option, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors text-center">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <option.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{option.title}</CardTitle>
                <CardDescription className="mb-4">
                  {option.description}
                </CardDescription>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{option.availability}</span>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full" asChild>
                  <Link href={option.href}>
                    {option.action}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Status & Updates */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              System Status
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-green-800">All Systems Operational</p>
                  <p className="text-sm text-green-600">CanvasChat is running smoothly</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Last updated:</strong> August 7, 2025 at 3:24 PM UTC
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Uptime:</strong> 99.9% this month
                </p>
              </div>
            </div>
          </div>
          
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-8 text-center">
              <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <ExternalLink className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-4">Status Page</h3>
              <p className="text-muted-foreground mb-6">
                Check real-time system status, scheduled maintenance, and incident reports.
              </p>
              <Button asChild>
                <Link href="/status">
                  View Status Page <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Still Need Help */}
      <section className="container mx-auto px-4 py-16">
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="text-center py-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Still Need Help?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Our support team is here to help. Reach out and we'll get you the assistance you need.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-6 text-lg h-auto" asChild>
                <Link href="/contact">
                  Contact Support <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg h-auto" asChild>
                <Link href="/docs">
                  Browse Documentation
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
