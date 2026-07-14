import { NextResponse } from "next/server";
import { query, execute, mapRows } from "@/lib/oracle";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await query(`
      SELECT p.plu_code AS id, p.plu_name AS name, p.plu_code AS barcode,
             p.default_price AS price, p.cost_price AS cost, p.stock,
             d.name AS category, NULL AS description
      FROM plu p
      LEFT JOIN department d ON d."INDEX" = p.department
      WHERE p.plu_code = :1
    `, [params.id]);
    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json(mapRows(result.rows)[0]);
  } catch (err) {
    console.error("Product GET error:", err);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const deptResult = await query("SELECT \"INDEX\" AS idx FROM department WHERE name = :1", [body.category || '']);
    const deptIndex = deptResult.rows && deptResult.rows.length > 0 ? (deptResult.rows[0] as any).idx : null;
    await execute(
      `UPDATE plu SET plu_name = :1, default_price = :2, cost_price = :3, stock = :4, department = :5 WHERE plu_code = :6`,
      [body.name, body.price, body.cost || 0, body.stock || 0, deptIndex, params.id]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Product PATCH error:", err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await execute("DELETE FROM plu WHERE plu_code = :1", [params.id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
