import StatusBadge from "./StatusBadge.jsx";

const DECISION_LABEL = {
  APPROVED: "Approved",
  NEEDS_REVIEW: "Needs Review",
  REJECTED: "Rejected",
};

const DECISION_SUB = {
  APPROVED:
    "All checks passed. The batch can proceed through standard QA release.",
  NEEDS_REVIEW:
    "One or more findings need human review before a release decision.",
  REJECTED:
    "Findings prevent release. Quarantine the batch and trigger deviation handling.",
};

const VARIANT = {
  APPROVED: "approved",
  NEEDS_REVIEW: "review",
  REJECTED: "rejected",
};

const SOURCE_LABEL = {
  DEMO_SAMPLE: "Sample Case",
  REAL_UPLOAD: "Uploaded Document",
};

function fmt(value, fallback = "—") {
  return value === null || value === undefined || value === ""
    ? fallback
    : value;
}

export default function DecisionCard({ verification }) {
  if (!verification) return null;
  const decision = verification.decision || "";
  const variant = VARIANT[decision] || "review";
  const coa = verification.extracted_fields?.coa || {};
  const sourceKey = verification.source || "DEMO_SAMPLE";
  const sourceLabel = SOURCE_LABEL[sourceKey] || "Unknown";

  return (
    <section className={`decision decision--${variant}`}>
      <div className="decision__main">
        <div className="decision__label">Decision</div>
        <div
          className={`decision__pill decision__pill--${variant}`}
          title={decision}
        >
          {DECISION_LABEL[decision] || decision || "—"}
        </div>
        <div className="decision-score" aria-live="polite">
          {verification.risk_score ?? "—"}
          <span className="decision-score__den">/100</span>
        </div>
        <div className="row row--wrap" style={{ gap: 8 }}>
          <StatusBadge
            value={verification.risk_level}
            kind="risk"
            label={`Risk: ${verification.risk_level || "—"}`}
          />
          {verification.human_review_required ? (
            <span className="badge badge--warn">Human review required</span>
          ) : null}
          <StatusBadge value={sourceKey} kind="source" />
        </div>
        <p className="decision__sub">
          {DECISION_SUB[decision] || verification.summary}
        </p>
        <p className="decision__hint">
          Risk score is calculated from deterministic validation findings.
          See <strong>Settings → Decision &amp; Risk Scoring</strong> for the
          weight matrix.
        </p>
      </div>

      <dl className="decision__meta">
        <dt>Material</dt>
        <dd>{fmt(coa.material_name)}</dd>
        <dt>Code</dt>
        <dd>{fmt(coa.material_code)}</dd>
        <dt>Supplier</dt>
        <dd>{fmt(coa.supplier)}</dd>
        <dt>Batch</dt>
        <dd>{fmt(coa.batch_no)}</dd>
        <dt>Source</dt>
        <dd>{sourceLabel}</dd>
        {verification.scenario_id ? (
          <>
            <dt>Scenario</dt>
            <dd style={{ fontFamily: "var(--font-mono)" }}>
              {verification.scenario_id}
            </dd>
          </>
        ) : null}
        <dt>Analysis ID</dt>
        <dd style={{ fontFamily: "var(--font-mono)" }}>
          {fmt(verification.analysis_id)}
        </dd>
        <dt>Human review</dt>
        <dd>{verification.human_review_required ? "Required" : "Not required"}</dd>
      </dl>
    </section>
  );
}
