import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/datasource";
import { Sale } from "@/lib/entities/Sale";
import { Plu } from "@/lib/entities/Plu";
import { Vip } from "@/lib/entities/Vip";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "cashier") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const ds = await getDataSource();
    const saleRepo = ds.getRepository(Sale);

    const where: any = {};
    if (user.role !== "super_admin") where.shopId = user.shopId;

    const sales = await saleRepo.find({ where, order: { createdAt: "DESC" } });

    const result = sales.map((sale) => {
      let items: any[] = [];
      if (sale.itemsJson) {
        try { items = JSON.parse(sale.itemsJson); } catch {}
      }
      return {
        id: sale.id,
        items,
        subtotal: sale.subtotal,
        tax: sale.tax,
        discount: sale.discount,
        total: sale.total,
        paymentMethod: sale.paymentMethod,
        customerId: sale.customerId,
        customerName: sale.customerName,
        cashierId: sale.cashierId,
        cashierName: sale.cashierName,
        receiptNumber: sale.receiptNumber,
        createdAt: sale.createdAt,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Sales GET error:", err);
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const ds = await getDataSource();

    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
    const now = new Date().toISOString();

    const saleRepo = ds.getRepository(Sale);
    const sale = saleRepo.create({
      id,
      receiptNumber: body.receiptNumber,
      itemsJson: JSON.stringify(body.items),
      subtotal: body.subtotal,
      tax: body.tax || 0,
      discount: body.discount || 0,
      total: body.total,
      paymentMethod: body.paymentMethod,
      customerId: body.customerId || null,
      customerName: body.customerName || null,
      cashierId: user.userId,
      cashierName: user.name,
      createdAt: now,
      shopId: user.shopId ?? undefined,
    });

    await saleRepo.save(sale);

    const pluRepo = ds.getRepository(Plu);
    for (const item of body.items || []) {
      await pluRepo
        .createQueryBuilder()
        .update(Plu)
        .set({ stock: () => "stock - :qty" })
        .where("pluCode = :id AND stock >= :qty", { id: item.productId, qty: item.quantity })
        .setParameters({ qty: item.quantity, id: item.productId })
        .execute();
    }

    if (body.customerId) {
      const vipRepo = ds.getRepository(Vip);
      const points = Math.floor(body.total / 10);
      await vipRepo
        .createQueryBuilder()
        .update(Vip)
        .set({ memberPoints: () => "NVL(member_points, 0) + :pts" })
        .where("vipCard = :id", { id: body.customerId })
        .setParameters({ pts: points })
        .execute();
    }

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("Sales POST error:", err);
    return NextResponse.json({ error: "Failed to create sale" }, { status: 500 });
  }
}
