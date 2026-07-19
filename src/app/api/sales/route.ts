import { NextRequest, NextResponse } from "next/server";
import oracledb from "oracledb";
import { query, execute, generateId, mapRows, getConnection } from "@/lib/oracle";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "cashier") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const conn = await getConnection();
    let sql = "SELECT * FROM sales";
    const params: any[] = [];

    if (user.role !== "super_admin") {
      sql += " WHERE shop_id = :1";
      params.push(user.shopId);
    }
    sql += " ORDER BY created_at DESC";

    const result = await conn.execute(sql, params, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      fetchInfo: { ITEMS_JSON: { type: oracledb.STRING } },
    });
    await conn.close();

    const sales = mapRows(result.rows).map((sale: any) => {
      let items: any[] = [];
      if (sale.items_json) {
        try { items = JSON.parse(sale.items_json); } catch {}
      }
      return { ...sale, items, items_json: undefined };
    });
    return NextResponse.json(sales);
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
    const id = generateId();
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO sales (id, receipt_number, items_json, subtotal, tax, discount, total, payment_method, customer_id, customer_name, cashier_id, cashier_name, created_at, shop_id)
       VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12, :13, :14)`,
      [
        id, body.receiptNumber, JSON.stringify(body.items), body.subtotal,
        body.tax || 0, body.discount || 0, body.total, body.paymentMethod,
        body.customerId || null, body.customerName || null,
        user.userId, user.name, now, user.shopId,
      ]
    );

    for (const item of body.items || []) {
      await execute(
        "UPDATE plu SET stock = stock - :1 WHERE plu_code = :2 AND stock >= :3",
        [item.quantity, item.productId, item.quantity]
      );
    }

    if (body.customerId) {
      const points = Math.floor(body.total / 10);
      await execute(
        "UPDATE vip SET member_points = NVL(member_points, 0) + :1 WHERE vip_card = :2",
        [points, body.customerId]
      );
    }

    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("Sales POST error:", err);
    return NextResponse.json({ error: "Failed to create sale" }, { status: 500 });
  }
}
