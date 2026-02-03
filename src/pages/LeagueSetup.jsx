import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

/**
 * Thrive Leagues — League Setup Wizard (Brick)
 * - Local storage only for now (system-first, wiring later)
 */

const LS_KEY = "tl_league";

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

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function cleanStr(v) {
  return String(v || "").trim();
}

function emailToPrettyName(email) {
  const e = cleanStr(email);
  if (!e.includes("@")) return "";
  const left = e.split("@")[0] || "";
  if (!left) return "";
  return left
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function clampInt(n, min, max, fallback) {
  const x = Number.parseInt(String(n), 10);
  if (Number.isNaN(x)) return fallback;
  return Math.min(max, Math.max(min, x));
}

export default function LeagueSetup() {
  const nav = useNavigate();
  const location = useLocation();

  // Wizard steps
  const steps = ["Basics", "Family Size", "Members", "Weeks", "Draft Mode", "Review", "Activate"];
  const [stepIndex, setStepIndex] = useState(0);

  // Session / commissioner info
  const [ready, setReady] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Basics
  const [leagueName, setLeagueName] = useState("Family League");

  // Family size (dropdown 3–12)
  const [memberCount, setMemberCount] = useState(4);

  // Members array always includes commissioner first
  const [members, setMembers] = useState([]);

  // Weeks (dropdown 3–12)
  const [weeks, setWeeks] = useState(3);

  // Draft mode
  // "self" => draft your own challenges
  // "others" => draft challenges for others
  const [draftMode, setDraftMode] = useState("self");

  // UI Status
  const [status, setStatus] = useState({ kind: "idle", msg: "" });

  // Options
  const memberOptions = useMemo(() => Array.from({ length: 10 }, (_, i) => i + 3), []);
  const weekOptions = useMemo(() => Array.from({ length: 10 }, (_, i) => i + 3), []);

  // Load session and initialize commissioner row
  useEffect(() => {
    let ignore = false;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (ignore) return;

      const session = data?.session || null;
      const email = session?.user?.email || "";
      setUserEmail(email);

      const commissionerName = emailToPrettyName(email) || "Commissioner";

      setMembers([
        {
          id: "commissioner",
          role: "commissioner",
          name: commissionerName,
          email,
          isLeagueManager: true, // commissioner always LM
        },
      ]);

      setReady(true);
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      const email = s?.user?.email || "";
      setUserEmail(email);

      setMembers((prev) => {
        const commissionerName = emailToPrettyName(email) || "Commissioner";

        // ensure commissioner row exists + stays synced
        const hasCommissioner = prev.some((m) => m.role === "commissioner");
        if (!hasCommissioner) {
          return [
            {
              id: "commissioner",
              role: "commissioner",
              name: commissionerName,
              email,
              isLeagueManager: true,
            },
          ];
        }

        return prev.map((m) => {
          if (m.role !== "commissioner") return m;
          return {
            ...m,
            email,
            isLeagueManager: true,
            // keep name unless blank
            name: cleanStr(m.name) ? m.name : commissionerName,
          };
        });
      });
    });

    return () => {
      ignore = true;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // Keep members array length synced with memberCount (commissioner + (memberCount-1))
  useEffect(() => {
    if (!ready) return;

    setMembers((prev) => {
      const commissioner =
        prev.find((m) => m.role === "commissioner") || {
          id: "commissioner",
          role: "commissioner",
          name: emailToPrettyName(userEmail) || "Commissioner",
          email: userEmail,
          isLeagueManager: true,
        };

      const others = prev.filter((m) => m.role !== "commissioner");
      const desiredOthers = Math.max(0, memberCount - 1);

      let nextOthers = [...others];

      if (nextOthers.length > desiredOthers) {
        nextOthers = nextOthers.slice(0, desiredOthers);
      }

      while (nextOthers.length < desiredOthers) {
        nextOthers.push({
          id: makeId(),
          role: "member",
          name: "",
          email: "",
          isLeagueManager: false,
        });
      }

      return [commissioner, ...nextOthers];
    });
  }, [memberCount, ready, userEmail]);

  const commissioner = useMemo(
    () => members.find((m) => m.role === "commissioner"),
    [members]
  );
  const membersOnly = useMemo(
    () => members.filter((m) => m.role !== "commissioner"),
    [members]
  );

  function cancel() {
    const from = location.state?.from || "/home";
    nav(from);
  }

  function goBack() {
    setStatus({ kind: "idle", msg: "" });
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function validateMembersStep() {
    // names required
    const missingName = members.some((m) => !cleanStr(m.name));
    if (missingName) {
      return "Please enter a name for each member.";
    }

    // LM requires email
    const invalidLM = members.some((m) => m.isLeagueManager && !cleanStr(m.email));
    if (invalidLM) {
      return "League Managers must have an email address.";
    }

    return "";
  }

  function goNext() {
    setStatus({ kind: "idle", msg: "" });

    // step validations
    if (stepIndex === 0) {
      if (!cleanStr(leagueName)) {
        setStatus({ kind: "error", msg: "Please enter a league name." });
        return;
      }
      setLeagueName(cleanStr(leagueName));
    }

    if (stepIndex === 2) {
      const err = validateMembersStep();
      if (err) {
        setStatus({ kind: "error", msg: err });
        return;
      }
    }

    setStepIndex((i) => Math.min(steps.length - 1, i + 1));
  }

  function saveLeagueConfig() {
    const payload = {
      leagueName: cleanStr(leagueName),
      memberCount,
      weeks,
      draftMode,
      members: members.map((m) => ({
        id: m.id,
        role: m.role,
        name: cleanStr(m.name),
        email: cleanStr(m.email),
        isLeagueManager: !!m.isLeagueManager,
      })),
      createdAt: new Date().toISOString(),
      version: 1,
    };

    localStorage.setItem(LS_KEY, JSON.stringify(payload));
  }

  function activate() {
    setStatus({ kind: "idle", msg: "" });

    if (!cleanStr(leagueName)) {
      setStatus({ kind: "error", msg: "League name is required." });
      setStepIndex(0);
      return;
    }

    if (memberCount < 3 || memberCount > 12) {
      setStatus({ kind: "error", msg: "Family size must be between 3 and 12." });
      setStepIndex(1);
      return;
    }

    if (weeks < 3 || weeks > 12) {
      setStatus({ kind: "error", msg: "Weeks must be between 3 and 12." });
      setStepIndex(3);
      return;
    }

    const err = validateMembersStep();
    if (err) {
      setStatus({ kind: "error", msg: err });
      setStepIndex(2);
      return;
    }

    saveLeagueConfig();
    nav("/home");
  }

  function StepNav() {
    return (
      <div className="tlWizardNav">
        {steps.map((s, idx) => {
          const done = idx < stepIndex;
          const active = idx === stepIndex;
          return (
            <div
              key={s}
              className={[
                "tlWizardStep",
                done ? "done" : "",
                active ? "active" : "",
              ].join(" ")}
            >
              <span className="dot" />
              <span>{s}</span>
            </div>
          );
        })}
      </div>
    );
  }

  function Basics() {
    return (
      <Card title="League basics" right={<Pill>Step 1</Pill>}>
        <div className="muted" style={{ marginBottom: 10 }}>
          Start with a league name. This will appear on your league home.
        </div>

        <label className="label">League name</label>
        <input
          className="input"
          value={leagueName}
          onChange={(e) => setLeagueName(e.target.value)}
          placeholder="Example: Family League"
        />
        <div className="helper muted">Tip: keep it simple. You can rename later.</div>
      </Card>
    );
  }

  function FamilySize() {
    return (
      <Card title="Family size" right={<Pill>Step 2</Pill>}>
        <div className="muted" style={{ marginBottom: 10 }}>
          How many members will be in this league? (3–12)
        </div>

        <label className="label">Members</label>
        <select
          className="select"
          value={memberCount}
          onChange={(e) => setMemberCount(clampInt(e.target.value, 3, 12, 4))}
        >
          {memberOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <div className="helper muted">We’ll set up your member list next.</div>
      </Card>
    );
  }

  function Members() {
    return (
      <Card title="Add members" right={<Pill>Step 3</Pill>}>
        <div className="muted" style={{ marginBottom: 10 }}>
          Names are required. Emails are optional — <strong>except</strong> League Managers (LM) must have an email.
        </div>

        <div className="tlMembersHeader">
          <div className="muted">Member</div>
          <div className="muted">Name (required)</div>
          <div className="muted">Email (optional)</div>
          <div className="muted" style={{ textAlign: "right" }}>
            League manager
          </div>
        </div>

        {/* Commissioner row */}
        <div className="tlMemberRow commissioner">
          <div className="memberLabel">
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
            <div className="helper muted">Commissioner email is pulled from your login.</div>
          </div>

          <div className="lmCell">
            <label className="toggleWrap" title="Commissioner is always a League Manager">
              <input type="checkbox" checked readOnly />
              <span className="toggle" />
            </label>
            <div className="helper muted lmHelp">
              League managers can score matchups and <strong>enter points for everyone</strong>.
            </div>
          </div>
        </div>

        {/* Other members */}
        {membersOnly.map((m, idx) => {
          const label = `Member ${idx + 2}`;
          const hasEmail = !!cleanStr(m.email);
          const lmDisabled = !hasEmail;

          return (
            <div key={m.id} className="tlMemberRow">
              <div className="memberLabel">{label}</div>

              <div>
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

              <div>
                <input
                  className="input"
                  value={m.email}
                  onChange={(e) => {
                    const v = e.target.value;
                    setMembers((prev) =>
                      prev.map((x) => (x.id === m.id ? { ...x, email: v } : x))
                    );
                  }}
                  placeholder="Email (optional)"
                />
                {m.isLeagueManager && !hasEmail ? (
                  <div className="helper tlErrorText">
                    Add an email to grant league manager permissions.
                  </div>
                ) : null}
              </div>

              <div className="lmCell">
                <label
                  className={["toggleWrap", lmDisabled ? "disabled" : ""].join(" ")}
                  title={
                    lmDisabled
                      ? "Add an email address to enable League Manager."
                      : "League Managers can score matchups and enter points for everyone."
                  }
                >
                  <input
                    type="checkbox"
                    checked={!!m.isLeagueManager}
                    disabled={lmDisabled}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setMembers((prev) =>
                        prev.map((x) =>
                          x.id === m.id ? { ...x, isLeagueManager: checked } : x
                        )
                      );
                    }}
                  />
                  <span className="toggle" />
                </label>

                <div className="helper muted lmHelp">
                  League managers can score matchups and <strong>enter points for everyone</strong>.
                </div>
              </div>
            </div>
          );
        })}
      </Card>
    );
  }

  function Weeks() {
    return (
      <Card title="Weeks" right={<Pill>Step 4</Pill>}>
        <div className="muted" style={{ marginBottom: 10 }}>
          How many weeks will this league run? (3–12)
        </div>

        <label className="label">Weeks</label>
        <select
          className="select"
          value={weeks}
          onChange={(e) => setWeeks(clampInt(e.target.value, 3, 12, 3))}
        >
          {weekOptions.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <div className="helper muted">
          (Pricing/free eligibility will be wired later. This brick just captures setup info.)
        </div>
      </Card>
    );
  }

  function DraftMode() {
    return (
      <Card title="Draft mode" right={<Pill>Step 5</Pill>}>
        <div className="muted" style={{ marginBottom: 12 }}>
          Choose how challenges are drafted.
        </div>

        <div className="tlRadioGrid">
          <label className={["tlRadioCard", draftMode === "self" ? "active" : ""].join(" ")}>
            <input
              type="radio"
              name="draftMode"
              value="self"
              checked={draftMode === "self"}
              onChange={() => setDraftMode("self")}
            />
            <div className="tlRadioTitle">Draft your own challenges</div>
            <div className="muted">Each person drafts the challenges they will complete.</div>
          </label>

          <label className={["tlRadioCard", draftMode === "others" ? "active" : ""].join(" ")}>
            <input
              type="radio"
              name="draftMode"
              value="others"
              checked={draftMode === "others"}
              onChange={() => setDraftMode("others")}
            />
            <div className="tlRadioTitle">Draft challenges for others</div>
            <div className="muted">Members draft challenges that other members must complete.</div>
          </label>
        </div>
      </Card>
    );
  }

  function Review() {
    return (
      <Card title="Review" right={<Pill>Step 6</Pill>}>
        <div className="tlReviewGrid">
          <div className="tlReviewItem">
            <div className="muted">League name</div>
            <div className="tlReviewValue">{cleanStr(leagueName)}</div>
          </div>
          <div className="tlReviewItem">
            <div className="muted">Members</div>
            <div className="tlReviewValue">{memberCount}</div>
          </div>
          <div className="tlReviewItem">
            <div className="muted">Weeks</div>
            <div className="tlReviewValue">{weeks}</div>
          </div>
          <div className="tlReviewItem">
            <div className="muted">Draft mode</div>
            <div className="tlReviewValue">{draftMode === "self" ? "Draft your own" : "Draft for others"}</div>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div className="muted" style={{ marginBottom: 8 }}>
            Members
          </div>
          <div className="tlReviewMembers">
            {members.map((m) => (
              <div key={m.id} className="tlReviewMemberRow">
                <div className="tlReviewMemberName">
                  {m.role === "commissioner" ? "Commissioner: " : ""}
                  {cleanStr(m.name) || "—"}
                </div>
                <div className="muted">{cleanStr(m.email) || "—"}</div>
                <div className="muted">{m.isLeagueManager ? "LM" : ""}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  function Activate() {
    return (
      <Card title="Activate" right={<Pill>Step 7</Pill>}>
        <div className="muted" style={{ marginBottom: 12 }}>
          This will save your league setup and take you to the league home.
        </div>

        <button className="btnPrimary" type="button" onClick={activate}>
          Activate league
        </button>

        <div className="helper muted" style={{ marginTop: 10 }}>
          (This brick writes setup into localStorage. We’ll wire persistence/payments later.)
        </div>
      </Card>
    );
  }

  function renderBody() {
    if (!ready) return null;

    switch (stepIndex) {
      case 0:
        return <Basics />;
      case 1:
        return <FamilySize />;
      case 2:
        return <Members />;
      case 3:
        return <Weeks />;
      case 4:
        return <DraftMode />;
      case 5:
        return <Review />;
      case 6:
        return <Activate />;
      default:
        return <Basics />;
    }
  }

  return (
    <div className="pageWrap">
      {/* Scoped style to fix formatting without requiring you to edit CSS files */}
      <style>{`
        .tlWizardWrap {
          max-width: 1100px;
          margin: 0 auto;
        }

        .tlWizardNav {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 12px;
        }

        .tlWizardStep {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(0,0,0,0.18);
          font-size: 13px;
        }
        .tlWizardStep .dot {
          width: 8px; height: 8px; border-radius: 999px;
          background: rgba(255,255,255,0.35);
        }
        .tlWizardStep.active {
          border-color: rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.06);
        }
        .tlWizardStep.done .dot {
          background: rgba(60,220,140,0.9);
        }

        .tlErrorBanner {
          padding: 10px 12px;
          border-radius: 12px;
          margin-bottom: 12px;
          border: 1px solid rgba(255,120,120,0.35);
          background: rgba(255,80,80,0.10);
        }
        .tlErrorText { color: rgba(255,140,140,0.95); }

        .select {
          width: 240px;
          max-width: 100%;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(0,0,0,0.18);
          color: inherit;
        }

        /* Member grid fixes: email next to name + not pushed down */
        .tlMembersHeader {
          display: grid;
          grid-template-columns: 160px 1fr 1fr 240px;
          gap: 12px;
          align-items: end;
          margin-bottom: 8px;
        }

        .tlMemberRow {
          display: grid;
          grid-template-columns: 160px 1fr 1fr 240px;
          gap: 12px;
          align-items: start;
          padding: 10px 0;
          border-top: 1px solid rgba(255,255,255,0.06);
        }

        .tlMemberRow.commissioner {
          border-top: none;
          padding-top: 0;
        }

        .memberLabel {
          font-weight: 800;
          line-height: 1.2;
          padding-top: 8px;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 12px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.06);
        }

        /* LM toggle + explanation */
        .lmCell {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 6px;
          padding-top: 2px;
        }
        .lmHelp {
          max-width: 240px;
          text-align: right;
          line-height: 1.25;
        }

        .toggleWrap {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          user-select: none;
        }
        .toggleWrap.disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
        .toggleWrap input { display: none; }
        .toggle {
          width: 44px;
          height: 24px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(255,255,255,0.08);
          position: relative;
        }
        .toggle::after {
          content: "";
          width: 18px; height: 18px;
          border-radius: 999px;
          background: rgba(255,255,255,0.85);
          position: absolute;
          left: 3px; top: 2px;
          transition: transform 160ms ease;
        }
        .toggleWrap input:checked + .toggle {
          background: rgba(60,220,140,0.22);
          border-color: rgba(60,220,140,0.35);
        }
        .toggleWrap input:checked + .toggle::after {
          transform: translateX(20px);
        }

        /* Draft mode cards */
        .tlRadioGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .tlRadioCard {
          display: block;
          border-radius: 14px;
          padding: 12px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(0,0,0,0.18);
          cursor: pointer;
        }
        .tlRadioCard.active {
          border-color: rgba(255,255,255,0.22);
          background: rgba(255,255,255,0.06);
        }
        .tlRadioCard input { display: none; }
        .tlRadioTitle { font-weight: 900; margin-bottom: 6px; }

        /* Review layout */
        .tlReviewGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        .tlReviewItem {
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(0,0,0,0.16);
        }
        .tlReviewValue { font-weight: 900; margin-top: 2px; }

        .tlReviewMembers { display: flex; flex-direction: column; gap: 8px; }
        .tlReviewMemberRow {
          display: grid;
          grid-template-columns: 1fr 1fr 60px;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(0,0,0,0.14);
        }
        .tlReviewMemberName { font-weight: 800; }

        @media (max-width: 900px) {
          .tlMembersHeader { display: none; }
          .tlMemberRow { grid-template-columns: 1fr; gap: 8px; }
          .lmCell { align-items: flex-start; }
          .lmHelp { max-width: none; text-align: left; }
          .tlRadioGrid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="tlWizardWrap">
        <StepNav />

        {status.kind === "error" ? (
          <div className="tlErrorBanner">{status.msg}</div>
        ) : null}

        {renderBody()}

        <div className="wizardActions">
          <button
            className="btnGhost"
            type="button"
            onClick={stepIndex === 0 ? cancel : goBack}
          >
            {stepIndex === 0 ? "Cancel" : "Back"}
          </button>

          {stepIndex < steps.length - 1 ? (
            <button className="btnPrimary" type="button" onClick={goNext}>
              Next
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
