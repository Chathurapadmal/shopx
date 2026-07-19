import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/lib/oracle";
import { hashPassword } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email, token, newPassword } = await req.json();

    if (email && !token) {
      const result = await query("SELECT id FROM users WHERE email = :1", [email.toLowerCase()]);
      const row = result.rows?.[0];
      if (!row) {
        return NextResponse.json({ success: true });
      }
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 3600000).toISOString();
      await execute("UPDATE users SET reset_password_token = :1, reset_password_expires = :2 WHERE id = :3", [resetToken, expires, row.ID]);
      await sendPasswordResetEmail(email, resetToken);
      return NextResponse.json({ success: true });
    }

    if (token && newPassword) {
      const result = await query("SELECT id FROM users WHERE reset_password_token = :1 AND reset_password_expires > :2", [token, new Date().toISOString()]);
      const row = result.rows?.[0];
      if (!row) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
      }
      const hash = await hashPassword(newPassword);
      await execute("UPDATE users SET password_hash = :1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = :2", [hash, row.ID]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
