import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Bot, 
  MessageSquare, 
  Zap, 
  Shield, 
  Globe, 
  Code, 
  ArrowRight, 
  CheckCircle,
  Search,
  Lightbulb,
  Users,
  Sparkles,
  Brain,
  Target
} from "lucide-react";
import Link from "next/link";
import { buildStaticMetadata } from "@/lib/seo";

export const metadata = buildStaticMetadata("/features");

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Powerful AI Features</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            Features That
            <span className="block text-primary">Transform Research</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Discover the powerful capabilities that make CanvasChat your ultimate canvas-based AI chat companion
          </p>
        </div>
      </section>

      {/* Core Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Core Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need for deep thinking and research
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Deep Research Conversations</CardTitle>
              <CardDescription>
                Engage in thoughtful, nuanced discussions that go beyond surface-level Q&A. Our AI understands context and provides comprehensive responses.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Multiple AI Perspectives</CardTitle>
              <CardDescription>
                Access different AI models and personalities to examine topics from academic, practical, creative, and critical viewpoints.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Real-time Research</CardTitle>
              <CardDescription>
                Get up-to-date information and insights with our advanced search capabilities integrated directly into conversations.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Idea Development</CardTitle>
              <CardDescription>
                Transform rough concepts into well-structured ideas through collaborative thinking, brainstorming, and systematic refinement.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Context Memory</CardTitle>
              <CardDescription>
                Our AI remembers your conversation history and adapts to your expertise level, interests, and preferred communication style.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Cross-Domain Intelligence</CardTitle>
              <CardDescription>
                Discover unexpected connections between fields - from science to art, business to philosophy, technology to humanities.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Advanced Capabilities */}
      <section className="container mx-auto px-4 py-16 bg-muted/20 rounded-xl my-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Advanced Capabilities
          </h2>
          <p className="text-xl text-muted-foreground">
            Cutting-edge AI features for professional researchers and thinkers
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Multi-Modal Analysis</CardTitle>
              <CardDescription>
                Analyze text, images, documents, and data simultaneously for comprehensive understanding and insights.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Specialized Reasoning</CardTitle>
              <CardDescription>
                Access specialized AI models trained for specific domains like scientific research, creative writing, and technical analysis.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Collaborative Thinking</CardTitle>
              <CardDescription>
                Simulate team discussions with multiple AI perspectives working together to solve complex problems and generate ideas.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Privacy & Security</CardTitle>
              <CardDescription>
                Your conversations are private and secure. We don't store personal data or use your information for training other models.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why CanvasChat Stands Out
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="space-y-4">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <span className="text-2xl">❌</span>
            </div>
            <h3 className="font-bold text-lg">Traditional Search</h3>
            <p className="text-muted-foreground">Static results, no conversation, limited perspective</p>
          </div>
          
          <div className="space-y-4">
            <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="font-bold text-lg">Basic AI Chat</h3>
            <p className="text-muted-foreground">Single perspective, no research depth, generic responses</p>
          </div>
          
          <div className="space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-bold text-lg">CanvasChat</h3>
            <p className="text-muted-foreground">Canvas-based, idea-focused, visual AI collaboration</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="text-center py-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Experience These Features Today
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start your creative journey with CanvasChat's powerful AI features and transform how you visualize ideas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-6 text-lg h-auto" asChild>
                <Link href="/yan">
                  Try Features Now <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
