import { NextResponse } from "next/server";
import { adminDb } from "../../../../firebase/admin";

export async function GET() {
  try {
    const db = adminDb;
    if (!db) {
      return NextResponse.json({ error: "Firebase not configured" }, { status: 500 });
    }

    const snap = await db.collection("categories").orderBy("name").get();
    const categories = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(categories);
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const db = adminDb;
    if (!db) {
      return NextResponse.json({ error: "Firebase not configured" }, { status: 500 });
    }

    const body = await req.json();
    if (!body?.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const docRef = await db.collection("categories").add({
      name: body.name.trim(),
      color: body.color || null,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}