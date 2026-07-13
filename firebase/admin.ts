import admin from "firebase-admin";

function getAdminApp() {
  if (admin.apps.length) return admin.apps[0]!;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey || projectId === "your-project-id") {
    if (typeof window === "undefined") {
      console.warn("Firebase Admin: Missing or placeholder credentials. API routes will return 500.");
    }
    return null as unknown as admin.app.App;
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

function getAdminDb() {
  try {
    const app = getAdminApp();
    return admin.firestore(app);
  } catch {
    return null as unknown as admin.firestore.Firestore;
  }
}

function getAdminAuth() {
  try {
    const app = getAdminApp();
    return admin.auth(app);
  } catch {
    return null as unknown as admin.auth.Auth;
  }
}

export const adminDb = getAdminDb();
export const adminAuth = getAdminAuth();
