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
  Code,
  Users,
  Brain,
  Target,
  Rocket,
  Clock
} from "lucide-react";
import Link from "next/link";
import { buildStaticMetadata } from "@/lib/seo";

export const metadata = buildStaticMetadata("/roadmap");

export default function RoadmapPage() {
  const roadmapItems = [
    {
      quarter: "Q3 2025",
      status: "in-progress",
      title: "Advanced Multi-Agent System",
      description: "Revolutionary multi-agent conversations with specialized AI personalities",
      features: [
        "Specialist AI agents for different domains (Science, Arts, Business, etc.)",
        "Dynamic agent collaboration and debate features",
        "Custom agent personality creation",
        "Agent memory and learning capabilities"
      ],
      progress: 75
    },
    {
      quarter: "Q4 2025", 
      status: "planned",
      title: "Real-Time Intelligence Hub",
      description: "Live data integration and real-time research capabilities",
      features: [
        "Live web search integration within conversations",
        "Real-time data feeds and market information",
        "News and research paper integration",
        "Dynamic fact-checking and verification"
      ],
      progress: 25
    },
    {
      quarter: "Q1 2026",
      status: "planned",
      title: "Collaboration Platform",
      description: "Team-based research and collaboration features",
      features: [
        "Team workspaces and shared conversations",
        "Collaborative research projects",
        "Real-time co-editing and commenting",
        "Advanced permission and access controls"
      ],
      progress: 10
    },
    {
      quarter: "Q2 2026",
      status: "planned", 
      title: "AI Model Marketplace",
      description: "Access to specialized AI models and custom training",
      features: [
        "Third-party AI model integrations",
        "Custom model fine-tuning for specific domains",
        "Model comparison and benchmarking tools",
        "Community-contributed specialized models"
      ],
      progress: 5
    },
    {
      quarter: "Q3 2026",
      status: "planned",
      title: "Enterprise Solutions", 
      description: "Advanced features for enterprise and research institutions",
      features: [
        "On-premise deployment options",
        "Advanced security and compliance features",
        "Custom integrations and API access",
        "Dedicated support and consulting services"
      ],
      progress: 0
    },
    {
      quarter: "Q4 2026",
      status: "vision",
      title: "AI Research Assistant 3.0",
      description: "Next-generation AI research capabilities",
      features: [
        "Autonomous research project management",
        "Advanced data analysis and visualization",
        "Scientific paper writing assistance",
        "Experimental design and methodology guidance"
      ],
      progress: 0
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in-progress":
        return "bg-green-100 text-green-800 border-green-200";
      case "planned":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "vision":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "in-progress":
        return <Zap className="h-4 w-4" />;
      case "planned":
        return <Clock className="h-4 w-4" />;
      case "vision":
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
            <Rocket className="h-4 w-4" />
            <span className="text-sm font-medium">Future Roadmap</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            Product
            <span className="block text-primary">Roadmap</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Discover what's coming next in CanvasChat's evolution as the ultimate canvas-based AI chat platform
          </p>
        </div>
      </section>

      {/* Current Focus */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Our Current Focus
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            What we're actively working on right now
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <Bot className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Multi-Agent Conversations</CardTitle>
              <CardDescription>
                Multiple AI personalities collaborating in real-time discussions
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Enhanced Intelligence</CardTitle>
              <CardDescription>
                Improved reasoning, context understanding, and knowledge synthesis
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-2 border-purple-200 bg-purple-50">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Real-Time Data</CardTitle>
              <CardDescription>
                Live web integration and real-time information retrieval
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Roadmap Timeline */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Development Timeline
          </h2>
          
          <div className="space-y-8">
            {roadmapItems.map((item, index) => (
              <Card key={item.quarter} className="border-2 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          {item.quarter}
                        </span>
                        {item.progress > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all duration-300" 
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{item.progress}%</span>
                          </div>
                        )}
                      </div>
                      <CardTitle className="text-xl mb-2">{item.title}</CardTitle>
                      <CardDescription className="text-base">
                        {item.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {item.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <div className="h-5 w-5 flex-shrink-0 mt-0.5">
                          {item.status === 'in-progress' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                          )}
                        </div>
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

      {/* Community Input */}
      <section className="container mx-auto px-4 py-16 bg-muted/20 rounded-xl my-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Shape Our Future
          </h2>
          <p className="text-xl text-muted-foreground">
            Your feedback helps us prioritize and improve our roadmap
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Community Feedback</CardTitle>
              <CardDescription>
                Join our community discussions and help us understand what features matter most to researchers and thinkers like you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <Link href="/contact">
                  Share Your Ideas
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Feature Requests</CardTitle>
              <CardDescription>
                Have a specific feature in mind? We're always looking for ways to make CanvasChat more powerful and useful.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <Link href="mailto:info@yzlab.cn?subject=Feature Request">
                  Request Feature
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="text-center py-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Be Part of the Journey
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start using CanvasChat today and experience the features that are shaping the future of AI-powered canvas collaboration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-6 text-lg h-auto" asChild>
                <Link href="/yan">
                  Start Research <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg h-auto" asChild>
                <Link href="/changelog">
                  View Updates
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
