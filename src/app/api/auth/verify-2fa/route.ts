import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/oracle";
import { signToken, verifyTwoFAToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { userId, token } = await req.json();
    if (!userId || !token) {
      return NextResponse.json({ error: "userId and token required" }, { status: 400 });
    }

    const result = await query("SELECT * FROM users WHERE id = :1 AND is_active = 1", [userId]);
    const user = result.rows?.[0];
    if (!user || !user.TWOFA_SECRET) {
      return NextResponse.json({ error: "User not found or 2FA not set up" }, { status: 401 });
    }

    if (!verifyTwoFAToken(user.TWOFA_SECRET, token)) {
      return NextResponse.json({ error: "Invalid 2FA code" }, { status: 401 });
    }

    const jwtToken = signToken({
      userId: user.ID,
      email: user.EMAIL,
      role: user.ROLE,
      shopId: user.SHOP_ID,
      name: user.NAME || user.EMAIL,
    });

    const userData = {
      id: user.ID,
      email: user.EMAIL,
      name: user.NAME,
      role: user.ROLE,
      shopId: user.SHOP_ID,
    };

    return NextResponse.json({ token, user: userData });
  } catch (error) {
    console.error("2FA verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
