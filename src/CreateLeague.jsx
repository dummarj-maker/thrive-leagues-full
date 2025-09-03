// src/CreateLeague.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function CreateLeague({ session }) {
  const navigate = useNavigate();

  // If not logged in, nudge to Onboarding (magic link page)
  if (!session) {
    return (
      <div className="card">
        <h2>Create a League</h2>
        <p className="error">Auth session missing!</p>
        <a className="btn" href="/onboarding">Log in</a>
      </div>
    );
  }

  // UI state
  const [plan, setPlan] = useState('basic');     // 'basic' | 'premium' | 'annual'
  const [promo, setPromo] = useState('');        // e.g. FIRSTFREE
  const [name, setName] = useState('My League'); // simple default
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    try {
      setError('');
      setLoading(true);

      // confirm current user
      const { data: { user }, error: uErr } = await supabase.auth.getUser();
      if (uErr) throw uErr;
      if (!user) throw new Error('Not signed in');

      // 1) create the league
      const { data: league, error: lErr } = await supabase
        .from('leagues')
        .insert({
          name: name || 'My League',
          plan,
          promo_code: promo || null,
          commissioner_id: user.id,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();
      if (lErr) throw lErr;

      // 2) add the commissioner as a member
      const { error: mErr } = await supabase
        .from('league_members')
        .insert({
          league_id: league.id,
          member_id: user.id,
          role: 'commissioner'
        });
      if (mErr) throw mErr;

      // 3) go to the Owner console for this league
      navigate(`/owner?league=${league.id}`);
    } catch (err) {
      console.error(err);
      setError(err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Create a League</h2>
      {error && <p className="error">{error}</p>}

      <div className="grid">
        <label>League name
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My League"
          />
        </label>

        <label>Plan
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

        <label>Promo code (optional)
          <input
            className="input"
            value={promo}
            onChange={(e) => setPromo(e.target.value)}
            placeholder="FIRSTFREE"
          />
        </label>
      </div>

      <button className="btn" onClick={handleCreate} disabled={loading}>
        {loading ? 'Creating…' : 'Continue'}
      </button>

      <p className="mono" style={{ marginTop: 8 }}>
        Checkout &amp; activation happen next.
      </p>
    </div>
  );
}
