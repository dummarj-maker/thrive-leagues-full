import React from "react";
import { NavLink, Routes, Route, Navigate } from "react-router-dom";

import Home from "./Home.jsx";
import Draft from "./Draft.jsx";
import Playbook from "./Playbook.jsx";
import CommissionerTools from "./CommissionerTools.jsx";
import Achievements from "./Achievements.jsx";

function Pill({ children }) {
  return <span className="pill">{children}</span>;
}

export default function App() {
  return (
    <div className="appShell">
      <div className="fixedDesktopCanvas">
        <header className="topBar">
          <div className="brand">
            <div className="brandMark">TL</div>
            <div>
              <div className="brandName">Thrive Leagues</div>
              <div className="brandSub">Stage 2 • Playbook Build</div>
            </div>
          </div>

          <nav className="nav">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `navLink ${isActive ? "active" : ""}`}
            >
              Home
            </NavLink>

            <NavLink
              to="/draft"
              className={({ isActive }) => `navLink ${isActive ? "active" : ""}`}
            >
              Draft
            </NavLink>

            <NavLink
              to="/playbook"
              className={({ isActive }) => `navLink ${isActive ? "active" : ""}`}
            >
              Playbook
            </NavLink>

            <NavLink
              to="/commissioner"
              className={({ isActive }) => `navLink ${isActive ? "active" : ""}`}
            >
              Commissioner Tools
            </NavLink>

            <NavLink
              to="/achievements"
              className={({ isActive }) => `navLink ${isActive ? "active" : ""}`}
            >
              Achievements
            </NavLink>
          </nav>

          <div className="topRight">
            <Pill>Season 2026</Pill>
            <button className="btnPrimary" type="button">
              New Challenge
            </button>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/draft" element={<Draft />} />
          <Route path="/playbook" element={<Playbook />} />
          <Route path="/commissioner" element={<CommissionerTools />} />
          <Route path="/achievements" element={<Achievements />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <footer className="footer">
          <span className="muted">Thrive Leagues • Built brick-by-brick</span>
          <span className="muted">No zoom controls — pinch/trackpad zoom only</span>
        </footer>
      </div>
    </div>
  );
}