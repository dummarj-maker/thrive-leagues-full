// src/Onboarding.jsx
import React, { useState, useEffect } from 'react';
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

    const { data: subscription } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (mounted) setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Send magic link with redirect to /auth/callback
  async function signInEmail(e) {
    e.preventDefault();
    setError('');
    setMsg('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`, // 👈 IMPORTANT FIX
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setMsg('Magic link sent! Check your email.');
    }
  }

  return (
    <div className="card">
      <h2>Get Started</h2>
      <p>Log in to join or create a league.</p>

      <form onSubmit={signInEmail}>
        <input
          className="input"
          type="email"
          placeholder="you@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send magic link'}
        </button>
      </form>

      {msg && <p className="msg">{msg}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
