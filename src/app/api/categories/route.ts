import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/datasource";
import { Department } from "@/lib/entities/Department";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "cashier") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const ds = await getDataSource();
    const deptRepo = ds.getRepository(Department);

    const where: any = {};
    if (user.role !== "super_admin") where.shopId = user.shopId;

    const departments = await deptRepo.find({ where, order: { name: "ASC" } });

    const result = departments.map((d) => ({
      id: d.id,
      name: d.name,
    }));

    return NextResponse.json(result);
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

    const ds = await getDataSource();
    const deptRepo = ds.getRepository(Department);

      const maxResult = await deptRepo
        .createQueryBuilder("d")
        .select("NVL(MAX(d.id), 0) + 1", "next_id")
        .getRawOne();

    const newId = maxResult?.next_id ?? 1;

    await deptRepo
      .createQueryBuilder()
      .insert()
      .into(Department)
      .values({
        id: newId,
        name: body.name.trim(),
        shopId: user.shopId ?? undefined,
      })
      .execute();
    return NextResponse.json({ id: newId }, { status: 201 });
  } catch (err) {
    console.error("Categories POST error:", err);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
