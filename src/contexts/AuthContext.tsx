"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../../firebase/client";

type AppUser = {
  uid: string;
  email: string;
};

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

type LocalAccount = {
  uid: string;
  email: string;
  password: string;
};

const ACCOUNTS_KEY = "shopx_local_accounts";
const SESSION_KEY = "shopx_local_session";

function readLocalAccounts(): LocalAccount[] {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(window.localStorage.getItem(ACCOUNTS_KEY) || "[]") as LocalAccount[];
  } catch {
    return [];
  }
}

function writeLocalAccounts(accounts: LocalAccount[]) {
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function readLocalSession(): AppUser | null {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(window.localStorage.getItem(SESSION_KEY) || "null") as AppUser | null;
  } catch {
    return null;
  }
}

function writeLocalSession(user: AppUser | null) {
  if (user) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

function isAuthConfigError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /CONFIGURATION_NOT_FOUND|configuration not found|invalid-api-key|auth\/configuration-not-found|API key/i.test(message);
}

function toAppUser(uid: string, email: string): AppUser {
  return { uid, email };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => readLocalSession());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      setUser(firebaseUser ? toAppUser(firebaseUser.uid, firebaseUser.email || "") : readLocalSession());
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      if (!isAuthConfigError(error)) {
        throw error;
      }

      const account = readLocalAccounts().find((entry) => entry.email.toLowerCase() === email.toLowerCase());
      if (!account || account.password !== password) {
        throw new Error("Firebase Auth is not configured and no local account exists for this email.");
      }

      const localUser = toAppUser(account.uid, account.email);
      writeLocalSession(localUser);
      setUser(localUser);
    }
  };

  const register = async (email: string, password: string) => {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

    if (!apiKey) {
      throw new Error("Missing Firebase API key");
    }

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      if (!isAuthConfigError(data?.error?.message)) {
        throw new Error(data?.error?.message || "Registration failed");
      }
    }

    if (response.ok) {
      await signInWithEmailAndPassword(auth, email, password);
      return;
    }

    const accounts = readLocalAccounts();
    const existing = accounts.find((entry) => entry.email.toLowerCase() === email.toLowerCase());
    const localUser = existing ? toAppUser(existing.uid, existing.email) : toAppUser(`local_${Date.now()}`, email);
    const nextAccounts = existing
      ? accounts.map((entry) => (entry.email.toLowerCase() === email.toLowerCase() ? { ...entry, password } : entry))
      : [...accounts, { uid: localUser.uid, email, password }];

    writeLocalAccounts(nextAccounts);
    writeLocalSession(localUser);
    setUser(localUser);
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } finally {
      writeLocalSession(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
