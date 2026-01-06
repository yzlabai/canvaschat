import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  CreditCard, 
  DollarSign, 
  Users, 
  Package, 
  TrendingUp,
  Calendar,
  Settings,
  Bell,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { 
  getDashboardOverview, 
  getRecentActivities, 
  getRecentOrders, 
  getMonthlyStats 
} from "@/services/admin";

export default async function AdminDashboard() {
  // Fetch real data from database
  const [dashboardOverview, recentActivities, recentOrders, monthlyStats] = await Promise.all([
    getDashboardOverview(),
    getRecentActivities(4),
    getRecentOrders(4),
    getMonthlyStats(),
  ]);
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your application.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-8 w-[200px]" />
          </div>
          <Button variant="outline" size="icon">
            <Bell className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${dashboardOverview.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {monthlyStats.revenueGrowthPercentage >= 0 ? '+' : ''}{monthlyStats.revenueGrowthPercentage}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardOverview.totalUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +{monthlyStats.newUsersThisMonth} new users this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardOverview.totalOrders.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {monthlyStats.orderGrowthPercentage >= 0 ? '+' : ''}{monthlyStats.orderGrowthPercentage}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardOverview.activeUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {monthlyStats.userGrowthPercentage >= 0 ? '+' : ''}{monthlyStats.userGrowthPercentage}% growth this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Recent Activity */}
            <Card className="col-span-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Activity</CardTitle>
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">{activity.user}</p>
                          <p className="text-xs text-muted-foreground">{activity.action}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                  ))}
                  {recentActivities.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent activities
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card className="col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Orders</CardTitle>
                  <Link href="/admin/orders">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">#{order.id}</p>
                        <p className="text-xs text-muted-foreground">{order.customer}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">${order.amount.toFixed(2)}</p>
                        <Badge 
                          variant={
                            order.status === 'completed' ? 'default' :
                            order.status === 'pending' ? 'secondary' :
                            'outline'
                          }
                          className="text-xs"
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {recentOrders.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent orders
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
                <p className="text-muted-foreground mb-4">
                  Detailed analytics and reporting features coming soon.
                </p>
                <Button variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Report Generation</h3>
                <p className="text-muted-foreground mb-4">
                  Custom reports and data exports will be available here.
                </p>
                <div className="flex justify-center space-x-2">
                  <Button variant="outline">Export Users</Button>
                  <Button variant="outline">Export Orders</Button>
                  <Button variant="outline">Export Revenue</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/admin/users">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center space-y-2">
                <Users className="h-6 w-6" />
                <span>Manage Users</span>
              </Button>
            </Link>
            <Link href="/admin/products">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center space-y-2">
                <Package className="h-6 w-6" />
                <span>Manage Products</span>
              </Button>
            </Link>
            <Link href="/admin/orders">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center space-y-2">
                <CreditCard className="h-6 w-6" />
                <span>View Orders</span>
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center space-y-2">
                <Settings className="h-6 w-6" />
                <span>Settings</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
