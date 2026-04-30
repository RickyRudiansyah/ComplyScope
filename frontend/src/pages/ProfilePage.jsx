/**
 * Static User Profile preview.
 *
 * Restored from the Claude/Stitch design. Authentication and account
 * management are not wired up yet; the page is a clearly-labeled
 * placeholder so the design stays visible.
 */
export default function ProfilePage({ onBack }) {
  const fields = [
    ["Full name", "QA Personnel"],
    ["Role", "QA Analyst"],
    ["Email", "qa@veritrace.com"],
    ["Department", "Quality Assurance"],
    ["Access level", "Standard — Read / Verify"],
    ["Last login", "—"],
    ["Protocol version", "v4.2"],
    ["Organization", "VeriTrace Pharma Systems"],
  ];

  return (
    <div className="stack">
      <div className="dev-banner" role="note">
        <div className="dev-banner__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12" y2="16.01" />
          </svg>
        </div>
        <div>
          <strong>Account management is in development.</strong>{" "}
          This is a static preview of the profile screen. Authentication and
          account-update endpoints are not wired up yet.
        </div>
      </div>

      <div className="card">
        <div className="card__body row" style={{ gap: 18, alignItems: "center" }}>
          <div
            className="avatar-btn"
            style={{ width: 64, height: 64, fontSize: 18, cursor: "default" }}
            aria-hidden="true"
          >
            QA
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--c-text)" }}>
              QA Personnel
            </div>
            <div className="muted" style={{ marginTop: 2 }}>
              qa@veritrace.com
            </div>
            <div style={{ marginTop: 8 }}>
              <span className="badge badge--info">QA Analyst</span>
              <span className="dev-badge dev-badge--neutral" style={{ marginLeft: 6 }}>
                Static
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <div>
            <h3 className="card__title">Account details</h3>
            <p className="card__subtitle">
              Read-only preview. Editable account profile is in development.
            </p>
          </div>
        </div>
        <div className="card__body">
          {fields.map(([k, v]) => (
            <div key={k} className="kv">
              <span className="kv__label">{k}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="row" style={{ gap: 10 }}>
        <button type="button" className="btn" onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className="btn"
          disabled
          title="Account management is in development"
        >
          Manage profile
        </button>
      </div>
    </div>
  );
}
