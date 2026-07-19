import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/lib/oracle";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(req);
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await query("SELECT id, name, email, phone, address, is_active, created_at FROM shops WHERE id = :1", [params.id]);
    const row = result.rows?.[0];
    if (!row) return NextResponse.json({ error: "Shop not found" }, { status: 404 });

    return NextResponse.json({
      id: row.ID, name: row.NAME, email: row.EMAIL, phone: row.PHONE,
      address: row.ADDRESS, isActive: row.IS_ACTIVE === 1, createdAt: row.CREATED_AT,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch shop" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(req);
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { name, email, phone, address, isActive } = await req.json();
    const now = new Date().toISOString();
    await execute(
      "UPDATE shops SET name = :1, email = :2, phone = :3, address = :4, is_active = :5, updated_at = :6 WHERE id = :7",
      [name || null, email || null, phone || null, address || null, isActive ? 1 : 0, now, params.id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update shop" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(req);
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await execute("DELETE FROM shops WHERE id = :1", [params.id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete shop" }, { status: 500 });
  }
}
