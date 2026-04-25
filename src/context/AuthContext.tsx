/**
 * Handles 42 OAuth implicit flow entirely in the browser.
 *
 * Setup (one-time):  user provides their app's CLIENT_ID + REDIRECT_URI,
 * stored in localStorage.  Then we redirect to 42's authorize endpoint
 * with response_type=token.  On return the access_token arrives in the
 * URL fragment.
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

const STORAGE_KEY_TOKEN   = "ft_access_token";
const STORAGE_KEY_EXPIRY  = "ft_token_expiry";
const STORAGE_KEY_CLIENT  = "ft_client_id";
const STORAGE_KEY_REDIR   = "ft_redirect_uri";

export interface AuthConfig {
  clientId: string;
  redirectUri: string;
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
    const clientId    = localStorage.getItem(STORAGE_KEY_CLIENT)  ?? "";
    const redirectUri = localStorage.getItem(STORAGE_KEY_REDIR)   ?? "";
    if (clientId) setConfig({ clientId, redirectUri });

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
      const res = await fetch("https://api.intra.42.fr/v2/me", {
        headers: { Authorization: `Bearer ${tkn}` },
      });
      if (res.ok) setUser(await res.json());
    } catch { /* network error – user still has token */ }
    setLoading(false);
  }

  const saveConfig = useCallback((cfg: AuthConfig) => {
    localStorage.setItem(STORAGE_KEY_CLIENT, cfg.clientId);
    localStorage.setItem(STORAGE_KEY_REDIR,  cfg.redirectUri);
    setConfig(cfg);
  }, []);

  const login = useCallback(() => {
    if (!config?.clientId) return;
    const params = new URLSearchParams({
      client_id:     config.clientId,
      redirect_uri:  config.redirectUri || window.location.origin + "/",
      response_type: "token",
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
