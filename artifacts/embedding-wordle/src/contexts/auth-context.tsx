import { createContext, useContext, useState, useCallback, useRef } from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export type AuthUser = { id: number; username: string; password: string };

type AuthContextValue = {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  openLogin: () => void;
  isLoginOpen: boolean;
  closeLogin: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch(`${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Login failed");
    }
    const data = await res.json();
    setUser({ id: data.id, username: data.username, password });
    localStorage.setItem("authUsername", data.username);
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const res = await fetch(`${BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Registration failed");
    }
    const data = await res.json();
    setUser({ id: data.id, username: data.username, password });
    localStorage.setItem("authUsername", data.username);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("authUsername");
  }, []);

  const openLogin = useCallback(() => setIsLoginOpen(true), []);
  const closeLogin = useCallback(() => setIsLoginOpen(false), []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, openLogin, isLoginOpen, closeLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
