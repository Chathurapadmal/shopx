import { NextRequest, NextResponse } from "next/server";
import { query, execute, mapRows } from "@/lib/oracle";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "cashier") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    let sql = `SELECT "INDEX" AS id, name FROM department`;
    const params: any[] = [];
    if (user.role !== "super_admin") {
      sql += " WHERE shop_id = :1";
      params.push(user.shopId);
    }
    sql += " ORDER BY name";

    const result = await query(sql, params);
    return NextResponse.json(mapRows(result.rows || []));
  } catch (err) {
    console.error("Categories GET error:", err);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "cashier") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    if (!body?.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }
    const maxResult = await query("SELECT NVL(MAX(\"INDEX\"), 0) + 1 AS next_id FROM department");
    const newId = (maxResult.rows?.[0] as any)?.NEXT_ID ?? 1;
    await execute(
      `INSERT INTO department ("INDEX", name, shop_id) VALUES (:1, :2, :3)`,
      [newId, body.name.trim(), user.shopId]
    );
    return NextResponse.json({ id: newId }, { status: 201 });
  } catch (err) {
    console.error("Categories POST error:", err);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
