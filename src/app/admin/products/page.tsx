import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminProductsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credit Management</h1>
          <p className="text-muted-foreground">
            Manage user credits and allocations.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Credit management interface coming soon...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}