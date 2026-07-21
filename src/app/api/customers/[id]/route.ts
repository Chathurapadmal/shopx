import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/datasource";
import { Vip } from "@/lib/entities/Vip";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const ds = await getDataSource();
    const vipRepo = ds.getRepository(Vip);

    const where: any = { vipCard: params.id };
    if (user.role !== "super_admin") where.shopId = user.shopId;

    const customer = await vipRepo.findOne({ where });
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    return NextResponse.json({
      id: customer.vipCard,
      name: customer.vipName,
      phone: customer.vipPhone,
      address: customer.vipAddress,
      email: null,
      loyaltyPoints: customer.memberPoints ? parseInt(customer.memberPoints, 10) || 0 : 0,
      createdAt: null,
      updatedAt: null,
    });
  } catch (err) {
    console.error("Customer GET error:", err);
    return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const ds = await getDataSource();
    const vipRepo = ds.getRepository(Vip);

    await vipRepo.update({ vipCard: params.id }, {
      vipName: body.name,
      vipPhone: body.phone || null,
      vipAddress: body.address || null,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Customer PATCH error:", err);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "cashier") {
    return NextResponse.json({ error: "Cashiers cannot delete customers" }, { status: 403 });
  }

  try {
    const ds = await getDataSource();
    const vipRepo = ds.getRepository(Vip);
    await vipRepo.delete({ vipCard: params.id });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}
