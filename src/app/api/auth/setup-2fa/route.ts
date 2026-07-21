import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/datasource";
import { User } from "@/lib/entities/User";
import { getAuthUser, generateTwoFASecret, verifyTwoFAToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();
    const ds = await getDataSource();
    const userRepo = ds.getRepository(User);

    if (token) {
      const row = await userRepo.findOne({ where: { id: user.userId } });
      if (!row?.twofaSecret) {
        return NextResponse.json({ error: "2FA not set up yet" }, { status: 400 });
      }
      if (!verifyTwoFAToken(row.twofaSecret, token)) {
        return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
      }
      await userRepo.update({ id: user.userId }, { twofaEnabled: 1 });
      return NextResponse.json({ success: true });
    }

    const { secret, otpauthUrl } = generateTwoFASecret();
    await userRepo.update({ id: user.userId }, {
      twofaSecret: secret,
      twofaEnabled: 0,
    });

    return NextResponse.json({ secret, otpauthUrl });
  } catch (error) {
    console.error("2FA setup error:", error);
    return NextResponse.json({ error: "Setup failed" }, { status: 500 });
  }
}
