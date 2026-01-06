import DashboardLayout from "@/components/dashboard/layout";
import { getUserInfo } from "@/services/user";
import { isAdmin } from "@/lib/admin";
import { Sidebar } from "@/types/sidebar";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const userInfo = await getUserInfo();
  
  // Check if user is authenticated
  if (!userInfo || !userInfo.email) {
    redirect("/auth/signin");
  }

  // Check if user is admin based on ADMIN_EMAILS environment variable
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    redirect("/access-denied");
  }

  const sidebar: Sidebar = {
    brand: {
      title: "Admin Panel",
      logo: {
        src: "/logo.png",
        alt: "Admin Panel",
      },
      url: "/admin",
    },
    nav: {
      items: [
        {
          title: "Dashboard",
          url: "/admin",
          icon: "RiDashboardLine",
        },
        {
          title: "Users",
          url: "/admin/users",
          icon: "RiUserLine",
        },
        {
          title: "Products",
          url: "/admin/products",
          icon: "RiBoxLine",
        },
        {
          title: "AI Models",
          url: "/admin/ai-models",
          icon: "RiCpuLine",
        },
        {
          title: "Orders",
          url: "/admin/orders",
          icon: "RiShoppingCartLine",
        },
        {
          title: "Analytics",
          url: "/admin/analytics",
          icon: "RiBarChartLine",
        },
        {
          title: "Settings",
          url: "/admin/settings",
          icon: "RiSettingsLine",
        },
      ],
    },
    account: {
      items: [
        {
          title: "Profile",
          url: "/yan/account",
          icon: "RiUserLine",
          target: "_self",
        },
        {
          title: "Back to App",
          url: "/yan",
          icon: "RiArrowLeftLine",
          target: "_self",
        },
      ],
    }
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-muted/40">
      <DashboardLayout sidebar={sidebar}>{children}</DashboardLayout>
    </div>
  );
}
