import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/datasource";
import { Vip } from "@/lib/entities/Vip";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const ds = await getDataSource();
    const vipRepo = ds.getRepository(Vip);

    const where: any = {};
    if (user.role !== "super_admin") where.shopId = user.shopId;

    const customers = await vipRepo.find({ where, order: { vipName: "ASC" } });

    const result = customers.map((c) => ({
      id: c.vipCard,
      name: c.vipName,
      phone: c.vipPhone,
      address: c.vipAddress,
      email: null,
      loyaltyPoints: c.memberPoints ? parseInt(c.memberPoints, 10) || 0 : 0,
      createdAt: null,
      updatedAt: null,
      addedBy: c.addedBy,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("Customers GET error:", err);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const ds = await getDataSource();
    const vipRepo = ds.getRepository(Vip);

    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 10);

    const vip = vipRepo.create({
      vipCard: id,
      vipName: body.name,
      vipPhone: body.phone || null,
      vipAddress: body.address || null,
      memberPoints: "0",
      shopId: user.shopId ?? undefined,
      addedBy: user.name,
    });

    await vipRepo.save(vip);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("Customers POST error:", err);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
