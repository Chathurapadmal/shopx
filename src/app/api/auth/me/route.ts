import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/datasource";
import { User } from "@/lib/entities/User";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ds = await getDataSource();
    const userRepo = ds.getRepository(User);

    const row = await userRepo.findOne({ where: { id: user.userId } });
    if (!row) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      shopId: row.shopId,
      twofaEnabled: row.twofaEnabled,
      emailVerified: row.emailVerified,
      isActive: row.isActive,
    });
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
