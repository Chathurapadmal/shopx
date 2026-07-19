import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/lib/oracle";
import { getAuthUser } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "cashier") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const target = await query("SELECT role, shop_id FROM users WHERE id = :1", [params.id]);
    const targetRow = target.rows?.[0];
    if (!targetRow) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (targetRow.ROLE === "super_admin") return NextResponse.json({ error: "Cannot modify super admin" }, { status: 403 });
    if (user.role === "shop_admin" && targetRow.SHOP_ID !== user.shopId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, isActive } = await req.json();
    const now = new Date().toISOString();
    await execute("UPDATE users SET name = :1, is_active = :2, updated_at = :3 WHERE id = :4", [name || null, isActive !== false ? 1 : 0, now, params.id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update staff" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "cashier") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const target = await query("SELECT role, shop_id FROM users WHERE id = :1", [params.id]);
    const targetRow = target.rows?.[0];
    if (!targetRow) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (targetRow.ROLE === "super_admin") return NextResponse.json({ error: "Cannot delete super admin" }, { status: 403 });
    if (user.role === "shop_admin" && targetRow.SHOP_ID !== user.shopId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await execute("UPDATE users SET is_active = 0 WHERE id = :1", [params.id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete staff" }, { status: 500 });
  }
}
