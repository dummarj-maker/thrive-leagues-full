// src/pages/Draft.jsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getActiveLeague } from "../lib/leagueStore";

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
  const leagueId = useMemo(() => getActiveLeague(), []);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [draftOrder, setDraftOrder] = useState([]); // [{draft_position, member_id, display_name}]
  const [categories, setCategories] = useState([]); // [{id, name}]

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setErr("");

      try {
        if (!leagueId) throw new Error("No active league found. Please run Setup.");

        // 1) Load draft order
        const { data: dRows, error: dErr } = await supabase
          .from("draft_order")
          .select("draft_position, member_id")
          .eq("league_id", leagueId)
          .order("draft_position", { ascending: true });

        if (dErr) throw dErr;

        const memberIds = (dRows || []).map((r) => r.member_id);
        if (memberIds.length === 0) {
          setDraftOrder([]);
        } else {
          // 2) Load member names
          const { data: mRows, error: mErr } = await supabase
            .from("league_members")
            .select("id, display_name")
            .in("id", memberIds);

          if (mErr) throw mErr;

          const nameById = new Map((mRows || []).map((m) => [m.id, m.display_name]));
          const merged = (dRows || []).map((r) => ({
            draft_position: r.draft_position,
            member_id: r.member_id,
            display_name: nameById.get(r.member_id) || "Member",
          }));

          setDraftOrder(merged);
        }

        // 3) Load categories
        const { data: cRows, error: cErr } = await supabase
          .from("categories")
          .select("id, name")
          .order("name", { ascending: true });

        if (cErr) throw cErr;

        if (!ignore) setCategories(cRows || []);
      } catch (e) {
        if (!ignore) setErr(e?.message || "Failed to load Draft data.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [leagueId]);

  return (
    <div className="pageWrap">
      <Card title="Draft" right={<span className="pill">Wired In</span>}>
        {loading ? <div className="muted">Loading draft data…</div> : null}
        {err ? <div className="helper errorText">{err}</div> : null}

        {!loading && !err ? (
          <div className="seasonGrid" style={{ marginTop: 10 }}>
            <div className="seasonTile">
              <div className="tileKicker">Draft Order</div>
              <div className="tileSub muted">Generated once at league creation.</div>

              <ol className="leaderboard" style={{ marginTop: 10 }}>
                {draftOrder.map((d) => (
                  <li key={d.member_id} className="row">
                    <span className="rowLeft">
                      <span className="rank">{String(d.draft_position).padStart(2, "0")}</span>
                      <span className="truncate">{d.display_name}</span>
                    </span>
                  </li>
                ))}
                {draftOrder.length === 0 ? <div className="muted">No draft order found.</div> : null}
              </ol>
            </div>

            <div className="seasonTile">
              <div className="tileKicker">Categories</div>
              <div className="tileSub muted">These are the available life categories.</div>

              <div style={{ marginTop: 10 }}>
                {categories.length ? (
                  <div className="chips" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {categories.map((c) => (
                      <span key={c.id} className="chip">{c.name}</span>
                    ))}
                  </div>
                ) : (
                  <div className="muted">No categories found.</div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
