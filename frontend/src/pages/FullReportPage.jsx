import { useEffect, useState } from "react";

import ResultTabs from "../components/ResultTabs.jsx";
import Spinner from "../components/Spinner.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { api } from "../api.js";

/**
 * Full Verification Report — adapted from the Claude/Stitch design.
 *
 * Re-uses the existing /api/verifications/:id endpoint and ResultTabs
 * component so behavior matches the History detail view but with an
 * audit-style metadata grid added on top.
 */

const SOURCE_LABEL = {
  REAL_UPLOAD: "Uploaded Document",
  DEMO_SAMPLE: "Sample Case",
};

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function fmt(v, fallback = "—") {
  return v === null || v === undefined || v === "" ? fallback : v;
}

export default function FullReportPage({ analysisId, onBack }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!analysisId) return;
    let cancelled = false;
    setLoading(true);
    setErr(null);
    api
      .getVerification(analysisId)
      .then((data) => !cancelled && setDetail(data))
      .catch((e) => !cancelled && setErr(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [analysisId]);

  if (loading) {
    return (
      <div className="card">
        <div className="card__body">
          <Spinner label="Loading full report…" />
        </div>
      </div>
    );
  }
  if (err) {
    return (
      <div className="stack">
        <div className="banner banner--error">{err}</div>
        <div>
          <button type="button" className="btn" onClick={onBack}>
            Back to history
          </button>
        </div>
      </div>
    );
  }
  if (!detail) return null;

  const coa = detail.extracted_fields?.coa || {};
  const sourceKey = detail.source || "DEMO_SAMPLE";
  const auditCells = [
    ["Analysis ID", detail.analysis_id],
    ["Created at", formatDate(detail.created_at)],
    ["Source", SOURCE_LABEL[sourceKey] || sourceKey],
    ["Material name", coa.material_name],
    ["Material code", coa.material_code],
    ["Batch", coa.batch_no],
    ["Supplier", coa.supplier],
    ["Manufacturer", coa.manufacturer],
    ["Expiry date", coa.expiry_date],
    ["Risk score", `${detail.risk_score ?? "—"}/100`],
    ["Risk level", detail.risk_level],
    ["Final decision", detail.decision],
    ["Human review required", detail.human_review_required ? "Yes" : "No"],
    ["Scenario", detail.scenario_id || "—"],
    ["Verified by", "VeriTrace deterministic engine"],
    ["Document intelligence", "Azure DI prebuilt-layout"],
  ];

  return (
    <div className="stack">
      <div className="row row--between" style={{ flexWrap: "wrap", gap: 10 }}>
        <button type="button" className="btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to history
        </button>
        <div className="row" style={{ gap: 8 }}>
          <StatusBadge value={detail.decision} kind="decision" />
          <span className="muted" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>
            {detail.analysis_id}
          </span>
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <div>
            <h3 className="card__title">Full audit metadata</h3>
            <p className="card__subtitle">
              All record-level fields used by QA reviewers and auditors.
            </p>
          </div>
        </div>
        <div className="card__body">
          <div className="audit-grid">
            {auditCells.map(([k, v]) => (
              <div key={k} className="audit-grid__cell">
                <div className="audit-grid__label">{k}</div>
                <div className="audit-grid__value">{fmt(v)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="card__footer">
          Risk score is calculated from deterministic validation findings.
        </div>
      </div>

      <ResultTabs verification={detail} />

      <div className="readonly-banner">
        <div className="readonly-banner__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l8 4v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <div>
          This report is part of the immutable audit trail. Records cannot be
          modified or deleted from the UI. Authorized QA personnel bear final
          responsibility for release decisions.
        </div>
      </div>
    </div>
  );
}
