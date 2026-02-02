import React, { useMemo, useState } from "react";

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

function Pill({ children }) {
  return <span className="pill">{children}</span>;
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="navLink"
      style={{
        cursor: "pointer",
        outline: "none",
        background: active
          ? "linear-gradient(135deg, rgba(109,91,255,.35), rgba(0,212,255,.18))"
          : "transparent",
        borderColor: active ? "rgba(109,91,255,.35)" : "transparent",
        color: active ? "var(--text)" : "var(--muted)",
      }}
    >
      {children}
    </button>
  );
}

function PdfEmbed({ title, src }) {
  // We can’t reliably “detect if file exists” without a fetch,
  // so we show a simple embed + fallback instructions.
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,.10)",
        borderRadius: 14,
        overflow: "hidden",
        background: "rgba(0,0,0,.18)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          alignItems: "center",
          padding: 12,
          borderBottom: "1px solid rgba(255,255,255,.10)",
        }}
      >
        <div style={{ fontWeight: 900 }}>{title}</div>
        <a className="link" href={src} target="_blank" rel="noreferrer">
          Open in new tab
        </a>
      </div>

      {/* PDF viewer */}
      <iframe
        title={title}
        src={src}
        style={{
          width: "100%",
          height: 720,
          border: "none",
          display: "block",
          background: "rgba(0,0,0,.18)",
        }}
      />

      {/* Fallback instructions */}
      <div style={{ padding: 12 }}>
        <div className="muted" style={{ fontSize: 12 }}>
          If you see a blank frame or an error, the PDF likely isn’t in the repo yet.
          Put the file in:
          <span className="mono" style={{ marginLeft: 6 }}>
            public/playbooks/
          </span>
          and name it:
          <span className="mono" style={{ marginLeft: 6 }}>{src.replace("/", "")}</span>
        </div>
      </div>
    </div>
  );
}

export default function Playbook() {
  const [mode, setMode] = useState("adult"); // "adult" | "kid"

  const pdf = useMemo(() => {
    // These paths assume files live in /public/playbooks/
    // Example full paths in the repo:
    // public/playbooks/adult-playbook.pdf
    // public/playbooks/kid-playbook.pdf
    if (mode === "adult") {
      return {
        title: "Adult Playbook (PDF)",
        src: "/playbooks/adult-playbook.pdf",
      };
    }
    return {
      title: "Kid Playbook (PDF)",
      src: "/playbooks/kid-playbook.pdf",
    };
  }, [mode]);

  return (
    <div className="pageWrap">
      <Card
        title="Playbook"
        right={
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Pill>Stage 2</Pill>
            <Pill>Live</Pill>
          </div>
        }
      >
        <p className="muted" style={{ marginTop: 0 }}>
          This is the “system reference” hub. Brick goal: display the Playbooks now (PDF),
          then later we’ll wire the structured draft (rules → mechanics → UI copy).
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <TabButton active={mode === "adult"} onClick={() => setMode("adult")}>
            Adult Playbook
          </TabButton>
          <TabButton active={mode === "kid"} onClick={() => setMode("kid")}>
            Kid Playbook
          </TabButton>
        </div>
      </Card>

      <div className="grid" style={{ gridTemplateColumns: "1fr 360px", marginTop: 14 }}>
        {/* LEFT: viewer */}
        <section className="col" style={{ gap: 14 }}>
          <Card title="Playbook Viewer" right={<Pill>{mode === "adult" ? "Adult" : "Kid"}</Pill>}>
            <PdfEmbed title={pdf.title} src={pdf.src} />
          </Card>
        </section>

        {/* RIGHT: notes / next brick */}
        <aside className="col" style={{ gap: 14 }}>
          <Card title="Next Brick">
            <p className="muted" style={{ marginTop: 0 }}>
              Wire in the Draft: extract Playbook rules into a structured spec (sections,
              definitions, scoring hooks), then render it here as searchable content.
            </p>
            <div className="tools">
              <button className="btnGhost" type="button">
                Draft → Spec (next)
              </button>
              <button className="btnGhost" type="button">
                Spec → UI Copy (next)
              </button>
            </div>
          </Card>

          <Card title="File Placement">
            <p className="muted" style={{ marginTop: 0 }}>
              Put your PDFs here in the repo:
            </p>
            <div className="row" style={{ marginTop: 10 }}>
              <span className="rowLeft">
                <span className="dot" />
                <span className="mono">public/playbooks/adult-playbook.pdf</span>
              </span>
            </div>
            <div className="row" style={{ marginTop: 10 }}>
              <span className="rowLeft">
                <span className="dot" />
                <span className="mono">public/playbooks/kid-playbook.pdf</span>
              </span>
            </div>
            <p className="muted" style={{ marginTop: 10 }}>
              After adding them, commit + sync and refresh the Playbook page.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
