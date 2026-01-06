import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowRight,
  Calendar,
  User,
  Tag,
  Clock,
  MessageSquare,
  TrendingUp,
  Lightbulb,
  Brain,
  Search,
  BookOpen
} from "lucide-react";
import Link from "next/link";
import { buildStaticMetadata } from "@/lib/seo";

export const metadata = buildStaticMetadata("/blog");

export default function BlogPage() {
  const blogPosts = [
    {
      id: "multi-agent-ai-research",
      title: "The Future of Research: Multi-Agent AI Conversations",
      excerpt: "Exploring how multiple AI perspectives can revolutionize how we approach complex research questions and develop new ideas.",
      author: "CanvasChat Team",
      date: "August 5, 2025",
      publishedAt: "2025-08-05",
      category: "AI Research",
      readTime: "8 min read",
      featured: true
    },
    {
      id: "thinking-different-ai",
      title: "Why 'Thinking Different' Matters in AI",
      excerpt: "The importance of diverse perspectives and creative thinking in artificial intelligence research and development.",
      author: "Research Team",
      date: "July 28, 2025", 
      publishedAt: "2025-07-28",
      category: "Philosophy",
      readTime: "6 min read",
      featured: true
    },
    {
      id: "research-methodology-ai",
      title: "How AI is Transforming Research Methodology",
      excerpt: "From hypothesis generation to data analysis, discover how AI tools are changing the fundamental approaches to research.",
      author: "Dr. Sarah Chen",
      date: "July 15, 2025",
      publishedAt: "2025-07-15",
      category: "Research",
      readTime: "10 min read",
      featured: false
    },
    {
      id: "creative-problem-solving",
      title: "Creative Problem Solving with AI Partners",
      excerpt: "Techniques and strategies for using AI as a creative collaborator in tackling complex, open-ended problems.",
      author: "Innovation Team",
      date: "July 2, 2025",
      publishedAt: "2025-07-02",
      category: "Creativity",
      readTime: "7 min read",
      featured: false
    },
    {
      id: "context-awareness-conversations",
      title: "The Power of Context-Aware AI Conversations",
      excerpt: "Understanding how memory and context transform AI from a question-answering tool to a true conversation partner.",
      author: "Technical Team",
      date: "June 20, 2025",
      publishedAt: "2025-06-20",
      category: "Technology",
      readTime: "9 min read",
      featured: false
    },
    {
      id: "democratizing-research-tools",
      title: "Democratizing Advanced Research Tools",
      excerpt: "Making sophisticated research capabilities accessible to students, professionals, and curious minds everywhere.",
      author: "CanvasChat Team",
      date: "June 5, 2025",
      publishedAt: "2025-06-05",
      category: "Education",
      readTime: "5 min read",
      featured: false
    }
  ];

  const categories = [
    { name: "All", count: 12 },
    { name: "AI Research", count: 4 },
    { name: "Research", count: 3 },
    { name: "Technology", count: 2 },
    { name: "Philosophy", count: 2 },
    { name: "Creativity", count: 1 },
    { name: "Education", count: 1 }
  ];

  const featuredPosts = blogPosts.filter(post => post.featured);
  const regularPosts = blogPosts.filter(post => !post.featured);

  const siteUrl = (process.env.NEXT_PUBLIC_WEB_URL ?? "https://canvas.chat").replace(/\/$/, "");
  const blogStructuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "CanvasChat Blog",
    url: `${siteUrl}/blog`,
    description:
      "Insights on multi-agent AI research, thinking methodologies, and the future of human-AI collaboration from the CanvasChat team.",
    blogPost: blogPosts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      author: {
        "@type": "Organization",
        name: post.author,
      },
      datePublished: new Date(`${post.publishedAt}T00:00:00Z`).toISOString(),
      url: `${siteUrl}/blog#${post.id}`,
    })),
  } satisfies Record<string, unknown>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogStructuredData) }}
      />
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
            <BookOpen className="h-4 w-4" />
            <span className="text-sm font-medium">Research & Insights</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            CanvasChat
            <span className="block text-primary">Blog</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Insights on AI research, thinking methodologies, and the future of human-AI collaboration
          </p>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Featured Articles
          </h2>
          <p className="text-xl text-muted-foreground">
            Our latest research and insights
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {featuredPosts.map((post, index) => (
            <Card key={post.id} className="border-2 hover:border-primary/50 transition-colors group cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                    {post.category}
                  </span>
                  <span>•</span>
                  <span>{post.date}</span>
                  <span>•</span>
                  <span>{post.readTime}</span>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {post.title}
                </CardTitle>
                <CardDescription className="text-base">
                  {post.excerpt}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{post.author}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="group-hover:text-primary">
                    Read More <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Categories & Search */}
      <section className="container mx-auto px-4 py-8 bg-muted/20 rounded-xl my-16">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/4">
            <h3 className="font-bold mb-4">Categories</h3>
            <div className="space-y-2">
              {categories.map((category) => (
                <button
                  key={category.name}
                  className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-background/50 transition-colors text-left"
                >
                  <span className="text-sm">{category.name}</span>
                  <span className="text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded-full">
                    {category.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="lg:w-3/4">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
                />
              </div>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Filter by Date
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Posts */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Recent Articles
          </h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {regularPosts.map((post) => (
            <Card key={post.id} className="border-2 hover:border-primary/50 transition-colors group cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                    {post.category}
                  </span>
                </div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {post.title}
                </CardTitle>
                <CardDescription>
                  {post.excerpt}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span>{post.date}</span>
                    <span>{post.readTime}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="container mx-auto px-4 py-16">
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="text-center py-16">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Stay Updated
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get the latest insights on AI research, thinking methodologies, and platform updates delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-4 py-2 border rounded-lg"
              />
              <Button>
                Subscribe
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Trending Topics */}
      <section className="container mx-auto px-4 py-16 bg-muted/20 rounded-xl my-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Trending Topics
          </h2>
          <p className="text-xl text-muted-foreground">
            Popular themes in our research community
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Multi-Agent AI</CardTitle>
              <CardDescription>
                Exploring collaborative AI systems and their research applications
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Creative Thinking</CardTitle>
              <CardDescription>
                How AI can enhance human creativity and problem-solving
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Research Methods</CardTitle>
              <CardDescription>
                Evolving methodologies in AI-assisted research
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">AI Ethics</CardTitle>
              <CardDescription>
                Responsible development and use of AI thinking tools
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="text-center py-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Experience What We Write About
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Ready to put these insights into practice? Start creating with CanvasChat today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-6 text-lg h-auto" asChild>
                <Link href="/yan">
                  Start Research <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg h-auto" asChild>
                <Link href="/about">
                  Learn More
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
