// src/pages/LeagueSetup.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { createLeagueWithGeneratedData } from "../lib/leagueService";
import { setActiveLeague } from "../lib/leagueStore";

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

/**
 * MEMBER MODEL (wizard)
 * We’ll store “LM wants login” as isLeagueManager.
 * - Commissioner ALWAYS LM and logged in
 * - Other LMs: must log in later => we require user_id before activation IF LM checked
 * - Non-LM members can be PIN-based => no user_id required
 */
export default function LeagueSetup() {
  const nav = useNavigate();
  const location = useLocation();

  const [session, setSession] = useState(null);
  const [status, setStatus] = useState({ kind: "idle", msg: "" });

  const [stepKey, setStepKey] = useState("basics");

  const [leagueName, setLeagueName] = useState("");
  const [membersCount, setMembersCount] = useState(4);
  const [weeks, setWeeks] = useState(3);
  const [draftMode, setDraftMode] = useState("self");

  // members: [{ id, role, name, email, isLeagueManager, username, pin, userId }]
  const [members, setMembers] = useState([]);

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
            userId: userId || m.userId || "",
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
        username: safeLocalPart(userEmail) || "commissioner",
        pin: "",
        userId: userId,
      });

      const extra = Math.max(
        0,
        clampInt(membersCount, MEMBERS_MIN, MEMBERS_MAX) - 1
      );
      for (let i = 0; i < extra; i++) {
        base.push({
          id: `m${i + 2}`,
          role: "member",
          name: "",
          email: "",
          isLeagueManager: false,
          username: "",
          pin: "",
          userId: "", // only needed if they are LM
        });
      }
      return base;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // Resize member list when membersCount changes (keep commissioner intact)
  useEffect(() => {
    setMembers((prev) => {
      if (!prev || prev.length === 0) return prev;

      const desired = clampInt(membersCount, MEMBERS_MIN, MEMBERS_MAX);
      const commissioner =
        prev.find((m) => m.role === "commissioner") || {
          id: "commissioner",
          role: "commissioner",
          name: safeLocalPart(userEmail) || "Commissioner",
          email: userEmail,
          isLeagueManager: true,
          username: safeLocalPart(userEmail) || "commissioner",
          pin: "",
          userId,
        };

      const existing = prev.filter((m) => m.role !== "commissioner");
      const need = Math.max(0, desired - 1);

      const nextMembers = existing.slice(0, need);
      while (nextMembers.length < need) {
        const idx = nextMembers.length + 2;
        nextMembers.push({
          id: `m${idx}`,
          role: "member",
          name: "",
          email: "",
          isLeagueManager: false,
          username: "",
          pin: "",
          userId: "",
        });
      }

      return [commissioner, ...nextMembers];
    });
  }, [membersCount, userEmail, userId]);

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

      // If they are LM, they MUST log in -> require email + userId
      if (m.isLeagueManager) {
        if (!(m.email || "").trim()) return false;
        if (!(m.userId || "").trim()) return false;
      }

      // Non-LM members must have either (username+pin) OR email (optional)
      // We’ll require username+pin to keep it simple and consistent.
      if (!m.isLeagueManager) {
        if (!(m.username || "").trim()) return false;
        if (!(m.pin || "").trim()) return false;
      }
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

  async function activateLeague() {
    setStatus({ kind: "loading", msg: "Activating league..." });

    try {
      if (!userId || !userEmail) {
        throw new Error("You must be logged in to activate a league.");
      }

      if (!canGoNextFromBasics()) throw new Error("League name is required.");
      if (!canGoNextFromFamilySize()) throw new Error("Member count is invalid.");
      if (!canGoNextFromMembers()) throw new Error("Member info is incomplete.");
      if (!canGoNextFromWeeks()) throw new Error("Weeks selection is invalid.");
      if (!canGoNextFromDraftMode()) throw new Error("Draft mode is invalid.");

      // Build members payload for leagueService
      const payloadMembers = members.map((m) => {
        const isCommissioner = m.role === "commissioner";
        const wantsLM = !!m.isLeagueManager || isCommissioner;

        return {
          display_name: (m.name || "").trim(),
          role: isCommissioner ? "commissioner" : "member",
          is_league_manager: wantsLM,

          // LM users must be authenticated and have a userId
          user_id: wantsLM ? (m.userId || "").trim() : null,

          // PIN-based members (non-LM)
          username: !wantsLM ? (m.username || "").trim() : safeLocalPart(m.email),
          pin: !wantsLM ? (m.pin || "").trim() : null,

          // optional
          email: (m.email || "").trim(),
        };
      });

      const { league } = await createLeagueWithGeneratedData({
        name: leagueName.trim(),
        commissionerEmail: userEmail,
        draftMode,
        weeks: clampInt(weeks, WEEKS_MIN, WEEKS_MAX),
        members: payloadMembers,
      });

      // ✅ Activation hook (so Home/Draft know what to load)
      setActiveLeague(league.id);

      setStatus({ kind: "success", msg: "League activated! Redirecting..." });
      nav("/home", { replace: true, state: { from: location.pathname } });
    } catch (e) {
      setStatus({ kind: "error", msg: e?.message || "Could not activate league." });
    }
  }

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
        </div>
      </Card>
    );
  }

  function renderFamilySize() {
    return (
      <Card title="Family size" right={<Pill>Step 2</Pill>}>
        <div className="field">
          <label className="label">How many members? (3–12)</label>
          <select
            className="input"
            value={membersCount}
            onChange={(e) =>
              setMembersCount(clampInt(e.target.value, MEMBERS_MIN, MEMBERS_MAX))
            }
          >
            {makeRange(MEMBERS_MIN, MEMBERS_MAX).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </Card>
    );
  }

  function renderMembers() {
    return (
      <Card title="Add members" right={<Pill>Step 3</Pill>}>
        <div className="muted" style={{ marginBottom: 10 }}>
          Rule: <strong>Commissioner + selected League Managers must log in</strong> (we store their auth user_id).
          Everyone else will use <strong>username + PIN</strong>.
        </div>

        {/* Commissioner */}
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
                setMembers((prev) =>
                  prev.map((m) =>
                    m.role === "commissioner" ? { ...m, name: v } : m
                  )
                );
              }}
              placeholder="Commissioner name"
            />
          </div>

          <div>
            <input className="input" value={userEmail} disabled />
            <div className="helper muted">Commissioner email is from login.</div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <label className="toggleWrap" title="Commissioner is always a League Manager">
              <input type="checkbox" checked readOnly />
              <span className="toggle" />
            </label>
          </div>
        </div>

        {/* Others */}
        {membersOnly.map((m, idx) => {
          const label = `Member ${idx + 2}`;

          return (
            <div key={m.id} className="card" style={{ marginTop: 12 }}>
              <div className="cardBody">
                <div className="membersRow">
                  <div className="memberTag">{label}</div>

                  <div>
                    <label className="label">Name (required)</label>
                    <input
                      className="input"
                      value={m.name}
                      onChange={(e) => {
                        const v = e.target.value;
                        setMembers((prev) =>
                          prev.map((x) => (x.id === m.id ? { ...x, name: v } : x))
                        );
                      }}
                      placeholder="Name"
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end", flexDirection: "column", alignItems: "flex-end" }}>
                    <label className="toggleWrap" title="League Managers must log in">
                      <input
                        type="checkbox"
                        checked={!!m.isLeagueManager}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setMembers((prev) =>
                            prev.map((x) =>
                              x.id === m.id
                                ? {
                                    ...x,
                                    isLeagueManager: checked,
                                    // when switching to LM, clear pin fields (they will log in)
                                    username: checked ? "" : x.username,
                                    pin: checked ? "" : x.pin,
                                  }
                                : x
                            )
                          );
                        }}
                      />
                      <span className="toggle" />
                    </label>
                    <div className="helper muted" style={{ textAlign: "right", maxWidth: 260 }}>
                      Check if this person should be a League Manager (must log in).
                    </div>
                  </div>
                </div>

                {m.isLeagueManager ? (
                  <div className="membersRow" style={{ marginTop: 10 }}>
                    <div className="memberTag muted">LM Login</div>

                    <div>
                      <label className="label">Email (required)</label>
                      <input
                        className="input"
                        value={m.email}
                        onChange={(e) => {
                          const v = e.target.value;
                          setMembers((prev) =>
                            prev.map((x) => (x.id === m.id ? { ...x, email: v } : x))
                          );
                        }}
                        placeholder="email@domain.com"
                      />
                      <div className="helper muted">
                        This LM must sign up / log in. Then paste their User ID below.
                      </div>
                    </div>

                    <div>
                      <label className="label">User ID (required)</label>
                      <input
                        className="input"
                        value={m.userId}
                        onChange={(e) => {
                          const v = e.target.value;
                          setMembers((prev) =>
                            prev.map((x) => (x.id === m.id ? { ...x, userId: v } : x))
                          );
                        }}
                        placeholder="Supabase auth user id (uuid)"
                      />
                      <div className="helper muted">
                        Get this from Supabase Auth → Users after they sign up.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="membersRow" style={{ marginTop: 10 }}>
                    <div className="memberTag muted">PIN Access</div>

                    <div>
                      <label className="label">Username (required)</label>
                      <input
                        className="input"
                        value={m.username}
                        onChange={(e) => {
                          const v = e.target.value;
                          setMembers((prev) =>
                            prev.map((x) => (x.id === m.id ? { ...x, username: v } : x))
                          );
                        }}
                        placeholder="Example: camden"
                      />
                    </div>

                    <div>
                      <label className="label">PIN (required)</label>
                      <input
                        className="input"
                        value={m.pin}
                        onChange={(e) => {
                          const v = e.target.value;
                          setMembers((prev) =>
                            prev.map((x) => (x.id === m.id ? { ...x, pin: v } : x))
                          );
                        }}
                        placeholder="4 digits (or simple code)"
                      />
                      <div className="helper muted">This is stored hashed.</div>
                    </div>
                  </div>
                )}
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
        <div className="field">
          <label className="label">How many weeks? (3–12)</label>
          <select
            className="input"
            value={weeks}
            onChange={(e) => setWeeks(clampInt(e.target.value, WEEKS_MIN, WEEKS_MAX))}
          >
            {makeRange(WEEKS_MIN, WEEKS_MAX).map((w) => (
              <option key={w} value={w}>
                {w} weeks
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
        <div className="radioGrid">
          <label className={["radioCard", draftMode === "self" ? "active" : ""].join(" ")}>
            <input
              type="radio"
              name="draftMode"
              value="self"
              checked={draftMode === "self"}
              onChange={() => setDraftMode("self")}
            />
            <div className="radioTitle">Draft your own challenges</div>
            <div className="radioDesc muted">Each person picks their own category.</div>
          </label>

          <label className={["radioCard", draftMode === "other" ? "active" : ""].join(" ")}>
            <input
              type="radio"
              name="draftMode"
              value="other"
              checked={draftMode === "other"}
              onChange={() => setDraftMode("other")}
            />
            <div className="radioTitle">Draft other members’ challenges</div>
            <div className="radioDesc muted">Family drafts categories for others.</div>
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
            <div>{draftMode}</div>
          </div>
        </div>

        <div className="notice" style={{ marginTop: 12 }}>
          Activation will:
          <ul style={{ marginTop: 8 }}>
            <li>Create league + members in Supabase</li>
            <li>Generate draft order + schedule ONCE and store them</li>
            <li>Set active league id locally so Home/Draft can load real data</li>
          </ul>
        </div>
      </Card>
    );
  }

  function renderActivate() {
    return (
      <Card title="Activate" right={<Pill>Step 7</Pill>}>
        <div className="notice">
          When you activate, we save this league setup and send you to the league home.
        </div>

        <div style={{ marginTop: 12 }}>
          <button
            className="btnPrimary"
            type="button"
            onClick={activateLeague}
            disabled={status.kind === "loading"}
          >
            Activate League
          </button>
        </div>

        {status.kind === "error" ? (
          <div className="helper errorText" style={{ marginTop: 10 }}>
            {status.msg}
          </div>
        ) : null}
        {status.kind === "success" ? (
          <div className="helper" style={{ marginTop: 10 }}>
            {status.msg}
          </div>
        ) : null}
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
    return false;
  }, [stepKey, leagueName, membersCount, members, weeks, draftMode]);

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

      {status.kind === "error" ? (
        <div className="helper errorText" style={{ marginTop: 10 }}>
          {status.msg}
        </div>
      ) : null}
    </div>
  );
}
