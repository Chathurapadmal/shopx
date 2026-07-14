import { NextResponse } from "next/server";
import { query, execute, generateId, mapRows } from "@/lib/oracle";

export async function GET() {
  try {
    const result = await query(`
      SELECT p.plu_code AS id, p.plu_name AS name, p.plu_code AS barcode,
             p.default_price AS price, p.cost_price AS cost, p.stock,
             d.name AS category, NULL AS description
      FROM plu p
      LEFT JOIN department d ON d."INDEX" = p.department
      ORDER BY p.plu_name
    `);
    return NextResponse.json(mapRows(result.rows || []));
  } catch (err) {
    console.error("Products GET error:", err);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body.barcode || generateId();
    await execute(
      `INSERT INTO plu (plu_code, plu_name, default_price, cost_price, stock, department)
       VALUES (:1, :2, :3, :4, :5, :6)`,
      [id, body.name, body.price, body.cost || 0, body.stock || 0, body.category || null]
    );
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("Products POST error:", err);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
