// src/pages/LeagueSetup.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { createLeagueWithGeneratedData } from "../lib/leagueService";
import { setActiveLeague, clearActiveLeague } from "../lib/leagueStore";

// Local storage keys (keep consistent)
const LS_LEAGUE_KEY = "tl_league";

const MEMBERS_MIN = 3;
const MEMBERS_MAX = 12;

const WEEKS_MIN = 3;
const WEEKS_MAX = 12;

const steps = [
  { key: "basics", label: "Basics" },
  { key: "familySize", label: "Family Size" },
  { key: "members", label: "Members" },
  { key: "weeks", label: "Weeks" },
  { key: "draftMode", label: "Draft Mode" },
  { key: "review", label: "Review" },
  { key: "activate", label: "Activate" },
];

function clampInt(val, min, max) {
  const n = Number(val);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function makeRange(min, max) {
  const out = [];
  for (let i = min; i <= max; i++) out.push(i);
  return out;
}

function safeLocalPart(email) {
  if (!email || typeof email !== "string") return "";
  const at = email.indexOf("@");
  if (at <= 0) return email;
  return email.slice(0, at);
}

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

function StepPills({ currentKey }) {
  const currentIdx = steps.findIndex((s) => s.key === currentKey);
  return (
    <div className="wizardSteps">
      {steps.map((s, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <span
            key={s.key}
            className={["wizardPill", done ? "done" : "", active ? "active" : ""]
              .filter(Boolean)
              .join(" ")}
          >
            {done ? "✓ " : ""}
            {s.label}
          </span>
        );
      })}
    </div>
  );
}

export default function LeagueSetup() {
  const nav = useNavigate();
  const location = useLocation();

  const [session, setSession] = useState(null);

  // Step state
  const [stepKey, setStepKey] = useState("basics");

  // League basics
  const [leagueName, setLeagueName] = useState("");

  // Config
  const [membersCount, setMembersCount] = useState(4);
  const [weeks, setWeeks] = useState(3);

  // Draft mode
  const [draftMode, setDraftMode] = useState("self");

  // Member list objects:
  // NOTE: DB can only create commissioner right now (FK requires real auth users).
  // We still collect names/emails for future "Invite / Join" brick.
  const [members, setMembers] = useState([]);

  // UI status
  const [status, setStatus] = useState({ kind: "idle", msg: "" });

  // Load session + seed commissioner
  useEffect(() => {
    let ignore = false;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (ignore) return;
      setSession(data.session || null);
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => {
      ignore = true;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const userEmail = (session?.user?.email || "").toLowerCase().trim();
  const userId = session?.user?.id || "";

  // Seed defaults once session is available
  useEffect(() => {
    if (!session) return;

    const commissionerName =
      session?.user?.user_metadata?.full_name?.trim?.() ||
      session?.user?.user_metadata?.name?.trim?.() ||
      safeLocalPart(session?.user?.email) ||
      "Commissioner";

    setLeagueName((prev) => (prev && prev.trim() ? prev : "Family League"));

    setMembers((prev) => {
      const hasCommissioner = prev.some((m) => m.role === "commissioner");
      if (hasCommissioner) {
        return prev.map((m) => {
          if (m.role !== "commissioner") return m;
          return {
            ...m,
            name: m.name?.trim?.() ? m.name : commissionerName,
            email: userEmail || m.email || "",
            isLeagueManager: true,
          };
        });
      }

      const base = [];
      base.push({
        id: "commissioner",
        role: "commissioner",
        name: commissionerName,
        email: userEmail,
        isLeagueManager: true,
      });

      const extra = Math.max(0, clampInt(membersCount, MEMBERS_MIN, MEMBERS_MAX) - 1);
      for (let i = 0; i < extra; i++) {
        base.push({
          id: `m${i + 2}`,
          role: "member",
          name: "",
          email: "",
          isLeagueManager: false,
        });
      }
      return base;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Resize array when membersCount changes
  useEffect(() => {
    setMembers((prev) => {
      if (!prev || prev.length === 0) return prev;

      const desired = clampInt(membersCount, MEMBERS_MIN, MEMBERS_MAX);
      const commissioner = prev.find((m) => m.role === "commissioner") || {
        id: "commissioner",
        role: "commissioner",
        name: safeLocalPart(userEmail) || "Commissioner",
        email: userEmail,
        isLeagueManager: true,
      };

      const existingMembers = prev.filter((m) => m.role !== "commissioner");
      const need = Math.max(0, desired - 1);

      const nextMembers = existingMembers.slice(0, need);
      while (nextMembers.length < need) {
        const idx = nextMembers.length + 2;
        nextMembers.push({
          id: `m${idx}`,
          role: "member",
          name: "",
          email: "",
          isLeagueManager: false,
        });
      }

      return [commissioner, ...nextMembers];
    });
  }, [membersCount, userEmail]);

  // LM toggle rule: must have email
  useEffect(() => {
    setMembers((prev) =>
      prev.map((m) => {
        if (m.role === "commissioner") {
          return { ...m, email: userEmail || m.email || "", isLeagueManager: true };
        }
        const hasEmail = !!(m.email || "").trim();
        if (!hasEmail && m.isLeagueManager) return { ...m, isLeagueManager: false };
        return m;
      })
    );
  }, [userEmail]);

  // Validation helpers
  const commissioner = members.find((m) => m.role === "commissioner");
  const membersOnly = members.filter((m) => m.role !== "commissioner");

  function canGoNextFromBasics() {
    return (leagueName || "").trim().length >= 2;
  }

  function canGoNextFromFamilySize() {
    const n = clampInt(membersCount, MEMBERS_MIN, MEMBERS_MAX);
    return n >= MEMBERS_MIN && n <= MEMBERS_MAX;
  }

  function canGoNextFromMembers() {
    if (!commissioner?.name?.trim()) return false;
    for (const m of membersOnly) {
      if (!m.name?.trim()) return false;
      if (m.isLeagueManager && !(m.email || "").trim()) return false;
    }
    return true;
  }

  function canGoNextFromWeeks() {
    const w = clampInt(weeks, WEEKS_MIN, WEEKS_MAX);
    return w >= WEEKS_MIN && w <= WEEKS_MAX;
  }

  function canGoNextFromDraftMode() {
    return draftMode === "self" || draftMode === "other";
  }

  function goNext() {
    setStatus({ kind: "idle", msg: "" });
    const idx = steps.findIndex((s) => s.key === stepKey);
    const next = steps[idx + 1]?.key;
    if (!next) return;
    setStepKey(next);
  }

  function goBack() {
    setStatus({ kind: "idle", msg: "" });
    const idx = steps.findIndex((s) => s.key === stepKey);
    const prev = steps[idx - 1]?.key;
    if (!prev) return;
    setStepKey(prev);
  }

  function resetLeagueLocal() {
    localStorage.removeItem(LS_LEAGUE_KEY);
    clearActiveLeague();
    setStatus({ kind: "success", msg: "League reset. You can run setup again." });
    setStepKey("basics");
  }

  async function activateLeague() {
    setStatus({ kind: "loading", msg: "Activating league..." });

    try {
      // Must be authed
      if (!userId || !userEmail) throw new Error("You must be logged in to activate a league.");

      // Final validation
      if (!canGoNextFromBasics()) throw new Error("League name is required.");
      if (!canGoNextFromFamilySize()) throw new Error("Member count is invalid.");
      if (!canGoNextFromMembers()) throw new Error("Member names are required.");
      if (!canGoNextFromWeeks()) throw new Error("Weeks selection is invalid.");
      if (!canGoNextFromDraftMode()) throw new Error("Draft mode is invalid.");

      // IMPORTANT: DB can only insert commissioner right now (auth FK).
      // We still pass the full list for future bricks, but service will insert commissioner only.
      const payloadMembers = members.map((m) => ({
        user_id: m.role === "commissioner" ? userId : null,
        display_name: (m.name || "").trim(),
        role: m.role === "commissioner" ? "commissioner" : "participant",
        is_league_manager: m.role === "commissioner" ? true : !!m.isLeagueManager,
        username: null,
        pin: null,
        email: (m.email || "").trim() || null,
      }));

      const result = await createLeagueWithGeneratedData({
        name: leagueName.trim(),
        commissionerEmail: userEmail,
        draftMode,
        weeks: clampInt(weeks, WEEKS_MIN, WEEKS_MAX),
        members: payloadMembers,
      });

      // Activation Hook (this is the missing wiring)
      setActiveLeague(result.leagueId);

      // Optional local cache (Stage 2 convenience)
      localStorage.setItem(
        LS_LEAGUE_KEY,
        JSON.stringify({
          leagueId: result.leagueId,
          leagueName: leagueName.trim(),
          commissionerEmail: userEmail,
          weeks: clampInt(weeks, WEEKS_MIN, WEEKS_MAX),
          draftMode,
        })
      );

      setStatus({ kind: "success", msg: "League activated! Redirecting to Home..." });

      setTimeout(() => {
        nav("/home", { replace: true, state: { from: location.pathname } });
      }, 350);
    } catch (e) {
      setStatus({ kind: "error", msg: e?.message || "Could not activate league." });
    }
  }

  // Render helpers
  function renderBasics() {
    return (
      <Card title="League basics" right={<Pill>Step 1</Pill>}>
        <div className="field">
          <label className="label">League name</label>
          <input
            className="input"
            value={leagueName}
            onChange={(e) => setLeagueName(e.target.value)}
            placeholder="Example: Family League"
            autoFocus
          />
          <div className="helper muted">Tip: keep it simple. You can rename later.</div>
        </div>
      </Card>
    );
  }

  function renderFamilySize() {
    return (
      <Card title="Family size" right={<Pill>Step 2</Pill>}>
        <div className="field">
          <label className="label">How many members will be in this league? (3–12)</label>
          <select
            className="input"
            value={membersCount}
            onChange={(e) => setMembersCount(clampInt(e.target.value, MEMBERS_MIN, MEMBERS_MAX))}
          >
            {makeRange(MEMBERS_MIN, MEMBERS_MAX).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <div className="helper muted">We’ll set up your member list next.</div>
        </div>
      </Card>
    );
  }

  function renderMembers() {
    return (
      <Card title="Add members" right={<Pill>Step 3</Pill>}>
        <div className="muted" style={{ marginBottom: 10 }}>
          Names are required. Emails are optional — <strong>except</strong> League Managers (LM) must have an email.
        </div>

        <div className="membersGridHeader">
          <div className="colLabel muted">Member</div>
          <div className="colLabel muted">Name (required)</div>
          <div className="colLabel muted">Email (optional)</div>
          <div className="colLabel muted" style={{ textAlign: "right" }}>
            League manager
          </div>
        </div>

        {/* Commissioner row */}
        <div className="membersRow commissionerRow">
          <div className="memberTag">
            <span className="badge">Commissioner</span>
          </div>

          <div>
            <input
              className="input"
              value={commissioner?.name || ""}
              onChange={(e) => {
                const v = e.target.value;
                setMembers((prev) => prev.map((m) => (m.role === "commissioner" ? { ...m, name: v } : m)));
              }}
              placeholder="Commissioner name"
            />
          </div>

          <div>
            <input className="input" value={userEmail} disabled />
            <div className="helper muted">Commissioner email is pulled from your login.</div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <label className="toggleWrap" title="Commissioner is always a League Manager">
              <input type="checkbox" checked readOnly />
              <span className="toggle" />
            </label>
          </div>
        </div>

        {/* Other members */}
        {membersOnly.map((m, idx) => {
          const label = `Member ${idx + 2}`;
          const hasEmail = !!(m.email || "").trim();
          const lmDisabled = !hasEmail;

          return (
            <div key={m.id} className="membersRow">
              <div className="memberTag">{label}</div>

              <div>
                <input
                  className="input"
                  value={m.name}
                  onChange={(e) => {
                    const v = e.target.value;
                    setMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, name: v } : x)));
                  }}
                  placeholder="Name"
                />
              </div>

              <div>
                <input
                  className="input"
                  value={m.email}
                  onChange={(e) => {
                    const v = e.target.value;
                    setMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, email: v } : x)));
                  }}
                  placeholder="Email (optional)"
                />
                {m.isLeagueManager && !hasEmail ? (
                  <div className="helper errorText">Add an email to grant league manager permissions.</div>
                ) : null}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", flexDirection: "column", alignItems: "flex-end" }}>
                <label
                  className={["toggleWrap", lmDisabled ? "disabled" : ""].join(" ")}
                  title={lmDisabled ? "Add an email address to enable League Manager." : "League Managers can enter points."}
                >
                  <input
                    type="checkbox"
                    checked={!!m.isLeagueManager}
                    disabled={lmDisabled}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, isLeagueManager: checked } : x)));
                    }}
                  />
                  <span className="toggle" />
                </label>

                <div className="helper muted" style={{ textAlign: "right", maxWidth: 260 }}>
                  League managers can score matchups and <strong>enter points for everyone</strong>.
                </div>
              </div>
            </div>
          );
        })}
      </Card>
    );
  }

  function renderWeeks() {
    return (
      <Card title="League length" right={<Pill>Step 4</Pill>}>
        <div className="notice">Paid leagues are <strong>$1 per week</strong> (no per-user fee). Payment comes later.</div>

        <div className="field" style={{ marginTop: 10 }}>
          <label className="label">How many weeks will this league run? (3–12)</label>
          <select
            className="input"
            value={weeks}
            onChange={(e) => setWeeks(clampInt(e.target.value, WEEKS_MIN, WEEKS_MAX))}
          >
            {makeRange(WEEKS_MIN, WEEKS_MAX).map((w) => (
              <option key={w} value={w}>
                {w} week{w === 1 ? "" : "s"}
              </option>
            ))}
          </select>
        </div>
      </Card>
    );
  }

  function renderDraftMode() {
    return (
      <Card title="Draft mode" right={<Pill>Step 5</Pill>}>
        <div className="muted" style={{ marginBottom: 10 }}>
          Choose how individual challenges are drafted.
        </div>

        <div className="radioGrid">
          <label className={["radioCard", draftMode === "self" ? "active" : ""].join(" ")}>
            <input type="radio" name="draftMode" value="self" checked={draftMode === "self"} onChange={() => setDraftMode("self")} />
            <div className="radioTitle">Draft your own challenges</div>
            <div className="radioDesc muted">Each member selects their own challenge category.</div>
          </label>

          <label className={["radioCard", draftMode === "other" ? "active" : ""].join(" ")}>
            <input type="radio" name="draftMode" value="other" checked={draftMode === "other"} onChange={() => setDraftMode("other")} />
            <div className="radioTitle">Draft other members’ challenges</div>
            <div className="radioDesc muted">Members draft categories for someone else (more strategy + fun).</div>
          </label>
        </div>
      </Card>
    );
  }

  function renderReview() {
    return (
      <Card title="Review" right={<Pill>Step 6</Pill>}>
        <div className="reviewGrid">
          <div className="reviewItem">
            <div className="muted">League name</div>
            <div>{leagueName.trim()}</div>
          </div>

          <div className="reviewItem">
            <div className="muted">Members</div>
            <div>{membersCount}</div>
          </div>

          <div className="reviewItem">
            <div className="muted">Weeks</div>
            <div>{weeks}</div>
          </div>

          <div className="reviewItem">
            <div className="muted">Draft mode</div>
            <div>{draftMode === "self" ? "Draft your own challenges" : "Draft other members’ challenges"}</div>
          </div>
        </div>

        <div className="notice" style={{ marginTop: 14 }}>
          <strong>Important:</strong> Due to security + database constraints, only users who already have accounts can be inserted into the league right now.
          <br />
          In this brick, we’ll create the league + commissioner. Next brick will be “Invite / Join League” so your family members appear here automatically.
        </div>
      </Card>
    );
  }

  function renderActivate() {
    return (
      <Card title="Activate" right={<Pill>Step 7</Pill>}>
        <div className="notice">When you activate, we save this league setup and send you to the league home.</div>

        <div style={{ marginTop: 12 }}>
          <button className="btnPrimary" type="button" onClick={activateLeague} disabled={status.kind === "loading"}>
            Activate League
          </button>

          <button className="btnGhost" type="button" onClick={resetLeagueLocal} style={{ marginLeft: 10 }}>
            Reset League (run wizard again)
          </button>
        </div>

        {status.kind === "error" ? <div className="helper errorText" style={{ marginTop: 10 }}>{status.msg}</div> : null}
        {status.kind === "success" ? <div className="helper" style={{ marginTop: 10 }}>{status.msg}</div> : null}
      </Card>
    );
  }

  function renderStep() {
    switch (stepKey) {
      case "basics":
        return renderBasics();
      case "familySize":
        return renderFamilySize();
      case "members":
        return renderMembers();
      case "weeks":
        return renderWeeks();
      case "draftMode":
        return renderDraftMode();
      case "review":
        return renderReview();
      case "activate":
        return renderActivate();
      default:
        return renderBasics();
    }
  }

  const nextEnabled = useMemo(() => {
    if (stepKey === "basics") return canGoNextFromBasics();
    if (stepKey === "familySize") return canGoNextFromFamilySize();
    if (stepKey === "members") return canGoNextFromMembers();
    if (stepKey === "weeks") return canGoNextFromWeeks();
    if (stepKey === "draftMode") return canGoNextFromDraftMode();
    if (stepKey === "review") return true;
    if (stepKey === "activate") return false;
    return false;
  }, [stepKey, leagueName, membersCount, members, weeks, draftMode, commissioner]);

  const showBack = stepKey !== "basics";
  const showNext = stepKey !== "activate";

  return (
    <div className="pageWrap">
      <div className="wizardTop">
        <StepPills currentKey={stepKey} />
      </div>

      {renderStep()}

      <div className="wizardNav">
        <div>
          <button className="btnGhost" type="button" onClick={() => nav("/home")} title="Leave setup">
            Cancel
          </button>
        </div>

        <div className="wizardNavRight">
          {showBack ? (
            <button className="btnGhost" type="button" onClick={goBack}>
              Back
            </button>
          ) : null}

          {showNext ? (
            <button className="btnPrimary" type="button" onClick={goNext} disabled={!nextEnabled}>
              Next
            </button>
          ) : null}
        </div>
      </div>

      {status.kind === "error" ? <div className="helper errorText" style={{ marginTop: 10 }}>{status.msg}</div> : null}
    </div>
  );
}
