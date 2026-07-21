import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/datasource";
import { User } from "@/lib/entities/User";
import { signToken, verifyTwoFAToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { userId, token } = await req.json();
    if (!userId || !token) {
      return NextResponse.json({ error: "userId and token required" }, { status: 400 });
    }

    const ds = await getDataSource();
    const userRepo = ds.getRepository(User);

    const user = await userRepo.findOne({ where: { id: userId, isActive: 1 } });
    if (!user || !user.twofaSecret) {
      return NextResponse.json({ error: "User not found or 2FA not set up" }, { status: 401 });
    }

    if (!verifyTwoFAToken(user.twofaSecret, token)) {
      return NextResponse.json({ error: "Invalid 2FA code" }, { status: 401 });
    }

    const jwtToken = signToken({
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
    console.error("2FA verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
