import React, { useEffect, useMemo, useState } from "react";

function Card({ title, children, right }) {
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

/**
 * Brick: Render Playbooks inside the site (no PDFs required).
 * Files must live in repo root:
 *   /public/playbooks/adult.md
 *   /public/playbooks/kid.md
 *
 * Vite serves /public at site root, so we fetch:
 *   /playbooks/adult.md
 *   /playbooks/kid.md
 */

// --- simple markdown -> HTML (safe-ish) ---
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

  // inline code
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  // bold
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // italics
  s = s.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  // links
  s = s.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    `<a href="$2" target="_blank" rel="noreferrer">$1</a>`
  );

  return s;
}

function mdToHtml(markdown) {
  const lines = (markdown || "").replace(/\r\n/g, "\n").split("\n");

  let html = "";
  let inCode = false;
  let codeLines = [];
  let listMode = null; // "ul" | "ol" | null
  let inBlockquote = false;

  const closeList = () => {
    if (listMode) {
      html += `</${listMode}>`;
      listMode = null;
    }
  };

  const closeBlockquote = () => {
    if (inBlockquote) {
      html += `</blockquote>`;
      inBlockquote = false;
    }
  };

  const closeCode = () => {
    if (inCode) {
      const code = escapeHtml(codeLines.join("\n"));
      html += `<pre><code>${code}</code></pre>`;
      inCode = false;
      codeLines = [];
    }
  };

  for (let raw of lines) {
    const line = raw ?? "";

    // fenced code blocks
    if (line.trim().startsWith("```")) {
      closeList();
      closeBlockquote();

      if (!inCode) {
        inCode = true;
        codeLines = [];
      } else {
        closeCode();
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    // horizontal rule
    if (/^\s*---\s*$/.test(line)) {
      closeList();
      closeBlockquote();
      html += `<hr />`;
      continue;
    }

    // blockquote
    if (/^\s*>\s?/.test(line)) {
      closeList();
      if (!inBlockquote) {
        html += `<blockquote>`;
        inBlockquote = true;
      }
      html += `<p>${renderInline(line.replace(/^\s*>\s?/, ""))}</p>`;
      continue;
    } else {
      closeBlockquote();
    }

    // headings
    const h3 = line.match(/^\s*###\s+(.*)$/);
    const h2 = line.match(/^\s*##\s+(.*)$/);
    const h1 = line.match(/^\s*#\s+(.*)$/);
    if (h1 || h2 || h3) {
      closeList();
      const text = renderInline((h1 || h2 || h3)[1]);
      if (h1) html += `<h1>${text}</h1>`;
      if (h2) html += `<h2>${text}</h2>`;
      if (h3) html += `<h3>${text}</h3>`;
      continue;
    }

    // ordered list
    const ol = line.match(/^\s*\d+\.\s+(.*)$/);
    if (ol) {
      closeBlockquote();
      if (listMode !== "ol") {
        closeList();
        listMode = "ol";
        html += `<ol>`;
      }
      html += `<li>${renderInline(ol[1])}</li>`;
      continue;
    }

    // unordered list
    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    if (ul) {
      closeBlockquote();
      if (listMode !== "ul") {
        closeList();
        listMode = "ul";
        html += `<ul>`;
      }
      html += `<li>${renderInline(ul[1])}</li>`;
      continue;
    }

    // blank line = paragraph break
    if (line.trim() === "") {
      closeList();
      closeBlockquote();
      continue;
    }

    // normal paragraph
    closeList();
    closeBlockquote();
    html += `<p>${renderInline(line)}</p>`;
  }

  closeCode();
  closeList();
  closeBlockquote();

  return html;
}

function usePlaybookText(active) {
  const [state, setState] = useState({ status: "idle", text: "", error: "" });

  useEffect(() => {
    const path = active === "kid" ? "/playbooks/kid.md" : "/playbooks/adult.md";
    let cancelled = false;

    async function load() {
      setState({ status: "loading", text: "", error: "" });
      try {
        const res = await fetch(path, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`Could not load ${path} (HTTP ${res.status})`);
        }
        const t = await res.text();
        if (!cancelled) setState({ status: "ready", text: t, error: "" });
      } catch (e) {
        if (!cancelled)
          setState({
            status: "error",
            text: "",
            error: e?.message || "Unknown error loading playbook",
          });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [active]);

  return state;
}

export default function Playbook() {
  const [active, setActive] = useState("adult"); // "adult" | "kid"
  const { status, text, error } = usePlaybookText(active);

  const html = useMemo(() => mdToHtml(text), [text]);

  const openSource = () => {
    const path = active === "kid" ? "/playbooks/kid.md" : "/playbooks/adult.md";
    window.open(path, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="pageWrap">
      {/* Local styles so you don't have to fight CSS right now */}
      <style>{`
        .segTabs { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
        .segBtn {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.14);
          color: rgba(255,255,255,0.9);
          padding: 8px 12px;
          border-radius: 999px;
          cursor: pointer;
          font-weight: 600;
        }
        .segBtnActive {
          background: rgba(255,255,255,0.16);
          border-color: rgba(255,255,255,0.24);
        }
        .playbookViewer {
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(0,0,0,0.18);
          border-radius: 14px;
          overflow: hidden;
        }
        .viewerHeader {
          display:flex;
          align-items:center;
          justify-content: space-between;
          padding: 12px 14px;
          border-bottom: 1px solid rgba(255,255,255,0.10);
        }
        .viewerTitle { font-weight: 800; letter-spacing: 0.2px; }
        .viewerMeta { display:flex; gap:10px; align-items:center; }
        .pillMini {
          padding: 5px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.16);
          font-size: 12px;
          font-weight: 700;
        }
        .viewerBody { padding: 16px; max-height: 62vh; overflow: auto; }
        .viewerBody h1 { font-size: 26px; margin: 14px 0 10px; }
        .viewerBody h2 { font-size: 20px; margin: 16px 0 10px; }
        .viewerBody h3 { font-size: 16px; margin: 14px 0 8px; opacity: 0.95; }
        .viewerBody p { line-height: 1.55; margin: 10px 0; color: rgba(255,255,255,0.92); }
        .viewerBody ul, .viewerBody ol { margin: 10px 0 10px 22px; }
        .viewerBody li { margin: 6px 0; line-height: 1.5; }
        .viewerBody hr { border: 0; height: 1px; background: rgba(255,255,255,0.14); margin: 16px 0; }
        .viewerBody blockquote {
          margin: 12px 0;
          padding: 10px 12px;
          border-left: 4px solid rgba(255,255,255,0.22);
          background: rgba(255,255,255,0.06);
          border-radius: 10px;
        }
        .viewerBody code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          background: rgba(255,255,255,0.10);
          padding: 2px 6px;
          border-radius: 8px;
          font-size: 0.95em;
        }
        .viewerBody pre {
          background: rgba(0,0,0,0.35);
          padding: 12px;
          border-radius: 12px;
          overflow: auto;
          border: 1px solid rgba(255,255,255,0.10);
        }
        .viewerBody pre code { background: transparent; padding: 0; }
        .viewerBody a { color: rgba(140, 200, 255, 1); text-decoration: underline; }
        .ghostLinkBtn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.14);
          color: rgba(255,255,255,0.9);
          padding: 8px 10px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 700;
        }
        .statusLine { opacity: 0.85; }
        .errorBox {
          border: 1px solid rgba(255,120,120,0.35);
          background: rgba(255,0,0,0.08);
          padding: 12px;
          border-radius: 12px;
        }
      `}</style>

      <Card title="Playbook" right={<span className="pill">Stage 2</span>}>
        <p className="muted" style={{ marginTop: 0 }}>
          This is the system reference hub. Brick goal: display the Playbooks cleanly inside Thrive Leagues
          (no external white screens). Next brick: extract rules → structured spec (Adult + Kid voice).
        </p>

        <div className="segTabs" style={{ marginTop: 10 }}>
          <button
            type="button"
            className={`segBtn ${active === "adult" ? "segBtnActive" : ""}`}
            onClick={() => setActive("adult")}
          >
            Adult Playbook
          </button>
          <button
            type="button"
            className={`segBtn ${active === "kid" ? "segBtnActive" : ""}`}
            onClick={() => setActive("kid")}
          >
            Kid Playbook
          </button>
        </div>
      </Card>

      <div className="grid" style={{ gridTemplateColumns: "1.6fr 0.9fr", marginTop: 14 }}>
        <div className="col">
          <div className="playbookViewer">
            <div className="viewerHeader">
              <div className="viewerTitle">
                {active === "kid" ? "Kid Playbook" : "Adult Playbook"}
              </div>
              <div className="viewerMeta">
                <span className="pillMini">{active === "kid" ? "Kid" : "Adult"}</span>
                <button className="ghostLinkBtn" type="button" onClick={openSource}>
                  Open source (.md)
                </button>
              </div>
            </div>

            <div className="viewerBody">
              {status === "loading" ? (
                <p className="statusLine">Loading playbook…</p>
              ) : status === "error" ? (
                <div className="errorBox">
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>Couldn’t load the playbook</div>
                  <div style={{ marginBottom: 10 }}>{error}</div>
                  <div className="muted">
                    Verify these files exist in your repo:
                    <br />
                    <code>/public/playbooks/adult.md</code> and <code>/public/playbooks/kid.md</code>
                    <br />
                    Then wait for deployment and refresh.
                  </div>
                </div>
              ) : (
                <div
                  className="playbookContent"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="col">
          <Card title="Next Brick">
            <p className="muted" style={{ marginTop: 0 }}>
              Wire in the Draft: extract Playbook rules (sections, definitions, scoring hooks), then make searchable content.
            </p>
            <button className="btnGhost" type="button">Draft → Spec (next)</button>
            <div style={{ height: 8 }} />
            <button className="btnGhost" type="button">Spec → UI Copy (next)</button>
          </Card>

          <Card title="File Placement">
            <p className="muted" style={{ marginTop: 0 }}>
              These must live in the repo at:
            </p>
            <div style={{ display: "grid", gap: 8 }}>
              <div className="pillMini" style={{ justifySelf: "start" }}>
                public/playbooks/adult.md
              </div>
              <div className="pillMini" style={{ justifySelf: "start" }}>
                public/playbooks/kid.md
              </div>
            </div>
            <p className="muted" style={{ marginTop: 10 }}>
              After committing, wait for ThriveLeagues to redeploy, then hard refresh.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
