import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/lib/oracle";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const result = await query("SELECT id FROM users WHERE email_verification_token = :1", [token]);
    const row = result.rows?.[0];
    if (!row) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    await execute("UPDATE users SET email_verified = 1, email_verification_token = NULL WHERE id = :1", [row.ID]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
