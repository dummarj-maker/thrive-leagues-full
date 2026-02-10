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
import Login from "./pages/Login.jsx";
import LeagueSetup from "./pages/LeagueSetup.jsx";
import CommissionerTools from "./pages/CommissionerTools.jsx";

import { supabase } from "./lib/supabaseClient";
import { canAccessCommissionerToolsFromLocalLeague } from "./lib/permissions";

// ---------- Helpers ----------
function hasLeagueConfigured() {
  return !!localStorage.getItem("tl_league");
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

function RequireCommissionerToolsAccess({ children }) {
  const location = useLocation();
  const { session, ready } = useSession();

  if (!ready) return null;
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Builder override (consistent with your app)
  if (isBuilder(session)) return children;

  // Must have league configured
  if (!hasLeagueConfigured()) {
    return <Navigate to="/setup" replace state={{ from: location.pathname }} />;
  }

  // Local-league based permissions (Stage 2)
  const allowed = canAccessCommissionerToolsFromLocalLeague(session);
  if (!allowed) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

// ---------- App Shell ----------
function AppShell({ children }) {
  const { session } = useSession();
  const navigate = useNavigate();

  const builder = useMemo(() => isBuilder(session), [session]);

  const canSeeCommissionerTools = useMemo(() => {
    if (!session) return false;
    if (isBuilder(session)) return true;
    return canAccessCommissionerToolsFromLocalLeague(session);
  }, [session]);

  function resetLeague() {
    if (!builder) return;

    const ok = window.confirm(
      "Reset this league and return to setup?\n\n(This only affects your local league state.)"
    );

    if (!ok) return;

    localStorage.removeItem("tl_league");
    localStorage.removeItem("tl_wizard"); // optional future-proofing

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
              <div className="brandSub">
                {builder ? "Builder Mode" : "Family League"}
              </div>
            </div>
          </div>

          <nav className="nav">
            <Link className="navLink" to="/home">Home</Link>
            <Link className="navLink" to="/draft">Draft</Link>
            <Link className="navLink" to="/playbook">Playbook</Link>

            {canSeeCommissionerTools && (
              <Link className="navLink" to="/commissioner-tools">
                Commissioner Tools
              </Link>
            )}

            <Link className="navLink" to="/achievements">Achiev
