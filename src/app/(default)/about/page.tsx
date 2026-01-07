import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowRight,
  Users,
  Target,
  Heart,
  Lightbulb,
  Globe,
  Award,
  Mail,
  MessageSquare,
  CheckCircle
} from "lucide-react";
import Link from "next/link";
import { buildStaticMetadata } from "@/lib/seo";

export const metadata = buildStaticMetadata("/about");

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
            <Heart className="h-4 w-4" />
            <span className="text-sm font-medium">Our Story</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            About
            <span className="block text-primary">CanvasChat</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We believe that everyone deserves access to intelligent, thoughtful conversation partners that help them think deeper and explore ideas further.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Our Mission
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              CanvasChat exists to democratize access to intelligent visual AI chat and creative thinking partnership. We're building a canvas-based AI platform that doesn't just answer questions - it helps you visualize ideas, explore multiple perspectives, and develop thoughts collaboratively on an interactive canvas.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              In a world of information overload, we provide depth over breadth, quality over quantity, and thoughtful discussion over quick answers.
            </p>
          </div>
          
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                  <Target className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Think Different</h3>
                <p className="text-muted-foreground">
                  We're not building another chatbot. We're creating a thinking partner that helps you explore ideas from angles you might never have considered.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Values Section */}
      <section className="container mx-auto px-4 py-16 bg-muted/20 rounded-xl my-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Our Values
          </h2>
          <p className="text-xl text-muted-foreground">
            The principles that guide everything we build
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Intellectual Curiosity</CardTitle>
              <CardDescription>
                We believe in fostering deep thinking, questioning assumptions, and exploring ideas from multiple perspectives.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Collaborative Intelligence</CardTitle>
              <CardDescription>
                AI should enhance human thinking, not replace it. We build tools that amplify your intelligence and creativity.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Accessible Knowledge</CardTitle>
              <CardDescription>
                Complex ideas and deep research shouldn't be limited to academics. We make sophisticated thinking tools available to everyone.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Quality Over Quantity</CardTitle>
              <CardDescription>
                We focus on providing thoughtful, nuanced responses rather than quick, superficial answers to complex questions.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Respectful Dialogue</CardTitle>
              <CardDescription>
                We promote thoughtful, respectful discourse that considers multiple viewpoints and encourages intellectual humility.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Continuous Learning</CardTitle>
              <CardDescription>
                We're always improving, learning from our users, and evolving our platform to better serve the thinking community.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Story Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              The CanvasChat Story
            </h2>
            <p className="text-xl text-muted-foreground">
              How we started and where we're heading
            </p>
          </div>
          
          <div className="space-y-8">
            <Card>
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-4">The Beginning</h3>
                <p className="text-muted-foreground leading-relaxed">
                  CanvasChat started from a simple observation: most AI assistants were designed to give quick answers, but what creative thinkers, researchers, and curious minds really needed was a visual thinking partner. Someone (or something) that could help them organize ideas on a canvas and explore concepts visually.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-4">The Challenge</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We noticed that traditional search engines and basic AI tools often left people with more questions than answers. Complex topics require nuanced discussion, multiple perspectives, and the ability to build on ideas over time. That's what we set out to create.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-4">The Solution</h3>
                <p className="text-muted-foreground leading-relaxed">
                  CanvasChat combines the latest advances in AI with a deep understanding of how visual thinking works. We've built a platform that lets you chat on a canvas, organize ideas visually, and develop creative concepts through collaborative AI intelligence.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-8">
                <h3 className="text-xl font-bold mb-4">The Future</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We're just getting started. Our vision is to create the world's most intelligent and helpful thinking partner - one that helps individuals and teams tackle the complex challenges of the 21st century through better thinking, deeper research, and more creative problem-solving.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Join Our Community
          </h2>
          <p className="text-xl text-muted-foreground">
            Connect with fellow researchers, thinkers, and curious minds
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Research Community</CardTitle>
              <CardDescription>
                Join discussions with researchers, creatives, and professionals who use CanvasChat for their work.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" asChild>
                <Link href="/contact">
                  Join Community
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Stay Connected</CardTitle>
              <CardDescription>
                Get updates on new features, research insights, and community highlights.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <Link href="mailto:info@yzlab.cn?subject=Newsletter Signup">
                  Subscribe to Updates
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
              Ready to Think Different?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience the difference of having an AI thinking partner that truly understands depth and nuance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-6 text-lg h-auto" asChild>
                <Link href="/yan">
                  Start Thinking <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg h-auto" asChild>
                <Link href="/contact">
                  Get in Touch
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
