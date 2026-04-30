/**
 * Help & Documentation — secondary utility page restored from the
 * Claude/Stitch design. Not exposed in primary navigation.
 *
 * Contact methods are placeholders; no support backend exists yet.
 */

const TOPICS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
    title: "Uploading documents",
    body:
      "Go to the Verify page. Drag and drop or browse for your COA and Material Label files. Assign each file its document type, then click Run verification. Supporting documents may be attached but are not analyzed in the current version.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4" />
        <path d="M12 3l8 4v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
      </svg>
    ),
    title: "Understanding verification results",
    body:
      "VeriTrace produces a deterministic decision: APPROVED, NEEDS REVIEW, or REJECTED. The risk score (0–100) is the sum of finding weights. 0–20 is low risk; 21–59 needs manual review; 60–100 triggers rejection. The LLM only generates summary text — it does not influence the final decision.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    title: "Reading findings & evidence",
    body:
      "Each finding shows its type code, severity, score contribution, and evidence key-value pairs. Use the Extracted Details tab to view side-by-side field comparison, COA test results, COA metadata, and label fields.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
    title: "Using verification history",
    body:
      "The History page is a read-only audit trail. Use filters to narrow by source or decision. Click any row for a side summary, or open the Full Report for a complete audit-style view.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="8" ry="3" />
        <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
        <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
      </svg>
    ),
    title: "Master data reference",
    body:
      "The Master Data page shows approved materials, required test specifications, and approved suppliers used by the validation engine. It is read-only in the current version.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 9h6v6h-6z" />
        <path d="M3 12h2M19 12h2M12 3v2M12 19v2" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
    title: "Sample cases",
    body:
      "Sample cases use synthetic data to demonstrate common outcomes: valid batch, batch mismatch, out-of-spec test results, unapproved supplier, and combined issues.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l8 4v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
      </svg>
    ),
    title: "Audit & compliance",
    body:
      "All verifications are saved to an immutable audit trail. Records cannot be modified or deleted from the UI. Final release decisions remain the responsibility of authorized QA personnel.",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19 12a7 7 0 1 1-14 0 7 7 0 0 1 14 0z" />
      </svg>
    ),
    title: "System status & scoring policy",
    body:
      "The Settings page shows service status, the verification pipeline, the risk scoring matrix, and the finding weight table. It also explains how VeriTrace makes deterministic decisions.",
  },
];

export default function HelpPage({ onOpenPolicy }) {
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
          <div className="info-tile__title">Help & documentation</div>
          <div className="info-tile__hint">
            VeriTrace is a prototype system. All verifications must be reviewed
            by authorized QA personnel before any material release action.
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {TOPICS.map((t) => (
          <div key={t.title} className="card">
            <div className="card__body">
              <div className="section-head">
                <div className="section-head__icon" aria-hidden="true">
                  {t.icon}
                </div>
                <div>
                  <h3 className="section-head__title">{t.title}</h3>
                </div>
              </div>
              <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>
                {t.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card__header">
          <div>
            <h3 className="card__title">Contact support</h3>
            <p className="card__subtitle">
              Reach out for issues, questions, or to report a discrepancy in
              verification results.
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
                <div style={{ fontWeight: 600 }}>Internal IT & QA Helpdesk</div>
                <div className="muted" style={{ fontSize: 12.5 }}>
                  helpdesk@pharmasystems.internal (placeholder)
                </div>
                <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
                  For access, permissions, and account questions
                </div>
              </div>
            </div>
          </div>
          <div className="row" style={{ gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn"
              onClick={() => onOpenPolicy?.("support")}
            >
              Open support ticket
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => onOpenPolicy?.("audit")}
            >
              Audit log protocol
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => onOpenPolicy?.("privacy")}
            >
              Privacy policy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
