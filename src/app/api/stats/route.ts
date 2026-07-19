import { NextRequest, NextResponse } from "next/server";
import { query, mapRows } from "@/lib/oracle";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "cashier") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const shopFilter = user.role !== "super_admin" ? " WHERE shop_id = :1" : "";
    const shopParams = user.role !== "super_admin" ? [user.shopId] : [];

    const [salesResult, productsResult, customersResult] = await Promise.all([
      query("SELECT total, created_at FROM sales" + shopFilter, shopParams),
      query("SELECT COUNT(*) AS count FROM plu" + shopFilter, shopParams),
      query("SELECT COUNT(*) AS count FROM vip" + shopFilter, shopParams),
    ]);

    let totalRevenue = 0;
    let totalOrders = 0;
    let todaySales = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sales = mapRows(salesResult.rows);
    for (const row of sales) {
      const saleDate = new Date(row.created_at);
      totalRevenue += row.total || 0;
      totalOrders++;
      if (saleDate >= today) {
        todaySales += row.total || 0;
      }
    }

    const productsRow = mapRows(productsResult.rows)[0] || {};
    const customersRow = mapRows(customersResult.rows)[0] || {};
    const totalProducts = productsRow.count || 0;
    const totalCustomers = customersRow.count || 0;

    return NextResponse.json({
      totalRevenue, totalOrders, totalProducts, totalCustomers, todaySales,
    });
  } catch (err) {
    console.error("Stats GET error:", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
