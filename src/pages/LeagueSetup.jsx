import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function LeagueSetup() {
  const nav = useNavigate();

  /* -----------------------------
     Wizard state
  ------------------------------*/
  const steps = ["Basics", "Family Size", "Members", "Weeks", "Draft Mode", "Review", "Activate"];
  const [stepIndex, setStepIndex] = useState(0);

  /* -----------------------------
     Session / commissioner
  ------------------------------*/
  const [ready, setReady] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  /* -----------------------------
     Basics
  ------------------------------*/
  const [leagueName, setLeagueName] = useState("Family League");

  /* -----------------------------
     Family size & weeks
  ------------------------------*/
  const [memberCount, setMemberCount] = useState(4);
  const [weeks, setWeeks] = useState(3);

  const memberOptions = useMemo(() => Array.from({ length: 10 }, (_, i) => i + 3), []);
  const weekOptions = memberOptions;

  /* -----------------------------
     Members (controlled, stable)
  ------------------------------*/
  const [members, setMembers] = useState([]);

  /* -----------------------------
     Draft mode
  ------------------------------*/
  const [draftMode, setDraftMode] = useState("self");

  /* -----------------------------
     Load session once
  ------------------------------*/
  useEffect(() => {
    let ignore = false;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (ignore) return;

      const email = data?.session?.user?.email || "";
      setUserEmail(email);

      // Initialize members ONCE
      setMembers((prev) => {
        if (prev.length) return prev;

        const base = [
          {
            role: "commissioner",
            name: "Commissioner",
            email,
            isManager: true,
          },
        ];

        for (let i = 1; i < memberCount; i++) {
          base.push({
            role: "member",
            name: "",
            email: "",
            isManager: false,
          });
        }
        return base;
      });

      setReady(true);
    }

    init();
    return () => (ignore = true);
  }, []);

  /* -----------------------------
     Adjust members when size changes
  ------------------------------*/
  useEffect(() => {
    setMembers((prev) => {
      const next = [...prev];

      // Grow
      while (next.length < memberCount) {
        next.push({
          role: "member",
          name: "",
          email: "",
          isManager: false,
        });
      }

      // Shrink
      return next.slice(0, memberCount);
    });
  }, [memberCount]);

  if (!ready) return null;

  /* -----------------------------
     Helpers
  ------------------------------*/
  function updateMember(idx, patch) {
    setMembers((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, ...patch } : m))
    );
  }

  /* -----------------------------
     Step UI
  ------------------------------*/
  function Basics() {
    return (
      <>
        <h2>League basics</h2>
        <label>League name</label>
        <input
          value={leagueName}
          onChange={(e) => setLeagueName(e.target.value)}
        />
        <p className="muted">You can rename this later.</p>
      </>
    );
  }

  function FamilySize() {
    return (
      <>
        <h2>Family size</h2>
        <label>Members</label>
        <select value={memberCount} onChange={(e) => setMemberCount(Number(e.target.value))}>
          {memberOptions.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </>
    );
  }

  function Members() {
    return (
      <>
        <h2>Add members</h2>
        <p className="muted">
          Names are required. Emails are optional — except League Managers.
        </p>

        <div className="memberGridHeader">
          <span>Name</span>
          <span>Email</span>
          <span>League Manager</span>
        </div>

        {members.map((m, idx) => {
          const isCommissioner = idx === 0;
          const lmDisabled = !m.email && !isCommissioner;

          return (
            <div className="memberRow" key={idx}>
              <input
                value={m.name}
                onChange={(e) => updateMember(idx, { name: e.target.value })}
              />

              <input
                value={m.email}
                disabled={isCommissioner}
                onChange={(e) => updateMember(idx, { email: e.target.value })}
                placeholder={isCommissioner ? userEmail : "Email (optional)"}
              />

              <input
                type="checkbox"
                checked={m.isManager}
                disabled={lmDisabled}
                onChange={(e) => updateMember(idx, { isManager: e.target.checked })}
                title={lmDisabled ? "Add an email to enable League Manager" : ""}
              />
            </div>
          );
        })}
      </>
    );
  }

  function Weeks() {
    return (
      <>
        <h2>League length</h2>
        <label>Weeks</label>
        <select value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}>
          {weekOptions.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
      </>
    );
  }

  const stepViews = [Basics, FamilySize, Members, Weeks];

  const StepView = stepViews[stepIndex];

  /* -----------------------------
     Render
  ------------------------------*/
  return (
    <div className="wizard">
      <StepView />

      <div className="wizardActions">
        {stepIndex > 0 && (
          <button onClick={() => setStepIndex(stepIndex - 1)}>Back</button>
        )}
        <button onClick={() => setStepIndex(stepIndex + 1)}>Next</button>
      </div>
    </div>
  );
}
