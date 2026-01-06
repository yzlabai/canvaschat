"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Compass, 
  Search, 
  Globe, 
  BookOpen, 
  Telescope,
  Network,
  ArrowRight,
  TrendingUp
} from "lucide-react";

export default function ExplorerPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Compass className="h-8 w-8 text-primary" />
            Knowledge Explorer (Under Development)
          </h1>
          <p className="text-muted-foreground mt-2">
            Discover unexpected connections and explore cross-domain knowledge
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="What would you like to explore today?"
          className="pl-10 h-12 text-lg"
        />
        <Button className="absolute right-2 top-2" size="sm">
          Explore
        </Button>
      </div>

      {/* Exploration Categories */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-2">
              <Network className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-lg">Cross-Domain Connections</CardTitle>
            <CardDescription>
              Find surprising links between different fields and disciplines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Start Connecting <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-2">
              <Telescope className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-lg">Deep Research</CardTitle>
            <CardDescription>
              Dive deep into complex topics with comprehensive analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Start Research <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-2">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle className="text-lg">Trend Analysis</CardTitle>
            <CardDescription>
              Explore emerging trends and future possibilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Analyze Trends <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center mb-2">
              <Globe className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle className="text-lg">Global Perspectives</CardTitle>
            <CardDescription>
              Examine topics from different cultural and geographical viewpoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Explore Views <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="h-12 w-12 rounded-lg bg-red-100 flex items-center justify-center mb-2">
              <BookOpen className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-lg">Knowledge Synthesis</CardTitle>
            <CardDescription>
              Combine information from multiple sources into new insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Synthesize <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="h-12 w-12 rounded-lg bg-teal-100 flex items-center justify-center mb-2">
              <Search className="h-6 w-6 text-teal-600" />
            </div>
            <CardTitle className="text-lg">Curiosity Engine</CardTitle>
            <CardDescription>
              Follow your curiosity with guided exploration paths
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Start Journey <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Explorations */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Recent Explorations</h2>
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Biomimicry in Architecture</h3>
                  <p className="text-muted-foreground mt-1">
                    Exploring how nature-inspired designs revolutionize building structures
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span>Explored 1 hour ago</span>
                    <span>•</span>
                    <span>Connected 12 concepts</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Quantum Computing & Cryptography</h3>
                  <p className="text-muted-foreground mt-1">
                    Understanding the implications of quantum technology on data security
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span>Explored yesterday</span>
                    <span>•</span>
                    <span>Connected 8 concepts</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Ancient Wisdom & Modern Psychology</h3>
                  <p className="text-muted-foreground mt-1">
                    Bridging traditional philosophies with contemporary mental health practices
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span>Explored 2 days ago</span>
                    <span>•</span>
                    <span>Connected 15 concepts</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
