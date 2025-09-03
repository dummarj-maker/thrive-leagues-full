// src/Picks.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

function mondayOfThisWeekIso() {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const diff = (day === 0 ? -6 : 1 - day); // back to Monday
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0,0,0,0);
  return d.toISOString().slice(0,10); // YYYY-MM-DD
}

export default function Picks(){
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [categories, setCats]   = useState([]);
  const [leagueId, setLeagueId] = useState(null);
  const [weekId, setWeekId]     = useState(null);
  const [locked, setLocked]     = useState(false);

  const [cat1, setCat1] = useState(null); // 3-point
  const [cat2, setCat2] = useState(null); // 2-point
  const [cat3, setCat3] = useState(null); // 1-point

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');

        // 1) Who am I?
        const { data: { user }, error: uErr } = await supabase.auth.getUser();
        if (uErr) throw uErr;
        if (!user) { setError('Please sign in first.'); return; }

        // 2) Find one league for this user (commissioner OR member)
        let foundLeagueId = null;

        const { data: ownLeagues, error: ownErr } = await supabase
          .from('leagues')
          .select('id')
          .eq('commissioner_id', user.id)
          .limit(1);
        if (ownErr) throw ownErr;
        if (ownLeagues && ownLeagues.length) {
          foundLeagueId = ownLeagues[0].id;
        } else {
          const { data: memRows, error: memErr } = await supabase
            .from('league_members')
            .select('league_id')
            .eq('member_id', user.id)
            .limit(1);
          if (memErr) throw memErr;
          if (memRows && memRows.length) foundLeagueId = memRows[0].league_id;
        }

        if (!foundLeagueId) { setError('You are not in a league yet. Create or join one first.'); return; }
        setLeagueId(foundLeagueId);

        // 3) Determine current week_id from table "weeks"
        const mondayIso = mondayOfThisWeekIso();
        // prefer exact week starting Monday; else fallback to the latest <= today
        let gotWeek = null;
        const { data: exactWeek, error: w1 } = await supabase
          .from('weeks')
          .select('id,start_date')
          .eq('start_date', mondayIso)
          .limit(1);
        if (w1) throw w1;
        if (exactWeek && exactWeek.length) {
          gotWeek = exactWeek[0];
        } else {
          const { data: latestWeek, error: w2 } = await supabase
            .from('weeks')
            .select('id,start_date')
            .lte('start_date', mondayIso)
            .order('start_date', { ascending: false })
            .limit(1);
          if (w2) throw w2;
          if (latestWeek && latestWeek.length) gotWeek = latestWeek[0];
        }

        if (!gotWeek) { setError('No week found. We need a row in "weeks" for this Monday.'); return; }
        setWeekId(gotWeek.id);

        // 4) Load categories for the dropdowns
        const { data: cats, error: cErr } = await supabase
          .from('categories')
          .select('id,name')
          .order('id', { ascending: true });
        if (cErr) throw cErr;
        setCats(cats || []);

        // 5) Load existing pick (if any) to prefill + see if it's locked
        const { data: existing, error: pErr } = await supabase
          .from('user_week_picks')
          .select('cat1_id,cat2_id,cat3_id,locked')
          .eq('league_id', foundLeagueId)
          .eq('week_id', gotWeek.id)
          .maybeSingle();
        if (pErr && pErr.code !== 'PGRST116') throw pErr; // "Results contain 0 rows"
        if (existing) {
          setCat1(existing.cat1_id ?? null);
          setCat2(existing.cat2_id ?? null);
          setCat3(existing.cat3_id ?? null);
          setLocked(!!existing.locked);
        }
      } catch (e) {
        setError(e.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function savePicks(){
    try {
      setError('');
      if (!leagueId || !weekId) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('Please sign in first.'); return; }
      if (!cat1 || !cat2 || !cat3) { setError('Pick all three categories first.'); return; }

      // prevent duplicate category selection
      if (new Set([cat1,cat2,cat3]).size !== 3) { setError('Use three different categories.'); return; }

      const payload = {
        league_id: leagueId,
        week_id: weekId,
        user_id: user.id,
        cat1_id: cat1,
        cat2_id: cat2,
        cat3_id: cat3,
      };

      const { error } = await supabase
        .from('user_week_picks')
        .upsert(payload, { onConflict: 'league_id,week_id,user_id' });
      if (error) throw error;

      alert('Saved!'); // quick feedback
    } catch (e) {
      setError(e.message ?? String(e));
    }
  }

  if (loading) return <div className="container"><p>Loading…</p></div>;
  if (error)   return <div className="container"><p style={{color:'#f88'}}>Error: {error}</p></div>;

  return (
    <div className="container">
      <h2>Your Picks (this week)</h2>
      {locked && <p style={{color:'#aaa'}}>Picks are locked for this week.</p>}

      <div style={{display:'grid', gap:'12px', maxWidth:420}}>
        <label>
          3-point category
          <select disabled={locked} value={cat1 ?? ''} onChange={e=>setCat1(Number(e.target.value)||null)}>
            <option value="">— choose —</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        <label>
          2-point category
          <select disabled={locked} value={cat2 ?? ''} onChange={e=>setCat2(Number(e.target.value)||null)}>
            <option value="">— choose —</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        <label>
          1-point category
          <select disabled={locked} value={cat3 ?? ''} onChange={e=>setCat3(Number(e.target.value)||null)}>
            <option value="">— choose —</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>

        <button className="btn" disabled={locked} onClick={savePicks}>Save picks</button>
      </div>
    </div>
  );
}
