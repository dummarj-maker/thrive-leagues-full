// src/Onboarding.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function Onboarding() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);

  // Keep a little session awareness on this screen
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_evt, session) => mounted && setSession(session)
    );

    return () => subscription.unsubscribe();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    setError('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // IMPORTANT: where the magic-link redirects back to
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) setError(error.message);
    else setMsg('Magic link sent! Check your email.');

    setLoading(false);
  }

  return (
    <div className="grid">
      <div className="card">
        <h2>Get Started</h2>
        <p>Log in to join or create a league.</p>

        {session ? (
          <p className="mono" style={{ marginTop: 8 }}>
            Logged in as <strong>{session.user?.email}</strong>
          </p>
        ) : (
          <form onSubmit={submit}>
            <input
              className="input"
              type="email"
              placeholder="you@domain.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <button className="btn" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Sending…' : 'Send magic link'}
            </button>
          </form>
        )}

        {error ? (
          <p className="error" style={{ marginTop: 8 }}>{error}</p>
        ) : null}
        {msg ? (
          <p className="mono" style={{ marginTop: 8 }}>{msg}</p>
        ) : null}
      </div>

      <div className="card">
        <h3>After login</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link className="btn" to="/join">Join a League</Link>
          <Link className="btn" to="/create">Create a League</Link>
        </div>
      </div>
    </div>
  );
}
