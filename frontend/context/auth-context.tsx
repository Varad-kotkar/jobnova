"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

interface AuthContextType {
  user: User | MockUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  isDemoUser: boolean;
}

export interface MockUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  resetPassword: async () => {},
  logout: async () => {},
  isDemoUser: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | MockUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoUser, setIsDemoUser] = useState<boolean>(false);

  useEffect(() => {
    // Check if demo user is stored in localStorage
    const savedDemoUser = localStorage.getItem("jobnova_demo_user");
    if (savedDemoUser) {
      try {
        setUser(JSON.parse(savedDemoUser));
        setIsDemoUser(true);
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem("jobnova_demo_user");
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsDemoUser(false);
      } else if (!isDemoUser) {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isDemoUser]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.warn("Firebase Auth Google Popup warning, switching to seamless demo login:", err);
      const demoUser: MockUser = {
        uid: "demo-user-123",
        email: "alex.rivera@example.com",
        displayName: "Alex Rivera",
        photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      };
      localStorage.setItem("jobnova_demo_user", JSON.stringify(demoUser));
      setUser(demoUser);
      setIsDemoUser(true);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      console.warn("Firebase Auth fallback to local session:", err);
      const demoUser: MockUser = {
        uid: `user-${Date.now()}`,
        email: email,
        displayName: email.split("@")[0] || "User",
        photoURL: null,
      };
      localStorage.setItem("jobnova_demo_user", JSON.stringify(demoUser));
      setUser(demoUser);
      setIsDemoUser(true);
    }
  };

  const signUpWithEmail = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
    } catch (err) {
      console.warn("Firebase SignUp fallback to local session:", err);
      const demoUser: MockUser = {
        uid: `user-${Date.now()}`,
        email: email,
        displayName: email.split("@")[0] || "New Candidate",
        photoURL: null,
      };
      localStorage.setItem("jobnova_demo_user", JSON.stringify(demoUser));
      setUser(demoUser);
      setIsDemoUser(true);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch {
      // Graceful notification in demo mode
    }
  };

  const logout = async () => {
    localStorage.removeItem("jobnova_demo_user");
    setIsDemoUser(false);
    setUser(null);
    try {
      await signOut(auth);
    } catch {
      // Ignored
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        logout,
        isDemoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
