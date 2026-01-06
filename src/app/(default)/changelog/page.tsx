import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Zap,
  Bot,
  Globe,
  Shield,
  Code
} from "lucide-react";
import Link from "next/link";
import { buildStaticMetadata } from "@/lib/seo";

export const metadata = buildStaticMetadata("/changelog");

export default function ChangelogPage() {
  const releases = [
    {
      version: "2.1.0",
      date: "August 2025",
      type: "major",
      title: "Multi-Agent Conversations",
      description: "Introducing collaborative AI discussions with multiple perspectives",
      features: [
        "Multiple AI agents can now collaborate in a single conversation",
        "Choose from different agent personalities and expertise areas",
        "Enhanced cross-domain knowledge synthesis",
        "Improved context sharing between agents"
      ]
    },
    {
      version: "2.0.5",
      date: "July 2025", 
      type: "minor",
      title: "Enhanced Research Tools",
      description: "Improved research capabilities and user experience",
      features: [
        "Real-time information retrieval integration",
        "Better document analysis and summarization",
        "Enhanced code analysis and explanation",
        "Improved conversation memory and context"
      ]
    },
    {
      version: "2.0.0",
      date: "June 2025",
      type: "major", 
      title: "CanvasChat 2.0 Launch",
      description: "Complete platform redesign with advanced AI models",
      features: [
        "Integration with GPT-4o, Claude 3.5, and Gemini Pro",
        "New modern UI with improved accessibility",
        "Enhanced conversation management",
        "Advanced prompt engineering for better responses",
        "Multi-language support"
      ]
    },
    {
      version: "1.8.2",
      date: "May 2025",
      type: "patch",
      title: "Performance & Stability",
      description: "Bug fixes and performance improvements",
      features: [
        "Faster response times for AI conversations",
        "Fixed memory issues with long conversations",
        "Improved error handling and user feedback",
        "Enhanced mobile responsiveness"
      ]
    },
    {
      version: "1.8.0",
      date: "April 2025",
      type: "minor",
      title: "Advanced Analytics",
      description: "New insights and conversation analytics",
      features: [
        "Conversation analytics dashboard",
        "Usage insights and patterns",
        "Export conversations to various formats",
        "Enhanced search within conversation history"
      ]
    },
    {
      version: "1.7.5",
      date: "March 2025",
      type: "minor",
      title: "Creative Tools Update",
      description: "Enhanced creative writing and brainstorming features",
      features: [
        "Creative writing assistant modes",
        "Brainstorming session templates",
        "Idea organization and clustering",
        "Enhanced prompt suggestions"
      ]
    },
    {
      version: "1.7.0",
      date: "February 2025",
      type: "minor",
      title: "Research Assistant Pro",
      description: "Professional research tools and features",
      features: [
        "Academic citation assistance",
        "Research methodology guidance",
        "Literature review support",
        "Data analysis conversation modes"
      ]
    },
    {
      version: "1.6.0",
      date: "January 2025",
      type: "minor",
      title: "Collaboration Features",
      description: "Team collaboration and sharing capabilities",
      features: [
        "Share conversations with team members",
        "Collaborative research projects",
        "Team workspace management",
        "Enhanced permission controls"
      ]
    }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "major":
        return "bg-green-100 text-green-800 border-green-200";
      case "minor":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "patch":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Product Updates</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            Changelog &
            <span className="block text-primary">Updates</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Stay up-to-date with the latest features, improvements, and fixes in CanvasChat
          </p>
        </div>
      </section>

      {/* Changelog Timeline */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {releases.map((release, index) => (
              <Card key={release.version} className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(release.type)}`}>
                          v{release.version}
                        </span>
                        <span className="text-sm text-muted-foreground">{release.date}</span>
                      </div>
                      <CardTitle className="text-xl mb-2">{release.title}</CardTitle>
                      <CardDescription className="text-base">
                        {release.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {release.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/20 rounded-xl my-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Coming Soon
          </h2>
          <p className="text-xl text-muted-foreground">
            Exciting features we're working on for future releases
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">AI Model Marketplace</CardTitle>
              <CardDescription>
                Access specialized AI models for different domains and use cases
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Live Web Integration</CardTitle>
              <CardDescription>
                Real-time web search and data integration within conversations
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">API & Integrations</CardTitle>
              <CardDescription>
                Connect CanvasChat with your favorite tools and workflows
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="container mx-auto px-4 py-16">
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="text-center py-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Stay Updated
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get notified about new features, updates, and improvements to CanvasChat.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-6 text-lg h-auto" asChild>
                <Link href="/yan">
                  Try Latest Features <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg h-auto" asChild>
                <Link href="/roadmap">
                  View Roadmap
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
