// Draft.jsx (place in the file your router uses for /draft)
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabaseClient"; // if your Draft is in /src/pages, change to "../lib/supabaseClient"
import { getActiveLeagueId, subscribeActiveLeague } from "./lib/leagueStore"; // if /src/pages, change to "../lib/leagueStore"

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

function Pill({ children }) {
  return <span className="pill">{children}</span>;
}

function prettyErr(e) {
  if (!e) return "Unknown error";
  if (typeof e === "string") return e;
  return e.message || JSON.stringify(e);
}

export default function Draft() {
  const [leagueId, setLeagueId] = useState(() => getActiveLeagueId());
  const [status, setStatus] = useState({ kind: "idle", msg: "" });

  const [draftRows, setDraftRows] = useState([]); // [{draft_position, member_id, league_members:{display_name}}]
  const [categories, setCategories] = useState([]); // [{id, name, ...}]

  // Keep leagueId in sync with leagueStore updates
  useEffect(() => {
    const unsub = subscribeActiveLeague((id) => setLeagueId(id || ""));
    return unsub;
  }, []);

  // Load Draft Order + Categories for active league
  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!leagueId) {
        setDraftRows([]);
        setCategories([]);
        setStatus({
          kind: "error",
          msg:
            "No active league is set yet. Go to /setup and Activate a league (it must call setActiveLeague(league.id)).",
        });
        return;
      }

      setStatus({ kind: "loading", msg: "Loading draft data..." });

      try {
        // 1) Draft order for this league, joined to league_members display_name
        const { data: draftData, error: draftErr } = await supabase
          .from("draft_order")
          .select(
            `
            draft_position,
            member_id,
            league_members:member_id (
              id,
              display_name,
              user_id,
              role
            )
          `
          )
          .eq("league_id", leagueId)
          .order("draft_position", { ascending: true });

        if (draftErr) throw draftErr;

        // 2) Categories list (global list for now)
        const { data: catData, error: catErr } = await supabase
          .from("categories")
          .select("*")
          .order("name", { ascending: true });

        if (catErr) throw catErr;

        if (ignore) return;

        setDraftRows(draftData || []);
        setCategories(catData || []);

        setStatus({ kind: "success", msg: "Loaded." });
      } catch (e) {
        if (ignore) return;
        setStatus({ kind: "error", msg: prettyErr(e) });
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [leagueId]);

  const draftNames = useMemo(() => {
    return (draftRows || []).map((r) => {
      const name = r?.league_members?.display_name || "Member";
      return { pos: r.draft_position, name };
    });
  }, [draftRows]);

  return (
    <div className="pageWrap">
      <Card
        title="Draft"
        right={
          <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Pill>Persisted</Pill>
            <span className="muted" style={{ fontSize: 12 }}>
              League: {leagueId ? leagueId.slice(0, 8) + "…" : "none"}
            </span>
          </span>
        }
      >
        {status.kind === "loading" ? (
          <div className="muted">Loading…</div>
        ) : null}

        {status.kind === "error" ? (
          <div className="helper errorText" style={{ marginBottom: 12 }}>
            {status.msg}
          </div>
        ) : null}

        <div className="seasonGrid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* Left: Draft Order */}
          <div className="seasonTile" style={{ padding: 0 }}>
            <div style={{ padding: 14 }}>
              <div className="tileTitle">Draft Order</div>
              <div className="tileSub">
                Generated once at league creation. Only editable via Commissioner Tools.
              </div>
            </div>

            <div style={{ padding: "0 14px 14px 14px" }}>
              {draftNames.length === 0 ? (
                <div className="muted">
                  No draft order rows found for this league.
                  <br />
                  That usually means league creation didn’t insert into <code>draft_order</code> for
                  the active league id.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {draftNames.map((d) => (
                    <div
                      key={`${d.pos}-${d.name}`}
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.06)",
                      }}
                    >
                      <div className="pill" style={{ width: 44, textAlign: "center" }}>
                        {String(d.pos).padStart(2, "0")}
                      </div>
                      <div style={{ fontWeight: 600 }}>{d.name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Categories (Phase 1 view only) */}
          <div className="seasonTile" style={{ padding: 0 }}>
            <div style={{ padding: 14 }}>
              <div className="tileTitle">Categories</div>
              <div className="tileSub">
                Phase 1: show the official categories. Next brick: commissioner drag-and-drop
                assignment per member.
              </div>
            </div>

            <div style={{ padding: "0 14px 14px 14px" }}>
              {categories.length === 0 ? (
                <div className="muted">
                  No categories found. That means your <code>categories</code> table is empty (or RLS
                  is blocking reads).
                </div>
              ) : (
                <div style={{ display: "grid", gap: 8 }}>
                  {categories.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.06)",
                        fontWeight: 600,
                      }}
                    >
                      {c.name || c.title || "Category"}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
