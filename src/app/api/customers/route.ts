import { NextResponse } from "next/server";
import { query, execute, generateId, mapRows } from "@/lib/oracle";

export async function GET() {
  try {
    const result = await query(`
      SELECT vip_card AS id, vip_name AS name, vip_phone AS phone,
             vip_address AS address, NULL AS email, member_points AS loyalty_points,
             NULL AS created_at, NULL AS updated_at
      FROM vip
      ORDER BY vip_name
    `);
    return NextResponse.json(mapRows(result.rows));
  } catch (err) {
    console.error("Customers GET error:", err);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = generateId();
    await execute(
      `INSERT INTO vip (vip_card, vip_name, vip_phone, vip_address, member_points)
       VALUES (:1, :2, :3, :4, 0)`,
      [id, body.name, body.phone || null, body.address || null]
    );
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("Customers POST error:", err);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
