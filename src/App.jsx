// src/App.jsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Picks from './Picks.jsx';
import Home from './Home.jsx';
import Onboarding from './Onboarding.jsx';
import JoinLeague from './JoinLeague.jsx';
import CreateLeague from './CreateLeague.jsx';
import Challenges from './Challenges.jsx';
import Schedule from './Schedule.jsx';
import Scoreboard from './Scoreboard.jsx';
import Standings from './Standings.jsx';
import Admin from './Admin.jsx';
import OwnerConsole from './OwnerConsole.jsx';

export default function App() {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  // Get current session & subscribe to auth changes
  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session || null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
    });

    return () => {
      isMounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  // Email magic-link sign in helper (Onboarding can call this)
  const signInEmail = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    return error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/onboarding');
  };

  return (
    <>
      <header className="topbar">
        <nav className="nav">
          <Link to="/home">Home</Link>
          <Link to="/picks">Picks</Link>
          <Link to="/challenges">Challenges</Link>
          <Link to="/schedule">Schedule</Link>
          <Link to="/scoreboard">Scoreboard</Link>
          <Link to="/standings">Standings</Link>
          <Link to="/admin">Admin</Link>
          <Link to="/owner">Owner</Link>
          {session ? (
            <button className="btn ghost" onClick={signOut}>Sign out</button>
          ) : (
            <Link to="/onboarding">Login</Link>
          )}
        </nav>
      </header>

      <main className="container">
        <Routes>
          {/* Redirect root to onboarding */}
          <Route path="/" element={<Navigate to="/onboarding" replace />} />

          {/* Public onboarding/login page */}
          <Route
            path="/onboarding"
            element={<Onboarding session={session} signInEmail={signInEmail} />}
          />

          {/* Optional public routes */}
          <Route path="/join" element={<JoinLeague />} />
          <Route path="/create" element={<CreateLeague />} />

          {/* App pages (they can read session to show/hide content) */}
          <Route path="/home" element={<Home session={session} />} />
          <Route path="/challenges" element={<Challenges />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/scoreboard" element={<Scoreboard />} />
          <Route path="/standings" element={<Standings />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/owner" element={<OwnerConsole />} />
          <Route path="/picks" element={<Picks />} />

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        </Routes>
      </main>
    </>
  );
}
