import { NextResponse } from "next/server";
import { query, execute, generateId, mapRows } from "@/lib/oracle";

export async function GET() {
  try {
    const result = await query(`
      SELECT "INDEX" AS id, name FROM department ORDER BY name
    `);
    return NextResponse.json(mapRows(result.rows || []));
  } catch (err) {
    console.error("Categories GET error:", err);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body?.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }
    const maxResult = await query("SELECT NVL(MAX(\"INDEX\"), 0) + 1 AS next_id FROM department");
    const newId = (maxResult.rows?.[0] as any)?.next_id ?? 1;
    await execute(
      `INSERT INTO department ("INDEX", name) VALUES (:1, :2)`,
      [newId, body.name.trim()]
    );
    return NextResponse.json({ id: newId }, { status: 201 });
  } catch (err) {
    console.error("Categories POST error:", err);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
