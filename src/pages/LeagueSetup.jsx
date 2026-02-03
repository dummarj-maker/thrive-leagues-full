// src/pages/LeagueSetup.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function StepPill({ active, done, children }) {
  const cls = ["stepPill"];
  if (active) cls.push("active");
  if (done) cls.push("done");
  return <div className={cls.join(" ")}>{children}</div>;
}

function Card({ title, subtitle, children }) {
  return (
    <section className="card">
      <div className="cardHeader">
        <div>
          <h3 className="cardTitle">{title}</h3>
          {subtitle ? <div className="muted" style={{ marginTop: 4 }}>{subtitle}</div> : null}
        </div>
      </div>
      <div className="cardBody">{children}</div>
    </section>
  );
}

function makeNiceNameFromEmail(email) {
  if (!email) return "";
  const left = email.split("@")[0] || "";
  const cleaned = left.replace(/[._-]+/g, " ").trim();
  if (!cleaned) return "";
  return cleaned
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function LeagueSetup() {
  const nav = useNavigate();

  // Wizard steps (keep simple & stable)
  const steps = useMemo(
    () => ["Basics", "Family Size", "Members", "Weeks", "Draft Mode", "Review", "Activate"],
    []
  );
  const [stepIdx, setStepIdx] = useState(0);

  // Commissioner (logged in user)
  const [commissionerEmail, setCommissionerEmail] = useState("");
  const [loadingUser, setLoadingUser] = useState(true);

  // Wizard data
  const [leagueName, setLeagueName] = useState("");
  const [familySize, setFamilySize] = useState(4);
  const [members, setMembers] = useState([]);
  const [weeks, setWeeks] = useState(6);
  const [draftMode, setDraftMode] = useState("self"); // "self" | "others"
  const [status, setStatus] = useState({ kind: "idle", msg: "" });

  // Fetch session user once (we are already behind RequireAuth)
  useEffect(() => {
    let ignore = false;

    async function run() {
      const { data, error } = await supabase.auth.getSession();
      if (ignore) return;

      if (error) {
        setStatus({ kind: "error", msg: "Could not read your login session." });
        setLoadingUser(false);
        return;
      }

      const email = (data?.session?.user?.email || "").toLowerCase().trim();
      setCommissionerEmail(email);
      setLoadingUser(false);
    }

    run();
    return () => {
      ignore = true;
    };
  }, []);

  // Initialize defaults once commissioner email is known
  useEffect(() => {
    if (loadingUser) return;

    // League name default (no "Dummar")
    if (!leagueName) setLeagueName("The Family League");

    // Members array: always sized to familySize, commissioner first
    setMembers((prev) => {
      const next = Array.from({ length: familySize }).map((_, idx) => {
        const existing = prev[idx] || {};
        if (idx === 0) {
          // Commissioner
          const fallbackName = makeNiceNameFromEmail(commissionerEmail) || existing.name || "";
          return {
            name: existing.name ?? fallbackName,
            email: commissionerEmail, // locked to commissioner email
            isCommissioner: true,
            isManager: existing.isManager ?? true, // commissioner default ON
          };
        }
        return {
          name: existing.name ?? "",
          email: existing.email ?? "",
          isCommissioner: false,
          isManager: existing.isManager ?? false,
        };
      });

      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingUser, commissionerEmail, familySize]);

  // Weeks rules:
  // - can be 3-12
  // - we won't enforce pricing here yet, but we will clamp and store
  useEffect(() => {
    setWeeks((w) => clamp(w, 3, 12));
  }, [familySize]);

  const canGoNext = useMemo(() => {
    const step = steps[stepIdx];

    if (step === "Basics") {
      return (leagueName || "").trim().length >= 2;
    }

    if (step === "Family Size") {
      return familySize >= 3 && familySize <= 12;
    }

    if (step === "Members") {
      // Commissioner must have email (from session)
      if (!commissionerEmail) return false;

      // Names required for all members
      for (const m of members) {
        if (!m?.name || !m.name.trim()) return false;
      }
      return true;
    }

    if (step === "Weeks") {
      return weeks >= 3 && weeks <= 12;
    }

    if (step === "Draft Mode") {
      return draftMode === "self" || draftMode === "others";
    }

    if (step === "Review") {
      return true;
    }

    if (step === "Activate") {
      return true;
    }

    return true;
  }, [steps, stepIdx, leagueName, familySize, members, weeks, draftMode, commissionerEmail]);

  function goNext() {
    setStatus({ kind: "idle", msg: "" });
    setStepIdx((i) => clamp(i + 1, 0, steps.length - 1));
  }

  function goBack() {
    setStatus({ kind: "idle", msg: "" });
    setStepIdx((i) => clamp(i - 1, 0, steps.length - 1));
  }

  function cancel() {
    // back to home (or login) - keep simple
    nav("/home");
  }

  function updateMember(idx, patch) {
    setMembers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };

      // Commissioner email should stay locked
      if (idx === 0) {
        next[idx].email = commissionerEmail;
        next[idx].isCommissioner = true;
      }
      return next;
    });
  }

  function activate() {
    setStatus({ kind: "loading", msg: "" });

    try {
      const payload = {
        leagueName: (leagueName || "").trim(),
        familySize,
        weeks,
        draftMode,
        members: members.map((m, idx) => ({
          name: (m.name || "").trim(),
          email: idx === 0 ? commissionerEmail : (m.email || "").trim(),
          isCommissioner: idx === 0,
          isManager: !!m.isManager,
        })),
        createdAt: new Date().toISOString(),
        version: 1,
      };

      localStorage.setItem("tl_league", JSON.stringify(payload));

      setStatus({ kind: "success", msg: "League saved! Loading your league..." });

      // Go to home (league gate will pass now)
      setTimeout(() => {
        nav("/home");
      }, 250);
    } catch (e) {
      setStatus({ kind: "error", msg: "Could not save league setup. Please try again." });
    }
  }

  const step = steps[stepIdx];

  if (loadingUser) {
    return (
      <div className="pageWrap">
        <Card title="Loading..." subtitle="Preparing your league setup wizard." />
      </div>
    );
  }

  return (
    <div className="pageWrap">
      <div className="wizardShell">
        <div className="wizardTop">
          <div className="wizardSteps">
            {steps.map((s, i) => (
              <StepPill key={s} active={i === stepIdx} done={i < stepIdx}>
                {i === stepIdx ? "👉 " : i < stepIdx ? "✅ " : "• "}
                {s}
              </StepPill>
            ))}
          </div>
        </div>

        {step === "Basics" ? (
          <Card
            title="League basics"
            subtitle="Start with a league name. This will appear on your league home."
          >
            <div className="field">
              <label className="label">League name</label>
              <input
                className="input"
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                placeholder="Example: The Family League"
              />
              <div className="muted" style={{ marginTop: 6 }}>
                Tip: keep it simple. You can rename later.
              </div>
            </div>
          </Card>
        ) : null}

        {step === "Family Size" ? (
          <Card
            title="Family size"
            subtitle="How many members will be in this league? (3–12)"
          >
            <div className="rowGrid">
              <div className="field">
                <label className="label">Members</label>
                <input
                  className="input"
                  type="number"
                  min={3}
                  max={12}
                  value={familySize}
                  onChange={(e) => setFamilySize(clamp(parseInt(e.target.value || "3", 10), 3, 12))}
                />
                <div className="muted" style={{ marginTop: 6 }}>
                  We’ll set up your member list next.
                </div>
              </div>

              <div className="hintBox">
                <div className="hintTitle">Free vs Paid (logic later)</div>
                <div className="muted">
                  We’ll wire pricing later. For now, this wizard supports 3–12 members.
                </div>
              </div>
            </div>
          </Card>
        ) : null}

        {step === "Members" ? (
          <Card
            title="Add members"
            subtitle="Names are required. Emails are optional (except the commissioner, which is already known)."
          >
            <div className="membersTable">
              <div className="membersHeader">
                <div className="mhCell">Member</div>
                <div className="mhCell">Name (required)</div>
                <div className="mhCell">Email (optional)</div>
                <div className="mhCell" style={{ textAlign: "center" }}>
                  League manager
                </div>
              </div>

              {members.map((m, idx) => {
                const isComm = idx === 0;
                return (
                  <div key={idx} className="membersRow">
                    <div className="mrCell">
                      <div className="memberTag">
                        Member {idx + 1}
                        {isComm ? <span className="tagPill">Commissioner</span> : null}
                      </div>
                    </div>

                    <div className="mrCell">
                      <input
                        className="input"
                        value={m.name}
                        onChange={(e) => updateMember(idx, { name: e.target.value })}
                        placeholder={isComm ? "Your name" : "Name"}
                      />
                    </div>

                    <div className="mrCell">
                      <input
                        className="input"
                        value={isComm ? commissionerEmail : m.email}
                        onChange={(e) => updateMember(idx, { email: e.target.value })}
                        placeholder={isComm ? "" : "Email (optional)"}
                        disabled={isComm}
                        title={isComm ? "Commissioner email comes from login" : ""}
                      />
                      {isComm ? (
                        <div className="muted" style={{ marginTop: 6 }}>
                          Commissioner email is pulled from your login.
                        </div>
                      ) : null}
                    </div>

                    <div className="mrCell" style={{ display: "flex", justifyContent: "center" }}>
                      <label className="toggle">
                        <input
                          type="checkbox"
                          checked={!!m.isManager}
                          onChange={(e) => updateMember(idx, { isManager: e.target.checked })}
                        />
                        <span className="togglePill" />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="muted" style={{ marginTop: 10 }}>
              League managers can score matchups (we’ll wire the permissions later).
            </div>
          </Card>
        ) : null}

        {step === "Weeks" ? (
          <Card
            title="League length"
            subtitle="Choose how many weeks this league will run. (3–12)"
          >
            <div className="field">
              <label className="label">Weeks</label>
              <input
                className="input"
                type="number"
                min={3}
                max={12}
                value={weeks}
                onChange={(e) => setWeeks(clamp(parseInt(e.target.value || "3", 10), 3, 12))}
              />
              <div className="muted" style={{ marginTop: 6 }}>
                We’ll connect this to pricing rules later.
              </div>
            </div>
          </Card>
        ) : null}

        {step === "Draft Mode" ? (
          <Card
            title="Draft mode"
            subtitle="How should challenges be drafted?"
          >
            <div className="radioGrid">
              <label className={`radioCard ${draftMode === "self" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="draftMode"
                  checked={draftMode === "self"}
                  onChange={() => setDraftMode("self")}
                />
                <div className="radioTitle">People draft their own challenges</div>
                <div className="muted">Each member selects their own category/challenge set.</div>
              </label>

              <label className={`radioCard ${draftMode === "others" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="draftMode"
                  checked={draftMode === "others"}
                  onChange={() => setDraftMode("others")}
                />
                <div className="radioTitle">People draft other members’ challenges</div>
                <div className="muted">Family members draft for each other (fun + accountability).</div>
              </label>
            </div>
          </Card>
        ) : null}

        {step === "Review" ? (
          <Card
            title="Review"
            subtitle="Confirm your league setup before activation."
          >
            <div className="reviewGrid">
              <div className="reviewItem">
                <div className="muted">League name</div>
                <div className="reviewValue">{leagueName}</div>
              </div>
              <div className="reviewItem">
                <div className="muted">Members</div>
                <div className="reviewValue">{familySize}</div>
              </div>
              <div className="reviewItem">
                <div className="muted">Weeks</div>
                <div className="reviewValue">{weeks}</div>
              </div>
              <div className="reviewItem">
                <div className="muted">Draft mode</div>
                <div className="reviewValue">{draftMode === "self" ? "Self draft" : "Draft for others"}</div>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="muted">Members</div>
              <div className="reviewMembers">
                {members.map((m, idx) => (
                  <div key={idx} className="reviewMember">
                    <div className="rmTop">
                      <span className="rmName">{m.name || `Member ${idx + 1}`}</span>
                      {idx === 0 ? <span className="tagPill">Commissioner</span> : null}
                      {m.isManager ? <span className="tagPill">Manager</span> : null}
                    </div>
                    <div className="muted">{idx === 0 ? commissionerEmail : (m.email || "No email")}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ) : null}

        {step === "Activate" ? (
          <Card
            title="Activate league"
            subtitle="This will save your league and take you into the app."
          >
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button className="btnPrimary" type="button" onClick={activate}>
                Activate League
              </button>
              <div className="muted">
                You can add pricing + payments after we lock this flow.
              </div>
            </div>

            {status.kind !== "idle" ? (
              <div
                className={`statusBox ${status.kind}`}
                style={{ marginTop: 12 }}
              >
                {status.msg || (status.kind === "loading" ? "Working..." : "")}
              </div>
            ) : null}
          </Card>
        ) : null}

        <div className="wizardFooter">
          <div>
            {stepIdx === 0 ? (
              <button className="btnGhost" type="button" onClick={cancel}>
                Cancel
              </button>
            ) : (
              <button className="btnGhost" type="button" onClick={goBack}>
                Back
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {status.kind === "error" ? (
              <div className="muted" style={{ color: "#ffb3b3" }}>
                {status.msg}
              </div>
            ) : null}

            {stepIdx < steps.length - 1 ? (
              <button className="btnPrimary" type="button" onClick={goNext} disabled={!canGoNext}>
                Next
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Minimal inline styles hooks (assumes your global css already exists). 
          If your CSS doesn't include these classnames, it will still function. */}
      <style>{`
        .wizardShell { display: grid; gap: 12; }
        .wizardSteps { display:flex; flex-wrap:wrap; gap:10px; align-items:center; }
        .stepPill { padding: 8px 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,.15); color: rgba(255,255,255,.75); font-size: 13px; }
        .stepPill.active { color: white; border-color: rgba(255,255,255,.35); }
        .stepPill.done { color: rgba(255,255,255,.9); }
        .wizardFooter { display:flex; justify-content:space-between; align-items:center; }
        .rowGrid { display:grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .hintBox { border: 1px solid rgba(255,255,255,.12); border-radius: 12px; padding: 12px; background: rgba(255,255,255,.04); }
        .hintTitle { font-weight: 700; margin-bottom: 6px; }
        .membersTable { display:grid; gap: 10px; }
        .membersHeader, .membersRow { display:grid; grid-template-columns: 120px 1fr 1fr 140px; gap: 10px; align-items:start; }
        .mhCell { font-size: 12px; color: rgba(255,255,255,.65); padding: 0 2px; }
        .memberTag { display:flex; align-items:center; gap:8px; }
        .tagPill { margin-left: 8px; font-size: 11px; padding: 2px 8px; border-radius: 999px; border: 1px solid rgba(255,255,255,.18); color: rgba(255,255,255,.9); }
        .toggle { position: relative; display:inline-flex; align-items:center; cursor:pointer; }
        .toggle input { display:none; }
        .togglePill { width: 44px; height: 24px; border-radius: 999px; border: 1px solid rgba(255,255,255,.18); background: rgba(255,255,255,.06); position: relative; }
        .togglePill:after { content:""; position:absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: rgba(255,255,255,.85); transition: all .18s ease; }
        .toggle input:checked + .togglePill { background: rgba(99, 211, 255, .25); border-color: rgba(99, 211, 255, .35); }
        .toggle input:checked + .togglePill:after { left: 22px; }
        .radioGrid { display:grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .radioCard { border: 1px solid rgba(255,255,255,.12); border-radius: 14px; padding: 12px; background: rgba(255,255,255,.04); display:grid; gap: 8px; cursor:pointer; }
        .radioCard.selected { border-color: rgba(99, 211, 255, .35); background: rgba(99, 211, 255, .08); }
        .radioCard input { width: 16px; height: 16px; }
        .radioTitle { font-weight: 700; }
        .reviewGrid { display:grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .reviewItem { border: 1px solid rgba(255,255,255,.12); border-radius: 12px; padding: 10px; background: rgba(255,255,255,.04); }
        .reviewValue { font-weight: 800; margin-top: 6px; }
        .reviewMembers { display:grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 8px; }
        .reviewMember { border: 1px solid rgba(255,255,255,.12); border-radius: 12px; padding: 10px; background: rgba(255,255,255,.04); }
        .rmTop { display:flex; gap: 8px; align-items:center; flex-wrap:wrap; }
        .rmName { font-weight: 800; }
        .statusBox { padding: 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,.15); background: rgba(255,255,255,.06); }
        .statusBox.error { border-color: rgba(255, 120, 120, .35); background: rgba(255, 120, 120, .10); }
        .statusBox.success { border-color: rgba(120, 255, 180, .35); background: rgba(120, 255, 180, .10); }
        @media (max-width: 900px) {
          .rowGrid { grid-template-columns: 1fr; }
          .radioGrid { grid-template-columns: 1fr; }
          .membersHeader, .membersRow { grid-template-columns: 90px 1fr 1fr 120px; }
          .reviewGrid { grid-template-columns: 1fr 1fr; }
          .reviewMembers { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
