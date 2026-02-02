import React, { useEffect, useMemo, useState } from "react";

/**
 * Thrive Leagues — Playbook
 * CLEAN VIEW MODE
 * - Removes header actions (Stage, Season, New Challenge)
 * - Removes right rail
 * - Expands playbook to full width
 * - Page-scoped only (does not affect other tabs)
 */

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

function escapeHtml(str) {
  return (str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderInline(md) {
  let s = escapeHtml(md);
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  s = s.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    `<a href="$2" target="_blank" rel="noreferrer">$1</a>`
  );
  return s;
}

function mdToHtml(markdown) {
  const lines = (markdown || "").split("\n");
  let html = "";
  let list = null;

  for (let line of lines) {
    if (/^### /.test(line)) {
      if (list) { html += `</${list}>`; list = null; }
      html += `<h3>${renderInline(line.replace(/^### /, ""))}</h3>`;
    } else if (/^## /.test(line)) {
      if (list) { html += `</${list}>`; list = null; }
      html += `<h2>${renderInline(line.replace(/^## /, ""))}</h2>`;
    } else if (/^# /.test(line)) {
      if (list) { html += `</${list}>`; list = null; }
      html += `<h1>${renderInline(line.replace(/^# /, ""))}</h1>`;
    } else if (/^- /.test(line)) {
      if (!list) { list = "ul"; html += "<ul>"; }
      html += `<li>${renderInline(line.replace(/^- /, ""))}</li>`;
    } else if (line.trim() === "---") {
      if (list) { html += `</${list}>`; list = null; }
      html += "<hr />";
    } else if (line.trim() === "") {
      if (list) { html += `</${list}>`; list = null; }
    } else {
      if (list) { html += `</${list}>`; list = null; }
      html += `<p>${renderInline(line)}</p>`;
    }
  }

  if (list) html += `</${list}>`;
  return html;
}

function usePlaybook(active) {
  const [state, setState] = useState({ status: "loading", text: "" });

  useEffect(() => {
    const path =
      active === "kid" ? "/playbooks/kid-playbook.md" : "/playbooks/adult.md";

    fetch(path, { cache: "no-store" })
      .then((r) => r.text())
      .then((t) => setState({ status: "ready", text: t }))
      .catch(() => setState({ status: "error", text: "" }));
  }, [active]);

  return state;
}

export default function Playbook() {
  const [active, setActive] = useState("adult");
  const { status, text } = usePlaybook(active);
  const html = useMemo(() => mdToHtml(text), [text]);

  return (
    <div className="pageWrap playbookClean">

      {/* PAGE-SCOPED CLEANUP */}
      <style>{`
        /* Hide global header actions ONLY on Playbook */
        .playbookClean .topRight,
        .playbookClean .nav,
        .playbookClean .brandSub,
        .playbookClean .pill {
          display: none !important;
        }

        /* Expand grid to single column */
        .playbookClean .grid {
          grid-template-columns: 1fr !important;
        }

        /* Typography polish */
        .playbookContent h1 { font-size: 30px; margin: 18px 0; }
        .playbookContent h2 { font-size: 22px; margin: 20px 0 10px; }
        .playbookContent h3 { font-size: 16px; margin: 16px 0 8px; }
        .playbookContent p  { line-height: 1.6; margin: 10px 0; }
        .playbookContent ul { margin-left: 22px; }
        .playbookContent hr { margin: 22px 0; opacity: 0.3; }
      `}</style>

      <Card title="Playbook">
        <div style={{ marginBottom: 14 }}>
          <button
            className={`btnGhost ${active === "adult" ? "active" : ""}`}
            onClick={() => setActive("adult")}
          >
            Adult
          </button>
          <button
            className={`btnGhost ${active === "kid" ? "active" : ""}`}
            onClick={() => setActive("kid")}
            style={{ marginLeft: 10 }}
          >
            Kid
          </button>
        </div>

        {status === "ready" && (
          <div
            className="playbookContent"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </Card>
    </div>
  );
}
