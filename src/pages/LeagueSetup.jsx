import React, { useMemo, useState } from "react";
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
      <div style={{ fontSize: 18, fontWeight: 800 }}>{title}</div>
      {subtitle ? (
        <div className="muted" style={{ marginTop: 4 }}>
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

function WizardShell({ children, onBack, backLabel, onNext, nextLabel, disableNext }) {
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
          <button className="btnGhost" type="button" onClick={onBack} disabled={!onBack}>
            {backLabel || "Back"}
          </button>

          <button className="btn" type="button" onClick={onNext} disabled={!!disableNext}>
            {nextLabel || "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LeagueSetup() {
  const nav = useNavigate();

  // New wizard steps (payment last):
  // 0 = Family size
  // 1 = Members
  // 2 = Draft mode
  // 3 = Review
  // 4 = Plan & payment (final) -> Create League
  const [step, setStep] = useState(0);

  const [familySize, setFamilySize] = useState(4);

  // Members
  const [members, setMembers] = useState(() => buildDefaultMembers(4));

  // Draft mode
  const [draftMode, setDraftMode] = useState("self"); // "self" | "others"

  // Plan/payment (final)
  const [plan, setPlan] = useState("free"); // "free" | "paid"
  const [promoCode, setPromoCode] = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState({ kind: "idle", msg: "" });

  // General status
  const [status, setStatus] = useState({ kind: "idle", msg: "" });

  const canUseFree = familySize <= 4;

  const planEffective = useMemo(() => {
    // Force paid if > 4 members
    if (!canUseFree) return "paid";
    return plan;
  }, [plan, canUseFree]);

  const price = useMemo(() => {
    if (planEffective !== "paid") return 0;
    return Number(familySize) * 1; // $1 per user
  }, [planEffective, familySize]);

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

  function goNext() {
    setStatus({ kind: "idle", msg: "" });

    // Step 0: Family size -> Members
    if (step === 0) {
      const size = Number(familySize);
      if (Number.isNaN(size) || size < 3 || size > 12) {
        setStatus({ kind: "error", msg: "Family size must be between 3 and 12." });
        return;
      }

      // If they go above 4, we keep allowing setup — we just force paid at the end.
      syncMembersToSize(size);

      // Helpful: if they exceed 4, preselect paid (so there’s no surprise later)
      if (size > 4) setPlan("paid");

      setStep(1);
      return;
    }

    // Step 1: Members -> Draft mode
    if (step === 1) {
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
      setStep(2);
      return;
    }

    // Step 2: Draft mode -> Review
    if (step === 2) {
      setStep(3);
      return;
    }

    // Step 3: Review -> Payment
    if (step === 3) {
      setStep(4);
      return;
    }

    // Step 4: Plan & Payment -> Create League
    if (step === 4) {
      void createLeagueAfterPayment();
      return;
    }
  }

  function goBack() {
    setStatus({ kind: "idle", msg: "" });
    setPaymentStatus({ kind: "idle", msg: "" });

    if (step <= 0) {
      nav("/home");
      return;
    }

    setStep((s) => Math.max(0, s - 1));
  }

  async function createLeagueAfterPayment() {
    try {
      setStatus({ kind: "idle", msg: "" });
      setPaymentStatus({ kind: "idle", msg: "" });

      // Validate payment rules
      if (planEffective === "paid") {
        if (!paymentConfirmed) {
          setPaymentStatus({ kind: "error", msg: "Please confirm payment to continue." });
          return;
        }
        // Stripe will replace this stub later
        setPaymentStatus({ kind: "success", msg: "Payment recorded (stub). Creating league..." });
      } else {
        // Free plan (<= 4): no payment required
        setPaymentConfirmed(true);
      }

      setStatus({ kind: "loading", msg: "Creating league..." });

      const { data } = await supabase.auth.getSession();
      const session = data?.session || null;
      if (!session) {
        setStatus({ kind: "error", msg: "You are not logged in. Please log in again." });
        nav("/login");
        return;
      }

      const league = {
        version: 1,
        createdAt: new Date().toISOString(),
        createdBy: session.user.id,
        createdByEmail: session.user.email || "",

        familySize: Number(familySize),

        plan: planEffective, // forced paid if >4
        adsEnabled: planEffective === "free",
        priceMonthlyUSD: planEffective === "paid" ? price : 0,
        promoCode: (promoCode || "").trim(),

        members: members.map((m, idx) => ({
          id: m.id,
          slot: idx + 1,
          name: m.name.trim(),
          email: (m.email || "").trim(),
          role: m.role || (idx < 2 ? "Parent" : "Kid"),
          canLogin: !!(m.email || "").trim(),
          managedByParent: !(m.email || "").trim(),
        })),

        draftMode, // "self" | "others"

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

      saveLeagueToLocalStorage(league);

      setStatus({ kind: "success", msg: "League created!" });
      nav("/home");
    } catch (e) {
      setStatus({ kind: "error", msg: e?.message || "Failed to create league." });
    }
  }

  const progress = useMemo(() => {
    const labels = ["Family Size", "Members", "Draft Mode", "Review", "Plan & Payment"];
    return labels.map((label, idx) => ({ label, done: idx < step, active: idx === step }));
  }, [step]);

  const disableNext = useMemo(() => {
    if (step === 4) {
      // On final step, if paid is required, must confirm
      if (planEffective === "paid" && !paymentConfirmed) return true;
      return status.kind === "loading";
    }
    return false;
  }, [step, planEffective, paymentConfirmed, status.kind]);

  return (
    <WizardShell
      onBack={goBack}
      backLabel={step === 0 ? "Cancel" : "Back"}
      onNext={goNext}
      nextLabel={step === 4 ? "Create League" : "Next"}
      disableNext={disableNext}
    >
      {/* Progress */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        {progress.map((p) => (
          <span
            key={p.label}
            className="pill"
            style={{
              opacity: p.done ? 0.95 : p.active ? 1 : 0.6,
              border: p.active ? "1px solid rgba(255,255,255,0.35)" : "1px solid rgba(255,255,255,0.18)",
            }}
          >
            {p.done ? "✅ " : p.active ? "👉 " : "• "}
            {p.label}
          </span>
        ))}
      </div>

      {/* Step 0: Family size */}
      {step === 0 ? (
        <>
          <StepHeader
            title="Set up your league"
            subtitle="Choose how many family members are participating (3–12)."
          />

          <div className="card" style={{ marginBottom: 12 }}>
            <div className="cardBody">
              <label className="muted" style={{ display: "block", marginBottom: 6 }}>
                Family size
              </label>

              <select
                className="input"
                value={familySize}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setFamilySize(next);
                  syncMembersToSize(next);
                  if (next > 4) setPlan("paid");
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
                Free plan supports up to <b>4</b> members (ad-supported). Paid plan supports up to{" "}
                <b>12</b> members (no ads, $1 per user).
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

      {/* Step 1: Members */}
      {step === 1 ? (
        <>
          <StepHeader
            title="Add members"
            subtitle="Names are required. Emails are optional (no-email members are managed by a parent)."
          />

          <div className="card">
            <div className="cardBody">
              <div className="muted" style={{ marginBottom: 10 }}>
                League size: <b>{familySize}</b>
                {familySize > 4 ? (
                  <>
                    {" "}
                    • <b style={{ color: "gold" }}>This size will require Paid (no ads)</b>
                  </>
                ) : null}
              </div>

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
                        setMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, name: v } : x)));
                      }}
                    />

                    <input
                      className="input"
                      value={m.email}
                      placeholder="Email (optional)"
                      onChange={(e) => {
                        const v = e.target.value;
                        setMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, email: v } : x)));
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="muted" style={{ marginTop: 12 }}>
                Members without an email can’t log in. Their points and achievements are logged by a parent account.
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

      {/* Step 2: Draft mode */}
      {step === 2 ? (
        <>
          <StepHeader
            title="Draft settings"
            subtitle="Choose how individual challenge categories are drafted."
          />

          <div className="grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="card">
              <div className="cardBody">
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Self Draft</div>
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
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Opponent Draft</div>
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
              <div style={{ fontWeight: 800, marginBottom: 6 }}>How your league works</div>
              <div className="muted">
                Families compete in <b>teams of two</b>. Each week, every player:
                <ul style={{ marginTop: 8 }}>
                  <li>Gets a random challenge tied to their <b>individual category</b> (easy/medium/hard)</li>
                  <li>Must also complete their <b>partner’s</b> challenge</li>
                  <li>Gets a <b>wildcard</b> category challenge generated by Thrive</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* Step 3: Review */}
      {step === 3 ? (
        <>
          <StepHeader
            title="Review"
            subtitle="Confirm everything looks right — then you’ll activate your plan."
          />

          <div className="card">
            <div className="cardBody">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <div className="muted">Family size</div>
                  <div style={{ fontWeight: 800 }}>{familySize}</div>

                  <div className="muted" style={{ marginTop: 10 }}>
                    Draft mode
                  </div>
                  <div style={{ fontWeight: 800 }}>{draftMode === "self" ? "Self Draft" : "Opponent Draft"}</div>

                  <div className="muted" style={{ marginTop: 10 }}>
                    Plan requirement
                  </div>
                  <div style={{ fontWeight: 800 }}>
                    {familySize > 4 ? "Paid required (no ads)" : "Free available (ads) or Paid (no ads)"}
                  </div>
                </div>

                <div>
                  <div className="muted">Members</div>
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

      {/* Step 4: Plan & Payment (FINAL) */}
      {step === 4 ? (
        <>
          <StepHeader
            title="Activate your league"
            subtitle="Choose your plan and finish setup. (Paid = no ads, $1 per user.)"
          />

          <div className="grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="card">
              <div className="cardBody">
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Free • Ad-supported</div>
                <div className="muted" style={{ marginBottom: 10 }}>
                  Max 4 family members • No payment
                </div>

                <button
                  className="btnGhost"
                  type="button"
                  disabled={!canUseFree}
                  onClick={() => setPlan("free")}
                  style={{ width: "100%" }}
                >
                  {planEffective === "free" ? "Selected ✅" : canUseFree ? "Choose Free" : "Not eligible"}
                </button>

                {!canUseFree ? (
                  <div className="muted" style={{ marginTop: 10, color: "gold" }}>
                    Your league has {familySize} members. Free is limited to 4, so this league must be Paid.
                  </div>
                ) : null}
              </div>
            </div>

            <div className="card">
              <div className="cardBody">
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Paid • No ads</div>
                <div className="muted" style={{ marginBottom: 10 }}>
                  {familySize} members • {dollars(price)}/month
                </div>

                <button
                  className="btnGhost"
                  type="button"
                  onClick={() => setPlan("paid")}
                  style={{ width: "100%" }}
                >
                  {planEffective === "paid" ? "Selected ✅" : "Choose Paid"}
                </button>

                <div style={{ marginTop: 12 }}>
                  <label className="muted" style={{ display: "block", marginBottom: 6 }}>
                    Promo code (optional)
                  </label>
                  <input
                    className="input"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="PROMO2026"
                  />
                </div>

                {planEffective === "paid" ? (
                  <div style={{ marginTop: 12 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input
                        type="checkbox"
                        checked={paymentConfirmed}
                        onChange={(e) => setPaymentConfirmed(e.target.checked)}
                      />
                      <span>
                        I agree to pay <b>{dollars(price)}/month</b> for {familySize} members.
                      </span>
                    </label>

                    <div className="muted" style={{ marginTop: 10 }}>
                      Payment is currently a <b>stub</b> while we build. Next brick: wire Stripe Checkout here.
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

          {status.kind === "loading" ? (
            <div className="muted" style={{ marginTop: 12 }}>
              {status.msg}
            </div>
          ) : status.kind === "error" ? (
            <div className="muted" style={{ marginTop: 12, color: "salmon" }}>
              {status.msg}
            </div>
          ) : null}
        </>
      ) : null}
    </WizardShell>
  );
}
