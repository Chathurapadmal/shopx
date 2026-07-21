import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/datasource";
import { Shop } from "@/lib/entities/Shop";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const ds = await getDataSource();
    const shopRepo = ds.getRepository(Shop);

    const shops = await shopRepo.find({ order: { createdAt: "DESC" } });

    const result = shops.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      address: s.address,
      isActive: s.isActive === 1,
      createdAt: s.createdAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Shops error:", error);
    return NextResponse.json({ error: "Failed to fetch shops" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { name, email, phone, address } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Shop name is required" }, { status: 400 });
    }

    const ds = await getDataSource();
    const shopRepo = ds.getRepository(Shop);

    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
    const now = new Date().toISOString();

    const shop = shopRepo.create({
      id,
      name,
      email: email || null,
      phone: phone || null,
      address: address || null,
      isActive: 1,
      createdAt: now,
      updatedAt: now,
    });

    await shopRepo.save(shop);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("Create shop error:", error);
    return NextResponse.json({ error: "Failed to create shop" }, { status: 500 });
  }
}
