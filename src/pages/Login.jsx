import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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

export default function Login() {
  const nav = useNavigate();
  const location = useLocation();
  const from = useMemo(() => location.state?.from || "/home", [location.state]);

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");

  function onLogin(e) {
    e.preventDefault();

    // Placeholder session (replace with Supabase later)
    const session = {
      email: email.trim() || "demo@thriveleagues.com",
      createdAt: Date.now(),
    };
    localStorage.setItem("tl_session", JSON.stringify(session));

    // After login, if they have no league, routing will send them to /setup automatically.
    nav(from, { replace: true });
  }

  return (
    <div className="appShell">
      <div className="fixedDesktopCanvas">
        <div style={{ marginTop: 14 }}>
          <Card title="Log in to Thrive Leagues">
            <p className="muted" style={{ marginTop: 0 }}>
              Stage 2 build: simple login gate. (We’ll upgrade to real auth later.)
            </p>

            <form onSubmit={onLogin} style={{ display: "grid", gap: 12 }}>
              <label style={{ display: "grid", gap: 6 }}>
                <span className="muted">Email</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
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
                <span className="muted">Password</span>
                <input
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="••••••••"
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

              <button className="btnPrimary" type="submit">
                Log In
              </button>

              <button
                className="btnGhost"
                type="button"
                onClick={() => {
                  // demo path = still sets a session, keeps friction low
                  localStorage.setItem(
                    "tl_session",
                    JSON.stringify({ email: "demo@thriveleagues.com", createdAt: Date.now() })
                  );
                  nav("/home", { replace: true });
                }}
              >
                Continue as Demo
              </button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
