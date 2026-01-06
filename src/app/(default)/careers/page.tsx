import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowRight,
  Users,
  Heart,
  Lightbulb,
  Globe,
  Zap,
  Target,
  Code,
  Brain,
  Coffee,
  MapPin,
  Clock,
  DollarSign
} from "lucide-react";
import Link from "next/link";
import { buildStaticMetadata } from "@/lib/seo";

export const metadata = buildStaticMetadata("/careers");

export default function CareersPage() {
  const jobOpenings = [
    {
      id: "senior-ai-researcher",
      title: "Senior AI Researcher",
      department: "Research",
      location: "Remote / San Francisco",
      type: "Full-time",
      salary: "$150k - $220k",
      description: "Lead research initiatives in multi-agent AI systems and advanced reasoning capabilities.",
      requirements: [
        "PhD in AI/ML, Computer Science, or related field",
        "5+ years experience in AI research",
        "Experience with large language models",
        "Publications in top-tier conferences"
      ],
      featured: true
    },
    {
      id: "full-stack-engineer", 
      title: "Full-Stack Engineer",
      department: "Engineering",
      location: "Remote / New York",
      type: "Full-time", 
      salary: "$120k - $180k",
      description: "Build and scale our research platform used by thousands of users worldwide.",
      requirements: [
        "5+ years full-stack development experience",
        "Proficiency in React, Node.js, TypeScript",
        "Experience with AI/ML integration",
        "Strong system design skills"
      ],
      featured: true
    },
    {
      id: "product-designer",
      title: "Product Designer",
      department: "Design",
      location: "Remote / London", 
      type: "Full-time",
      salary: "$100k - $150k",
      description: "Design intuitive interfaces for complex AI research tools and conversations.",
      requirements: [
        "4+ years product design experience",
        "Portfolio demonstrating complex product design",
        "Experience with AI/conversational interfaces",
        "Proficiency in Figma, prototyping tools"
      ],
      featured: false
    },
    {
      id: "machine-learning-engineer",
      title: "Machine Learning Engineer", 
      department: "Engineering",
      location: "Remote / Seattle",
      type: "Full-time",
      salary: "$130k - $190k",
      description: "Optimize and deploy AI models for production research applications.",
      requirements: [
        "3+ years ML engineering experience", 
        "Experience with model optimization and deployment",
        "Proficiency in Python, PyTorch/TensorFlow",
        "Cloud platform experience (AWS/GCP)"
      ],
      featured: false
    },
    {
      id: "research-scientist-intern",
      title: "Research Scientist Intern",
      department: "Research",
      location: "Remote",
      type: "Internship",
      salary: "$6k - $8k/month",
      description: "Work on cutting-edge research projects in AI reasoning and multi-agent systems.",
      requirements: [
        "PhD student in AI/ML or related field",
        "Strong research background",
        "Programming experience in Python",
        "3-6 month availability"
      ],
      featured: false
    }
  ];

  const benefits = [
    {
      icon: Heart,
      title: "Health & Wellness", 
      description: "Comprehensive health insurance, mental health support, and wellness stipends"
    },
    {
      icon: Globe,
      title: "Remote-First",
      description: "Work from anywhere with flexible hours and quarterly team retreats"
    },
    {
      icon: Lightbulb,
      title: "Learning & Growth",
      description: "Conference budgets, course allowances, and dedicated research time"
    },
    {
      icon: Coffee,
      title: "Work-Life Balance",
      description: "Unlimited PTO, sabbatical programs, and family-friendly policies"
    },
    {
      icon: DollarSign,
      title: "Competitive Package",
      description: "Top-tier salaries, equity participation, and performance bonuses"
    },
    {
      icon: Users,
      title: "Amazing Team",
      description: "Work with world-class researchers and engineers passionate about AI"
    }
  ];

  const values = [
    {
      title: "Intellectual Curiosity",
      description: "We encourage deep thinking, questioning assumptions, and exploring new ideas."
    },
    {
      title: "Collaborative Innovation", 
      description: "Great ideas come from diverse perspectives working together."
    },
    {
      title: "Quality Over Speed",
      description: "We prioritize thoughtful, well-designed solutions over quick fixes."
    },
    {
      title: "User-Centric Design",
      description: "Everything we build should genuinely help people think better."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
            <Users className="h-4 w-4" />
            <span className="text-sm font-medium">Join Our Team</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            Careers at
            <span className="block text-primary">CanvasChat</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Help us build the future of AI-powered canvas experiences. Join a team that's passionate about making creative thinking more visual and collaborative.
          </p>
        </div>
      </section>

      {/* Why CanvasChat */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Work at CanvasChat?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We're building something meaningful with a team that cares about impact
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{benefit.title}</CardTitle>
                <CardDescription>
                  {benefit.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Open Positions */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Open Positions
          </h2>
          <p className="text-xl text-muted-foreground">
            Find your next opportunity to shape the future of AI research
          </p>
        </div>
        
        <div className="space-y-6 max-w-4xl mx-auto">
          {jobOpenings.map((job) => (
            <Card key={job.id} className={`border-2 hover:border-primary/50 transition-colors ${job.featured ? 'border-primary/20 bg-primary/5' : ''}`}>
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      {job.featured && (
                        <span className="px-2 py-1 bg-primary text-primary-foreground rounded-full text-xs font-medium">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4" />
                        <span>{job.department}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{job.type}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>{job.salary}</span>
                      </div>
                    </div>
                    <CardDescription className="text-base mb-4">
                      {job.description}
                    </CardDescription>
                    <div>
                      <h4 className="font-semibold mb-2">Key Requirements:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {job.requirements.map((req, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button asChild>
                      <Link href={`mailto:revessencehk@gmail.com?subject=Application for ${job.title}`}>
                        Apply Now
                      </Link>
                    </Button>
                    <Button variant="outline">
                      Learn More
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Our Values */}
      <section className="container mx-auto px-4 py-16 bg-muted/20 rounded-xl my-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Our Values
          </h2>
          <p className="text-xl text-muted-foreground">
            The principles that guide how we work and build together
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {values.map((value, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{value.title}</CardTitle>
                <CardDescription className="text-base">
                  {value.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Application Process */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Application Process
          </h2>
          <p className="text-xl text-muted-foreground">
            What to expect when you apply
          </p>
        </div>
        
        <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary font-bold">
                1
              </div>
              <CardTitle className="text-lg">Apply</CardTitle>
              <CardDescription>
                Submit your application with resume and cover letter
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="text-center">
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary font-bold">
                2
              </div>
              <CardTitle className="text-lg">Screen</CardTitle>
              <CardDescription>
                Initial conversation with our hiring team
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="text-center">
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary font-bold">
                3
              </div>
              <CardTitle className="text-lg">Interview</CardTitle>
              <CardDescription>
                Technical and cultural fit interviews with the team
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="text-center">
            <CardHeader>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary font-bold">
                4
              </div>
              <CardTitle className="text-lg">Offer</CardTitle>
              <CardDescription>
                Final decision and offer discussion
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Don't See Your Role */}
      <section className="container mx-auto px-4 py-16">
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="text-center py-16">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Don't See Your Role?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              We're always looking for exceptional people. If you're passionate about AI research and building tools that help people think better, we'd love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-6 text-lg h-auto" asChild>
                <Link href="mailto:revessencehk@gmail.com?subject=General Application">
                  Send Us Your Resume <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg h-auto" asChild>
                <Link href="/about">
                  Learn About Us
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
