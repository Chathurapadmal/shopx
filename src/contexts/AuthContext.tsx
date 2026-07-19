"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";

type AppUser = {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "shop_admin" | "cashier";
  shopId: string | null;
};

type LoginResponse = {
  token: string;
  user: AppUser;
};

type LoginStep = "credentials" | "2fa";

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  verify2FA: (userId: string, token: string) => Promise<void>;
  setup2FA: (token?: string) => Promise<{ secret?: string; otpauthUrl?: string } | { success: boolean }>;
  logout: () => void;
  loginStep: LoginStep;
  pendingUserId: string | null;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const TOKEN_KEY = "shopx_token";
const USER_KEY = "shopx_user";

function storeSession(token: string, user: AppUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginStep, setLoginStep] = useState<LoginStep>("credentials");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AppUser;
        setUser(parsed);
      }
    } catch {}
    setLoading(false);
  }, []);

  const getToken = () => localStorage.getItem(TOKEN_KEY);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Login failed");

    if (data.require2fa) {
      setLoginStep("2fa");
      setPendingUserId(data.userId);
      return;
    }

    storeSession(data.token, data.user);
    setUser(data.user);
  };

  const verify2FA = async (userId: string, token: string) => {
    const res = await fetch("/api/auth/verify-2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, token }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Verification failed");

    storeSession(data.token, data.user);
    setUser(data.user);
    setLoginStep("credentials");
    setPendingUserId(null);
  };

  const setup2FA = async (token?: string) => {
    const storedToken = getToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (storedToken) headers["Authorization"] = `Bearer ${storedToken}`;

    const res = await fetch("/api/auth/setup-2fa", {
      method: "POST",
      headers,
      body: JSON.stringify(token ? { token } : {}),
    });

    return res.json();
  };

  const logout = () => {
    clearSession();
    setUser(null);
    router.push("/");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verify2FA, setup2FA, logout, loginStep, pendingUserId, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
