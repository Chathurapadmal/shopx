import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/datasource";
import { Plu } from "@/lib/entities/Plu";
import { Department } from "@/lib/entities/Department";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const ds = await getDataSource();
    const pluRepo = ds.getRepository(Plu);
    const deptRepo = ds.getRepository(Department);

    const where: any = {};
    if (user.role !== "super_admin") where.shopId = user.shopId;

    const products = await pluRepo.find({ where, order: { pluName: "ASC" } });
    const departments = await deptRepo.find();

    const deptMap = new Map(departments.map((d) => [d.id, d.name]));

    const result = products.map((p) => ({
      id: p.pluCode,
      name: p.pluName,
      barcode: p.pluCode,
      price: p.defaultPrice,
      cost: p.costPrice || 0,
      stock: p.stock || 0,
      category: p.department != null ? deptMap.get(p.department) || "" : "",
      description: null,
      modifiedBy: p.modifiedBy,
      modifiedAt: p.modifiedAt,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("Products GET error:", err);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const ds = await getDataSource();
    const pluRepo = ds.getRepository(Plu);

    const id = body.barcode || Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
    const now = new Date().toISOString();

    const plu = pluRepo.create({
      pluCode: id,
      pluName: body.name,
      defaultPrice: body.price,
      costPrice: body.cost || 0,
      stock: body.stock || 0,
      department: body.category || null,
      shopId: user.shopId ?? undefined,
      modifiedBy: user.name,
      modifiedAt: now,
    });

    await pluRepo.save(plu);
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    console.error("Products POST error:", err);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
