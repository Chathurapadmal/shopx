import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/datasource";
import { User } from "@/lib/entities/User";

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const ds = await getDataSource();
    const userRepo = ds.getRepository(User);

    const user = await userRepo.findOne({ where: { emailVerificationToken: token } });
    if (!user) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    await userRepo.update({ id: user.id }, {
      emailVerified: 1,
      emailVerificationToken: null as any,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
