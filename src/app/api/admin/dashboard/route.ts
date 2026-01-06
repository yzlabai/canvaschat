import { NextRequest, NextResponse } from "next/server";
import { getDashboardOverview } from "@/services/admin";
import { requireAdmin } from "@/lib/admin-middleware";

export const GET = requireAdmin(async function(request: NextRequest) {
  try {
    const overview = await getDashboardOverview();
    return NextResponse.json(overview);
  } catch (error) {
    console.error("Error fetching dashboard overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard overview" },
      { status: 500 }
    );
  }
});