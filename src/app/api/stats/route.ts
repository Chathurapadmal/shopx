import { NextResponse } from "next/server";
import { adminDb } from "../../../../firebase/admin";

export async function GET() {
  try {
    const db = adminDb;
    if (!db) {
      return NextResponse.json({ error: "Firebase not configured" }, { status: 500 });
    }
    const salesSnap = await db.collection("sales").get();
    const productsSnap = await db.collection("products").get();
    const customersSnap = await db.collection("customers").get();

    let totalRevenue = 0;
    let totalOrders = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let todaySales = 0;

    salesSnap.forEach((doc) => {
      const sale = doc.data();
      const date = sale.createdAt ? new Date(sale.createdAt) : new Date();
      totalRevenue += sale.total || 0;
      totalOrders++;
      if (date >= today) {
        todaySales += sale.total || 0;
      }
    });

    return NextResponse.json({
      totalRevenue,
      totalOrders,
      totalProducts: productsSnap.size,
      totalCustomers: customersSnap.size,
      todaySales,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
