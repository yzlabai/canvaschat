import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  TrendingUp,
  Calendar,
  DollarSign
} from "lucide-react";
import { UserStats } from "@/services/admin-client";

interface UserStatsCardsProps {
  stats: UserStats;
  isLoading?: boolean;
}

export function UserStatsCards({ stats, isLoading = false }: UserStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
              <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted rounded animate-pulse mb-2"></div>
              <div className="h-3 w-24 bg-muted rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cardData = [
    {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      description: "All registered users",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Active Users",
      value: stats.activeUsers.toLocaleString(),
      description: "Active in last 30 days",
      icon: UserCheck,
      color: "text-green-600"
    },
    {
      title: "New Today",
      value: stats.newUsersToday.toLocaleString(),
      description: "Registered today",
      icon: UserPlus,
      color: "text-purple-600"
    },
    {
      title: "New This Week",
      value: stats.newUsersThisWeek.toLocaleString(),
      description: "Registered this week",
      icon: Calendar,
      color: "text-orange-600"
    },
    {
      title: "Top Provider",
      value: stats.topSigninProvider.charAt(0).toUpperCase() + stats.topSigninProvider.slice(1),
      description: "Most used sign-in",
      icon: TrendingUp,
      color: "text-indigo-600"
    },
    {
      title: "Avg Order Value",
      value: `$${stats.avgOrderValue.toFixed(2)}`,
      description: "Per user average",
      icon: DollarSign,
      color: "text-emerald-600"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
      {cardData.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}