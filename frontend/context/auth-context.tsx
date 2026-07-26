"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { getApiUrl } from "@/lib/api";
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onIdTokenChanged,
  type FirebaseUser,
} from "@/lib/firebase";

export interface AppUser {
  id: string;
  email: string;
  full_name: string;
  role: "candidate" | "recruiter" | "admin";
  avatar_url?: string | null;
  profile?: any;
  recruiter_profile?: any;
}

interface AuthContextType {
  user: AppUser | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, fullName: string, role?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  resetPassword: async () => {},
  sendVerificationEmail: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          setToken(idToken);

          const apiBase = getApiUrl();
          const meRes = await fetch(`${apiBase}/api/auth/me`, {
            headers: { Authorization: `Bearer ${idToken}` },
          });

          if (meRes.ok) {
            const userData = await meRes.json();
            setUser(userData);
          } else {
            // Upsert / initialize user if not present
            const initRes = await fetch(`${apiBase}/api/auth/register`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify({
                email: fbUser.email || "",
                password: "firebase-managed-auth-session",
                full_name: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
              }),
            });
            if (initRes.ok) {
              const data = await initRes.json();
              setUser(data.user);
            }
          }
        } catch (err) {
          console.error("Error fetching authenticated user context:", err);
        }
      } else {
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    const userCred = await signInWithEmailAndPassword(auth, email, pass);
    const idToken = await userCred.user.getIdToken();
    setToken(idToken);
  };

  const signUp = async (email: string, pass: string, fullName: string, role: string = "candidate") => {
    const userCred = await createUserWithEmailAndPassword(auth, email, pass);
    const idToken = await userCred.user.getIdToken();
    setToken(idToken);

    const apiBase = getApiUrl();
    const res = await fetch(`${apiBase}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ email, password: pass, full_name: fullName, role }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || data.error?.message || "Registration failed on backend");
    }

    const data = await res.json();
    setUser(data.user);
  };

  const signInWithGoogle = async () => {
    const userCred = await signInWithPopup(auth, googleProvider);
    const idToken = await userCred.user.getIdToken();
    setToken(idToken);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const sendVerificationEmail = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        resetPassword,
        sendVerificationEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
