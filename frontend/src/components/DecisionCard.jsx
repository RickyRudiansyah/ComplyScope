import StatusBadge from "./StatusBadge.jsx";

const VARIANT = {
  APPROVED: "approved",
  NEEDS_REVIEW: "review",
  REJECTED: "rejected",
};

function fmt(value, fallback = "—") {
  return value === null || value === undefined || value === ""
    ? fallback
    : value;
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default function DecisionCard({ verification }) {
  if (!verification) return null;
  const decision = verification.decision || "";
  const variant = VARIANT[decision] || "review";
  const coa = verification.extracted_fields?.coa || {};

  const meta = [
    ["Material", fmt(coa.material_name)],
    ["Supplier", fmt(coa.supplier)],
    ["Batch No.", fmt(coa.batch_no)],
    ["Analysis ID", fmt(verification.analysis_id)],
    ["Created at", formatDate(verification.created_at)],
  ];

  return (
    <section className={`decision decision--${variant}`}>
      <div className="decision__main">
        <StatusBadge value={decision} kind="decision" />
        <div className="decision__score" aria-live="polite">
          {verification.risk_score ?? "—"}
          <span className="decision__score-den">/100</span>
        </div>
        <div className="decision__meta-row">
          <span className="decision__meta-label">Risk level</span>
          <span className="decision__meta-value">
            {verification.risk_level || "—"}
          </span>
        </div>
        <div className="decision__meta-row">
          <span className="decision__meta-label">Human review</span>
          <span className="decision__meta-value">
            {verification.human_review_required ? "Required" : "Not required"}
          </span>
        </div>
      </div>

      <dl className="decision__grid">
        {meta.map(([k, v]) => (
          <div key={k} className="decision__grid-cell">
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      <p className="decision__hint">
        Risk score is calculated from deterministic validation findings.
      </p>
    </section>
  );
}
