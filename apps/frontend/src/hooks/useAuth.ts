import { useState } from "react";
import type { User } from "../types";

const USER_KEY = "snail_racing_user";
const TOKEN_KEY = "snail_racing_token";

function loadUser(): User | null {
  const stored = localStorage.getItem(USER_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed.id === "string" && typeof parsed.email === "string") {
      return parsed as User;
    }
    localStorage.removeItem(USER_KEY);
    return null;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

function loadToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(loadUser);
  const [token, setToken] = useState<string | null>(loadToken);

  const isAuthenticated = user !== null && token !== null;

  const login = (userData: User, authToken: string) => {
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    localStorage.setItem(TOKEN_KEY, authToken);
    setUser(userData);
    setToken(authToken);
  };

  const logout = () => {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setToken(null);
  };

  return { user, token, isAuthenticated, login, logout };
}
