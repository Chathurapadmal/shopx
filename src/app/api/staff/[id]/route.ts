import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/datasource";
import { User } from "@/lib/entities/User";
import { getAuthUser } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "cashier") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const ds = await getDataSource();
    const userRepo = ds.getRepository(User);

    const target = await userRepo.findOne({ where: { id: params.id } });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (target.role === "super_admin") return NextResponse.json({ error: "Cannot modify super admin" }, { status: 403 });
    if (user.role === "shop_admin" && target.shopId !== user.shopId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, isActive } = await req.json();
    const now = new Date().toISOString();

    await userRepo.update({ id: params.id }, {
      name: name || null,
      isActive: isActive !== false ? 1 : 0,
      updatedAt: now,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update staff" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "cashier") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const ds = await getDataSource();
    const userRepo = ds.getRepository(User);

    const target = await userRepo.findOne({ where: { id: params.id } });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (target.role === "super_admin") return NextResponse.json({ error: "Cannot delete super admin" }, { status: 403 });
    if (user.role === "shop_admin" && target.shopId !== user.shopId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await userRepo.update({ id: params.id }, { isActive: 0 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete staff" }, { status: 500 });
  }
}
