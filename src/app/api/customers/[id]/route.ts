import { NextResponse } from "next/server";
import { query, execute, mapRows } from "@/lib/oracle";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await query(`
      SELECT vip_card AS id, vip_name AS name, vip_phone AS phone,
             vip_address AS address, NULL AS email, member_points AS loyalty_points,
             NULL AS created_at, NULL AS updated_at
      FROM vip WHERE vip_card = :1
    `, [params.id]);
    if (!result.rows || result.rows.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    return NextResponse.json(mapRows(result.rows)[0]);
  } catch (err) {
    console.error("Customer GET error:", err);
    return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    await execute(
      `UPDATE vip SET vip_name = :1, vip_phone = :2, vip_address = :3 WHERE vip_card = :4`,
      [body.name, body.phone || null, body.address || null, params.id]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Customer PATCH error:", err);
    return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await execute("DELETE FROM vip WHERE vip_card = :1", [params.id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}
