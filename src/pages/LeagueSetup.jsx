import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
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

function clampInt(n, min, max, fallback) {
  const x = Number.parseInt(String(n), 10);
  if (Number.isNaN(x)) return fallback;
  return Math.min(max, Math.max(min, x));
}

function emailToName(email) {
  if (!email) return "";
  const left = String(email).split("@")[0] || "";
  if (!left) return "";
  // simple prettify: "jesse.dummar" -> "Jesse Dummar"
  return left
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

// localStorage key for this “brick”
const LS_KEY = "tl_league";

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------
export default function LeagueSetup() {
  const nav = useNavigate();
  const location = useLocation();

  // session + commissioner info
  const [ready, setReady] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // wizard steps
  const steps = ["Basics", "Family Size", "Members", "Weeks", "Draft Mode", "Review", "Activate"];
  const [stepIndex, setStepIndex] = useState(0);

  // basics
  const [leagueName, setLeagueName] = useState("Family League");

  // size
  const [memberCount, setMemberCount] = useState(4);

  // members
  const [members, setMembers] = useState([]);

  // weeks
  const [weeks, setWeeks] = useState(3);

  // draft mode
  // "self" = draft your own challenges, "others" = draft for others
  const [draftMode, setDraftMode] = useState("self");

  // status / errors
  const [status, setStatus] = useState({ kind: "idle", msg: "" });

  // ----------------------------------------------------------
  // Load session + init commissioner
  // ----------------------------------------------------------
  useEffect(() => {
    let ignore = false;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (ignore) return;

      const session = data?.session || null;
      const email = session?.user?.email || "";
      setUserEmail(email);
      setReady(true);

      // Initialize members with commissioner row
      const commissionerName = emailToName(email) || "Commissioner";
      setMembers([
        {
          id: "commissioner",
          role: "commissioner",
          name: commissionerName,
          email: email, // pulled from login
          isLeagueManager: true, // commissioner always LM
        },
      ]);
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      const email = s?.user?.email || "";
      setUserEmail(email);

      // Keep commissioner email synced
      setMembers((prev) => {
        const hasCommissioner = prev.some((m) => m.role === "commissioner");
        const commissionerName = emailToName(email) || "Commissioner";

        if (!hasCommissioner) {
          return [
            {
              id: "commissioner",
              role: "commissioner",
              name: commissionerName,
              email: email,
              isLeagueManager: true,
            },
          ];
        }

        return prev.map((m) => {
          if (m.role !== "commissioner") return m;
          return {
            ...m,
            name: m.name || commissionerName,
            email: email,
            isLeagueManager: true,
          };
        });
      });
    });

    return () => {
      ignore = true;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  // Keep memberCount synced with members array (excluding commissioner)
  useEffect(() => {
    if (!ready) return;

    setMembers((prev) => {
      const commissioner = prev.find((m) => m.role === "commissioner") || {
        id: "commissioner",
        role: "commissioner",
        name: emailToName(userEmail) || "Commissioner",
        email: userEmail,
        isLeagueManager: true,
      };

      const others = prev.filter((m) => m.role !== "commissioner");
      const desiredOthers = Math.max(0, memberCount - 1);

      // add or remove other members to match desired count
      if (others.length === desiredOthers) return prev;

      let nextOthers = [...others];

      // trim
      if (nextOthers.length > desiredOthers) {
        nextOthers = nextOthers.slice(0, desiredOthers);
      }

      // add
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

  // ----------------------------------------------------------
  // Navigation helpers
  // ----------------------------------------------------------
  function goNext() {
    setStatus({ kind: "idle", msg: "" });

    // validation per step
    if (stepIndex === 0) {
      const clean = leagueName.trim();
      if (!clean) {
        setStatus({ kind: "error", msg: "Please enter a league name." });
        return;
      }
      setLeagueName(clean);
    }

    if (stepIndex === 2) {
      // members validation: names required
      const bad = members.some((m) => !String(m.name || "").trim());
      if (bad) {
        setStatus({ kind: "error", msg: "Please enter a name for each member." });
        return;
      }

      // LM rule: if LM is checked, must have email
      const invalidLM = members.some((m) => {
        if (!m.isLeagueManager) return false;
        const email = String(m.email || "").trim();
        return !email;
      });

      if (invalidLM) {
        setStatus({
          kind: "error",
          msg: "League Managers must have an email address.",
        });
        return;
      }
    }

    setStepIndex((i) => Math.min(steps.length - 1, i + 1));
  }

  function goBack() {
    setStatus({ kind: "idle", msg: "" });
    setStepIndex((i) => Math.max(0, i - 1));
  }

  function cancel() {
    // back to where they came from, or home
    const from = location.state?.from || "/home";
    nav(from);
  }

  // ----------------------------------------------------------
  // Save League config (local “brick”)
  // ----------------------------------------------------------
  function saveLeagueConfig() {
    const payload = {
      leagueName: leagueName.trim(),
      memberCount,
      weeks,
      draftMode,
      members: members.map((m) => ({
        id: m.id,
        role: m.role,
        name: String(m.name || "").trim(),
        email: String(m.email || "").trim(),
        isLeagueManager: !!m.isLeagueManager,
      })),
      createdAt: new Date().toISOString(),
      version: 1,
    };

    localStorage.setItem(LS_KEY, JSON.stringify(payload));
  }

  function activate() {
    setStatus({ kind: "idle", msg: "" });

    // final validation
    if (!leagueName.trim()) {
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
    const missingName = members.some((m) => !String(m.name || "").trim());
    if (missingName) {
      setStatus({ kind: "error", msg: "Please enter a name for each member." });
      setStepIndex(2);
      return;
    }

    const invalidLM = members.some((m) => m.isLeagueManager && !String(m.email || "").trim());
    if (invalidLM) {
      setStatus({
        kind: "error",
        msg: "League Managers must have an email address.",
      });
      setStepIndex(2);
      return;
    }

    saveLeagueConfig();

    // send them into the app
    nav("/home");
  }

  // ----------------------------------------------------------
  // UI pieces
  // ----------------------------------------------------------
  function renderStepNav() {
    return (
      <div className="wizardNav">
        {steps.map((s, idx) => {
          const done = idx < stepIndex;
          const active = idx === stepIndex;
          return (
            <div
              key={s}
              className={[
                "wizardStep",
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

  function renderBasics() {
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

  function renderFamilySize() {
    const options = Array.from({ length: 10 }, (_, i) => i + 3); // 3..12
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
          {options.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <div className="helper muted">We’ll set up your member list next.</div>
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

        <div className="membersGrid">
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
                    prev.map((m) => (m.role === "commissioner" ? { ...m, name: v } : m))
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
                          prev.map((x) => (x.id === m.id ? { ...x, isLeagueManager: checked } : x))
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
        </div>
      </Card>
    );
  }

  function renderWeeks() {
    const options = Array.from({ length: 10 }, (_, i) => i + 3); // 3..12

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
          {options.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>

        <div className="helper muted">
          (We’ll wire pricing/eligibility later. This brick only captures the setup info.)
        </div>
      </Card>
    );
  }

  function renderDraftMode() {
    return (
      <Card title="Draft mode" right={<Pill>Step 5</Pill>}>
        <div className="muted" style={{ marginBottom: 12 }}>
          Choose how challenges are drafted.
        </div>

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
            <div className="radioBody muted">
              Each person drafts the challenges they will complete.
            </div>
          </label>

          <label className={["radioCard", draftMode === "others" ? "active" : ""].join(" ")}>
            <input
              type="radio"
              name="draftMode"
              value="others"
              checked={draftMode === "others"}
              onChange={() => setDraftMode("others")}
            />
            <div className="radioTitle">Draft challenges for others</div>
            <div className="radioBody muted">
              Members draft challenges that other members must complete.
            </div>
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
            <div className="reviewValue">{leagueName}</div>
          </div>
          <div className="reviewItem">
            <div className="muted">Members</div>
            <div className="reviewValue">{memberCount}</div>
          </div>
          <div className="reviewItem">
            <div className="muted">Weeks</div>
            <div className="reviewValue">{weeks}</div>
          </div>
          <div className="reviewItem">
            <div className="muted">Draft mode</div>
            <div className="reviewValue">{draftMode === "self" ? "Draft your own" : "Draft for others"}</div>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div className="muted" style={{ marginBottom: 8 }}>
            Members
          </div>
          <div className="reviewMembers">
            {members.map((m) => (
              <div key={m.id} className="reviewMemberRow">
                <div className="reviewMemberName">
                  {m.role === "commissioner" ? "Commissioner: " : ""}
                  {m.name}
                </div>
                <div className="muted">{m.email ? m.email : "—"}</div>
                <div className="muted">{m.isLeagueManager ? "LM" : ""}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  function renderActivate() {
    return (
      <Card title="Activate" right={<Pill>Step 7</Pill>}>
        <div className="muted" style={{ marginBottom: 12 }}>
          This will save your league setup and take you to the league home.
        </div>

        <button className="btnPrimary" type="button" onClick={activate}>
          Activate league
        </button>

        <div className="helper muted" style={{ marginTop: 10 }}>
          (This brick writes setup into localStorage. We’ll wire persistence and payments later.)
        </div>
      </Card>
    );
  }

  function renderBody() {
    if (!ready) return null;

    switch (stepIndex) {
      case 0:
        return renderBasics();
      case 1:
        return renderFamilySize();
      case 2:
        return renderMembers();
      case 3:
        return renderWeeks();
      case 4:
        return renderDraftMode();
      case 5:
        return renderReview();
      case 6:
        return renderActivate();
      default:
        return renderBasics();
    }
  }

  return (
    <div className="pageWrap">
      <div className="wizardWrap">
        {renderStepNav()}

        {status.kind === "error" ? (
          <div className="errorBanner">{status.msg}</div>
        ) : null}

        {renderBody()}

        <div className="wizardActions">
          <button className="btnGhost" type="button" onClick={stepIndex === 0 ? cancel : goBack}>
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
