import { Fragment, useEffect, useState } from "react";

import Spinner from "../components/Spinner.jsx";
import { api } from "../api.js";

const PIPELINE_STEPS = [
  { label: "Upload", sub: "Ingest COA / label", icon: "upload_file" },
  { label: "Extract", sub: "Parse entities", icon: "text_fields" },
  { label: "Compare", sub: "Check master data", icon: "compare_arrows" },
  { label: "Score", sub: "Calculate risk", icon: "score" },
  { label: "Explain", sub: "Generate narrative", icon: "psychology" },
  { label: "Save", sub: "Audit log entry", icon: "save" },
];

/**
 * Maps GET /health response fields to the Service Status cards.
 *
 * Backend contract (backend/schemas.py · HealthResponse):
 *   status                    → API readiness ("ok" or other)
 *   service                   → service name (display only)
 *   doc_intel_configured      → Azure Document Intelligence configured (extraction)
 *   azure_openai_configured   → Azure OpenAI / explanation provider configured
 *
 * Items without a /health field show "Backend integration pending" so we
 * never fabricate a live state we can't observe.
 */
function buildServices(health) {
  const apiOk = health?.status === "ok";
  const extractionOk = !!health?.doc_intel_configured;
  const explanationOk = !!health?.azure_openai_configured;
  return [
    {
      icon: "rule",
      label: "Extraction Engine",
      status: extractionOk ? "Operational" : "Not configured",
      ok: extractionOk,
      hint: "Azure Document Intelligence (doc_intel_configured)",
    },
    {
      icon: "table_chart",
      label: "Master Data",
      status: apiOk ? "Connected" : "Unavailable",
      ok: apiOk,
      hint: "API status (/health.status)",
    },
    {
      icon: "analytics",
      label: "Risk Engine",
      status: apiOk ? "Operational" : "Unavailable",
      ok: apiOk,
      hint: "Deterministic, runs in process",
    },
    {
      icon: "shield",
      label: "Audit Service",
      status: apiOk ? "Recording" : "Unavailable",
      ok: apiOk,
      hint: "API status (/health.status)",
    },
    {
      icon: "psychology",
      label: "Explanation Provider",
      status: explanationOk ? "Configured" : "Template fallback",
      ok: explanationOk,
      hint: "Azure OpenAI (azure_openai_configured)",
    },
  ];
}

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

  const services = buildServices(health);

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
              Readiness signals derived from the <code>/health</code> endpoint.
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
                <div
                  key={s.label}
                  className={`svc-card ${s.ok ? "svc-card--ok" : "svc-card--warn"}`}
                  title={s.hint}
                >
                  <div
                    className={`svc-card__tile ${s.ok ? "svc-card__tile--ok" : "svc-card__tile--warn"}`}
                    aria-hidden="true"
                  >
                    <span className="material-symbols-outlined">{s.icon}</span>
                  </div>
                  <div className="svc-card__main">
                    <div className="svc-card__label">{s.label}</div>
                    <div className="svc-card__status">
                      <span>{s.status}</span>
                      <span
                        className={`svc-card__dot ${s.ok ? "svc-card__dot--ok" : "svc-card__dot--warn"}`}
                        aria-hidden="true"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card pipeline-card">
        <div className="card__header">
          <div className="row" style={{ gap: 8 }}>
            <span
              className="material-symbols-outlined"
              aria-hidden="true"
              style={{ fontSize: 20, color: "var(--c-secondary)" }}
            >
              account_tree
            </span>
            <h3 className="card__title">Verification pipeline</h3>
          </div>
          <p className="card__subtitle">
            How a document set becomes a reviewable verification record.
          </p>
        </div>
        <div className="card__body">
          <div className="pipeline">
            {PIPELINE_STEPS.map((p, i) => (
              <Fragment key={p.label}>
                <div className="pipeline__step">
                  <div className="pipeline__circle" aria-hidden="true">
                    <span className="material-symbols-outlined">{p.icon}</span>
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
          <div className="card__body">
            <p className="settings-intro">
              Risk score is the capped sum of deterministic finding weights.
              Lower scores indicate higher confidence in the verification record.
            </p>

            <div className="score-bands">
              <div className="score-band score-band--low">
                <span className="score-band__range">0 – 20</span>
                <span className="score-band__desc">
                  Auto-approve eligible. High-confidence match.
                </span>
              </div>
              <div className="score-band score-band--med">
                <span className="score-band__range">21 – 59</span>
                <span className="score-band__desc">
                  Manual QA review required. Moderate risk flagged.
                </span>
              </div>
              <div className="score-band score-band--high">
                <span className="score-band__range">60 – 100</span>
                <span className="score-band__desc">
                  Auto-reject recommended. Critical mismatch detected.
                </span>
              </div>
            </div>

            <div className="callout callout--accent" style={{ marginTop: 16 }}>
              <span
                className="material-symbols-outlined callout__mi"
                aria-hidden="true"
              >
                info
              </span>
              <div>
                <div className="callout__title">Transparency note</div>
                <div className="callout__body">
                  The scoring matrix is configurable and deterministic. A
                  CRITICAL <code>TEST_RESULT_OUT_OF_SPEC</code> finding forces
                  REJECTED regardless of total score. The LLM only summarises
                  findings — it does not set the final decision. Material
                  release decisions remain with authorized QA personnel.
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
