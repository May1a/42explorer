/**
 * Handles 42 OAuth Authorization Code flow.
 *
 * The 42 API does not support the implicit flow (response_type=token).
 * Instead:
 *   browser → 42 authorize (response_type=code) → /api/auth/callback
 *   → edge function exchanges code+secret → redirects back with
 *   #access_token=... in the URL fragment → we read it here.
 *
 * The client credentials live only in Vercel env vars. The frontend starts
 * login through /api/auth/login so it never needs local OAuth app setup.
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { FortyTwoUser } from "../types";

const STORAGE_KEY_TOKEN  = "ft_access_token";
const STORAGE_KEY_EXPIRY = "ft_token_expiry";
const STORAGE_KEY_SCOPE  = "ft_scope";

export interface AuthContextValue {
  token: string | null;
  user: FortyTwoUser | null;
  loading: boolean;
  authError: string | null;
  currentScope: string;
  hasScope: (scope: string) => boolean;
  refreshUser: () => Promise<void>;
  login: (extraScopes?: readonly string[]) => void;
  logout: () => void;
}

const Ctx = createContext<AuthContextValue>(null!);

function normalizeScopes(value: unknown): string[] {
  const scopes =
    typeof value === "string"
      ? value.split(/\s+/)
      : Array.isArray(value)
        ? value
        : [];

  return scopes
    .map((scope) => String(scope).trim())
    .filter(Boolean);
}

function buildScopeParam(currentScope: string, extraScopes: unknown) {
  return Array.from(new Set(["public", ...normalizeScopes(currentScope), ...normalizeScopes(extraScopes)])).join(" ");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token,        setToken]        = useState<string | null>(null);
  const [user,         setUser]         = useState<FortyTwoUser | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [authError,    setAuthError]    = useState<string | null>(null);
  const [currentScope, setCurrentScope] = useState("public");

  useEffect(() => {
    // Check for error from OAuth callback
    const hash  = new URLSearchParams(window.location.hash.slice(1));
    const error = hash.get("error");
    if (error) {
      history.replaceState(null, "", window.location.pathname);
      const messages: Record<string, string> = {
        not_configured: "The app is missing its 42 API credentials. Set FORTY_TWO_CLIENT_ID and FORTY_TWO_CLIENT_SECRET in your Vercel project settings.",
        token_failed:   "The 42 token exchange failed. The OAuth code may have expired or the redirect URI may not match. Try logging in again.",
        auth_failed:    "Authentication was cancelled or denied by 42.",
      };
      setAuthError(messages[error] ?? `Login failed: ${error}`);
      setLoading(false);
      return;
    }

    // Check for token returned by /api/auth/callback
    const tkn   = hash.get("access_token");
    const expIn = hash.get("expires_in");
    const scope = hash.get("scope");
    if (tkn) {
      const expiry = Date.now() + Number(expIn ?? 7200) * 1000;
      const resolvedScope = scope || "public";
      localStorage.setItem(STORAGE_KEY_TOKEN,  tkn);
      localStorage.setItem(STORAGE_KEY_EXPIRY, String(expiry));
      localStorage.setItem(STORAGE_KEY_SCOPE,  resolvedScope);
      setCurrentScope(resolvedScope);
      history.replaceState(null, "", window.location.pathname);
      fetchUserAndActivate(tkn);
      return;
    }

    // Resume from stored token
    const storedToken  = localStorage.getItem(STORAGE_KEY_TOKEN);
    const storedExpiry = Number(localStorage.getItem(STORAGE_KEY_EXPIRY) ?? 0);
    const storedScope  = localStorage.getItem(STORAGE_KEY_SCOPE) ?? "public";
    setCurrentScope(storedScope);
    if (storedToken && storedExpiry > Date.now() + 60_000) {
      fetchUserAndActivate(storedToken);
    } else {
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_EXPIRY);
      localStorage.removeItem(STORAGE_KEY_SCOPE);
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearStoredToken() {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_EXPIRY);
    localStorage.removeItem(STORAGE_KEY_SCOPE);
  }

  async function fetchUserAndActivate(tkn: string) {
    setToken(tkn);
    setLoading(true);
    setAuthError(null);
    try {
      const res = await fetch("/api/42?path=/me", {
        headers: { Authorization: `Bearer ${tkn}` },
      });
      if (res.ok) {
        setUser(await res.json());
      } else if (res.status === 401) {
        // Token has expired or been revoked — clear it and return to login
        clearStoredToken();
        setToken(null);
      } else {
        const body = await res.text().catch(() => "");
        console.error("Failed to fetch user profile:", res.status, body);
        setAuthError(`Could not load profile (${res.status}). Check your Vercel env vars and redeploy.`);
      }
    } catch (e: any) {
      console.error("Network error fetching profile:", e);
      setAuthError("Network error loading profile — check your internet connection.");
    }
    setLoading(false);
  }

  const refreshUser = useCallback(async () => {
    if (!token) return;
    const res = await fetch("/api/42?path=/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401) {
      clearStoredToken();
      setToken(null);
      setUser(null);
      setCurrentScope("public");
      return;
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(body || `Could not refresh profile (${res.status})`);
    }
    setUser(await res.json());
  }, [token]);

  const login = useCallback((extraScopes?: readonly string[]) => {
    const params = new URLSearchParams({
      scope: buildScopeParam(currentScope, extraScopes),
    });
    window.location.href = `/api/auth/login?${params}`;
  }, [currentScope]);

  const hasScope = useCallback((scope: string) => {
    return normalizeScopes(currentScope).includes(scope);
  }, [currentScope]);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_EXPIRY);
    localStorage.removeItem(STORAGE_KEY_SCOPE);
    setToken(null);
    setUser(null);
    setAuthError(null);
    setCurrentScope("public");
  }, []);

  return (
    <Ctx.Provider value={{ token, user, loading, authError, currentScope, hasScope, refreshUser, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
