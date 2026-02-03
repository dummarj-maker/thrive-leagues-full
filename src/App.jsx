import React, { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from "react-router-dom";

import Home from "./Home.jsx";
import Playbook from "./Playbook.jsx";
import Login from "./pages/Login.jsx";
import LeagueSetup from "./pages/LeagueSetup.jsx";

import { supabase } from "./lib/supabaseClient";

// Placeholders (safe)
function Draft() {
  return (
    <div className="pageWrap">
      <div className="card">
        <div className="cardHeader">
          <h3 className="cardTitle">Draft</h3>
        </div>
        <div className="cardBody">
          <p className="muted" style={{ marginTop: 0 }}>
            Draft will be wired in next. Routing is stable.
          </p>
        </div>
      </div>
    </div>
  );
}
function CommissionerTools() {
  return (
    <div className="pageWrap">
      <div className="card">
        <div className="cardHeader">
          <h3 className="cardTitle">Commissioner Tools</h3>
        </div>
        <div className="cardBody">
          <p className="muted" style={{ marginTop: 0 }}>
            Commissioner tools will be built brick-by-brick.
          </p>
        </div>
      </div>
    </div>
  );
}
function Achievements() {
  return (
    <div className="pageWrap">
      <div className="card">
        <div className="cardHeader">
          <h3 className="cardTitle">Achievements</h3>
        </div>
        <div className="cardBody">
          <p className="muted" style={{ marginTop: 0 }}>
            Badges live inside Achievements.
          </p>
        </div>
      </div>
    </div>
  );
}

// League config placeholder (local for now)
function hasLeagueConfigured() {
  return localStorage.getItem("tl_league") ? true : false;
}

// Builder email (set in .env)
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

// Guards
function RequireAuth({ children }) {
  const location = useLocation();
  const { session, ready } = useSession();

  if (!ready) return null; // keep it simple; could add loading UI later
  if (!session)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

function RequireLeagueUnlessBuilder({ children }) {
  const location = useLocation();
  const { session, ready } = useSession();

  if (!ready) return null;

  // Builder bypasses league setup
  if (session && isBuilder(session)) return children;

  if (!hasLeagueConfigured()) {
    return <Navigate to="/setup" replace state={{ from: location.pathname }} />;
  }
  return children;
}

function AppShell({ children }) {
  const { session } = useSession();
  const builder = useMemo(() => isBuilder(session), [session]);

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
            <Link className="navLink" to="/commissioner-tools">Commissioner Tools</Link>
            <Link className="navLink" to="/achievements">Achievements</Link>
          </nav>

          <div className="topRight">
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Logged in, no league => setup (builder can still access but may want to skip) */}
        <Route
          path="/setup"
          element={
            <RequireAuth>
              <LeagueSetup />
            </RequireAuth>
          }
        />

        {/* Protected + league gate (builder bypasses) */}
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
                  <CommissionerTools />
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
                  <Achievements />
                </AppShell>
              </RequireLeagueUnlessBuilder>
            </RequireAuth>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
