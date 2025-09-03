import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function CreateLeague() {
  const [plan, setPlan] = useState('basic');
  const [promo, setPromo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    try {
      setError('');
      setLoading(true);

      // get current user
      const { data: { user }, error: uErr } = await supabase.auth.getUser();
      if (uErr) throw uErr;
      if (!user) throw new Error("You must be logged in to create a league.");

      // insert into leagues
      const { data: league, error: lErr } = await supabase
        .from('leagues')
        .insert({
          name: `League by ${user.email}`,   // TODO: replace with real input field
          commissioner_id: user.id,
          plan: plan,
          promo: promo || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (lErr) throw lErr;

      // also add the commissioner as a member
      const { error: mErr } = await supabase
        .from('league_members')
        .insert({
          league_id: league.id,
          member_id: user.id
        });

      if (mErr) throw mErr;

      alert(`League created! ID: ${league.id}`);
      window.location.href = `/owner`; // redirect commissioner console
    } catch (e) {
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h2>Create a League</h2>
      {error && <p style={{color:"red"}}>{error}</p>}
      <label>
        Plan:
        <select value={plan} onChange={e=>setPlan(e.target.value)}>
          <option value="basic">Basic — $4.99</option>
          <option value="premium">Premium</option>
        </select>
      </label>
      <label>
        Promo code (optional):
        <input value={promo} onChange={e=>setPromo(e.target.value)} />
      </label>
      <button disabled={loading} onClick={handleCreate}>
        {loading ? "Creating..." : "Continue"}
      </button>
    </div>
  );
}
