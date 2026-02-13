import React, { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { getActiveLeagueId } from "./lib/leagueStore";

function Card({ title, children, right }) {
  return (
    <section className="card">
      <div className="cardHeader">
        <h3 className="cardTitle">{title}</h3>
        {right ? <div className="cardRight">{right}</div> : null}
      </div>
      <div className="cardBody">{children}</div>
    </section>
  );
}

export default function Draft() {
  const leagueId = getActiveLeagueId();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      if (!leagueId) throw new Error("No active league. Run setup first.");

      const { data, error: err } = await supabase
        .from("draft_order")
        .select("draft_position, member_id, league_members:member_id(display_name)")
        .eq("league_id", leagueId)
        .order("draft_position", { ascending: true });

      if (err) throw err;

      setRows(
        (data || []).map((r) => ({
          pos: r.draft_position,
          name: r.league_members?.display_name || "Member",
        }))
      );
    } catch (e) {
      setError(e?.message || "Could not load draft order.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueId]);

  return (
    <div className="pageWrap">
      <Card title="Draft Order" right={<span className="pill">Persisted</span>}>
        {loading ? <div className="muted">Loading…</div> : null}
        {error ? <div className="helper errorText">{error}</div> : null}

        {!loading && !error ? (
          <ol className="leaderboard" style={{ marginTop: 10 }}>
            {rows.map((r) => (
              <li key={r.pos} className="row">
                <span className="rowLeft">
                  <span className="rank">{String(r.pos).padStart(2, "0")}</span>
                  <span className="truncate">{r.name}</span>
                </span>
              </li>
            ))}
          </ol>
        ) : null}

        <div className="muted" style={{ marginTop: 12 }}>
          Draft order is generated once at league creation and only editable by Commissioner Tools.
        </div>
      </Card>
    </div>
  );
}
