import { NextRequest, NextResponse } from "next/server";
import { query, execute, generateId, mapRows } from "@/lib/oracle";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    let sql = `
      SELECT p.plu_code AS id, p.plu_name AS name, p.plu_code AS barcode,
             p.default_price AS price, p.cost_price AS cost, p.stock,
             d.name AS category, NULL AS description, p.modified_by, p.modified_at
      FROM plu p
      LEFT JOIN department d ON d."INDEX" = p.department
    `;
    const params: any[] = [];

    if (user.role !== "super_admin") {
      sql += " WHERE p.shop_id = :1";
      params.push(user.shopId);
    }

    sql += " ORDER BY p.plu_name";
    const result = await query(sql, params);
    return NextResponse.json(mapRows(result.rows || []));
  } catch (err) {
    console.error("Products GET error:", err);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const id = body.barcode || generateId();
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO plu (plu_code, plu_name, default_price, cost_price, stock, department, shop_id, modified_by, modified_at)
       VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9)`,
      [id, body.name, body.price, body.cost || 0, body.stock || 0, body.category || null, user.shopId, user.name, now]
    );
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("Products POST error:", err);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
