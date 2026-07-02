"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUser } from "@/lib/services/auth.service";

// Describes what the user was trying to do before being gated
export type PendingAction = {
  type: "portfolio" | "committee" | "download_report";
  payload?: Record<string, unknown>;
} | null;

interface AuthGateContextValue {
  pendingAction: PendingAction;
  // Call this when an unauthenticated user hits a protected feature.
  // Returns true if authenticated, false if redirected to login.
  requireAuth: (action: PendingAction) => boolean;
  // After login, call this to consume and return the pending action.
  consumePendingAction: () => PendingAction;
  // For components that read isAuthenticated globally
  isAuthenticated: boolean;
  setIsAuthenticated: (v: boolean) => void;
  user: any;
  setUser: (u: any) => void;
  // Used to manually refresh the session
  checkSession: () => Promise<void>;
  isLoadingSession: boolean;
}

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

export function AuthGateProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  const checkSession = useCallback(async () => {
    setIsLoadingSession(true);
    try {
      const data = await getCurrentUser();
      if (data?.data) {
        setIsAuthenticated(true);
        setUser(data.data);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (err) {
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoadingSession(false);
    }
  }, []);

  // Fetch session on mount
  React.useEffect(() => {
    checkSession();
  }, [checkSession]);

  const requireAuth = useCallback(
    (action: PendingAction): boolean => {
      if (isAuthenticated) return true;
      // Store the action for post-login execution
      setPendingAction(action);
      // Encode the current page as redirect target
      const redirectParam = encodeURIComponent(pathname ?? "/");
      router.push(`/login?redirect=${redirectParam}`);
      return false;
    },
    [isAuthenticated, pathname, router]
  );

  const consumePendingAction = useCallback((): PendingAction => {
    const action = pendingAction;
    setPendingAction(null);
    return action;
  }, [pendingAction]);

  return (
    <AuthGateContext.Provider
      value={{
        pendingAction,
        requireAuth,
        consumePendingAction,
        isAuthenticated,
        setIsAuthenticated,
        user,
        setUser,
        checkSession,
        isLoadingSession,
      }}
    >
      {children}
    </AuthGateContext.Provider>
  );
}

export function useAuthGate(): AuthGateContextValue {
  const ctx = useContext(AuthGateContext);
  if (!ctx) throw new Error("useAuthGate must be used inside AuthGateProvider");
  return ctx;
}
