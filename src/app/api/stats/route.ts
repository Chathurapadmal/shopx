import { NextResponse } from "next/server";
import { query, mapRows } from "@/lib/oracle";

export async function GET() {
  try {
    const [salesResult, productsResult, customersResult] = await Promise.all([
      query("SELECT total, created_at FROM sales"),
      query("SELECT COUNT(*) AS count FROM plu"),
      query("SELECT COUNT(*) AS count FROM vip"),
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
      totalRevenue,
      totalOrders,
      totalProducts,
      totalCustomers,
      todaySales,
    });
  } catch (err) {
    console.error("Stats GET error:", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
