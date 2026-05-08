"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { login as apiLogin } from "./api";
import type { TokenResponse, UserRead } from "./types";

const STORAGE_KEY = "nbktoybrary_auth";

interface StoredAuth {
  token: string;
  user: UserRead;
}

interface AuthContextValue {
  user: UserRead | null;
  token: string | null;
  authReady: boolean;
  login: (email: string, password: string) => Promise<UserRead>;
  logout: () => void;
  updateStoredUser: (updated: UserRead) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperadmin: boolean;
  isMember: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<UserRead | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        const stored = JSON.parse(raw) as StoredAuth;
        setToken(stored.token);
        setUser(stored.user);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setAuthReady(true);
  }, []);

  useEffect(() => {
    function handleUnauthorized(): void {
      localStorage.removeItem(STORAGE_KEY);
      setToken(null);
      setUser(null);
    }
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<UserRead> => {
    const response: TokenResponse = await apiLogin(email, password);
    const stored: StoredAuth = { token: response.access_token, user: response.user };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    setToken(response.access_token);
    setUser(response.user);
    return response.user;
  }, []);

  const logout = useCallback((): void => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const updateStoredUser = useCallback((updated: UserRead): void => {
    setUser(updated);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw !== null) {
        const stored = JSON.parse(raw) as StoredAuth;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: stored.token, user: updated }));
      }
    } catch {
      // ignore
    }
  }, []);

  const roles = user?.roles ?? [];

  const value: AuthContextValue = {
    user,
    token,
    authReady,
    login,
    logout,
    updateStoredUser,
    isAuthenticated: user !== null,
    isAdmin: roles.includes("admin") || roles.includes("superadmin"),
    isSuperadmin: roles.includes("superadmin"),
    isMember: roles.includes("member"),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
