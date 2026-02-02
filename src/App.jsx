import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";

import Home from "./Home.jsx";
import Playbook from "./Playbook.jsx";
import Login from "./pages/Login.jsx";
import LeagueSetup from "./pages/LeagueSetup.jsx";

// --- Minimal placeholders (safe if you don't have these pages yet) ---
function Draft() {
  return (
    <div className="pageWrap">
      <div className="card">
        <div className="cardHeader">
          <h3 className="cardTitle">Draft</h3>
        </div>
        <div className="cardBody">
          <p className="muted" style={{ marginTop: 0 }}>
            Draft will be wired in next. This page exists so routing is stable.
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
            Badges live inside Achievements (as you decided).
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Session + League (placeholder for now, replace with Supabase later) ---
function getSession() {
  try {
    return JSON.parse(localStorage.getItem("tl_session") || "null");
  } catch {
    return null;
  }
}
function hasLeagueConfigured() {
  return localStorage.getItem("tl_league") ? true : false;
}

// --- Guards ---
function RequireAuth({ children }) {
  const location = useLocation();
  const session = getSession();
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}

function RequireLeague({ children }) {
  const location = useLocation();
  if (!hasLeagueConfigured()) {
    return <Navigate to="/setup" replace state={{ from: location.pathname }} />;
  }
  return children;
}

// --- A simple “app shell” only for logged-in + configured users ---
function AppShell({ children }) {
  return (
    <div className="appShell">
      <div className="fixedDesktopCanvas">
        <header className="topBar">
          <div className="brand">
            <div className="brandMark">TL</div>
            <div>
              <div className="brandName">Thrive Leagues</div>
              <div className="brandSub">Stage 2 • Playbook Build</div>
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
              onClick={() => {
                localStorage.removeItem("tl_session");
                // keep league data; login is separate from league setup
                window.location.href = "/login";
              }}
            >
              Log out
            </button>
          </div>
        </header>

        <main style={{ marginTop: 14 }}>
          {children}
        </main>

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
        {/* Root behavior */}
        <Route
          path="/"
          element={<Navigate to="/home" replace />}
        />

        {/* Public routes */}
        <Route path="/login" element={<Login />} />

        {/* Logged-in but league not configured goes here */}
        <Route
          path="/setup"
          element={
            <RequireAuth>
              <LeagueSetup />
            </RequireAuth>
          }
        />

        {/* Protected app routes (must be logged in + league configured) */}
        <Route
          path="/home"
          element={
            <RequireAuth>
              <RequireLeague>
                <AppShell>
                  <Home />
                </AppShell>
              </RequireLeague>
            </RequireAuth>
          }
        />

        <Route
          path="/playbook"
          element={
            <RequireAuth>
              <RequireLeague>
                <AppShell>
                  <Playbook />
                </AppShell>
              </RequireLeague>
            </RequireAuth>
          }
        />

        <Route
          path="/draft"
          element={
            <RequireAuth>
              <RequireLeague>
                <AppShell>
                  <Draft />
                </AppShell>
              </RequireLeague>
            </RequireAuth>
          }
        />

        <Route
          path="/commissioner-tools"
          element={
            <RequireAuth>
              <RequireLeague>
                <AppShell>
                  <CommissionerTools />
                </AppShell>
              </RequireLeague>
            </RequireAuth>
          }
        />

        <Route
          path="/achievements"
          element={
            <RequireAuth>
              <RequireLeague>
                <AppShell>
                  <Achievements />
                </AppShell>
              </RequireLeague>
            </RequireAuth>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
