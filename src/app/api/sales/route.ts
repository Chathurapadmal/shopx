import { NextResponse } from "next/server";
import oracledb from "oracledb";
import { query, execute, generateId, mapRows, getConnection } from "@/lib/oracle";

export async function GET() {
  try {
    const conn = await getConnection();
    const result = await conn.execute(
      "SELECT * FROM sales ORDER BY created_at DESC",
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT, fetchInfo: { ITEMS_JSON: { type: oracledb.STRING } } }
    );
    await conn.close();
    const sales = mapRows(result.rows).map((sale: any) => {
      let items = [];
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = generateId();

    await execute(
      `INSERT INTO sales (id, receipt_number, items_json, subtotal, tax, discount, total, payment_method, customer_id, customer_name, cashier_id, cashier_name, created_at)
       VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12, :13)`,
      [
        id,
        body.receiptNumber,
        JSON.stringify(body.items),
        body.subtotal,
        body.tax || 0,
        body.discount || 0,
        body.total,
        body.paymentMethod,
        body.customerId || null,
        body.customerName || null,
        body.cashierId || null,
        body.cashierName || null,
        new Date().toISOString(),
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
