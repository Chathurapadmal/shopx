import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/datasource";
import { User } from "@/lib/entities/User";
import { hashPassword, verifyPassword, signToken, generateTwoFASecret } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const ds = await getDataSource();
    const userRepo = ds.getRepository(User);

    const user = await userRepo.findOne({ where: { email: email.toLowerCase(), isActive: 1 } });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (user.twofaEnabled) {
      return NextResponse.json({
        require2fa: true,
        userId: user.id,
        email: user.email,
      });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as "super_admin" | "shop_admin" | "cashier",
      shopId: user.shopId || null,
      name: user.name || user.email,
    });

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      shopId: user.shopId,
    };

    return NextResponse.json({ token, user: userData });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
