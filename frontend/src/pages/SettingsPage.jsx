import { useEffect, useState } from "react";

import Spinner from "../components/Spinner.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { api } from "../api.js";

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

  return (
    <div className="stack settings-page">
      <div className="settings-grid">
        <div className="card status-card">
          <div className="card__header">
            <div>
              <h3 className="card__title">System status</h3>
              <p className="card__subtitle">
                Readiness signals for the backend and document integrations.
              </p>
            </div>
          </div>
          <div className="card__body">
            {loading ? (
              <Spinner label="Checking backend..." />
            ) : err ? (
              <div className="banner banner--error">{err}</div>
            ) : (
              <>
                <div className="kv">
                  <span className="kv__label">API</span>
                  <StatusBadge
                    value={health?.status === "ok" ? "ONLINE" : "OFFLINE"}
                    kind={health?.status === "ok" ? "ok" : "bad"}
                  />
                </div>
                <div className="kv">
                  <span className="kv__label">Service</span>
                  <span style={{ fontFamily: "var(--font-mono)" }}>
                    {health?.service || "-"}
                  </span>
                </div>
                <div className="kv">
                  <span className="kv__label">Azure Document Intelligence</span>
                  <StatusBadge
                    value={health?.doc_intel_configured ? "CONNECTED" : "NOT CONFIGURED"}
                    kind={health?.doc_intel_configured ? "ok" : "warn"}
                  />
                </div>
                <div className="kv">
                  <span className="kv__label">Explanation provider</span>
                  <StatusBadge value="GitHub Models" kind="info" />
                </div>
                <div className="kv">
                  <span className="kv__label">Decision engine</span>
                  <StatusBadge value="Deterministic" kind="info" />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Verification flow</h3>
              <p className="card__subtitle">
                How a document pair becomes a reviewable decision.
              </p>
            </div>
          </div>
          <div className="card__body help">
            <ol>
              <li>Extract fields from the COA and material label.</li>
              <li>Compare against approved material specs and supplier records.</li>
              <li>Generate validation findings.</li>
              <li>Calculate risk score and decision.</li>
              <li>Summarize the result for QA review.</li>
            </ol>
            <p style={{ marginTop: 14 }} className="muted">
              Final status comes from validation findings and the risk policy.
              Narrative explanations are generated after the decision is already set.
            </p>
          </div>
          <div className="card__footer">
            Sample records are included for repeatable verification checks.
          </div>
        </div>
      </div>

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
          <h4>Risk score</h4>
          <p>
            Risk score = sum of finding scores, capped at <strong>100</strong>.
          </p>

          <h4>Risk level</h4>
          <ul>
            <li><strong>0-20</strong> {"->"} LOW</li>
            <li><strong>21-59</strong> {"->"} MEDIUM</li>
            <li><strong>60-100</strong> {"->"} HIGH</li>
          </ul>

          <h4>Decision policy</h4>
          <ul>
            <li><strong>0-20</strong> {"->"} APPROVED</li>
            <li><strong>21-59</strong> {"->"} NEEDS_REVIEW</li>
            <li><strong>60-100</strong> {"->"} REJECTED</li>
            <li>
              A <strong>CRITICAL</strong> <code>TEST_RESULT_OUT_OF_SPEC</code>{" "}
              finding forces REJECTED regardless of total score.
            </li>
          </ul>

          <h4>Finding weights</h4>
          <table className="table weight-table">
            <thead>
              <tr>
                <th>Finding type</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>MISSING_REQUIRED_FIELD</code></td>
                <td>+15</td>
              </tr>
              <tr>
                <td><code>BATCH_MISMATCH</code></td>
                <td>+35</td>
              </tr>
              <tr>
                <td><code>SUPPLIER_NOT_APPROVED</code></td>
                <td>+30</td>
              </tr>
              <tr>
                <td><code>EXPIRY_BELOW_THRESHOLD</code></td>
                <td>+20</td>
              </tr>
              <tr>
                <td><code>MISSING_REQUIRED_TEST</code></td>
                <td>+25</td>
              </tr>
              <tr>
                <td><code>TEST_RESULT_OUT_OF_SPEC</code></td>
                <td>+10 / +20 / +30 / +40 by parameter criticality</td>
              </tr>
              <tr>
                <td><code>QUANTITY_MISMATCH</code></td>
                <td>+15</td>
              </tr>
              <tr>
                <td><code>LOW_EXTRACTION_CONFIDENCE</code> / <code>UNPARSABLE_DOCUMENT</code></td>
                <td>+25</td>
              </tr>
            </tbody>
          </table>

          <p className="muted scoring-note">
            The scoring matrix is transparent and reviewable. Material release
            remains with authorized QA personnel.
          </p>
        </div>
        <div className="card__footer">
          Decision logic is computed from validator findings and the configured risk policy.
        </div>
      </div>
    </div>
  );
}
