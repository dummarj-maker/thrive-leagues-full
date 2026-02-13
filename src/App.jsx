import React, { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Home from "./Home.jsx";
import Playbook from "./Playbook.jsx";
import Draft from "./Draft.jsx";
import CommissionerTools from "./CommissionerTools.jsx";
import Achievements from "./Achievements.jsx";

import Login from "./pages/Login.jsx";
import LeagueSetup from "./pages/LeagueSetup.jsx";

import { supabase } from "./lib/supabaseClient";
import { getActiveLeagueId } from "./lib/leagueStore";

// ---------- Helpers ----------
function hasLeagueConfigured() {
  return !!getActiveLeagueId();
}

const BUILDER_EMAIL = (import.meta.env.VITE_BUILDER_EMAIL || "").toLowerCase().trim();

function useSession() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!ignore) {
        setSession(data.session || null);
        setReady(true);
      }
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => {
      ignore = true;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  return { session, ready };
}

function isBuilder(session) {
  const email = session?.user?.email?.toLowerCase?.() || "";
  return !!BUILDER_EMAIL && email === BUILDER_EMAIL;
}

async function isLeagueAdmin(leagueId) {
  if (!leagueId) return false;
  // expects you have a SQL function: public.is_league_admin(p_league_id uuid) returns boolean
  // If you don’t yet, we can add it as the next DB brick.
  const { data, error } = await supabase.rpc("is_league_admin", { p_league_id: leagueId });
  if (error) return false;
  return !!data;
}

// ---------- Guards ----------
function RequireAuth({ children }) {
  const location = useLocation();
  const { session, ready } = useSession();

  if (!ready) return null;
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

function RequireLeagueUnlessBuilder({ children }) {
  const location = useLocation();
  const { session, ready } = useSession();

  if (!ready) return null;

  if (session && isBuilder(session)) return children;

  if (!hasLeagueConfigured()) {
    return <Navigate to="/setup" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function RequireLeagueAdmin({ children }) {
  const location = useLocation();
  const { ready } = useSession();
  const [ok, setOk] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function run() {
      const leagueId = getActiveLeagueId();
      const allowed = await isLeagueAdmin(leagueId);
      if (!ignore) setOk(allowed);
    }
    run();
    return () => {
      ignore = true;
    };
  }, []);

  if (!ready) return null;
  if (ok === null) return null;

  if (!ok) {
    return <Navigate to="/home" replace state={{ from: location.pathname }} />;
  }
  return children;
}

// ---------- App Shell ----------
function AppShell({ children }) {
  const { session } = useSession();
  const navigate = useNavigate();

  const builder = useMemo(() => isBuilder(session), [session]);
  const [showAdminLink, setShowAdminLink] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function check() {
      const leagueId = getActiveLeagueId();
      if (builder) {
        if (!ignore) setShowAdminLink(true);
        return;
      }
      const allowed = await isLeagueAdmin(leagueId);
      if (!ignore) setShowAdminLink(allowed);
    }

    check();
    return () => {
      ignore = true;
    };
  }, [builder]);

  function resetLeague() {
    if (!builder) return;

    const ok = window.confirm(
      "Reset this league and return to setup?\n\n(This only affects your local league pointer.)"
    );
    if (!ok) return;

    localStorage.removeItem("tl_league");
    localStorage.removeItem("tl_wizard");

    navigate("/setup", { replace: true });
  }

  return (
    <div className="appShell">
      <div className="fixedDesktopCanvas">
        <header className="topBar">
          <div className="brand">
            <div className="brandMark">TL</div>
            <div>
              <div className="brandName">Thrive Leagues</div>
              <div className="brandSub">{builder ? "Builder Mode" : "Family League"}</div>
            </div>
          </div>

          <nav className="nav">
            <Link className="navLink" to="/home">Home</Link>
            <Link className="navLink" to="/draft">Draft</Link>
            <Link className="navLink" to="/playbook">Playbook</Link>
            {showAdminLink ? (
              <Link className="navLink" to="/commissioner-tools">Commissioner Tools</Link>
            ) : null}
            <Link className="navLink" to="/achievements">Achievements</Link>
          </nav>

          <div className="topRight" style={{ display: "flex", gap: 8 }}>
            {builder && (
              <button className="btnGhost" type="button" onClick={resetLeague} title="Builder only">
                Reset League
              </button>
            )}

            <button
              className="btnGhost"
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}
            >
              Log out
            </button>
          </div>
        </header>

        <main style={{ marginTop: 14 }}>{children}</main>

        <footer className="footer">
          <span className="muted">Thrive Leagues • Built brick-by-brick</span>
          <span className="muted">System first • App second</span>
        </footer>
      </div>
    </div>
  );
}

// ---------- Routes ----------
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />

        <Route path="/login" element={<Login />} />

        <Route
          path="/setup"
          element={
            <RequireAuth>
              <LeagueSetup />
            </RequireAuth>
          }
        />

        <Route
          path="/home"
          element={
            <RequireAuth>
              <RequireLeagueUnlessBuilder>
                <AppShell>
                  <Home />
                </AppShell>
              </RequireLeagueUnlessBuilder>
            </RequireAuth>
          }
        />

        <Route
          path="/playbook"
          element={
            <RequireAuth>
              <RequireLeagueUnlessBuilder>
                <AppShell>
                  <Playbook />
                </AppShell>
              </RequireLeagueUnlessBuilder>
            </RequireAuth>
          }
        />

        <Route
          path="/draft"
          element={
            <RequireAuth>
              <RequireLeagueUnlessBuilder>
                <AppShell>
                  <Draft />
                </AppShell>
              </RequireLeagueUnlessBuilder>
            </RequireAuth>
          }
        />

        <Route
          path="/commissioner-tools"
          element={
            <RequireAuth>
              <RequireLeagueUnlessBuilder>
                <RequireLeagueAdmin>
                  <AppShell>
                    <CommissionerTools />
                  </AppShell>
                </RequireLeagueAdmin>
              </RequireLeagueUnlessBuilder>
            </RequireAuth>
          }
        />

        <Route
          path="/achievements"
          element={
            <RequireAuth>
              <RequireLeagueUnlessBuilder>
                <AppShell>
                  <Achievements />
                </AppShell>
              </RequireLeagueUnlessBuilder>
            </RequireAuth>
          }
        />

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
