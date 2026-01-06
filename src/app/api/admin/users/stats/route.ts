import { NextRequest, NextResponse } from "next/server";
import { getUserStats } from "@/services/admin";
import { requireAdmin } from "@/lib/admin-middleware";

export const GET = requireAdmin(async function(request: NextRequest) {
  try {
    const stats = await getUserStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user stats" },
      { status: 500 }
    );
  }
});