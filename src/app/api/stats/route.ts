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

    const where: any = {};
    if (user.role !== "super_admin") where.shopId = user.shopId;

    const [sales, productCount, customerCount] = await Promise.all([
      ds.getRepository(Sale).find({ where, select: { total: true, createdAt: true } }),
      ds.getRepository(Plu).count({ where }),
      ds.getRepository(Vip).count({ where }),
    ]);

    let totalRevenue = 0;
    let totalOrders = 0;
    let todaySales = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const sale of sales) {
      const saleDate = new Date(sale.createdAt || "");
      totalRevenue += sale.total || 0;
      totalOrders++;
      if (saleDate >= today) {
        todaySales += sale.total || 0;
      }
    }

    return NextResponse.json({
      totalRevenue,
      totalOrders,
      totalProducts: productCount,
      totalCustomers: customerCount,
      todaySales,
    });
  } catch (err) {
    console.error("Stats GET error:", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
