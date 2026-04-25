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

// The redirect URI is always <origin>/api/auth/callback — derived at runtime,
// never stored.  Register exactly this URL in your 42 OAuth app settings.
function callbackUri() {
  return window.location.origin + "/api/auth/callback";
}

export interface AuthConfig {
  clientId: string;
}

export interface AuthContextValue {
  token: string | null;
  user: FortyTwoUser | null;
  config: AuthConfig | null;
  loading: boolean;
  saveConfig: (cfg: AuthConfig) => void;
  login: () => void;
  logout: () => void;
}

const Ctx = createContext<AuthContextValue>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token,   setToken]   = useState<string | null>(null);
  const [user,    setUser]    = useState<FortyTwoUser | null>(null);
  const [config,  setConfig]  = useState<AuthConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Load persisted config & token on mount
  useEffect(() => {
    const clientId = localStorage.getItem(STORAGE_KEY_CLIENT) ?? "";
    if (clientId) setConfig({ clientId });

    // Check for token in URL fragment (post-OAuth redirect)
    const hash   = new URLSearchParams(window.location.hash.slice(1));
    const tkn    = hash.get("access_token");
    const expIn  = hash.get("expires_in");

    if (tkn) {
      const expiry = Date.now() + Number(expIn ?? 7200) * 1000;
      localStorage.setItem(STORAGE_KEY_TOKEN,  tkn);
      localStorage.setItem(STORAGE_KEY_EXPIRY, String(expiry));
      // Clean the URL fragment so a refresh doesn't re-process
      history.replaceState(null, "", window.location.pathname + window.location.search);
      activateToken(tkn);
      return;
    }

    // Load stored token
    const storedToken  = localStorage.getItem(STORAGE_KEY_TOKEN);
    const storedExpiry = Number(localStorage.getItem(STORAGE_KEY_EXPIRY) ?? 0);

    if (storedToken && storedExpiry > Date.now() + 60_000) {
      activateToken(storedToken);
    } else {
      if (storedToken) {
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_EXPIRY);
      }
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function activateToken(tkn: string) {
    setToken(tkn);
    setLoading(true);
    try {
      const res = await fetch("/api/42/me", {
        headers: { Authorization: `Bearer ${tkn}` },
      });
      if (res.ok) setUser(await res.json());
    } catch { /* network error – user still has token */ }
    setLoading(false);
  }

  const saveConfig = useCallback((cfg: AuthConfig) => {
    localStorage.setItem(STORAGE_KEY_CLIENT, cfg.clientId);
    setConfig(cfg);
  }, []);

  const login = useCallback(() => {
    if (!config?.clientId) return;
    const params = new URLSearchParams({
      client_id:     config.clientId,
      redirect_uri:  callbackUri(),
      response_type: "code",
      scope:         "public",
    });
    window.location.href = `https://api.intra.42.fr/oauth/authorize?${params}`;
  }, [config]);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_EXPIRY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <Ctx.Provider value={{ token, user, config, loading, saveConfig, login, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  return useContext(Ctx);
}
