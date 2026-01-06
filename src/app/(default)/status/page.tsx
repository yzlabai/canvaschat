import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity,
  Server,
  Globe,
  Database,
  Zap,
  Clock,
  TrendingUp,
  Calendar,
  Bell
} from "lucide-react";
import Link from "next/link";
import { buildStaticMetadata } from "@/lib/seo";

export const metadata = buildStaticMetadata("/status");

export default function StatusPage() {
  const currentStatus = {
    overall: "operational",
    lastUpdated: "August 7, 2025 at 3:24 PM UTC"
  };

  const services = [
    {
      name: "API Gateway",
      status: "operational",
      uptime: "99.98%",
      description: "Core API endpoints and authentication"
    },
    {
      name: "AI Models",
      status: "operational", 
      uptime: "99.95%",
      description: "GPT-4o, Claude 3.5, and other AI models"
    },
    {
      name: "Conversation Engine",
      status: "operational",
      uptime: "99.97%",
      description: "Message processing and conversation management"
    },
    {
      name: "Web Application",
      status: "operational",
      uptime: "99.99%",
      description: "CanvasChat web interface and dashboard"
    },
    {
      name: "Database",
      status: "operational",
      uptime: "99.96%",
      description: "User data and conversation storage"
    },
    {
      name: "Authentication",
      status: "operational",
      uptime: "99.98%",
      description: "User login and API key management"
    }
  ];

  const incidents = [
    {
      title: "API Response Delays",
      status: "resolved",
      date: "August 5, 2025",
      duration: "23 minutes",
      description: "Some users experienced slower than normal API response times due to increased traffic.",
      impact: "Minor service degradation"
    },
    {
      title: "Scheduled Maintenance",
      status: "completed",
      date: "August 1, 2025", 
      duration: "2 hours",
      description: "Scheduled database maintenance and performance optimizations.",
      impact: "No service interruption"
    },
    {
      title: "Authentication Service Outage",
      status: "resolved",
      date: "July 28, 2025",
      duration: "45 minutes", 
      description: "Users were unable to log in or access API services due to authentication provider issues.",
      impact: "Major service disruption"
    }
  ];

  const metrics = [
    {
      title: "API Response Time",
      value: "142ms",
      trend: "down",
      description: "Average response time (24h)"
    },
    {
      title: "Uptime",
      value: "99.98%",
      trend: "stable",
      description: "Overall uptime (30 days)"
    },
    {
      title: "Active Users",
      value: "2,847",
      trend: "up", 
      description: "Concurrent active users"
    },
    {
      title: "API Requests",
      value: "1.2M",
      trend: "up",
      description: "Requests processed (24h)"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "text-green-600 bg-green-100 border-green-200";
      case "degraded":
        return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "down":
        return "text-red-600 bg-red-100 border-red-200";
      case "resolved":
        return "text-green-600 bg-green-100 border-green-200";
      case "completed":
        return "text-blue-600 bg-blue-100 border-blue-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
      case "resolved":
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "degraded":
        return <AlertTriangle className="h-4 w-4" />;
      case "down":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "down":
        return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
            <Activity className="h-4 w-4" />
            <span className="text-sm font-medium">System Status</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            CanvasChat
            <span className="block text-primary">Status</span>
          </h1>
          
          <div className="max-w-2xl mx-auto">
            <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full border-2 ${getStatusColor(currentStatus.overall)}`}>
              {getStatusIcon(currentStatus.overall)}
              <span className="font-semibold text-lg">All Systems Operational</span>
            </div>
            <p className="text-muted-foreground mt-4">
              Last updated: {currentStatus.lastUpdated}
            </p>
          </div>
        </div>
      </section>

      {/* Current Metrics */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Performance Metrics
          </h2>
          <p className="text-xl text-muted-foreground">
            Real-time system performance indicators
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <Card key={index} className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardDescription>{metric.title}</CardDescription>
                  {getTrendIcon(metric.trend)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{metric.value}</div>
                <p className="text-sm text-muted-foreground">{metric.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Service Status */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Service Status
          </h2>
          <p className="text-xl text-muted-foreground">
            Current status of all CanvasChat services
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto space-y-4">
          {services.map((service, index) => (
            <Card key={index} className="border-2">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {index === 0 && <Server className="h-5 w-5 text-primary" />}
                      {index === 1 && <Zap className="h-5 w-5 text-primary" />}
                      {index === 2 && <Activity className="h-5 w-5 text-primary" />}
                      {index === 3 && <Globe className="h-5 w-5 text-primary" />}
                      {index === 4 && <Database className="h-5 w-5 text-primary" />}
                      {index === 5 && <CheckCircle className="h-5 w-5 text-primary" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{service.name}</h3>
                      <p className="text-muted-foreground">{service.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(service.status)}`}>
                      {getStatusIcon(service.status)}
                      <span className="capitalize">{service.status}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {service.uptime} uptime
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Recent Incidents */}
      <section className="container mx-auto px-4 py-16 bg-muted/20 rounded-xl my-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Recent Incidents
          </h2>
          <p className="text-xl text-muted-foreground">
            Past incidents and maintenance activities
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto space-y-6">
          {incidents.map((incident, index) => (
            <Card key={index} className="border-2">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(incident.status)}`}>
                        {getStatusIcon(incident.status)}
                        <span className="capitalize">{incident.status}</span>
                      </span>
                      <span className="text-sm text-muted-foreground">{incident.date}</span>
                    </div>
                    <CardTitle className="text-xl">{incident.title}</CardTitle>
                    <CardDescription className="text-base mt-2">
                      {incident.description}
                    </CardDescription>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div className="flex items-center gap-1 mb-1">
                      <Clock className="h-4 w-4" />
                      <span>{incident.duration}</span>
                    </div>
                    <div>{incident.impact}</div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Uptime History */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Uptime History
          </h2>
          <p className="text-xl text-muted-foreground">
            90-day uptime overview for all services
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Card className="border-2">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="text-4xl font-bold text-green-600 mb-2">99.98%</div>
                <p className="text-lg text-muted-foreground">Overall uptime (90 days)</p>
              </div>
              
              <div className="grid grid-cols-30 gap-1 mb-6">
                {Array.from({ length: 90 }, (_, i) => (
                  <div
                    key={i}
                    className={`h-8 w-full rounded-sm ${
                      i === 5 || i === 17 ? 'bg-yellow-200' : 
                      i === 33 ? 'bg-red-200' : 'bg-green-200'
                    }`}
                    title={`Day ${90 - i}: ${
                      i === 5 || i === 17 ? 'Degraded' :
                      i === 33 ? 'Outage' : 'Operational'
                    }`}
                  />
                ))}
              </div>
              
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-green-200 rounded-sm" />
                  <span>Operational</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-yellow-200 rounded-sm" />
                  <span>Degraded</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-red-200 rounded-sm" />
                  <span>Outage</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Subscribe to Updates */}
      <section className="container mx-auto px-4 py-16">
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="text-center py-16">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <Bell className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Stay Informed
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Subscribe to status updates and get notified about incidents, maintenance, and system improvements.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-6 text-lg h-auto">
                Subscribe to Updates <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg h-auto" asChild>
                <Link href="/contact">
                  Report an Issue
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
