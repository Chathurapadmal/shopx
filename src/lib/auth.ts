import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import speakeasy from "speakeasy";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "shopx-dev-secret-change-in-production";

export type UserPayload = {
  userId: string;
  email: string;
  role: "super_admin" | "shop_admin" | "cashier";
  shopId: string | null;
  name: string;
};

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch {
    return null;
  }
}

export function generateTwoFASecret(): { secret: string; otpauthUrl: string } {
  const secret = speakeasy.generateSecret({ name: "ShopX POS" });
  return { secret: secret.base32, otpauthUrl: secret.otpauth_url || "" };
}

export function verifyTwoFAToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 1,
  });
}

export function getAuthUser(req: NextRequest): UserPayload | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return verifyToken(authHeader.slice(7));
}

export function requireRole(user: UserPayload | null, allowedRoles: string[]): boolean {
  if (!user) return false;
  if (user.role === "super_admin") return true;
  return allowedRoles.includes(user.role);
}
