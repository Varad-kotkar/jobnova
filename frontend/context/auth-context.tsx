"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { getApiUrl } from "@/lib/api";
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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
  const [user, setUser] = useState<AppUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("jobnova_session_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("jobnova_session_token") || null;
  });

  const [loading, setLoading] = useState<boolean>(true);

  const saveSession = (u: AppUser | null, t: string | null) => {
    setUser(u);
    setToken(t);
    if (typeof window !== "undefined") {
      if (u && t) {
        localStorage.setItem("jobnova_session_user", JSON.stringify(u));
        localStorage.setItem("jobnova_session_token", t);
      } else {
        localStorage.removeItem("jobnova_session_user");
        localStorage.removeItem("jobnova_session_token");
      }
    }
  };

  // Handle Google redirect result on mount (popup-blocked fallback)
  useEffect(() => {
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        const idToken = await result.user.getIdToken();
        const apiBase = getApiUrl();
        const meRes = await fetch(`${apiBase}/api/auth/me`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (meRes.ok) {
          const userData = await meRes.json();
          saveSession(userData, idToken);
        }
      }
    }).catch(() => {
      // No redirect pending — normal load
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          const apiBase = getApiUrl();
          const meRes = await fetch(`${apiBase}/api/auth/me`, {
            headers: { Authorization: `Bearer ${idToken}` },
          });

          if (meRes.ok) {
            const userData = await meRes.json();
            saveSession(userData, idToken);
          } else {
            // Upsert / initialize user if not present (first Google sign-in)
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
              saveSession(data.user, idToken);
            }
          }
        } catch (err) {
          console.error("Error fetching authenticated user context:", err);
        }
      } else {
        // Firebase explicitly fired null — user signed out on Firebase side
        // Only clear if we previously had a Firebase-managed session
        const storedToken = typeof window !== "undefined" ? localStorage.getItem("jobnova_session_token") : null;
        if (storedToken && storedToken.length > 100) {
          // Heuristic: JWT tokens are long; Firebase ID tokens are very long
          saveSession(null, null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, pass);
      const idToken = await userCred.user.getIdToken();
      const apiBase = getApiUrl();
      const meRes = await fetch(`${apiBase}/api/auth/me`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (meRes.ok) {
        const userData = await meRes.json();
        saveSession(userData, idToken);
        return;
      }
    } catch (fbErr: any) {
      console.warn("Firebase auth warning (falling back to API auth):", fbErr?.message || fbErr);
    }

    // Backend Auth Fallback for Dev/Local environments or invalid Firebase API Key
    const apiBase = getApiUrl();
    const res = await fetch(`${apiBase}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = data.detail || data.error?.message || "Invalid credentials. Please verify your email and password.";
      throw new Error(msg.includes("api-key-not-valid") ? "Invalid credentials. Please check your login details." : msg);
    }

    const data = await res.json();
    saveSession(data.user, data.access_token);
  };

  const signUp = async (email: string, pass: string, fullName: string, role: string = "candidate") => {
    let idToken = "";
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, pass);
      idToken = await userCred.user.getIdToken();
    } catch (fbErr: any) {
      console.warn("Firebase signup warning (falling back to API registration):", fbErr?.message || fbErr);
    }

    const apiBase = getApiUrl();
    const res = await fetch(`${apiBase}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify({ email, password: pass, full_name: fullName, role }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = data.detail || data.error?.message || "Registration failed. Please try a different email address.";
      throw new Error(msg.includes("api-key-not-valid") ? "Registration failed. Please check your details." : msg);
    }

    const data = await res.json();
    saveSession(data.user, data.token || idToken);
  };

  const signInWithGoogle = async () => {
    try {
      const userCred = await signInWithPopup(auth, googleProvider);
      const idToken = await userCred.user.getIdToken();
      const apiBase = getApiUrl();
      const meRes = await fetch(`${apiBase}/api/auth/me`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (meRes.ok) {
        const userData = await meRes.json();
        saveSession(userData, idToken);
      }
    } catch (err: any) {
      if (err?.code === "auth/popup-blocked" || err?.code === "auth/popup-closed-by-user") {
        console.warn("Popup blocked or closed, falling back to signInWithRedirect...");
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      if (err?.code === "auth/unauthorized-domain") {
        throw new Error(
          "This domain is not authorized for Google Sign-In in Firebase Console. Please add your domain to Firebase Console -> Authentication -> Settings -> Authorized Domains."
        );
      }
      throw new Error(err?.message || "Google sign in failed. Please try again.");
    }
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
    try {
      await firebaseSignOut(auth);
    } catch {
      // Ignore firebase signout error if offline or uninitialized
    }
    saveSession(null, null);
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
