"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Auth } from "firebase/auth";
import { getFirebase } from "./config";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInstance, setAuthInstance] = useState<Auth | null>(null);

  useEffect(() => {
    let unsubscribe: () => void = () => {};

    const initializeAuth = async () => {
      try {
        const { auth } = await getFirebase();
        setAuthInstance(auth);

        const { onAuthStateChanged } = await import("firebase/auth");
        unsubscribe = onAuthStateChanged(auth, (user) => {
          setUser(user);
          setLoading(false);
        });
      } catch (error) {
        console.error("Error initializing auth:", error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Return the unsubscribe function directly
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    if (!authInstance) {
      const { auth } = await getFirebase();
      setAuthInstance(auth);
    }

    try {
      const { signInAnonymously } = await import("firebase/auth");
      await signInAnonymously(authInstance!);
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  };

  const signOut = async () => {
    if (!authInstance) {
      const { auth } = await getFirebase();
      setAuthInstance(auth);
    }

    try {
      const { signOut: firebaseSignOut } = await import("firebase/auth");
      await firebaseSignOut(authInstance!);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
