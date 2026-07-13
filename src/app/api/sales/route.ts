import { NextResponse } from "next/server";
import { adminDb } from "../../../../firebase/admin";

export async function GET() {
  try {
    const db = adminDb;
    if (!db) {
      return NextResponse.json({ error: "Firebase not configured" }, { status: 500 });
    }
    const snap = await db.collection("sales").orderBy("createdAt", "desc").limit(100).get();
    const sales = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json(sales);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const db = adminDb;
    if (!db) {
      return NextResponse.json({ error: "Firebase not configured" }, { status: 500 });
    }
    const body = await req.json();
    const docRef = await db.collection("sales").add({
      ...body,
      createdAt: new Date().toISOString(),
    });

    for (const item of body.items || []) {
      const productRef = db.collection("products").doc(item.productId);
      const product = await productRef.get();
      if (product.exists) {
        const currentStock = product.data()?.stock || 0;
        await productRef.update({ stock: currentStock - item.quantity });
      }
    }

    if (body.customerId) {
      const custRef = db.collection("customers").doc(body.customerId);
      const cust = await custRef.get();
      if (cust.exists) {
        const points = Math.floor(body.total / 10);
        const currentPoints = cust.data()?.loyaltyPoints || 0;
        await custRef.update({ loyaltyPoints: currentPoints + points });
      }
    }

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create sale" }, { status: 500 });
  }
}
