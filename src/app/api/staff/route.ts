import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/lib/oracle";
import { getAuthUser, hashPassword } from "@/lib/auth";
import { generateId } from "@/lib/oracle";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "cashier") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    let sql = "SELECT id, email, name, role, shop_id, twofa_enabled, email_verified, is_active, created_at FROM users";
    const params: any[] = [];

    if (user.role === "shop_admin") {
      sql += " WHERE shop_id = :1 AND role = 'cashier'";
      params.push(user.shopId);
    }

    sql += " ORDER BY created_at DESC";
    const result = await query(sql, params);

    return NextResponse.json(result.rows?.map((r: any) => ({
      id: r.ID, email: r.EMAIL, name: r.NAME, role: r.ROLE,
      shopId: r.SHOP_ID, twofaEnabled: r.TWOFA_ENABLED === 1,
      emailVerified: r.EMAIL_VERIFIED === 1, isActive: r.IS_ACTIVE === 1,
      createdAt: r.CREATED_AT,
    })) || []);
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

    const existing = await query("SELECT id FROM users WHERE email = :1", [email.toLowerCase()]);
    if (existing.rows?.[0]) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const targetRole = role || "cashier";
    if (targetRole === "super_admin") {
      return NextResponse.json({ error: "Cannot create super admin" }, { status: 403 });
    }

    const id = generateId();
    const passwordHash = await hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const now = new Date().toISOString();

    await execute(
      "INSERT INTO users (id, email, password_hash, name, role, shop_id, email_verification_token, is_active, created_at, updated_at) VALUES (:1, :2, :3, :4, :5, :6, :7, 1, :8, :8)",
      [id, email.toLowerCase(), passwordHash, name || null, targetRole, targetShopId, verificationToken, now]
    );

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
