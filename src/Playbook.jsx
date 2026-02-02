import React, { useEffect, useMemo, useState } from "react";

/**
 * Thrive Leagues — Playbook
 * CLEAN VIEW MODE
 * - Adult/Kid toggle row side-by-side (aligned)
 * - Loads from:
 *    /playbooks/adult.md
 *    /playbooks/kid.md
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
      if (list) {
        html += `</${list}>`;
        list = null;
      }
      html += `<h3>${renderInline(line.replace(/^### /, ""))}</h3>`;
    } else if (/^## /.test(line)) {
      if (list) {
        html += `</${list}>`;
        list = null;
      }
      html += `<h2>${renderInline(line.replace(/^## /, ""))}</h2>`;
    } else if (/^# /.test(line)) {
      if (list) {
        html += `</${list}>`;
        list = null;
      }
      html += `<h1>${renderInline(line.replace(/^# /, ""))}</h1>`;
    } else if (/^- /.test(line)) {
      if (!list) {
        list = "ul";
        html += "<ul>";
      }
      html += `<li>${renderInline(line.replace(/^- /, ""))}</li>`;
    } else if (line.trim() === "---") {
      if (list) {
        html += `</${list}>`;
        list = null;
      }
      html += "<hr />";
    } else if (line.trim() === "") {
      if (list) {
        html += `</${list}>`;
        list = null;
      }
    } else {
      if (list) {
        html += `</${list}>`;
        list = null;
      }
      html += `<p>${renderInline(line)}</p>`;
    }
  }

  if (list) html += `</${list}>`;
  return html;
}

function usePlaybook(active) {
  const [state, setState] = useState({
    status: "loading",
    text: "",
    error: "",
  });

  useEffect(() => {
    const path = active === "kid" ? "/playbooks/kid.md" : "/playbooks/adult.md";

    setState({ status: "loading", text: "", error: "" });

    fetch(path, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          throw new Error(`Missing file: ${path} (HTTP ${r.status})`);
        }
        return r.text();
      })
      .then((t) => setState({ status: "ready", text: t, error: "" }))
      .catch((e) =>
        setState({
          status: "error",
          text: "",
          error: e?.message || "Playbook could not be loaded.",
        })
      );
  }, [active]);

  return state;
}

export default function Playbook() {
  const [active, setActive] = useState("adult");
  const { status, text, error } = usePlaybook(active);
  const html = useMemo(() => mdToHtml(text), [text]);

  return (
    <div className="pageWrap playbookClean">
      {/* PAGE-SCOPED STYLES (only affect this page) */}
      <style>{`
        /* Adult/Kid toggles: side-by-side + aligned */
        .playbookClean .toggleRow {
          display: flex;
          gap: 12px;
          align-items: stretch;
          margin-bottom: 16px;
        }
        .playbookClean .toggleBtn {
          flex: 1;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          height: 44px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          user-select: none;
          /* if your app already styles .btnGhost, this won't fight it much */
        }

        /* Typography polish */
        .playbookClean .playbookContent h1 { font-size: 30px; margin: 18px 0; }
        .playbookClean .playbookContent h2 { font-size: 22px; margin: 20px 0 10px; }
        .playbookClean .playbookContent h3 { font-size: 16px; margin: 16px 0 8px; }
        .playbookClean .playbookContent p  { line-height: 1.6; margin: 10px 0; }
        .playbookClean .playbookContent ul { margin-left: 22px; }
        .playbookClean .playbookContent hr { margin: 22px 0; opacity: 0.3; }

        /* Error box */
        .playbookClean .errorBox {
          padding: 14px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(0,0,0,0.18);
        }
        .playbookClean .errorTitle {
          font-weight: 700;
          margin-bottom: 6px;
        }
        .playbookClean .errorHint {
          opacity: 0.85;
          font-size: 14px;
          margin-top: 8px;
        }
      `}</style>

      <Card title="Playbook">
        {/* Side-by-side toggles */}
        <div className="toggleRow">
          <button
            className={`btnGhost toggleBtn ${active === "adult" ? "active" : ""}`}
            onClick={() => setActive("adult")}
            type="button"
          >
            Adult
          </button>

          <button
            className={`btnGhost toggleBtn ${active === "kid" ? "active" : ""}`}
            onClick={() => setActive("kid")}
            type="button"
          >
            Kid
          </button>
        </div>

        {status === "loading" && <div>Loading playbook…</div>}

        {status === "error" && (
          <div className="errorBox">
            <div className="errorTitle">Playbook file not found</div>
            <div>{error}</div>
            <div className="errorHint">
              Check that these files exist in GitHub (and are committed):<br />
              <code>public/playbooks/adult.md</code><br />
              <code>public/playbooks/kid.md</code>
            </div>
          </div>
        )}

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
