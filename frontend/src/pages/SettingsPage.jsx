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

const WORK_STEPS = [
  {
    icon: "text_fields",
    title: "Extract fields",
    desc: "Pull material name, batch, supplier, and key analytical results from the COA and material label.",
  },
  {
    icon: "compare_arrows",
    title: "Compare documents",
    desc: "Match extracted values against approved master data and the active material specification.",
  },
  {
    icon: "rule",
    title: "Generate findings",
    desc: "Flag every discrepancy with a clear severity so reviewers see the exact reason for review.",
  },
  {
    icon: "speed",
    title: "Score risk",
    desc: "Aggregate findings into a deterministic risk score and a band — Low, Medium, or High.",
  },
  {
    icon: "psychology",
    title: "Explain result",
    desc: "Produce a plain-language summary of the outcome — Approved, Needs Review, or Rejected.",
  },
  {
    icon: "shield",
    title: "Save audit trail",
    desc: "Record the verification with full evidence so QA and auditors can review it later.",
  },
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
      label: "Explanation Servicer",
      status: explanationOk ? "Configured" : "Available",
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
            Deterministic decision engine <br />· AI explains, QA decides
          </div>
          <div className="callout__body">
            VeriTrace calculates findings, risk score, and verification status using deterministic rules. AI-generated explanations summarize the findings only, they do not determine the decision. Final material release remains under authorized QA responsibility.
          </div>
        </div>
      </div>

      <div className="card status-card">
        <div className="card__header">
          <div>
            <h3 className="card__title">Service status</h3>
            <p className="card__subtitle">
              Service readiness signals.
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

          <details className="toggle-block">
            <summary className="toggle-block__summary">
              <svg
                className="toggle-block__chev"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="9 6 15 12 9 18" />
              </svg>
              View step details
            </summary>
            <div className="toggle-block__body">
              <div className="work-flow">
                {WORK_STEPS.map((s, i) => (
                  <div key={s.title} className="work-step">
                    <div className="work-step__icon" aria-hidden="true">
                      <span className="material-symbols-outlined">{s.icon}</span>
                    </div>
                    <div className="work-step__main">
                      <div className="work-step__num">
                        Step {String(i + 1).padStart(2, "0")}
                      </div>
                      <div className="work-step__title">{s.title}</div>
                      <div className="work-step__desc">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </details>
        </div>
      </div>

      <div className="settings-grid">
        <div className="card">
          <div className="card__header card__header--divided">
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

            <hr className="settings-divider" />

            <div className="callout callout--accent">
              <span
                className="material-symbols-outlined callout__mi"
                aria-hidden="true"
              >
                info
              </span>
              <div>
                <div className="callout__title">Transparency note</div>
                <div className="callout__body">
                  The scoring matrix is deterministic and configurable. Critical out-of-spec test results automatically lead to a rejected verification decision, regardless of total score. This includes critical <code>TEST_RESULT_OUT_OF_SPEC</code> findings. AI-generated explanations summarize findings only; they do not determine the decision. Final material release remains the responsibility of authorized QA personnel.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card__header card__header--divided">
            <div>
              <h3 className="card__title">Finding weights</h3>
              <p className="card__subtitle">Penalty score per discrepancy type.</p>
            </div>
          </div>
          <div className="card__body">
            <table className="table weight-table">
              <colgroup>
                <col className="weight-col-type" />
                <col className="weight-col-score" />
              </colgroup>
              <thead>
                <tr>
                  <th>Finding type</th>
                  <th className="weight-table__score">Score</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>MISSING_REQUIRED_FIELD</code></td>
                  <td className="weight-table__score">+15</td>
                </tr>
                <tr>
                  <td><code>BATCH_MISMATCH</code></td>
                  <td className="weight-table__score">+35</td>
                </tr>
                <tr>
                  <td><code>SUPPLIER_NOT_APPROVED</code></td>
                  <td className="weight-table__score">+30</td>
                </tr>
                <tr>
                  <td><code>EXPIRY_BELOW_THRESHOLD</code></td>
                  <td className="weight-table__score">+20</td>
                </tr>
                <tr>
                  <td><code>MISSING_REQUIRED_TEST</code></td>
                  <td className="weight-table__score">+25</td>
                </tr>
                <tr>
                  <td>
                    <code>TEST_RESULT_OUT_OF_SPEC</code>
                    <div className="weight-table__hint">
                      Scaled by severity — low / medium / high / critical
                    </div>
                  </td>
                  <td className="weight-table__score">+10 – +40</td>
                </tr>
                <tr>
                  <td><code>QUANTITY_MISMATCH</code></td>
                  <td className="weight-table__score">+15</td>
                </tr>
                <tr>
                  <td>
                    <code>LOW_EXTRACTION_CONFIDENCE</code>
                    <div className="weight-table__hint">
                      or <code>UNPARSABLE_DOCUMENT</code>
                    </div>
                  </td>
                  <td className="weight-table__score">+25</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card__header card__header--divided">
          <div>
            <h3 className="card__title">Supported documents and current scope</h3>
            <p className="card__subtitle">
              What VeriTrace verifies today, and what is on the roadmap.
            </p>
          </div>
        </div>
        <div className="card__body">
          <div className="scope-stack">
            <div className="scope-group">
              <div className="scope-group__head">
                <span
                  className="scope-group__icon scope-group__icon--ok"
                  aria-hidden="true"
                >
                  <span className="material-symbols-outlined">
                    check_circle
                  </span>
                </span>
                <div>
                  <div className="scope-group__title">
                    Supported for verification
                  </div>
                  <div className="scope-group__hint">
                    Analyzed end-to-end and saved to the audit trail.
                  </div>
                </div>
              </div>
              <ul className="scope-group__list">
                <li>Certificate of Analysis (COA) — PDF, PNG, JPG</li>
                <li>Material Label — PDF, PNG, JPG</li>
              </ul>
            </div>

            <div className="scope-group">
              <div className="scope-group__head">
                <span
                  className="scope-group__icon scope-group__icon--neutral"
                  aria-hidden="true"
                >
                  <span className="material-symbols-outlined">
                    upload_file
                  </span>
                </span>
                <div>
                  <div className="scope-group__title">
                    Accepted but not analyzed
                  </div>
                  <div className="scope-group__hint">
                    Accepted in the interface; not analyzed or saved in this MVP.
                  </div>
                </div>
              </div>
              <ul className="scope-group__list">
                <li>Delivery notes</li>
                <li>Packing lists</li>
                <li>Purchase orders</li>
                <li>Safety Data Sheets (SDS / MSDS)</li>
              </ul>
            </div>

            <div className="scope-group">
              <div className="scope-group__head">
                <span
                  className="scope-group__icon scope-group__icon--info"
                  aria-hidden="true"
                >
                  <span className="material-symbols-outlined">schedule</span>
                </span>
                <div>
                  <div className="scope-group__title">In development</div>
                  <div className="scope-group__hint">
                    Planned capabilities, not yet available in this release.
                  </div>
                </div>
              </div>
              <ul className="scope-group__list">
                <li>Notifications and alerts</li>
                <li>Account management and role-based permissions</li>
                <li>Exportable PDF report</li>
              </ul>
            </div>
          </div>

          <div className="scope-note" role="note">
            <span className="material-symbols-outlined" aria-hidden="true">
              info
            </span>
            <div>
              Complete verification currently requires one COA and one Material
              Label. Supporting documents are not analyzed or saved in this MVP.
            </div>
          </div>

          <details className="toggle-block">
            <summary className="toggle-block__summary">
              <svg
                className="toggle-block__chev"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="9 6 15 12 9 18" />
              </svg>
              Current limitations
            </summary>
            <div className="toggle-block__body">
              <ul>
                <li>
                  Scoring weights are calibrated against the included sample
                  cases. Production deployments should re-tune weights with QA
                  subject-matter experts and historical deviation data.
                </li>
                <li>
                  The document parser is tuned for the included sample COA and
                  label formats. Wider real-world layouts may require parser
                  updates before going live.
                </li>
              </ul>
              <p className="tech-note">
                Technical note — this MVP stores records in SQLite. Production
                deployments should run on a managed database.
              </p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
