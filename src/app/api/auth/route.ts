import { NextResponse } from "next/server";
import { adminAuth } from "../../../../firebase/admin";

export async function POST(req: Request) {
  try {
    const auth = adminAuth;
    if (!auth) {
      return NextResponse.json({ error: "Firebase not configured" }, { status: 500 });
    }
    const { uid } = await req.json();
    const user = await auth.getUser(uid);
    return NextResponse.json({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
    });
  } catch (err) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}
