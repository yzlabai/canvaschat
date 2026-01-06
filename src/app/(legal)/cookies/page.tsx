import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowRight,
  Shield,
  Cookie,
  Settings,
  Eye,
  Clock,
  Database,
  Globe,
  Check,
  Info
} from "lucide-react";
import Link from "next/link";
import { buildStaticMetadata } from "@/lib/seo";

export const metadata = buildStaticMetadata("/cookies");

export default function CookiePolicyPage() {
  const cookieTypes = [
    {
      category: "Essential Cookies",
      description: "Required for basic website functionality",
      duration: "Session / 1 year",
      canDisable: false,
      examples: [
        "Authentication tokens",
        "Security cookies", 
        "Load balancer session tracking",
        "CSRF protection tokens"
      ]
    },
    {
      category: "Analytics Cookies",
      description: "Help us understand how users interact with our site",
      duration: "2 years",
      canDisable: true,
      examples: [
        "Google Analytics tracking",
        "Page view statistics",
        "User behavior analysis",
        "Performance monitoring"
      ]
    },
    {
      category: "Functional Cookies",
      description: "Remember your preferences and settings",
      duration: "1 year",
      canDisable: true,
      examples: [
        "Theme preferences (dark/light mode)",
        "Language settings",
        "Accessibility preferences",
        "Recent conversation history"
      ]
    },
    {
      category: "Marketing Cookies",
      description: "Used to deliver relevant advertisements",
      duration: "1 year",
      canDisable: true,
      examples: [
        "Advertising tracking pixels",
        "Social media integration",
        "Marketing campaign tracking",
        "Conversion tracking"
      ]
    }
  ];

  const thirdPartyServices = [
    {
      service: "Google Analytics",
      purpose: "Website analytics and performance monitoring",
      cookiesUsed: "_ga, _gid, _gat",
      optOut: "https://tools.google.com/dlpage/gaoptout"
    },

    {
      service: "Cloudflare",
      purpose: "Security and performance optimization",
      cookiesUsed: "__cfduid, cf_ray",
      optOut: "Required for security"
    }
  ];

  const cookieSettings = [
    {
      title: "View Current Cookies",
      description: "See what cookies are currently stored",
      action: "Inspect Cookies"
    },
    {
      title: "Manage Preferences",
      description: "Control which cookies you accept",
      action: "Cookie Settings"
    },
    {
      title: "Clear All Cookies",
      description: "Remove all cookies from your browser",
      action: "Clear Cookies"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
            <Cookie className="h-4 w-4" />
            <span className="text-sm font-medium">Cookie Policy</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            Cookie
            <span className="block text-primary">Policy</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Learn how CanvasChat uses cookies to improve your experience and protect your privacy
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold text-blue-900 mb-2">Last Updated: August 7, 2025</h3>
                <p className="text-blue-800 text-sm">
                  This Cookie Policy explains how CanvasChat uses cookies and similar technologies when you visit our website or use our services.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Are Cookies */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl">What Are Cookies?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the site owners.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Cookies can be "session" cookies (which are deleted when you close your browser) or "persistent" cookies (which remain on your device for a set period or until you delete them).
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Cookie Types */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Types of Cookies We Use
          </h2>
          <p className="text-xl text-muted-foreground">
            Different categories of cookies serve different purposes
          </p>
        </div>
        
        <div className="grid lg:grid-cols-2 gap-8">
          {cookieTypes.map((type, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{type.category}</CardTitle>
                    <CardDescription className="text-base mt-2">
                      {type.description}
                    </CardDescription>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    type.canDisable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {type.canDisable ? 'Optional' : 'Required'}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Duration: {type.duration}</span>
                </div>
              </CardHeader>
              <CardContent>
                <h4 className="font-semibold mb-3">Examples:</h4>
                <ul className="space-y-2">
                  {type.examples.map((example, exampleIndex) => (
                    <li key={exampleIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{example}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Third Party Services */}
      <section className="container mx-auto px-4 py-16 bg-muted/20 rounded-xl my-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Third-Party Services
          </h2>
          <p className="text-xl text-muted-foreground">
            External services that may set cookies on our website
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto space-y-6">
          {thirdPartyServices.map((service, index) => (
            <Card key={index} className="border-2">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{service.service}</h3>
                    <p className="text-muted-foreground mb-3">{service.purpose}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Database className="h-4 w-4" />
                      <span>Cookies: {service.cookiesUsed}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {service.optOut.startsWith('http') ? (
                      <Button variant="outline" size="sm" asChild>
                        <a href={service.optOut} target="_blank" rel="noopener noreferrer">
                          Opt Out
                        </a>
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground px-3 py-2 bg-muted rounded">
                        {service.optOut}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Cookie Management */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Managing Your Cookies
          </h2>
          <p className="text-xl text-muted-foreground">
            You have control over the cookies stored on your device
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {cookieSettings.map((setting, index) => (
            <Card key={index} className="border-2 hover:border-primary/50 transition-colors text-center">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  {index === 0 && <Eye className="h-6 w-6 text-primary" />}
                  {index === 1 && <Settings className="h-6 w-6 text-primary" />}
                  {index === 2 && <Database className="h-6 w-6 text-primary" />}
                </div>
                <CardTitle className="text-lg">{setting.title}</CardTitle>
                <CardDescription>
                  {setting.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  {setting.action}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Browser Settings */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl">Browser Cookie Settings</CardTitle>
              <CardDescription className="text-base">
                You can also manage cookies through your browser settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Most browsers allow you to:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">View cookies that have been set and delete them individually</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Block third-party cookies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Block cookies from specific sites</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Block all cookies (may break website functionality)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Delete all cookies when closing the browser</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-yellow-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-yellow-900 mb-2">Important Note</h4>
                    <p className="text-yellow-800 text-sm">
                      Disabling or blocking cookies may impact your ability to use certain features of CanvasChat. Essential cookies are required for basic functionality.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Updates to Policy */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-2xl">Updates to This Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. When we update this policy, we will notify users by updating the "Last Updated" date at the top of this page.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We encourage you to review this Cookie Policy periodically to stay informed about how we use cookies and similar technologies.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="text-center py-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Questions About Our Cookie Policy?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              If you have any questions about our use of cookies or this Cookie Policy, please don't hesitate to contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="px-8 py-6 text-lg h-auto" asChild>
                <Link href="/contact">
                  Contact Us <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg h-auto" asChild>
                <Link href="/privacy-policy">
                  Privacy Policy
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
