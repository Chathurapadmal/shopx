import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/datasource";
import { User } from "@/lib/entities/User";
import { getAuthUser, hashPassword } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "cashier") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const ds = await getDataSource();
    const userRepo = ds.getRepository(User);

    const where: any = {};
    if (user.role === "shop_admin") {
      where.shopId = user.shopId;
      where.role = "cashier";
    }

    const users = await userRepo.find({ where, order: { createdAt: "DESC" } });

    const result = users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      shopId: u.shopId,
      twofaEnabled: u.twofaEnabled === 1,
      emailVerified: u.emailVerified === 1,
      isActive: u.isActive === 1,
      createdAt: u.createdAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Staff list error:", error);
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "cashier") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { email, name, password, role, shopId } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const targetShopId = shopId || user.shopId;
    if (!targetShopId) {
      return NextResponse.json({ error: "Shop ID required" }, { status: 400 });
    }

    const ds = await getDataSource();
    const userRepo = ds.getRepository(User);

    const existing = await userRepo.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const targetRole = role || "cashier";
    if (targetRole === "super_admin") {
      return NextResponse.json({ error: "Cannot create super admin" }, { status: 403 });
    }

    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
    const passwordHash = await hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const now = new Date().toISOString();

    const newUser = userRepo.create({
      id,
      email: email.toLowerCase(),
      passwordHash,
      name: name || null,
      role: targetRole,
      shopId: targetShopId,
      emailVerificationToken: verificationToken,
      isActive: 1,
      createdAt: now,
      updatedAt: now,
    });

    await userRepo.save(newUser);

    try {
      await sendVerificationEmail(email, verificationToken);
    } catch (emailErr) {
      console.warn("Failed to send verification email:", emailErr);
    }

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("Create staff error:", error);
    return NextResponse.json({ error: "Failed to create staff" }, { status: 500 });
  }
}
