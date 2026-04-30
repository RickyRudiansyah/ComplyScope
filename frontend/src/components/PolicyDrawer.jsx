import { useEffect } from "react";

/**
 * Generic right-side drawer used for footer secondary links
 * (Privacy Policy, Audit Log Protocol, System Status, Contact Support).
 */

const POLICIES = {
  privacy: {
    title: "Privacy Policy",
    devNote:
      "Policy preview — final wording should be reviewed before production use.",
    body: [
      {
        h: "Data we process",
        p:
          "VeriTrace processes Certificate of Analysis and Material Label files to extract structured fields and verify them against approved master data. Supporting documents may be uploaded in the interface, but are not analyzed or stored in the current MVP.",
      },
      {
        h: "Where data lives",
        p:
          "Verification records are stored in a controlled local audit-trail database for review and traceability. Master data is read-only in VeriTrace and managed through controlled QA processes.",
      },
      {
        h: "Third-party services",
        p:
          "Document extraction is performed through Azure Document Intelligence. Explanation services may summarize deterministic findings, but they do not determine verification status or final material release decisions.",
      },
      {
        h: "Retention",
        p:
          "Verification records are maintained as part of the audit trail. Records cannot be edited or deleted from the VeriTrace interface.",
      },
      {
        h: "QA responsibility",
        p:
          "VeriTrace supports document review and risk triage. Final material release decisions remain the responsibility of authorized QA personnel.",
      },
    ],
  },
  audit: {
    title: "Audit Log Protocol",
    devNote:
      "Audit export and tamper-evidence controls are planned for a future release.",
    body: [
      {
        h: "What is recorded",
        p:
          "Each verification record includes the analysis ID, decision, risk score, risk level, findings, evidence, extracted fields, source type, and creation timestamp.",
      },
      {
        h: "Read-only by design",
        p:
          "Verification history is read-only in VeriTrace. Records cannot be edited, deleted, or overridden from the interface, supporting traceability for QA review.",
      },
      {
        h: "Evidence and review",
        p:
          "Findings are stored with supporting evidence where available, so reviewers can trace discrepancies back to source document values and approved master data.",
      },
      {
        h: "Final accountability",
        p:
          "The decision engine is deterministic and reviewable. Final material release decisions remain the responsibility of authorized QA personnel.",
      },
    ],
  },
  status: {
    title: "System Status",
    devNote: "Public status page is in development.",
    body: [
      {
        h: "Live status pill",
        p:
          "The status pill in the header reflects a live /api/health probe of the VeriTrace backend.",
      },
      {
        h: "Component health",
        p:
          "The Settings page shows per-component status: API, Azure Document Intelligence, explanation provider, and decision engine.",
      },
      {
        h: "Incident communication",
        p:
          "A public incident history and uptime feed are not yet wired up. Contact your internal IT helpdesk for outage reports.",
      },
    ],
  },
  support: {
    title: "Contact Support",
    devNote:
      "Support ticket submission is planned for a future release.",
    body: [
      {
        h: "VeriTrace product support",
        p:
          "support@veritrace.com — for questions about verification results, extraction quality, findings, or evidence display.",
      },
      {
        h: "Internal IT & QA helpdesk",
        p:
          "helpdesk@pharmasystems.internal — for access, account, permissions, and organization-specific support.",
      },
      {
        h: "What to include",
        p:
          "When reporting an issue, include the analysis ID, source type, material name, batch number, and a short description of the unexpected behavior.",
      },
    ],
    note:
      "Do not include sensitive production data in support requests unless approved by your organization's quality process.",
  },
};

export default function PolicyDrawer({ topic, onClose }) {
  const open = Boolean(topic);
  const data = topic ? POLICIES[topic] : null;

  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <>
      <div
        className={"drawer-backdrop" + (open ? " drawer-backdrop--shown" : "")}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={"drawer" + (open ? " drawer--open" : "")}
        role="dialog"
        aria-label={data?.title || "Policy"}
        aria-hidden={!open}
      >
        <div className="drawer__header">
          <h3 className="drawer__title">{data?.title || ""}</h3>
          <button
            type="button"
            className="drawer__close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="drawer__body">
          {data ? (
            <>
              <div className="dev-banner" style={{ marginBottom: 14 }}>
                <div className="dev-banner__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12" y2="16.01" />
                  </svg>
                </div>
                <div>{data.devNote}</div>
              </div>
              {data.body.map((b) => (
                <div key={b.h}>
                  <h4>{b.h}</h4>
                  <p>{b.p}</p>
                </div>
              ))}
              {data.note ? (
                <p className="drawer__note">{data.note}</p>
              ) : null}
            </>
          ) : null}
        </div>
      </aside>
    </>
  );
}
