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
import Login from "./pages/Login.jsx";
import LeagueSetup from "./pages/LeagueSetup.jsx";

import { supabase } from "./lib/supabaseClient";

// ---------- Helpers ----------
function readLocalLeague() {
  try {
    const raw = localStorage.getItem("tl_league");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function hasLeagueConfigured() {
  const l = readLocalLeague();
  return !!l;
}

function getLeagueId() {
  const l = readLocalLeague();
  return l?.leagueId || null;
}

const BUILDER_EMAIL = (import.meta.env.VITE_BUILDER_EMAIL || "")
  .toLowerCase()
  .trim();

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

function isLeagueAdminRow(row) {
  if (!row) return false;
  return row.role === "commissioner" || row.is_league_manager === true;
}

function useLeagueAdminAccess() {
  const { session, ready } = useSession();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function run() {
      if (!ready) return;
      const leagueId = getLeagueId();

      if (!session || !leagueId) {
        if (!ignore) {
          setAllowed(false);
          setChecking(false);
        }
        return;
      }

      // Builder gets access for debugging
      if (isBuilder(session)) {
        if (!ignore) {
          setAllowed(true);
          setChecking(false);
        }
        return;
      }

      setChecking(true);
      const { data, error } = await supabase
        .from("league_members")
        .select("role,is_league_manager")
        .eq("league_id", leagueId)
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (!ignore) {
        if (error) {
          console.error(error);
          setAllowed(false);
          setChecking(false);
          return;
        }
        setAllowed(isLeagueAdminRow(data));
        setChecking(false);
      }
    }

    run();

    return () => {
      ignore = true;
    };
  }, [session, ready]);

  return { allowed, checking };
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
  const { allowed, checking } = useLeagueAdminAccess();
  if (checking) return null;
  if (!allowed) {
    return (
      <div className="pageWrap card">
        <h3 style={{ marginTop: 0 }}>No access</h3>
        <p className="muted">
          Only the commissioner and selected league managers can use Commissioner Tools.
        </p>
      </div>
    );
  }
  return children;
}

// ---------- App Shell ----------
function AppShell({ children }) {
  const { session } = useSession();
  const navigate = useNavigate();
  const { allowed: adminAllowed, checking: adminChecking } = useLeagueAdminAccess();

  const builder = useMemo(() => isBuilder(session), [session]);

  function resetLeague() {
    if (!builder) return;

    const ok = window.confirm(
      "Reset this league and return to setup?\n\n(This affects your local league state.)"
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

            {/* Only show Commissioner Tools if admin (or builder) */}
            {!adminChecking && adminAllowed ? (
              <Link className="navLink" to="/commissioner-tools">Commissioner Tools</Link>
            ) : null}

            <Link className="navLink" to="/achievements">Achievements</Link>
          </nav>

          <div className="topRight" style={{ display: "flex", gap: 8 }}>
            {builder && (
              <button
                className="btnGhost"
                type="button"
                onClick={resetLeague}
                title="Builder only"
              >
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
                <AppShell>
                  <RequireLeagueAdmin>
                    <CommissionerTools />
                  </RequireLeagueAdmin>
                </AppShell>
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
                  <div className="pageWrap card">Achievements placeholder</div>
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
