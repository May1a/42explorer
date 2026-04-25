import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import { Layout, type Page } from "./components/Layout";
import { SetupPage }     from "./pages/Setup";
import { DashboardPage } from "./pages/Dashboard";
import { StudentsPage }  from "./pages/Students";
import { LocationsPage } from "./pages/Locations";
import { ProfilePage }   from "./pages/Profile";
import { FullPageSpinner } from "./components/Loading";

/** Derive page + optional param from URL hash, e.g. #/profile/jdoe */
function parseHash(): { page: Page; param?: string } {
  const hash = window.location.hash.replace(/^#\/?/, "");
  const [seg, param] = hash.split("/");
  const page = (["dashboard", "students", "locations", "profile"].includes(seg ?? "") ? seg : "dashboard") as Page;
  return { page, param: param || undefined };
}

export function App() {
  const { config, loading, authError, logout } = useAuth();
  const [page,  setPage]  = useState<Page>(() => parseHash().page);
  const [param, setParam] = useState<string | undefined>(() => parseHash().param ?? undefined);

  // Sync page ↔ URL hash
  useEffect(() => {
    const onHashChange = () => {
      const { page: p, param: pr } = parseHash();
      setPage(p);
      setParam(pr);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function navigate(p: Page, extra?: string) {
    const hash = extra ? `#/${p}/${extra}` : `#/${p}`;
    window.location.hash = hash;
    setPage(p);
    setParam(extra);
  }

  if (loading) return <FullPageSpinner />;

  // Show setup screen if no client ID configured yet
  if (!config?.clientId) return <SetupPage />;

  // Show auth error prominently so it's obvious what failed
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--color-bg)" }}>
        <div className="w-full max-w-md rounded-2xl border p-8 space-y-4" style={{ background: "var(--color-card)", borderColor: "var(--color-red)" }}>
          <div className="text-lg font-bold" style={{ color: "var(--color-red)" }}>Auth error</div>
          <p className="text-sm font-mono break-all" style={{ color: "var(--color-muted)", fontFamily: "var(--font-mono)" }}>{authError}</p>
          <button
            onClick={logout}
            className="w-full py-2 rounded-xl text-sm font-bold"
            style={{ background: "var(--color-purple)", color: "#fff" }}
          >
            Reset &amp; try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout page={page} onNavigate={navigate}>
      {page === "dashboard"  && <DashboardPage  onNavigate={navigate} />}
      {page === "students"   && <StudentsPage   onNavigate={navigate} />}
      {page === "locations"  && <LocationsPage  onNavigate={navigate} />}
      {page === "profile"    && <ProfilePage    login={param} onNavigate={navigate} />}
    </Layout>
  );
}

export default App;
