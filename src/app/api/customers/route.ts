import { NextRequest, NextResponse } from "next/server";
import { query, execute, generateId, mapRows } from "@/lib/oracle";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    let sql = `
      SELECT vip_card AS id, vip_name AS name, vip_phone AS phone,
             vip_address AS address, NULL AS email, member_points AS loyalty_points,
             NULL AS created_at, NULL AS updated_at, added_by
      FROM vip
    `;
    const params: any[] = [];
    if (user.role !== "super_admin") {
      sql += " WHERE shop_id = :1";
      params.push(user.shopId);
    }
    sql += " ORDER BY vip_name";

    const result = await query(sql, params);
    return NextResponse.json(mapRows(result.rows));
  } catch (err) {
    console.error("Customers GET error:", err);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const id = generateId();
    await execute(
      `INSERT INTO vip (vip_card, vip_name, vip_phone, vip_address, member_points, shop_id, added_by)
       VALUES (:1, :2, :3, :4, 0, :5, :6)`,
      [id, body.name, body.phone || null, body.address || null, user.shopId, user.name]
    );
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("Customers POST error:", err);
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
  }
}
