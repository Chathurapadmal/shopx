import { NextResponse } from "next/server";
import { adminDb } from "../../../../../firebase/admin";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = adminDb;
    if (!db) {
      return NextResponse.json({ error: "Firebase not configured" }, { status: 500 });
    }
    const snap = await db.collection("products").doc(params.id).get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ id: snap.id, ...snap.data() });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = adminDb;
    if (!db) {
      return NextResponse.json({ error: "Firebase not configured" }, { status: 500 });
    }
    const body = await req.json();
    await db.collection("products").doc(params.id).update({
      ...body,
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = adminDb;
    if (!db) {
      return NextResponse.json({ error: "Firebase not configured" }, { status: 500 });
    }
    await db.collection("products").doc(params.id).delete();
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
