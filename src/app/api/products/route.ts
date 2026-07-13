import { NextResponse } from "next/server";
import { adminDb } from "../../../../firebase/admin";

export async function GET() {
  try {
    const db = adminDb;
    if (!db) {
      return NextResponse.json({ error: "Firebase not configured" }, { status: 500 });
    }
    const snap = await db.collection("products").orderBy("name").get();
    const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json(products);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const db = adminDb;
    if (!db) {
      return NextResponse.json({ error: "Firebase not configured" }, { status: 500 });
    }
    const body = await req.json();
    const docRef = await db.collection("products").add({
      ...body,
      createdAt: new Date().toISOString(),
    });
    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
