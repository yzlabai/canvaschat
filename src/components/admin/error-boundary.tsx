"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface AdminErrorBoundaryProps {
  error: Error;
  reset: () => void;
}

export default function AdminErrorBoundary({ error, reset }: AdminErrorBoundaryProps) {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-red-700">Error Loading Dashboard</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              There was an error loading the admin dashboard data. This could be due to a database connection issue or server error.
            </p>
            <div className="bg-red-50 p-3 rounded-md">
              <p className="text-sm text-red-700 font-mono">
                {error.message}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={reset} variant="outline">
                <RefreshCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button 
                onClick={() => window.location.reload()} 
                variant="secondary"
              >
                Reload Page
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}