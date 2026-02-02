import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Card({ title, children }) {
  return (
    <section className="card">
      <div className="cardHeader">
        <h3 className="cardTitle">{title}</h3>
      </div>
      <div className="cardBody">{children}</div>
    </section>
  );
}

export default function LeagueSetup() {
  const nav = useNavigate();

  const [familyName, setFamilyName] = useState("");
  const [leagueName, setLeagueName] = useState("");
  const [familySize, setFamilySize] = useState(4);

  function onCreate(e) {
    e.preventDefault();

    const league = {
      familyName: familyName.trim(),
      leagueName: leagueName.trim() || `${familyName.trim() || "My"} League`,
      familySize: Number(familySize),
      createdAt: Date.now(),
    };

    localStorage.setItem("tl_league", JSON.stringify(league));
    nav("/home", { replace: true });
  }

  return (
    <div className="appShell">
      <div className="fixedDesktopCanvas">
        <div style={{ marginTop: 14 }}>
          <Card title="Set up your league">
            <p className="muted" style={{ marginTop: 0 }}>
              You’re logged in. Next: set up your family so Thrive can personalize the experience.
            </p>

            <form onSubmit={onCreate} style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span className="muted">Family name</span>
                <input
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="Dummar Family"
                  required
                  style={{
                    padding: "12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.18)",
                    color: "rgba(255,255,255,0.92)",
                    outline: "none",
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span className="muted">League name</span>
                <input
                  value={leagueName}
                  onChange={(e) => setLeagueName(e.target.value)}
                  placeholder="Thrive League"
                  style={{
                    padding: "12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.18)",
                    color: "rgba(255,255,255,0.92)",
                    outline: "none",
                  }}
                />
              </label>

              <label style={{ display: "grid", gap: 6 }}>
                <span className="muted">Family size</span>
                <select
                  value={familySize}
                  onChange={(e) => setFamilySize(e.target.value)}
                  style={{
                    padding: "12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.18)",
                    color: "rgba(255,255,255,0.92)",
                    outline: "none",
                  }}
                >
                  {Array.from({ length: 10 }, (_, i) => i + 2).map((n) => (
                    <option key={n} value={n}>
                      {n} people
                    </option>
                  ))}
                </select>
              </label>

              <button className="btnPrimary" type="submit">
                Create League
              </button>

              <button
                className="btnGhost"
                type="button"
                onClick={() => {
                  // Optional: allow resetting setup without drama
                  localStorage.removeItem("tl_league");
                  setFamilyName("");
                  setLeagueName("");
                  setFamilySize(4);
                }}
              >
                Reset
              </button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
