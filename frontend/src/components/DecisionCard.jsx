import StatusBadge from "./StatusBadge.jsx";

const VARIANT = {
  APPROVED: "approved",
  NEEDS_REVIEW: "review",
  REJECTED: "rejected",
};

function fmt(value, fallback = "-") {
  return value === null || value === undefined || value === ""
    ? fallback
    : value;
}

function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default function DecisionCard({ verification }) {
  if (!verification) return null;

  const decision = verification.decision || "";
  const variant = VARIANT[decision] || "review";
  const coa = verification.extracted_fields?.coa || {};
  const source = verification.source || "";

  const businessContext = [
    ["Material", fmt(coa.material_name)],
    ["Batch No.", fmt(coa.batch_no)],
    ["Supplier", fmt(coa.supplier)],
  ];

  const auditMetadata = [
    ["Analysis ID", fmt(verification.analysis_id)],
    ["Created at", formatDate(verification.created_at)],
  ];

  if (source) {
    auditMetadata.push([
      "Source",
      source === "REAL_UPLOAD" ? "Uploaded Document" : source === "DEMO_SAMPLE" ? "Sample Case" : source,
    ]);
  }

  return (
    <section className={`decision decision--${variant}`}>
      <div className="decision__section decision__section--primary">
        <div className="decision__badge-wrap">
          <StatusBadge value={decision} kind="decision" />
        </div>
        <div className="decision__score" aria-live="polite">
          {verification.risk_score ?? "-"}
          <span className="decision__score-den">/100</span>
        </div>
        <div className="decision__rows">
          <div className="decision__meta-row">
            <span className="decision__meta-label">Risk level</span>
            <span className="decision__meta-value">
              {verification.risk_level || "-"}
            </span>
          </div>
          <div className="decision__meta-row">
            <span className="decision__meta-label">Human review</span>
            <span className="decision__meta-value">
              {verification.human_review_required ? "REQUIRED" : "NOT REQUIRED"}
            </span>
          </div>
        </div>
      </div>

      <div className="decision__section decision__section--context">
        <div className="decision__section-title">Material Details</div>
        <dl className="decision__list">
          {businessContext.map(([k, v]) => (
            <div key={k} className="decision__list-row">
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="decision__section decision__section--audit">
        <div className="decision__section-title">Verification Details</div>
        <dl className="decision__list">
          {auditMetadata.map(([k, v]) => (
            <div key={k} className="decision__list-row">
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
