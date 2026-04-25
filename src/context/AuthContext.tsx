/**
 * Handles 42 OAuth Authorization Code flow.
 *
 * The 42 API does not support the implicit flow (response_type=token).
 * Instead:
 *   browser → 42 authorize (response_type=code) → /api/auth/callback
 *   → edge function exchanges code+secret → redirects back with
 *   #access_token=... in the URL fragment → we read it here.
 *
 * The CLIENT_SECRET lives only in Vercel env vars (api/auth/callback.ts).
 * The CLIENT_ID is entered once in the setup screen and stored in localStorage.
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
const STORAGE_KEY_CLIENT = "ft_client_id";
const STORAGE_KEY_SCOPE  = "ft_scope";

function callbackUri() {
  return window.location.origin + "/api/auth/callback";
}

export interface AuthConfig { clientId: string }

export interface AuthContextValue {
  token: string | null;
  user: FortyTwoUser | null;
  config: AuthConfig | null;
  loading: boolean;
  authError: string | null;
  currentScope: string;
  saveConfig: (cfg: AuthConfig) => void;
  login: (extraScopes?: string[]) => void;
  logout: () => void;
}

const Ctx = createContext<AuthContextValue>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token,        setToken]        = useState<string | null>(null);
  const [user,         setUser]         = useState<FortyTwoUser | null>(null);
  const [config,       setConfig]       = useState<AuthConfig | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [authError,    setAuthError]    = useState<string | null>(null);
  const [currentScope, setCurrentScope] = useState("public");

  useEffect(() => {
    const clientId = localStorage.getItem(STORAGE_KEY_CLIENT) ?? "";
    if (clientId) setConfig({ clientId });

    // Check for error from OAuth callback
    const hash  = new URLSearchParams(window.location.hash.slice(1));
    const error = hash.get("error");
    if (error) {
      history.replaceState(null, "", window.location.pathname);
      setAuthError(`Login failed: ${error}`);
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
      } else {
        const body = await res.text().catch(() => "");
        console.error("Failed to fetch user profile:", res.status, body);
        // Token is valid but profile fetch failed — keep the token, show error
        setAuthError(`Could not load profile (${res.status}). Check your Vercel env vars and redeploy.`);
      }
    } catch (e: any) {
      console.error("Network error fetching profile:", e);
      setAuthError("Network error loading profile — check your internet connection.");
    }
    setLoading(false);
  }

  const saveConfig = useCallback((cfg: AuthConfig) => {
    localStorage.setItem(STORAGE_KEY_CLIENT, cfg.clientId);
    setConfig(cfg);
  }, []);

  const login = useCallback((extraScopes?: string[]) => {
    if (!config?.clientId) return;
    const scopes = ["public", ...(extraScopes ?? [])];
    const params = new URLSearchParams({
      client_id:     config.clientId,
      redirect_uri:  callbackUri(),
      response_type: "code",
      scope:         scopes.join(" "),
    });
    window.location.href = `https://api.intra.42.fr/oauth/authorize?${params}`;
  }, [config]);

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
    <Ctx.Provider value={{ token, user, config, loading, authError, currentScope, saveConfig, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
