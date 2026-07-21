import { NextRequest, NextResponse } from "next/server";
import { getDataSource } from "@/lib/datasource";
import { Plu } from "@/lib/entities/Plu";
import { Department } from "@/lib/entities/Department";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const ds = await getDataSource();
    const pluRepo = ds.getRepository(Plu);
    const deptRepo = ds.getRepository(Department);

    const where: any = { pluCode: params.id };
    if (user.role !== "super_admin") where.shopId = user.shopId;

    const product = await pluRepo.findOne({ where });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    let category = "";
    if (product.department != null) {
      const dept = await deptRepo.findOne({ where: { id: product.department } });
      if (dept) category = dept.name || "";
    }

    return NextResponse.json({
      id: product.pluCode,
      name: product.pluName,
      barcode: product.pluCode,
      price: product.defaultPrice,
      cost: product.costPrice || 0,
      stock: product.stock || 0,
      category,
      description: null,
    });
  } catch (err) {
    console.error("Product GET error:", err);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const ds = await getDataSource();
    const pluRepo = ds.getRepository(Plu);

    let deptIndex: number | null = null;
    if (body.category) {
      const deptRepo = ds.getRepository(Department);
      const dept = await deptRepo.findOne({ where: { name: body.category } });
      if (dept) deptIndex = dept.id;
    }

    const now = new Date().toISOString();
    const where: any = { pluCode: params.id };
    if (user.role !== "super_admin") where.shopId = user.shopId;

    await pluRepo.update(where, {
      pluName: body.name,
      defaultPrice: body.price,
      costPrice: body.cost || 0,
      stock: body.stock || 0,
      department: deptIndex ?? undefined,
      modifiedBy: user.name,
      modifiedAt: now,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Product PATCH error:", err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role === "cashier") {
    return NextResponse.json({ error: "Cashiers cannot delete products" }, { status: 403 });
  }

  try {
    const ds = await getDataSource();
    const pluRepo = ds.getRepository(Plu);

    const where: any = { pluCode: params.id };
    if (user.role !== "super_admin") where.shopId = user.shopId;

    await pluRepo.delete(where);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
