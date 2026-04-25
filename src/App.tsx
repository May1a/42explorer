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
  const { config, loading } = useAuth();
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
