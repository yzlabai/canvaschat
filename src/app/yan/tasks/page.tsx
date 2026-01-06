"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckSquare, 
  Plus, 
  Calendar, 
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowRight
} from "lucide-react";

export default function TasksPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CheckSquare className="h-8 w-8 text-primary" />
            Tasks & Projects (Under Development)
          </h1>
          <p className="text-muted-foreground mt-2">
            Organize your research, ideas, and projects with AI assistance
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Task Statistics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-muted-foreground">Active Tasks</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">5</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">8</p>
                <p className="text-sm text-muted-foreground">Projects</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg">Research Tasks</CardTitle>
            <CardDescription>
              Create and manage research-focused tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Create Research Task <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg">Idea Projects</CardTitle>
            <CardDescription>
              Organize idea development into structured projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Start Idea Project <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg">AI Assistance</CardTitle>
            <CardDescription>
              Get help breaking down complex tasks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Get AI Help <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Active Tasks */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Active Tasks</h2>
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">Market Research Analysis</h3>
                    <Badge variant="secondary">High Priority</Badge>
                    <Badge variant="outline">Research</Badge>
                  </div>
                  <p className="text-muted-foreground mb-3">
                    Analyze competitor strategies and market trends for Q2 planning
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Due: Feb 15, 2024
                    </span>
                    <span>Progress: 60%</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                  <Button size="sm">
                    Continue
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">User Experience Study</h3>
                    <Badge variant="outline">Medium Priority</Badge>
                    <Badge variant="outline">Analysis</Badge>
                  </div>
                  <p className="text-muted-foreground mb-3">
                    Conduct user interviews and analyze feedback patterns
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Due: Feb 20, 2024
                    </span>
                    <span>Progress: 30%</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                  <Button size="sm">
                    Continue
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">Technology Stack Evaluation</h3>
                    <Badge variant="destructive">Overdue</Badge>
                    <Badge variant="outline">Technical</Badge>
                  </div>
                  <p className="text-muted-foreground mb-3">
                    Evaluate new frameworks and tools for upcoming project
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Due: Feb 10, 2024
                    </span>
                    <span>Progress: 80%</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                  <Button size="sm">
                    Complete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Projects */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Recent Projects</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">AI Product Development</CardTitle>
              <CardDescription>
                Building next-generation AI-powered features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">8 tasks • 3 completed</span>
                <Badge variant="secondary">Active</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div className="bg-primary h-2 rounded-full" style={{ width: '37.5%' }}></div>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                View Project
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Market Expansion Research</CardTitle>
              <CardDescription>
                Exploring new market opportunities and strategies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">5 tasks • 5 completed</span>
                <Badge variant="outline">Completed</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                View Results
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
