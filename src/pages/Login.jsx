import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

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

  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [status, setStatus] = useState({ kind: "idle", msg: "" });

  const supabaseReady =
    !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;

  async function onSubmit(e) {
    e.preventDefault();
    setStatus({ kind: "loading", msg: "" });

    if (!supabaseReady) {
      setStatus({
        kind: "error",
        msg:
          "Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then refresh.",
      });
      return;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail || !pw) {
      setStatus({ kind: "error", msg: "Email and password are required." });
      return;
    }

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: pw,
        });
        if (error) throw error;

        setStatus({
          kind: "ok",
          msg:
            "Account created. If Supabase email confirmation is enabled, check your email—then return and log in.",
        });
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: pw,
      });
      if (error) throw error;

      nav(from, { replace: true });
    } catch (err) {
      setStatus({
        kind: "error",
        msg: err?.message || "Login failed. Please try again.",
      });
    }
  }

  return (
    <div className="appShell">
      <div className="fixedDesktopCanvas">
        <style>{`
          .loginHero {
            margin-top: 14px;
            display: grid;
            grid-template-columns: 1.25fr 0.75fr;
            gap: 14px;
            align-items: stretch;
          }
          .heroPanel {
            border: 1px solid rgba(255,255,255,0.12);
            background: linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03));
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            padding: 18px;
            overflow: hidden;
            position: relative;
          }
          .heroPanel::before{
            content:"";
            position:absolute;
            inset:-80px -80px auto auto;
            width:240px;height:240px;
            background: radial-gradient(circle at 30% 30%, rgba(0,212,255,.22), transparent 60%);
            filter: blur(2px);
          }
          .heroTop {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 14px;
            position: relative;
            z-index: 1;
          }
          .heroMark {
            width: 56px;
            height: 56px;
            border-radius: 18px;
            display: grid;
            place-items: center;
            font-weight: 950;
            font-size: 18px;
            background: linear-gradient(135deg, var(--a), var(--c));
            box-shadow: 0 12px 30px rgba(109,91,255,.25);
          }
          .heroTitle {
            margin: 0;
            font-size: 26px;
            letter-spacing: .2px;
          }
          .heroSub {
            margin-top: 6px;
            color: var(--muted);
            line-height: 1.55;
          }
          .heroBullets {
            margin: 14px 0 0;
            padding-left: 18px;
            color: rgba(255,255,255,0.88);
            line-height: 1.6;
          }
          .heroBullets li { margin: 6px 0; }
          .heroCTA {
            margin-top: 14px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }
          .ctaPill {
            display:inline-flex;
            align-items:center;
            gap:8px;
            padding: 8px 10px;
            border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(0,0,0,0.18);
            color: rgba(255,255,255,0.88);
            font-size: 12px;
            font-weight: 700;
          }

          .authTabs {
            display: flex;
            gap: 10px;
            margin-bottom: 12px;
          }
          .authTab {
            flex: 1;
            height: 42px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(0,0,0,0.18);
            color: rgba(255,255,255,0.88);
            cursor: pointer;
            font-weight: 800;
          }
          .authTabActive {
            background: linear-gradient(135deg, rgba(109,91,255,.30), rgba(0,212,255,.14));
            border-color: rgba(109,91,255,.35);
            color: rgba(255,255,255,0.95);
          }
          .field {
            display: grid;
            gap: 6px;
          }
          .input {
            padding: 12px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.14);
            background: rgba(0,0,0,0.18);
            color: rgba(255,255,255,0.92);
            outline: none;
          }
          .statusBox {
            margin-top: 12px;
            padding: 10px 12px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.12);
            background: rgba(0,0,0,0.18);
          }
          .statusOk { border-color: rgba(0,212,255,0.30); }
          .statusErr { border-color: rgba(255,61,127,0.35); background: rgba(255,61,127,0.08); }
          .statusMuted { color: var(--muted); font-size: 12px; margin-top: 10px; line-height: 1.4; }
          @media (max-width: 1100px){
            .loginHero { grid-template-columns: 1fr; }
          }
        `}</style>

        <div className="loginHero">
          {/* MARKETING / SALES */}
          <div className="heroPanel">
            <div className="heroTop">
              <div className="heroMark">TL</div>
              <div>
                <h1 className="heroTitle">Thrive Leagues</h1>
                <div className="brandSub">Families • Accountability • Growth</div>
              </div>
            </div>

            <p className="heroSub">
              Thrive Leagues is a family-first system that turns personal growth into a game.
              Draft categories, complete short challenges, earn points, and build better habits together.
            </p>

            <ul className="heroBullets">
              <li><strong>Better Together</strong> — teamwork, encouragement, and shared wins</li>
              <li><strong>Structure without pressure</strong> — progress over perfection</li>
              <li><strong>Real-life habits</strong> — fitness, responsibility, kindness, learning, and more</li>
              <li><strong>Designed for families</strong> — kids + adults, one system, two voices</li>
            </ul>

            <div className="heroCTA">
              <span className="ctaPill">✅ Draft-based accountability</span>
              <span className="ctaPill">🏆 Points + Achievements</span>
              <span className="ctaPill">📘 Playbook built-in</span>
              <span className="ctaPill">🧠 System-first design</span>
            </div>

            {!supabaseReady ? (
              <div className={`statusBox statusErr`} style={{ marginTop: 14 }}>
                <div style={{ fontWeight: 900 }}>Setup needed</div>
                <div style={{ marginTop: 6 }}>
                  Supabase env vars aren’t set yet. Once you add them, real login will work instantly.
                </div>
              </div>
            ) : null}
          </div>

          {/* AUTH CARD */}
          <Card title="Access your league">
            <div className="authTabs">
              <button
                type="button"
                className={`authTab ${mode === "login" ? "authTabActive" : ""}`}
                onClick={() => setMode("login")}
              >
                Log in
              </button>
              <button
                type="button"
                className={`authTab ${mode === "signup" ? "authTabActive" : ""}`}
                onClick={() => setMode("signup")}
              >
                Create account
              </button>
            </div>

            <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
              <label className="field">
                <span className="muted">Email</span>
                <input
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  autoComplete="email"
                  required
                />
              </label>

              <label className="field">
                <span className="muted">Password</span>
                <input
                  className="input"
                  type="password"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                />
              </label>

              <button className="btnPrimary" type="submit" disabled={status.kind === "loading"}>
                {mode === "signup" ? "Create Account" : "Log In"}
              </button>

              {status.kind !== "idle" ? (
                <div
                  className={`statusBox ${
                    status.kind === "ok" ? "statusOk" : status.kind === "error" ? "statusErr" : ""
                  }`}
                >
                  {status.kind === "loading" ? "Working…" : status.msg}
                </div>
              ) : null}

              <div className="statusMuted">
                <strong>Builder access:</strong> the builder email can bypass league setup so you can keep building fast.
                (We’ll set that email in one line in <code>.env</code>.)
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
