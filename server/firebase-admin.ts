import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Initialize Firebase Admin SDK
if (!getApps().length) {
  // For development, we'll use the Firebase Admin SDK with service account
  // In production, you would use a proper service account key
  initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || "todo-task-management-web",
  });
}

export const adminAuth = getAuth();

export async function verifyFirebaseToken(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    throw new Error("Invalid Firebase token");
  }
}
