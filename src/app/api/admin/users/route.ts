import { NextRequest, NextResponse } from "next/server";
import { getUsersList } from "@/services/admin";
import { requireAdmin } from "@/lib/admin-middleware";

export const GET = requireAdmin(async function(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search") || "";
    const sortColumn = searchParams.get("sortColumn") || "created_at";
    const sortDirection = (searchParams.get("sortDirection") || "desc") as 'asc' | 'desc';

    const result = await getUsersList(page, pageSize, search, sortColumn, sortDirection);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
});