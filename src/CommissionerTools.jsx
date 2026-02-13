import React, { useEffect, useMemo, useState } from "react";
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

async function ensureLeagueAdmin(leagueId) {
  const { data, error } = await supabase.rpc("is_league_admin", { p_league_id: leagueId });
  if (error) return false;
  return !!data;
}

export default function CommissionerTools() {
  const leagueId = getActiveLeagueId();

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [members, setMembers] = useState([]);
  const [draft, setDraft] = useState([]);

  const [status, setStatus] = useState({ kind: "idle", msg: "" });

  // Score entry UI
  const [scoreMemberId, setScoreMemberId] = useState("");
  const [scorePoints, setScorePoints] = useState(5);
  const [scoreNote, setScoreNote] = useState("");

  const memberOptions = useMemo(
    () => members.map((m) => ({ id: m.id, name: m.display_name || "Member" })),
    [members]
  );

  async function load() {
    setLoading(true);
    setStatus({ kind: "idle", msg: "" });

    try {
      if (!leagueId) throw new Error("No active league. Run setup first.");

      const ok = await ensureLeagueAdmin(leagueId);
      setIsAdmin(ok);
      if (!ok) throw new Error("You do not have permission to access Commissioner Tools.");

      const { data: memberRows, error: memErr } = await supabase
        .from("league_members")
        .select("id, display_name, role, is_league_manager")
        .eq("league_id", leagueId)
        .order("created_at", { ascending: true });

      if (memErr) throw memErr;

      const { data: draftRows, error: dErr } = await supabase
        .from("draft_order")
        .select("id, member_id, draft_position, league_members:member_id(display_name)")
        .eq("league_id", leagueId)
        .order("draft_position", { ascending: true });

      if (dErr) throw dErr;

      setMembers(memberRows || []);
      setDraft(
        (draftRows || []).map((r) => ({
          id: r.id,
          member_id: r.member_id,
          name: r.league_members?.display_name || "Member",
          draft_position: r.draft_position,
        }))
      );

      // default score member
      if (!scoreMemberId && memberRows?.length) {
        setScoreMemberId(memberRows[0].id);
      }
    } catch (e) {
      setStatus({ kind: "error", msg: e?.message || "Failed to load Commissioner Tools." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueId]);

  function moveDraft(fromIdx, toIdx) {
    if (toIdx < 0 || toIdx >= draft.length) return;
    const next = [...draft];
    const [item] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, item);

    // Re-number positions 1..n
    const renumbered = next.map((x, i) => ({ ...x, draft_position: i + 1 }));
    setDraft(renumbered);
  }

  async function saveDraft() {
    setStatus({ kind: "loading", msg: "Saving draft order…" });

    try {
      if (!isAdmin) throw new Error("Not authorized.");

      const updates = draft.map((d) => ({
        id: d.id,
        league_id: leagueId,
        member_id: d.member_id,
        draft_position: d.draft_position,
      }));

      const { error } = await supabase.from("draft_order").upsert(updates, { onConflict: "id" });
      if (error) throw error;

      setStatus({ kind: "success", msg: "Draft order saved." });
    } catch (e) {
      setStatus({ kind: "error", msg: e?.message || "Could not save draft order." });
    }
  }

  async function submitScore() {
    setStatus({ kind: "loading", msg: "Submitting score…" });

    try {
      if (!isAdmin) throw new Error("Not authorized.");
      if (!scoreMemberId) throw new Error("Select a member.");
      const pts = Number(scorePoints);
      if (!Number.isFinite(pts)) throw new Error("Points must be a number.");

      const payload = {
        league_id: leagueId,
        member_id: scoreMemberId,
        points: pts,
        note: (scoreNote || "").trim() || null,
      };

      const { error } = await supabase.from("score_events").insert(payload);
      if (error) throw error;

      setScoreNote("");
      setStatus({ kind: "success", msg: "Score recorded. Home leaderboard will update." });
    } catch (e) {
      setStatus({ kind: "error", msg: e?.message || "Could not submit score." });
    }
  }

  if (loading) {
    return (
      <div className="pageWrap">
        <Card title="Commissioner Tools">
          <div className="muted">Loading…</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="pageWrap">
      <Card title="Commissioner Tools" right={<span className="pill">Admin</span>}>
        {status.kind === "error" ? <div className="helper errorText">{status.msg}</div> : null}
        {status.kind === "success" ? <div className="helper">{status.msg}</div> : null}
        {status.kind === "loading" ? <div className="muted">{status.msg}</div> : null}

        {!isAdmin ? (
          <div className="helper errorText" style={{ marginTop: 10 }}>
            You do not have access to this page.
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gap: 14 }}>
              {/* Draft Order Editor */}
              <Card title="Edit Draft Order" right={<button className="btnPrimary" onClick={saveDraft}>Save</button>}>
                <div className="muted" style={{ marginTop: 0 }}>
                  Draft order is generated once and only editable here.
                </div>

                <ol className="leaderboard" style={{ marginTop: 10 }}>
                  {draft.map((d, idx) => (
                    <li key={d.id} className="row" style={{ alignItems: "center" }}>
                      <span className="rowLeft">
                        <span className="rank">{String(d.draft_position).padStart(2, "0")}</span>
                        <span className="truncate">{d.name}</span>
                      </span>

                      <span style={{ display: "flex", gap: 6 }}>
                        <button className="btnGhost" type="button" onClick={() => moveDraft(idx, idx - 1)}>
                          ↑
                        </button>
                        <button className="btnGhost" type="button" onClick={() => moveDraft(idx, idx + 1)}>
                          ↓
                        </button>
                      </span>
                    </li>
                  ))}
                </ol>
              </Card>

              {/* Score Entry */}
              <Card title="Enter Scores" right={<span className="pill">Updates Home</span>}>
                <div className="field">
                  <label className="label">Member</label>
                  <select
                    className="input"
                    value={scoreMemberId}
                    onChange={(e) => setScoreMemberId(e.target.value)}
                  >
                    {memberOptions.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field" style={{ marginTop: 10 }}>
                  <label className="label">Points</label>
                  <input
                    className="input"
                    type="number"
                    value={scorePoints}
                    onChange={(e) => setScorePoints(e.target.value)}
                  />
                </div>

                <div className="field" style={{ marginTop: 10 }}>
                  <label className="label">Note (optional)</label>
                  <input
                    className="input"
                    value={scoreNote}
                    onChange={(e) => setScoreNote(e.target.value)}
                    placeholder="Example: Completed 2-minute plank"
                  />
                </div>

                <div style={{ marginTop: 12 }}>
                  <button className="btnPrimary" type="button" onClick={submitScore}>
                    Submit Score
                  </button>
                </div>

                <div className="muted" style={{ marginTop: 10 }}>
                  Next brick: schedule editor + weekly matchup scoring view.
                </div>
              </Card>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
