import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-muted-foreground">
            You don't have permission to access the admin panel. 
            Only authorized administrators can access this area.
          </p>
          
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>Contact your system administrator for access</span>
          </div>
          
          <div className="flex flex-col gap-2 pt-4">
            <Button asChild variant="default">
              <Link href="/yan">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to App
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/auth/signin">
                Sign in with different account
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}