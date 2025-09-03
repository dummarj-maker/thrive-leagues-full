import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function Onboarding() {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });

    if (error) {
      setMsg(error.message);
    } else {
      setMsg('Magic link sent! Check your email.');
    }

    setLoading(false);
  };

  return (
    <div className="grid">
      <div className="card">
        <h2>Get Started</h2>
        <p>Log in to join or create a league.</p>

        <form onSubmit={submit} className="grid">
          <input
            className="input"
            placeholder="you@domain.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send magic link'}
          </button>
        </form>

        {msg && <p className="mono" style={{ marginTop: 8 }}>{msg}</p>}

        <div style={{ marginTop: '1rem' }}>
          <p>After login:</p>
          <Link to="/join" className="btn">Join a League</Link>
          <Link to="/create" className="btn" style={{ marginLeft: '0.5rem' }}>
            Create a League
          </Link>
        </div>
      </div>
    </div>
  );
}
