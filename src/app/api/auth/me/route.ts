import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/oracle";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await query("SELECT id, email, name, role, shop_id, twofa_enabled, email_verified, is_active FROM users WHERE id = :1", [user.userId]);
    const row = result.rows?.[0];
    if (!row) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: row.ID,
      email: row.EMAIL,
      name: row.NAME,
      role: row.ROLE,
      shopId: row.SHOP_ID,
      twofaEnabled: row.TWOFA_ENABLED,
      emailVerified: row.EMAIL_VERIFIED,
      isActive: row.IS_ACTIVE,
    });
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
