import { Fragment, useEffect, useState } from "react";

import Spinner from "../components/Spinner.jsx";
import { api } from "../api.js";

const PIPELINE_STEPS = [
  {
    label: "Upload",
    sub: "Ingest COA / label",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    label: "Extract",
    sub: "Parse fields",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="13" y2="17" />
      </svg>
    ),
  },
  {
    label: "Compare",
    sub: "Check master data",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
  },
  {
    label: "Score",
    sub: "Calculate risk",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <polyline points="7 14 12 9 16 13 21 8" />
      </svg>
    ),
  },
  {
    label: "Explain",
    sub: "Generate narrative",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: "Save",
    sub: "Audit log entry",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>
    ),
  },
];

export default function SettingsPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .health()
      .then((data) => !cancelled && setHealth(data))
      .catch((e) => !cancelled && setErr(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const apiOk = health?.status === "ok";
  const docIntelOk = !!health?.doc_intel_configured;

  const services = [
    {
      label: "API",
      status: apiOk ? "Online" : "Offline",
      ok: apiOk ? "ok" : "bad",
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M5 6h14M5 18h14" />
        </svg>
      ),
    },
    {
      label: "Service",
      status: health?.service || "—",
      ok: apiOk ? "ok" : "warn",
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="6" rx="1" />
          <rect x="3" y="14" width="18" height="6" rx="1" />
        </svg>
      ),
    },
    {
      label: "Azure Document Intelligence",
      status: docIntelOk ? "Connected" : "Not configured",
      ok: docIntelOk ? "ok" : "warn",
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      label: "LLM explanation provider",
      status: "GitHub Models",
      ok: "ok",
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.4-3.4-1.4-.5-1.2-1.2-1.5-1.2-1.5-.9-.6.1-.6.1-.6 1 .1 1.6 1.1 1.6 1.1.9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.7-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2z" />
        </svg>
      ),
    },
    {
      label: "Decision engine",
      status: "Deterministic",
      ok: "ok",
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
    },
    {
      label: "Audit service",
      status: "Recording",
      ok: "ok",
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l8 4v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="stack settings-page">
      <div className="callout callout--accent">
        <div className="callout__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3 7h7l-5.5 4 2 7-6.5-4.5L5.5 20l2-7L2 9h7z" />
          </svg>
        </div>
        <div>
          <div className="callout__title">
            Deterministic decision engine · LLM explains, does not decide
          </div>
          <div className="callout__body">
            VeriTrace calculates risk and decision deterministically from
            validation findings. The LLM only generates plain-language
            explanations of findings — it does not set status. Final material
            release decisions remain with authorized QA personnel.
          </div>
        </div>
      </div>

      <div className="card status-card">
        <div className="card__header">
          <div>
            <h3 className="card__title">Service status</h3>
            <p className="card__subtitle">
              Live readiness signals for the backend and document integrations.
            </p>
          </div>
        </div>
        <div className="card__body">
          {loading ? (
            <Spinner label="Checking backend…" />
          ) : err ? (
            <div className="banner banner--error">{err}</div>
          ) : (
            <div className="svc-grid">
              {services.map((s) => (
                <div key={s.label} className={`svc-card svc-card--${s.ok}`}>
                  <div className="svc-card__icon" aria-hidden="true">
                    {s.icon}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="svc-card__label">{s.label}</div>
                    <div className="svc-card__status">
                      {s.status}
                      <span className="svc-card__dot" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <div>
            <h3 className="card__title">Verification pipeline</h3>
            <p className="card__subtitle">
              How a document pair becomes a reviewable decision.
            </p>
          </div>
        </div>
        <div className="card__body">
          <div className="pipeline">
            {PIPELINE_STEPS.map((p, i) => (
              <Fragment key={p.label}>
                <div className="pipeline__step">
                  <div className="pipeline__icon" aria-hidden="true">
                    {p.icon}
                  </div>
                  <div className="pipeline__label">{p.label}</div>
                  <div className="pipeline__sub">{p.sub}</div>
                </div>
                {i < PIPELINE_STEPS.length - 1 ? (
                  <div className="pipeline__line" aria-hidden="true" />
                ) : null}
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="settings-grid">
        <div className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Decision and risk scoring</h3>
              <p className="card__subtitle">
                How VeriTrace turns validation findings into risk level and final status.
              </p>
            </div>
          </div>
          <div className="card__body help">
            <p style={{ marginTop: 0 }}>
              The system calculates an aggregate score based on found
              discrepancies. Lower scores indicate higher confidence. Risk score
              = sum of finding scores, capped at <strong>100</strong>.
            </p>

            <div className="score-chips" style={{ marginTop: 14 }}>
              <div className="score-chip score-chip--low">
                <span className="score-chip__range">0 – 20</span>
                <span>Auto-Approve eligible. High confidence match.</span>
              </div>
              <div className="score-chip score-chip--med">
                <span className="score-chip__range">21 – 59</span>
                <span>Manual Review Required. Moderate risk flagged.</span>
              </div>
              <div className="score-chip score-chip--high">
                <span className="score-chip__range">60 – 100</span>
                <span>Auto-Reject recommended. Critical mismatch detected.</span>
              </div>
            </div>

            <div className="callout callout--accent" style={{ marginTop: 14 }}>
              <div className="callout__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12" y2="16.01" />
                </svg>
              </div>
              <div>
                <div className="callout__title">Transparency Note</div>
                <div className="callout__body">
                  The scoring matrix is a configurable prototype heuristic
                  designed to surface risk. A <strong>CRITICAL</strong>{" "}
                  <code>TEST_RESULT_OUT_OF_SPEC</code> finding forces REJECTED
                  regardless of total score. Final release decisions remain
                  with authorized QA personnel.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Finding weights</h3>
              <p className="card__subtitle">Penalty score per discrepancy type.</p>
            </div>
          </div>
          <div className="card__body" style={{ paddingTop: 12 }}>
            <table className="table weight-table">
              <thead>
                <tr>
                  <th>Finding type</th>
                  <th style={{ textAlign: "right" }}>Score</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><code>MISSING_REQUIRED_FIELD</code></td><td style={{ textAlign: "right" }}>+15</td></tr>
                <tr><td><code>BATCH_MISMATCH</code></td><td style={{ textAlign: "right" }}>+35</td></tr>
                <tr><td><code>SUPPLIER_NOT_APPROVED</code></td><td style={{ textAlign: "right" }}>+30</td></tr>
                <tr><td><code>EXPIRY_BELOW_THRESHOLD</code></td><td style={{ textAlign: "right" }}>+20</td></tr>
                <tr><td><code>MISSING_REQUIRED_TEST</code></td><td style={{ textAlign: "right" }}>+25</td></tr>
                <tr><td><code>TEST_RESULT_OUT_OF_SPEC</code></td><td style={{ textAlign: "right" }}>+10 / +20 / +30 / +40</td></tr>
                <tr><td><code>QUANTITY_MISMATCH</code></td><td style={{ textAlign: "right" }}>+15</td></tr>
                <tr><td><code>LOW_EXTRACTION_CONFIDENCE</code> / <code>UNPARSABLE_DOCUMENT</code></td><td style={{ textAlign: "right" }}>+25</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <div>
            <h3 className="card__title">How VeriTrace works</h3>
            <p className="card__subtitle">
              Reference for QA reviewers and auditors.
            </p>
          </div>
        </div>
        <div className="card__body help">
          <ol>
            <li>Extract fields from the COA and material label using Azure Document Intelligence.</li>
            <li>Compare extracted fields against approved material specs and master data.</li>
            <li>Generate deterministic findings with severity and score for each discrepancy.</li>
            <li>Calculate aggregate risk score and decision (APPROVED / NEEDS_REVIEW / REJECTED).</li>
            <li>Summarize findings via GitHub Models or template fallback — the LLM does not decide the outcome.</li>
            <li>Save the result to the read-only audit trail with full evidence.</li>
          </ol>
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <div>
            <h3 className="card__title">Supported documents and current limitations</h3>
            <p className="card__subtitle">
              Honest scope statement for QA reviewers.
            </p>
          </div>
        </div>
        <div className="card__body help">
          <h4>Supported</h4>
          <ul>
            <li>Certificate of Analysis (COA) — PDF, PNG, JPG</li>
            <li>Material Label — PDF, PNG, JPG</li>
            <li>Sample cases — synthetic verification scenarios</li>
          </ul>

          <h4>Not yet analyzed (UI-accepted, backend pending)</h4>
          <ul>
            <li>Supporting documents (delivery notes, packing lists, purchase orders, SDS, ERP/WMS/LIMS exports)</li>
            <li>Notifications and alerts <span className="dev-badge dev-badge--neutral">In development</span></li>
            <li>Account management and role-based permissions <span className="dev-badge dev-badge--neutral">In development</span></li>
            <li>Exportable PDF report <span className="dev-badge dev-badge--neutral">In development</span></li>
          </ul>

          <h4>Current limitations</h4>
          <ul>
            <li>Scoring matrix is a configurable prototype heuristic; production weights should be calibrated with QA SMEs and historical deviation data.</li>
            <li>Parser is optimized for the included synthetic COA / label set and may need expansion for broader real-world layouts.</li>
            <li>Storage is SQLite for the MVP; production deployments should use a managed database.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
