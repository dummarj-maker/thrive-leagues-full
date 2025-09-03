// src/CreateLeague.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function CreateLeague({ session }) {
  const navigate = useNavigate();

  // show gate if not logged in
  if (!session) {
    return (
      <div className="card">
        <h2>Create a League</h2>
        <p className="error">Auth session missing!</p>
        <Link className="btn" to="/onboarding">Log in</Link>
      </div>
    );
  }

  // form state
  const [name, setName] = useState('My League');
  const [plan, setPlan] = useState('basic');          // basic | premium | annual
  const [promo, setPromo] = useState('FIRSTFREE');    // optional
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      // 1) Get the current user id (prefer session prop)
      const uid =
        session?.user?.id ||
        (await supabase.auth.getUser()).data.user?.id;

      if (!uid) throw new Error('No user ID found. Please log in again.');

      // 2) Build league payload — these columns must exist in public.leagues
      // Required: name (text), owner_id (uuid), plan (text)
      // Optional: promo_code (text), status (text)
      const payload = {
        name: name?.trim(),
        owner_id: uid,
        plan,
        promo_code: (promo || '').trim().toUpperCase() || null,
        status: 'pending',
      };

      if (!payload.name) {
        throw new Error('Please enter a league name.');
      }

      // 3) Insert league and return its id
      const { data: league, error: insertErr } = await supabase
        .from('leagues')
        .insert(payload)
        .select('id')
        .single();

      if (insertErr) throw insertErr;
      if (!league?.id) throw new Error('League was created but ID was not returned.');

      // 4) Add creator as commissioner in league_members
      // Required columns in public.league_members: league_id (uuid), member_id (uuid), role (text)
      const { error: lmErr } = await supabase
        .from('league_members')
        .insert({
          league_id: league.id,
          member_id: uid,
          role: 'commissioner',
        })
        .single();

      if (lmErr) throw lmErr;

      // 5) (Checkout wiring comes later) -> for now, go to Owner console
      navigate('/owner', { replace: true });
    } catch (err) {
      console.error(err);
      // Supabase errors often have .message
      setErrorMsg(err?.message || 'Something went wrong creating the league.');
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Create a League</h2>

      <form onSubmit={handleCreate} className="grid" style={{ gap: 12 }}>
        <label>
          League name
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My League"
            required
          />
        </label>

        <label>
          Plan
          <select
            className="input"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
          >
            <option value="basic">Basic — $4.99 (≈1 month, up to 8)</option>
            <option value="premium">Premium — $9.99 (up to 12 weeks, up to 20)</option>
            <option value="annual">Annual — $99.99 (host up to 3 premium leagues)</option>
          </select>
        </label>

        <label>
          Promo code (optional)
          <input
            className="input"
            value={promo}
            onChange={(e) => setPromo(e.target.value)}
            placeholder="FIRSTFREE"
          />
        </label>

        {errorMsg ? <p className="error" style={{ marginTop: 6 }}>{errorMsg}</p> : null}

        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Continue'}
        </button>

        <p className="mono" style={{ marginTop: 8 }}>
          Checkout &amp; activation happen next.
        </p>
      </form>
    </div>
  );
}

