import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/datasource";
import { User } from "@/lib/entities/User";
import { hashPassword } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email, token, newPassword } = await req.json();

    const ds = await getDataSource();
    const userRepo = ds.getRepository(User);

    if (email && !token) {
      const user = await userRepo.findOne({ where: { email: email.toLowerCase() } });
      if (!user) {
        return NextResponse.json({ success: true });
      }
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 3600000).toISOString();
      await userRepo.update({ id: user.id }, {
        resetPasswordToken: resetToken,
        resetPasswordExpires: expires,
      });
      await sendPasswordResetEmail(email, resetToken);
      return NextResponse.json({ success: true });
    }

    if (token && newPassword) {
      const user = await userRepo
        .createQueryBuilder("u")
        .where("u.resetPasswordToken = :token AND u.resetPasswordExpires > :now", {
          token,
          now: new Date().toISOString(),
        })
        .getOne();

      if (!user) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
      }

      const hash = await hashPassword(newPassword);
      await userRepo.update({ id: user.id }, {
        passwordHash: hash,
        resetPasswordToken: null as any,
        resetPasswordExpires: null as any,
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
