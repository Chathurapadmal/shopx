import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/datasource";
import { Shop } from "@/lib/entities/Shop";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(req);
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const ds = await getDataSource();
    const shopRepo = ds.getRepository(Shop);

    const shop = await shopRepo.findOne({ where: { id: params.id } });
    if (!shop) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    return NextResponse.json({
      id: shop.id,
      name: shop.name,
      email: shop.email,
      phone: shop.phone,
      address: shop.address,
      isActive: shop.isActive === 1,
      createdAt: shop.createdAt,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch shop" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(req);
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { name, email, phone, address, isActive } = await req.json();
    const now = new Date().toISOString();

    const ds = await getDataSource();
    const shopRepo = ds.getRepository(Shop);

    await shopRepo.update({ id: params.id }, {
      name: name || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      isActive: isActive ? 1 : 0,
      updatedAt: now,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update shop" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(req);
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const ds = await getDataSource();
    const shopRepo = ds.getRepository(Shop);
    await shopRepo.delete({ id: params.id });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete shop" }, { status: 500 });
  }
}
