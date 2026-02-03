import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

const LEAGUE_KEY = "tl_league";

function saveLeagueToLocalStorage(league) {
  localStorage.setItem(LEAGUE_KEY, JSON.stringify(league));
}

function buildDefaultMembers(size) {
  return Array.from({ length: size }).map((_, idx) => ({
    id: `m${idx + 1}`,
    name: "",
    email: "",
    role: idx < 2 ? "Parent" : "Kid",
  }));
}

function isValidEmail(email) {
  if (!email) return true; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function dollars(n) {
  return `$${Number(n || 0).toFixed(0)}`;
}

function StepHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 18, fontWeight: 900 }}>{title}</div>
      {subtitle ? (
        <div className="muted" style={{ marginTop: 4 }}>
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

function WizardShell({
  children,
  onBack,
  backLabel,
  onNext,
  nextLabel,
  disableNext,
}) {
  return (
    <div className="pageWrap">
      <div className="card" style={{ maxWidth: 980, margin: "0 auto" }}>
        <div className="cardBody">{children}</div>

        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "space-between",
            padding: "0 16px 16px",
          }}
        >
          <button
            className="btnGhost"
            type="button"
            onClick={onBack}
            disabled={!onBack}
            style={{ width: 140 }}
          >
            {backLabel || "Back"}
          </button>

          <button
            className="btnPrimary"
            type="button"
            onClick={onNext}
            disabled={!!disableNext}
            style={{ width: 180 }}
          >
            {nextLabel || "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LeagueSetup() {
  const nav = useNavigate();

  /**
   * Wizard steps (payment LAST)
   * 0 = League basics
   * 1 = Family size
   * 2 = Members
   * 3 = Weeks
   * 4 = Draft mode
   * 5 = Review
   * 6 = Activate (Free vs Paid + Payment)
   */
  const [step, setStep] = useState(0);

  // Step 0: basics
  const [leagueName, setLeagueName] = useState("");

  // Step 1: size
  const [familySize, setFamilySize] = useState(4);

  // Step 2: members
  const [members, setMembers] = useState(() => buildDefaultMembers(4));

  // Step 3: weeks (3-12)
  const [weeks, setWeeks] = useState(8);

  // Step 4: draft mode
  const [draftMode, setDraftMode] = useState("self"); // "self" | "others"

  // Step 6: plan selection + payment stub
  // Note: even if eligible for free, user can choose paid (no ads).
  const [selectedPlan, setSelectedPlan] = useState("auto"); // "auto" | "free" | "paid"
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState({ kind: "idle", msg: "" });

  // One-free-league-per-user flag (stored in Supabase auth user metadata)
  const [freeUsed, setFreeUsed] = useState(null); // null = loading, boolean when ready

  // General status
  const [status, setStatus] = useState({ kind: "idle", msg: "" });

  const totalCost = useMemo(() => {
    // $1 per week, flat
    return Number(weeks) * 1;
  }, [weeks]);

  const freeEligibleByConfig = useMemo(() => {
    // Free eligibility based on config only: weeks=3 and members 3-4
    return Number(weeks) === 3 && Number(familySize) >= 3 && Number(familySize) <= 4;
  }, [weeks, familySize]);

  const freeEligible = useMemo(() => {
    // Free eligible only if they haven't used the free league yet
    return freeEligibleByConfig && freeUsed === false;
  }, [freeEligibleByConfig, freeUsed]);

  const effectivePlan = useMemo(() => {
    // If user explicitly picks a plan, honor it (with rules enforcement)
    // Otherwise use auto:
    // - if eligible for free, default free
    // - else paid
    const auto = freeEligible ? "free" : "paid";

    if (selectedPlan === "auto") return auto;

    if (selectedPlan === "free") {
      // Only allow free if eligible
      return freeEligible ? "free" : "paid";
    }

    return "paid";
  }, [selectedPlan, freeEligible]);

  function syncMembersToSize(newSize) {
    setMembers((prev) => {
      const next = [...prev];

      if (next.length === newSize) return next;

      if (next.length < newSize) {
        const add = buildDefaultMembers(newSize).slice(next.length);
        return next.concat(add);
      }

      return next.slice(0, newSize);
    });
  }

  // Load user + freeUsed flag from Supabase auth metadata
  useEffect(() => {
    let ignore = false;

    async function loadFreeFlag() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;

        const meta = data?.user?.user_metadata || {};
        const used = !!meta.tl_free_used;

        if (!ignore) setFreeUsed(used);
      } catch (_e) {
        // If we can't read it, default to "unknown" -> we will block free until loaded.
        if (!ignore) setFreeUsed(false);
      }
    }

    loadFreeFlag();

    return () => {
      ignore = true;
    };
  }, []);

  const progress = useMemo(() => {
    const labels = [
      "Basics",
      "Family Size",
      "Members",
      "Weeks",
      "Draft Mode",
      "Review",
      "Activate",
    ];
    return labels.map((label, idx) => ({
      label,
      done: idx < step,
      active: idx === step,
    }));
  }, [step]);

  function goBack() {
    setStatus({ kind: "idle", msg: "" });
    setPaymentStatus({ kind: "idle", msg: "" });

    if (step <= 0) {
      nav("/home");
      return;
    }

    setStep((s) => Math.max(0, s - 1));
  }

  function goNext() {
    setStatus({ kind: "idle", msg: "" });
    setPaymentStatus({ kind: "idle", msg: "" });

    // Step 0: basics
    if (step === 0) {
      const name = (leagueName || "").trim();
      if (!name) {
        setStatus({ kind: "error", msg: "Please enter a league name." });
        return;
      }
      setLeagueName(name);
      setStep(1);
      return;
    }

    // Step 1: family size
    if (step === 1) {
      const size = Number(familySize);
      if (Number.isNaN(size) || size < 3 || size > 12) {
        setStatus({ kind: "error", msg: "Family size must be between 3 and 12." });
        return;
      }
      syncMembersToSize(size);
      setStep(2);
      return;
    }

    // Step 2: members
    if (step === 2) {
      const trimmed = members.map((m) => ({
        ...m,
        name: (m.name || "").trim(),
        email: (m.email || "").trim(),
      }));

      if (trimmed.some((m) => !m.name)) {
        setStatus({ kind: "error", msg: "Each member needs a name." });
        return;
      }

      const badEmail = trimmed.find((m) => !isValidEmail(m.email));
      if (badEmail) {
        setStatus({
          kind: "error",
          msg: `Invalid email format for "${badEmail.name}". (Email is optional, but must be valid if provided.)`,
        });
        return;
      }

      setMembers(trimmed);
      setStep(3);
      return;
    }

    // Step 3: weeks
    if (step === 3) {
      const w = Number(weeks);
      if (Number.isNaN(w) || w < 3 || w > 12) {
        setStatus({ kind: "error", msg: "Weeks must be between 3 and 12." });
        return;
      }
      setWeeks(w);
      setStep(4);
      return;
    }

    // Step 4: draft mode
    if (step === 4) {
      setStep(5);
      return;
    }

    // Step 5: review -> activate
    if (step === 5) {
      setStep(6);
      return;
    }

    // Step 6: activate -> create
    if (step === 6) {
      void createLeague();
      return;
    }
  }

  async function markFreeUsedInSupabase() {
    // We only mark this if they create a FREE league successfully.
    const { data, error } = await supabase.auth.updateUser({
      data: { tl_free_used: true },
    });
    if (error) throw error;
    return data;
  }

  async function createLeague() {
    try {
      setStatus({ kind: "loading", msg: "Creating league..." });

      // Must be logged in (your route guard should already enforce this)
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session || null;
      if (!session) {
        setStatus({ kind: "error", msg: "You are not logged in. Please log in again." });
        nav("/login");
        return;
      }

      // FreeUsed must be known before allowing free
      if (freeUsed === null) {
        setStatus({ kind: "error", msg: "One moment — still checking your free-league eligibility. Try again." });
        return;
      }

      // Enforce plan rules
      const plan = effectivePlan; // "free" | "paid"
      const wantsFree = plan === "free";

      // Payment/confirmation gating
      if (plan === "paid") {
        if (!paymentConfirmed) {
          setPaymentStatus({ kind: "error", msg: "Please confirm payment to continue." });
          setStatus({ kind: "idle", msg: "" });
          return;
        }
        // Payment is still stubbed until Stripe is wired
        setPaymentStatus({ kind: "success", msg: "Payment recorded (stub). Creating league..." });
      } else {
        // Free: must be eligible
        if (!freeEligible) {
          setPaymentStatus({
            kind: "error",
            msg:
              freeEligibleByConfig
                ? "You have already used your one free league. Paid is required."
                : "Free leagues require 3 weeks and 3–4 members. Paid is required.",
          });
          setStatus({ kind: "idle", msg: "" });
          return;
        }
      }

      // Create league object (system-first scaffold)
      const league = {
        version: 2,
        createdAt: new Date().toISOString(),
        createdBy: session.user.id,
        createdByEmail: session.user.email || "",

        leagueName: (leagueName || "").trim(),

        familySize: Number(familySize),
        weeks: Number(weeks),

        pricing: {
          model: "per_week_flat",
          rateUSDPerWeek: 1,
          totalUSD: plan === "paid" ? Number(totalCost) : 0,
        },

        plan: plan, // "free" | "paid"
        adsEnabled: plan === "free",

        members: members.map((m, idx) => ({
          id: m.id,
          slot: idx + 1,
          name: m.name.trim(),
          email: (m.email || "").trim(),
          role: m.role || (idx < 2 ? "Parent" : "Kid"),
          canLogin: !!(m.email || "").trim(),
          managedByParent: !(m.email || "").trim(),
        })),

        draftMode: draftMode, // "self" | "others"

        gameplay: {
          teamsOfTwo: true,
          weeklyStructure: {
            eachPlayerHasIndividualCategory: true,
            mustCompletePartnerChallenges: true,
            wildcardGeneratedWeekly: true,
            randomDifficulty: ["easy", "medium", "hard"],
          },
        },
      };

      // If they create a free league, mark free used in Supabase now
      if (wantsFree) {
        await markFreeUsedInSupabase();
        setFreeUsed(true);
      }

      // Save league locally (your existing system gate uses localStorage)
      saveLeagueToLocalStorage(league);

      setStatus({ kind: "success", msg: "League created!" });
      nav("/home");
    } catch (e) {
      setStatus({ kind: "error", msg: e?.message || "Failed to create league." });
    }
  }

  const disableNext = useMemo(() => {
    // Only hard-disable final Create button if paid and not confirmed
    if (step === 6 && effectivePlan === "paid" && !paymentConfirmed) return true;
    if (step === 6 && status.kind === "loading") return true;
    return false;
  }, [step, effectivePlan, paymentConfirmed, status.kind]);

  return (
    <WizardShell
      onBack={goBack}
      backLabel={step === 0 ? "Cancel" : "Back"}
      onNext={goNext}
      nextLabel={step === 6 ? "Create League" : "Next"}
      disableNext={disableNext}
    >
      {/* Progress pills */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        {progress.map((p) => (
          <span
            key={p.label}
            className="pill"
            style={{
              opacity: p.done ? 0.95 : p.active ? 1 : 0.6,
              border: p.active
                ? "1px solid rgba(255,255,255,0.35)"
                : "1px solid rgba(255,255,255,0.18)",
            }}
          >
            {p.done ? "✅ " : p.active ? "👉 " : "• "}
            {p.label}
          </span>
        ))}
      </div>

      {/* STEP 0: Basics */}
      {step === 0 ? (
        <>
          <StepHeader
            title="League basics"
            subtitle="Start with a league name. This will appear on your league home."
          />

          <div className="card" style={{ marginBottom: 12 }}>
            <div className="cardBody">
              <label className="muted" style={{ display: "block", marginBottom: 6 }}>
                League name
              </label>
              <input
                className="input"
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                placeholder="Example: The Dummar League"
              />
              <div className="muted" style={{ marginTop: 10 }}>
                Tip: keep it simple. You can rename later.
              </div>
            </div>
          </div>

          {status.kind === "error" ? (
            <div className="muted" style={{ color: "salmon" }}>
              {status.msg}
            </div>
          ) : null}
        </>
      ) : null}

      {/* STEP 1: Family Size */}
      {step === 1 ? (
        <>
          <StepHeader
            title="Family size"
            subtitle="How many people are participating in this league? (3–12)"
          />

          <div className="card" style={{ marginBottom: 12 }}>
            <div className="cardBody">
              <label className="muted" style={{ display: "block", marginBottom: 6 }}>
                Members
              </label>

              <select
                className="input"
                value={familySize}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setFamilySize(next);
                  syncMembersToSize(next);
                }}
              >
                {Array.from({ length: 10 }).map((_, i) => {
                  const v = i + 3;
                  return (
                    <option key={v} value={v}>
                      {v} members
                    </option>
                  );
                })}
              </select>

              <div className="muted" style={{ marginTop: 10 }}>
                Free leagues are available only for <b>3-week</b> leagues with <b>3–4 members</b> (one per user).
              </div>
            </div>
          </div>

          {status.kind === "error" ? (
            <div className="muted" style={{ color: "salmon" }}>
              {status.msg}
            </div>
          ) : null}
        </>
      ) : null}

      {/* STEP 2: Members */}
      {step === 2 ? (
        <>
          <StepHeader
            title="Add members"
            subtitle="Names are required. Emails are optional (no-email members are managed by a parent)."
          />

          <div className="card">
            <div className="cardBody">
              <div style={{ display: "grid", gap: 10 }}>
                {members.map((m, idx) => (
                  <div
                    key={m.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "120px 1fr 1fr",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <div className="muted">
                      Member {idx + 1} <span style={{ opacity: 0.7 }}>({m.role})</span>
                    </div>

                    <input
                      className="input"
                      value={m.name}
                      placeholder="Name (required)"
                      onChange={(e) => {
                        const v = e.target.value;
                        setMembers((prev) =>
                          prev.map((x) => (x.id === m.id ? { ...x, name: v } : x))
                        );
                      }}
                    />

                    <input
                      className="input"
                      value={m.email}
                      placeholder="Email (optional)"
                      onChange={(e) => {
                        const v = e.target.value;
                        setMembers((prev) =>
                          prev.map((x) => (x.id === m.id ? { ...x, email: v } : x))
                        );
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="muted" style={{ marginTop: 12 }}>
                Members without email can’t log in. A parent account can track their progress.
              </div>

              {status.kind === "error" ? (
                <div className="muted" style={{ color: "salmon", marginTop: 10 }}>
                  {status.msg}
                </div>
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      {/* STEP 3: Weeks */}
      {step === 3 ? (
        <>
          <StepHeader
            title="League length"
            subtitle="How many weeks do you want this league to run? (3–12)"
          />

          <div className="card">
            <div className="cardBody">
              <label className="muted" style={{ display: "block", marginBottom: 6 }}>
                Weeks
              </label>

              <select
                className="input"
                value={weeks}
                onChange={(e) => setWeeks(Number(e.target.value))}
              >
                {Array.from({ length: 10 }).map((_, i) => {
                  const v = i + 3;
                  return (
                    <option key={v} value={v}>
                      {v} weeks
                    </option>
                  );
                })}
              </select>

              <div className="muted" style={{ marginTop: 10 }}>
                Recommended: <b>8 weeks</b> for habit-building momentum.
              </div>

              <div className="muted" style={{ marginTop: 10 }}>
                Pricing: <b>$1 per week</b> (paid leagues). Free eligibility requires exactly <b>3 weeks</b>.
              </div>

              {status.kind === "error" ? (
                <div className="muted" style={{ color: "salmon", marginTop: 10 }}>
                  {status.msg}
                </div>
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      {/* STEP 4: Draft Mode */}
      {step === 4 ? (
        <>
          <StepHeader
            title="Draft settings"
            subtitle="Choose how individual challenge categories are drafted."
          />

          <div
            className="grid"
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div className="card">
              <div className="cardBody">
                <div style={{ fontWeight: 900, marginBottom: 6 }}>Self Draft</div>
                <div className="muted" style={{ marginBottom: 10 }}>
                  Each person drafts their <b>own</b> individual challenge category.
                </div>
                <button
                  className="btnGhost"
                  type="button"
                  onClick={() => setDraftMode("self")}
                  style={{ width: "100%" }}
                >
                  {draftMode === "self" ? "Selected ✅" : "Choose Self Draft"}
                </button>
              </div>
            </div>

            <div className="card">
              <div className="cardBody">
                <div style={{ fontWeight: 900, marginBottom: 6 }}>Opponent Draft</div>
                <div className="muted" style={{ marginBottom: 10 }}>
                  Family members draft <b>other</b> members’ categories.
                </div>
                <button
                  className="btnGhost"
                  type="button"
                  onClick={() => setDraftMode("others")}
                  style={{ width: "100%" }}
                >
                  {draftMode === "others" ? "Selected ✅" : "Choose Opponent Draft"}
                </button>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="cardBody">
              <div style={{ fontWeight: 900, marginBottom: 6 }}>Core league flow</div>
              <div className="muted">
                Families compete in <b>teams of two</b>. Each week, every player:
                <ul style={{ marginTop: 8 }}>
                  <li>Has an <b>individual category</b> (drafted)</li>
                  <li>Must complete their <b>partner’s</b> challenges</li>
                  <li>Gets a <b>wildcard</b> category challenge generated weekly</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* STEP 5: Review */}
      {step === 5 ? (
        <>
          <StepHeader
            title="Review"
            subtitle="Confirm everything looks right. Next step: activate your plan."
          />

          <div className="card">
            <div className="cardBody">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <div className="muted">League name</div>
                  <div style={{ fontWeight: 900 }}>{leagueName}</div>

                  <div className="muted" style={{ marginTop: 10 }}>Members</div>
                  <div style={{ fontWeight: 900 }}>{familySize}</div>

                  <div className="muted" style={{ marginTop: 10 }}>Weeks</div>
                  <div style={{ fontWeight: 900 }}>{weeks}</div>

                  <div className="muted" style={{ marginTop: 10 }}>Draft mode</div>
                  <div style={{ fontWeight: 900 }}>
                    {draftMode === "self" ? "Self Draft" : "Opponent Draft"}
                  </div>

                  <div className="muted" style={{ marginTop: 10 }}>Plan preview</div>
                  {freeUsed === null ? (
                    <div style={{ fontWeight: 900 }}>Checking eligibility…</div>
                  ) : (
                    <div style={{ fontWeight: 900 }}>
                      {freeEligible ? "Free eligible (ad-supported, one-time)" : "Paid required (no ads)"}
                    </div>
                  )}
                </div>

                <div>
                  <div className="muted">Member list</div>
                  <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
                    {members.map((m, idx) => (
                      <div key={m.id} style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <span>
                          <b>{idx + 1}.</b> {m.name || "(missing)"}
                        </span>
                        <span className="muted">{m.email ? "can log in" : "parent-managed"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {status.kind === "error" ? (
                <div className="muted" style={{ color: "salmon", marginTop: 10 }}>
                  {status.msg}
                </div>
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      {/* STEP 6: Activate */}
      {step === 6 ? (
        <>
          <StepHeader
            title="Activate your league"
            subtitle="Free is one-time per user. Paid is $1 per week (no ads)."
          />

          <div className="card" style={{ marginBottom: 12 }}>
            <div className="cardBody">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {/* FREE */}
                <div className="card" style={{ boxShadow: "none" }}>
                  <div className="cardBody">
                    <div style={{ fontWeight: 900, marginBottom: 6 }}>Free • Ad-supported</div>
                    <div className="muted" style={{ marginBottom: 10 }}>
                      Available only for <b>3 weeks</b> and <b>3–4 members</b>, and only <b>once per user</b>.
                    </div>

                    <button
                      className="btnGhost"
                      type="button"
                      style={{ width: "100%" }}
                      onClick={() => setSelectedPlan("free")}
                      disabled={!freeEligible}
                      title={
                        freeEligible
                          ? "Free available"
                          : freeEligibleByConfig
                            ? "You already used your free league"
                            : "Not eligible (requires 3 weeks and 3–4 members)"
                      }
                    >
                      {effectivePlan === "free" ? "Selected ✅" : freeEligible ? "Choose Free" : "Not eligible"}
                    </button>

                    {!freeEligible ? (
                      <div className="muted" style={{ marginTop: 10, color: "gold" }}>
                        {freeUsed === null
                          ? "Checking your free-league status…"
                          : freeEligibleByConfig
                            ? "You’ve already used your one free league. Paid is required."
                            : "Free requires 3 weeks and 3–4 members."}
                      </div>
                    ) : (
                      <div className="muted" style={{ marginTop: 10 }}>
                        This will mark your account as having used its one free league.
                      </div>
                    )}
                  </div>
                </div>

                {/* PAID */}
                <div className="card" style={{ boxShadow: "none" }}>
                  <div className="cardBody">
                    <div style={{ fontWeight: 900, marginBottom: 6 }}>Paid • No ads</div>
                    <div className="muted" style={{ marginBottom: 10 }}>
                      Flat pricing: <b>$1 per week</b>. Total today: <b>{dollars(totalCost)}</b>.
                    </div>

                    <button
                      className="btnGhost"
                      type="button"
                      style={{ width: "100%" }}
                      onClick={() => setSelectedPlan("paid")}
                    >
                      {effectivePlan === "paid" ? "Selected ✅" : "Choose Paid"}
                    </button>

                    {effectivePlan === "paid" ? (
                      <div style={{ marginTop: 12 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <input
                            type="checkbox"
                            checked={paymentConfirmed}
                            onChange={(e) => setPaymentConfirmed(e.target.checked)}
                          />
                          <span>
                            I agree to pay <b>{dollars(totalCost)}</b> for this {weeks}-week league.
                          </span>
                        </label>

                        <div className="muted" style={{ marginTop: 10 }}>
                          Payment is currently a <b>stub</b>. Next brick: wire Stripe Checkout here.
                        </div>

                        {paymentStatus.kind === "error" ? (
                          <div className="muted" style={{ color: "salmon", marginTop: 8 }}>
                            {paymentStatus.msg}
                          </div>
                        ) : paymentStatus.kind === "success" ? (
                          <div className="muted" style={{ color: "lightgreen", marginTop: 8 }}>
                            {paymentStatus.msg}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="card" style={{ marginTop: 12, boxShadow: "none" }}>
                <div className="cardBody">
                  <div style={{ fontWeight: 900, marginBottom: 6 }}>Summary</div>
                  <div className="muted">
                    <div>
                      Plan: <b>{effectivePlan === "free" ? "Free (ads)" : "Paid (no ads)"}</b>
                    </div>
                    <div>
                      League: <b>{leagueName}</b> • <b>{familySize}</b> members • <b>{weeks}</b> weeks
                    </div>
                    <div>
                      Draft mode: <b>{draftMode === "self" ? "Self Draft" : "Opponent Draft"}</b>
                    </div>
                    <div>
                      Total: <b>{effectivePlan === "paid" ? dollars(totalCost) : "$0"}</b>
                    </div>
                  </div>

                  {status.kind === "loading" ? (
                    <div className="muted" style={{ marginTop: 10 }}>
                      {status.msg}
                    </div>
                  ) : status.kind === "error" ? (
                    <div className="muted" style={{ marginTop: 10, color: "salmon" }}>
                      {status.msg}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </WizardShell>
  );
}
