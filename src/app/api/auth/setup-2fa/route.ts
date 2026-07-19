import { NextRequest, NextResponse } from "next/server";
import { execute } from "@/lib/oracle";
import { getAuthUser, generateTwoFASecret, verifyTwoFAToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();

    if (token) {
      const result = await execute("SELECT twofa_secret FROM users WHERE id = :1", [user.userId]);
      const row = result.rows?.[0];
      if (!row?.TWOFA_SECRET) {
        return NextResponse.json({ error: "2FA not set up yet" }, { status: 400 });
      }
      if (!verifyTwoFAToken(row.TWOFA_SECRET, token)) {
        return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
      }
      await execute("UPDATE users SET twofa_enabled = 1 WHERE id = :1", [user.userId]);
      return NextResponse.json({ success: true });
    }

    const { secret, otpauthUrl } = generateTwoFASecret();
    await execute("UPDATE users SET twofa_secret = :1, twofa_enabled = 0 WHERE id = :2", [secret, user.userId]);

    return NextResponse.json({ secret, otpauthUrl });
  } catch (error) {
    console.error("2FA setup error:", error);
    return NextResponse.json({ error: "Setup failed" }, { status: 500 });
  }
}
