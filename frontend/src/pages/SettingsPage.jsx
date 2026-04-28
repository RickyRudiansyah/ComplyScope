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
    <div className="settings-grid">
      <div className="card">
        <div className="card__header">
          <div>
            <h3 className="card__title">System status</h3>
            <p className="card__subtitle">
              Live readiness signal for the backend and integrations.
            </p>
          </div>
        </div>
        <div className="card__body">
          {loading ? (
            <Spinner label="Checking backend…" />
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
                  {health?.service || "—"}
                </span>
              </div>
              <div className="kv">
                <span className="kv__label">
                  Azure Document Intelligence
                </span>
                <StatusBadge
                  value={health?.doc_intel_configured ? "CONFIGURED" : "NOT CONFIGURED"}
                  kind={health?.doc_intel_configured ? "ok" : "warn"}
                />
              </div>
              <div className="kv">
                <span className="kv__label">Azure OpenAI</span>
                <StatusBadge
                  value={
                    health?.azure_openai_configured ? "CONFIGURED" : "NOT CONFIGURED"
                  }
                  kind={health?.azure_openai_configured ? "ok" : "warn"}
                />
              </div>
              <div className="kv">
                <span className="kv__label">Decision engine</span>
                <StatusBadge value="DETERMINISTIC" kind="info" />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <div>
            <h3 className="card__title">How VeriTrace works</h3>
            <p className="card__subtitle">
              The verification pipeline at a glance.
            </p>
          </div>
        </div>
        <div className="card__body help">
          <ol>
            <li>Azure Document Intelligence extracts text, layout, and tables from the COA and label.</li>
            <li>The parser normalizes those fields against canonical aliases.</li>
            <li>The deterministic validator compares them with the material master, supplier list, and per-material specs.</li>
            <li>The risk engine sums finding scores and applies the decision matrix.</li>
            <li>A template explanation summarizes the findings; Azure OpenAI may later restate the same facts in plain language.</li>
          </ol>
          <h4>Decision policy</h4>
          <ul>
            <li><strong>APPROVED</strong> — score 0–20 and no critical out-of-spec.</li>
            <li><strong>NEEDS_REVIEW</strong> — score 21–59.</li>
            <li><strong>REJECTED</strong> — score 60+ or any critical out-of-spec test.</li>
          </ul>
          <p style={{ marginTop: 14 }} className="muted">
            The decision is computed entirely from validator findings. Azure
            OpenAI never decides — it can only describe.
          </p>
        </div>
        <div className="card__footer">
          Synthetic dataset only. No real patient, supplier, or batch data is used.
        </div>
      </div>
    </div>
  );
}
