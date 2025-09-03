// src/CreateLeague.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function CreateLeague({ session }) {
  const navigate = useNavigate();

  // gate: must be logged in
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
  const [plan, setPlan] = useState('basic');         // 'basic' | 'premium' | 'annual'
  const [promo, setPromo] = useState('');            // e.g., FIRSTFREE
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // get user id (prefer prop, fall back to API)
      const uid =
        session?.user?.id ||
        (await supabase.auth.getUser()).data.user?.id;

      if (!uid) throw new Error('No user ID found. Please log in again.');

      // build payload for leagues insert
      const payload = {
        name,
        plan,                                   // must exist as a text column in public.leagues
        promo_code: (promo || '').toUpperCase() || null, // nullable text col ok
        owner_id: uid,                          // must exist as uuid NOT NULL in public.leagues
        status: 'pending',                      // optional (remove if you don’t have this column)
      };

      // create league
      const { data: league, error: insertErr } = await supabase
        .from('leagues')
        .insert(payload)
        .select('id')
        .single();

      if (insertErr) throw insertErr;

      // add creator as commissioner/member (table & columns must exist)
      await supabase.from('league_members').insert({
        league_id: league.id,
        member_id: uid,
        role: 'commissioner',
      });

      alert('League created! (Checkout wiring comes next.)');
      navigate('/owner'); // or wherever you want to send them
    } catch (err) {
      setError(err.message);
    } finally {
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

        {error && <p className="error">{error}</p>}

        <div>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Continue'}
          </button>
          <p className="mono" style={{ marginTop: 8 }}>
            Checkout & activation happen next.
          </p>
        </div>
      </form>
    </div>
  );
}
