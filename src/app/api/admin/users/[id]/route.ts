import { NextRequest, NextResponse } from "next/server";
import { getUserDetails } from "@/services/admin";
import { requireAdmin } from "@/lib/admin-middleware";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const GET = requireAdmin(async function(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = parseInt((await params).id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // First get the user UUID from the ID
    const userResult = await db()
      .select({ uuid: users.uuid })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userResult.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userDetails = await getUserDetails(userResult[0].uuid);
    
    if (!userDetails) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json(userDetails);
  } catch (error) {
    console.error("Error fetching user details:", error);
    return NextResponse.json(
      { error: "Failed to fetch user details" },
      { status: 500 }
    );
  }
});