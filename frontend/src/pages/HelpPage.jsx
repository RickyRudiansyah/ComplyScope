/**
 * Help & Documentation — secondary utility page.
 *
 * Topic icons use Material Symbols Outlined to match Claude Design.
 * Contact methods are placeholders; no support backend exists yet.
 */

const TOPICS = [
  {
    icon: "upload_file",
    title: "Uploading documents",
    body:
      "From the Verify page, drag and drop or browse for the Certificate of Analysis and Material Label. Assign each file its document type, then start the verification. Supporting documents may be attached for reference but are not analysed in this release.",
  },
  {
    icon: "fact_check",
    title: "Understanding verification results",
    body:
      "VeriTrace produces a deterministic decision: Approved, Needs Review, or Rejected. The risk score (0–100) is the capped sum of finding weights. 0–20 is auto-approve eligible; 21–59 requires manual QA review; 60–100 is auto-reject. The LLM only summarises findings — it does not set the decision.",
  },
  {
    icon: "search",
    title: "Reading findings & evidence",
    body:
      "Each finding shows its type code, severity, score contribution, and supporting evidence. The Extracted Details tab presents a side-by-side field comparison, COA test results, COA metadata, and material label fields.",
  },
  {
    icon: "history_edu",
    title: "Using verification history",
    body:
      "The History page is a read-only audit trail. Filter by source or decision, search by analysis ID, material, or supplier. Selecting a row reveals the overview report; the full report opens in a dedicated view.",
  },
  {
    icon: "storage",
    title: "Master data reference",
    body:
      "The Master Data page shows approved materials, required test specifications, and approved suppliers used by the verification engine. Records are read-only in this release.",
  },
  {
    icon: "science",
    title: "Sample cases",
    body:
      "Sample cases use synthetic data to demonstrate common outcomes: valid match, batch mismatch, out-of-specification test result, unapproved supplier, and combined issues.",
  },
  {
    icon: "shield",
    title: "Audit & compliance",
    body:
      "All verification records are saved to an immutable audit trail. Records cannot be modified or deleted from the UI. Final material release decisions remain with authorized QA personnel.",
  },
  {
    icon: "settings",
    title: "System status & scoring policy",
    body:
      "The Settings page shows service status (from /health), the verification pipeline, the risk scoring bands, and the finding weight table. It also describes how VeriTrace makes deterministic decisions.",
  },
];

export default function HelpPage() {
  return (
    <div className="stack">
      <div className="info-tile" role="note">
        <div className="info-tile__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12" y2="16.01" />
          </svg>
        </div>
        <div>
          <div className="info-tile__title">Help &amp; documentation</div>
          <div className="info-tile__hint">
            Reference material for QA reviewers and auditors. Final material
            release decisions remain with authorized QA personnel.
          </div>
        </div>
      </div>

      <div className="help-grid">
        {TOPICS.map((t) => (
          <div key={t.title} className="card help-card">
            <div className="card__body">
              <div className="help-card__head">
                <div className="help-card__icon" aria-hidden="true">
                  <span className="material-symbols-outlined">{t.icon}</span>
                </div>
                <h3 className="help-card__title">{t.title}</h3>
              </div>
              <p className="help-card__body">{t.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card__header">
          <div>
            <h3 className="card__title">Contact support</h3>
            <p className="card__subtitle">
              Reach out for system issues, access questions, or to report a
              discrepancy in a verification record.
            </p>
          </div>
          <span className="dev-badge">Backend pending</span>
        </div>
        <div className="card__body">
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            <div className="card" style={{ boxShadow: "none" }}>
              <div className="card__body">
                <div className="muted" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>
                  System support
                </div>
                <div style={{ fontWeight: 600 }}>VeriTrace Technical Support</div>
                <div className="muted" style={{ fontSize: 12.5 }}>
                  support@veritrace.com (placeholder)
                </div>
                <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
                  Response time: 1 business day
                </div>
              </div>
            </div>
            <div className="card" style={{ boxShadow: "none" }}>
              <div className="card__body">
                <div className="muted" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 4 }}>
                  QA helpdesk
                </div>
                <div style={{ fontWeight: 600 }}>Internal IT &amp; QA Helpdesk</div>
                <div className="muted" style={{ fontSize: 12.5 }}>
                  helpdesk@pharmasystems.internal (placeholder)
                </div>
                <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
                  For access, permissions, and account questions
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
