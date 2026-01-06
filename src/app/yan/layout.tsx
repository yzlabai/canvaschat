import DashboardLayout from "@/components/dashboard/layout";
import { getUserInfo } from "@/services/user";
import { Sidebar } from "@/types/sidebar";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

interface YanLayoutProps {
  children: ReactNode;
}

export default async function YanLayout({ children }: YanLayoutProps) {
  const userInfo = await getUserInfo();
  if (!userInfo || !userInfo.email) {
    redirect("/auth/signin");
  }

  const sidebar: Sidebar = {
    brand: {
      title: "CanvasChat",
      logo: {
        src: "/logo.png",
        alt: "CanvasChat",
      },
      url: "/",
    },
    nav: {
      items: [
        {
          title: "Chat",
          url: "/yan",
          icon: "RiMessageLine",
        },
        {
          title: "Ideas",
          url: "/yan/ideas",
          icon: "RiLightbulbLine",
        },
      ],
    },
    account: {
      items: [
        {
          title: "Account",
          url: "/yan/account",
          icon: "RiHomeLine",
          target: "_blank",
        },
      ],
    },
  };
  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <DashboardLayout sidebar={sidebar}>{children}</DashboardLayout>
    </div>
  );
}
