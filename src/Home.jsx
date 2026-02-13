import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { getActiveLeagueId } from "./lib/leagueStore";

function Card({ title, right, children }) {
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

function Pill({ children }) {
  return <span className="pill">{children}</span>;
}

export default function Home() {
  const leagueId = getActiveLeagueId();

  const [loading, setLoading] = useState(true);
  const [league, setLeague] = useState(null);
  const [members, setMembers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      if (!leagueId) throw new Error("No active league found. Please run setup.");

      const { data: leagueRow, error: leagueErr } = await supabase
        .from("leagues")
        .select("*")
        .eq("id", leagueId)
        .single();

      if (leagueErr) throw leagueErr;

      const { data: memberRows, error: memErr } = await supabase
        .from("league_members")
        .select("id, league_id, display_name, role, is_league_manager")
        .eq("league_id", leagueId)
        .order("created_at", { ascending: true });

      if (memErr) throw memErr;

      // Try to compute points from score_events (if the table exists).
      // If it doesn't exist yet, we fall back to 0 points.
      let pointsByMemberId = {};
      try {
        const { data: scoreRows, error: scoreErr } = await supabase
          .from("score_events")
          .select("member_id, points")
          .eq("league_id", leagueId);

        if (!scoreErr && Array.isArray(scoreRows)) {
          for (const r of scoreRows) {
            const mid = r.member_id;
            const p = Number(r.points || 0);
            pointsByMemberId[mid] = (pointsByMemberId[mid] || 0) + p;
          }
        }
      } catch {
        // ignore
      }

      const lb = memberRows
        .map((m) => ({
          id: m.id,
          name: m.display_name || "Member",
          points: pointsByMemberId[m.id] || 0,
        }))
        .sort((a, b) => b.points - a.points);

      setLeague(leagueRow);
      setMembers(memberRows);
      setLeaderboard(lb);
    } catch (e) {
      setError(e?.message || "Could not load league home.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    // Realtime: if score_events exists + realtime enabled, this keeps leaderboard current.
    // If realtime is not enabled yet, it still works — just without live updates.
    const channel = supabase
      .channel("home-score-events")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "score_events", filter: `league_id=eq.${leagueId}` },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueId]);

  const teamName = useMemo(() => league?.name || "League", [league]);

  if (loading) {
    return (
      <div className="pageWrap">
        <Card title="Home">
          <div className="muted">Loading league…</div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pageWrap">
        <Card title="Home">
          <div className="helper errorText">{error}</div>
        </Card>
      </div>
    );
  }

  return (
    <main className="grid">
      {/* LEFT COLUMN */}
      <aside className="col left">
        <Card title="League" right={<Pill>{league?.weeks ? `${league.weeks}w` : "Active"}</Pill>}>
          <div className="teamBox">
            <div className="teamLogo">🌵</div>
            <div className="teamMeta">
              <div className="teamName">{teamName}</div>
              <div className="teamOwner muted">
                {members.length} members • {league?.draft_mode ? `Draft: ${league.draft_mode}` : "Draft: —"}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Members">
          <ul className="list">
            {members.map((m) => (
              <li key={m.id} className="row">
                <span className="rowLeft">
                  <span className="dot" />
                  <span className="truncate">
                    {m.display_name}{" "}
                    {m.role === "commissioner" ? <span className="muted">(Commissioner)</span> : null}
                    {m.is_league_manager ? <span className="muted"> (LM)</span> : null}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </aside>

      {/* CENTER COLUMN */}
      <section className="col center">
        <Card title="Season Hub">
          <div className="seasonGrid">
            <div className="seasonTile">
              <div className="tileKicker">Today</div>
              <div className="tileTitle">Daily Challenges</div>
              <div className="tileSub">Draft tasks • Track points</div>
            </div>
            <div className="seasonTile">
              <div className="tileKicker">This Week</div>
              <div className="tileTitle">Matchups</div>
              <div className="tileSub">Head-to-head + partners</div>
            </div>
            <div className="seasonTile">
              <div className="tileKicker">This Season</div>
              <div className="tileTitle">Leaderboard</div>
              <div className="tileSub">Points update from scoring</div>
            </div>
          </div>
        </Card>

        <Card title="Thrive Moment of the Day" right={<Pill>Auto</Pill>}>
          <div className="muted">
            Next brick: choose “Moment of the Day” from latest score event or a featured challenge completion.
          </div>
        </Card>
      </section>

      {/* RIGHT COLUMN */}
      <aside className="col right">
        <Card title="Season Leaderboard" right={<a className="link" href="/commissioner-tools">Score</a>}>
          <ol className="leaderboard">
            {leaderboard.map((p, idx) => (
              <li key={p.id} className="row">
                <span className="rowLeft">
                  <span className="rank">{String(idx + 1).padStart(2, "0")}</span>
                  <span className="truncate">{p.name}</span>
                </span>
                <span className="pillScore">{p.points}</span>
              </li>
            ))}
          </ol>
        </Card>
      </aside>
    </main>
  );
}
