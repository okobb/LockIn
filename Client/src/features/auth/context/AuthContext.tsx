import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { auth, type User } from "../api/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error("Failed to parse user from storage", e);
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    const t = localStorage.getItem("token");
    return t === "null" || t === "undefined" ? null : t;
  });

  useEffect(() => {

    // Refresh user data if we have a token
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      auth
        .getMe()
        .then((res) => {
          const fresh = res.data;
          setUser(fresh);
          localStorage.setItem("user", JSON.stringify(fresh));
        })
        .catch((err) => {
          console.error("Background user refresh failed", err);
        });
    }
  }, []);

  const setAuth = useCallback((newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("current_focus_session");
  }, []);

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) return;
    try {
      const response = await auth.getMe();
      const freshUser = response.data;
      setUser(freshUser);
      localStorage.setItem("user", JSON.stringify(freshUser));
    } catch (e) {
      console.error("Manual refresh user failed", e);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      setAuth,
      logout,
      refreshUser,
    }),
    [user, token, setAuth, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
