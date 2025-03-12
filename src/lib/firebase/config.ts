// Firebase configuration
import { FirebaseApp } from "firebase/app";
import { Auth } from "firebase/auth";
import { Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let analytics: Analytics | null = null;

// Lazy initialization function
async function initializeFirebase() {
  if (typeof window === "undefined") {
    // Server-side initialization (minimal)
    const { initializeApp, getApps } = await import("firebase/app");
    const { getAuth } = await import("firebase/auth");

    const apps = getApps();
    app = apps.length === 0 ? initializeApp(firebaseConfig) : apps[0];
    auth = getAuth(app);
    return { app, auth, analytics: null };
  } else {
    // Client-side initialization
    const { initializeApp, getApps } = await import("firebase/app");
    const { getAuth } = await import("firebase/auth");

    const apps = getApps();
    app = apps.length === 0 ? initializeApp(firebaseConfig) : apps[0];
    auth = getAuth(app);

    try {
      const analyticsModule = await import("firebase/analytics");
      analytics = analyticsModule.getAnalytics(app);
    } catch (err) {
      console.error("Error loading analytics:", err);
    }

    return { app, auth, analytics };
  }
}

// Export a function to get Firebase instances
export async function getFirebase() {
  return initializeFirebase();
}

// For backward compatibility
export { app, auth, analytics };
