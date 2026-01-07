"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowRight,
  Mail,
  MessageSquare,
  Phone,
  MapPin,
  Clock,
  Send,
  User,
  HelpCircle,
  Lightbulb,
  Users,
  Globe
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Create mailto link with form data
    const mailtoLink = `mailto:info@yzlab.cn?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    )}`;
    window.location.href = mailtoLink;
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Us",
      description: "Get in touch for general inquiries",
      contact: "info@yzlab.cn",
      action: "Send Email"
    },
    {
      icon: MessageSquare,
      title: "Phone Support",
      description: "Call us for immediate assistance",
      contact: "+86 133 9712 5912",
      action: "Start Chat",
    },
    {
      icon: Users,
      title: "Community",
      description: "Join our research community",
      contact: "Discord & Forums",
      action: "Join Community"
    }
  ];

  const supportTopics = [
    {
      icon: HelpCircle,
      title: "General Support",
      description: "Questions about using CanvasChat",
      email: "info@yzlab.cn"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm font-medium">Get in Touch</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            Contact
            <span className="block text-primary">CanvasChat</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Have questions, feedback, or ideas? We'd love to hear from you. Reach out and let's start a conversation.
          </p>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Get in Touch
          </h2>
          <p className="text-xl text-muted-foreground">
            Choose the best way to reach us
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {contactMethods.map((method, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors text-center">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <method.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>{method.title}</CardTitle>
                <CardDescription className="mb-4">
                  {method.description}
                </CardDescription>
                <p className="text-sm font-medium text-muted-foreground mb-4">
                  {method.contact}
                </p>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact Form */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Send Us a Message
            </h2>
            <p className="text-xl text-muted-foreground">
              Fill out the form below and we'll get back to you soon
            </p>
          </div>
          
          <Card className="border-2">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select a subject</option>
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Feature Request">Feature Request</option>
                    <option value="Bug Report">Bug Report</option>
                    <option value="Partnership">Partnership Inquiry</option>
                    <option value="Press Inquiry">Press Inquiry</option>
                    <option value="Technical Support">Technical Support</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Tell us how we can help..."
                  />
                </div>
                
                <Button type="submit" size="lg" className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Support Topics */}
      <section className="container mx-auto px-4 py-16 bg-muted/20 rounded-xl my-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Specific Inquiries
          </h2>
          <p className="text-xl text-muted-foreground">
            Contact the right team for faster assistance
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {supportTopics.map((topic, index) => (
            <Card key={index} className="hover:border-primary/50 transition-colors">
              <CardHeader className="text-center">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <topic.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{topic.title}</CardTitle>
                <CardDescription className="mb-4">
                  {topic.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`mailto:${topic.email}`}>
                    Contact Team
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ Quick Links */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Common Questions
          </h2>
          <p className="text-xl text-muted-foreground">
            Find quick answers to frequently asked questions
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg">How does CanvasChat work?</CardTitle>
              <CardDescription>
                Learn about our AI-powered research and conversation platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <Link href="/features">
                  Learn More
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg">Getting Started</CardTitle>
              <CardDescription>
                Quick guide to start your first research conversation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild>
                <Link href="/docs">
                  View Docs
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Response Time */}
      <section className="container mx-auto px-4 py-16">
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="text-center py-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              We'll Get Back to You
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              We typically respond to inquiries within 24 hours during business days. For urgent matters, please mention it in your subject line.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-6 text-lg h-auto" asChild>
                <Link href="/yan">
                  Try CanvasChat Now <ArrowRight className="ml-2 h-5 w-5" />
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
