import { NextRequest, NextResponse } from "next/server";
import { execute, query } from "@/lib/oracle";
import { getAuthUser } from "@/lib/auth";
import { generateId } from "@/lib/oracle";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await query("SELECT id, name, email, phone, address, is_active, created_at FROM shops ORDER BY created_at DESC");
    return NextResponse.json(result.rows?.map((r: any) => ({
      id: r.ID,
      name: r.NAME,
      email: r.EMAIL,
      phone: r.PHONE,
      address: r.ADDRESS,
      isActive: r.IS_ACTIVE === 1,
      createdAt: r.CREATED_AT,
    })) || []);
  } catch (error) {
    console.error("Shops error:", error);
    return NextResponse.json({ error: "Failed to fetch shops" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user || user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { name, email, phone, address } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Shop name is required" }, { status: 400 });
    }

    const id = generateId();
    const now = new Date().toISOString();
    await execute(
      "INSERT INTO shops (id, name, email, phone, address, is_active, created_at, updated_at) VALUES (:1, :2, :3, :4, :5, 1, :6, :6)",
      [id, name, email || null, phone || null, address || null, now]
    );

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("Create shop error:", error);
    return NextResponse.json({ error: "Failed to create shop" }, { status: 500 });
  }
}
