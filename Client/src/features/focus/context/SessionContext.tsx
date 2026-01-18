import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useAuthContext } from "../../auth/context/AuthContext";

export interface ActiveSession {
  taskId?: number;
  title: string;
  isFreestyle?: boolean;
  sessionId?: number;
  timer: number;
  isPaused: boolean;
  lastUpdated: number;
}

interface SessionState {
  activeSession: ActiveSession | null;
  updateSession: (updates: Partial<ActiveSession>) => void;
  clearSession: () => void;
}

const SessionContext = createContext<SessionState | undefined>(undefined);

const STORAGE_KEY = "current_focus_session";

export function SessionProvider({ children }: { children: ReactNode }) {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(
    () => {
      if (typeof window === "undefined") return null;
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error("Failed to parse active session from storage", e);
          return null;
        }
      }
      return null;
    },
  );

  // Sync to localStorage whenever activeSession changes
  useEffect(() => {
    if (activeSession) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeSession));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [activeSession]);

  const { user } = useAuthContext();

  // Track previous user state to detect logout (not initial load)
  const previousUserRef = useRef<typeof user | undefined>(undefined);

  // Clear session only when user actually logs out
  useEffect(() => {
    const wasLoggedIn =
      previousUserRef.current !== undefined && previousUserRef.current !== null;
    const isNowLoggedOut = !user;

    // Only clear session if we transition from logged-in to logged-out (actual logout)
    if (wasLoggedIn && isNowLoggedOut) {
      setActiveSession(null);
    }

    previousUserRef.current = user;
  }, [user]);

  const updateSession = useCallback((updates: Partial<ActiveSession>) => {
    setActiveSession((prev) => {
      if (!prev) {
        return updates as ActiveSession;
      }
      return { ...prev, ...updates };
    });
  }, []);

  const clearSession = useCallback(() => {
    setActiveSession(null);
  }, []);

  const value = useMemo(
    () => ({
      activeSession,
      updateSession,
      clearSession,
    }),
    [activeSession, updateSession, clearSession],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export const useSessionContext = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessionContext must be used within a SessionProvider");
  }
  return context;
};
