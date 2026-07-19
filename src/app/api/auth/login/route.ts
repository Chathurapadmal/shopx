import { NextRequest, NextResponse } from "next/server";
import { query, execute } from "@/lib/oracle";
import { hashPassword, verifyPassword, signToken, generateTwoFASecret } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const result = await query("SELECT * FROM users WHERE email = :1 AND is_active = 1", [email.toLowerCase()]);
    const user = result.rows?.[0];
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.PASSWORD_HASH);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (user.TWOFA_ENABLED) {
      return NextResponse.json({
        require2fa: true,
        userId: user.ID,
        email: user.EMAIL,
      });
    }

    const token = signToken({
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
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
