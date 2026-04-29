import EmptyState from "./EmptyState.jsx";
import StatusBadge from "./StatusBadge.jsx";

const FRIENDLY_TYPE = {
  MISSING_REQUIRED_FIELD: "Missing required field",
  BATCH_MISMATCH: "Batch number mismatch",
  SUPPLIER_NOT_APPROVED: "Supplier not approved",
  EXPIRY_BELOW_THRESHOLD: "Remaining shelf life below threshold",
  MISSING_REQUIRED_TEST: "Missing required test",
  TEST_RESULT_OUT_OF_SPEC: "Test result out of specification",
  QUANTITY_MISMATCH: "Quantity mismatch",
};

const SCORE_CAP = 100;

function buildRiskBreakdown(findings, riskScore) {
  if (!findings || findings.length === 0) {
    return { text: "Risk breakdown: no findings, score 0.", capped: false };
  }
  const parts = findings.map(
    (f) => `${f.type} +${Number.isFinite(f.score) ? f.score : 0}`
  );
  const rawTotal = findings.reduce(
    (sum, f) => sum + (Number.isFinite(f.score) ? f.score : 0),
    0
  );
  const capped =
    rawTotal > SCORE_CAP ||
    (typeof riskScore === "number" && riskScore < rawTotal);
  const totalText = capped
    ? `${rawTotal} (capped at ${SCORE_CAP})`
    : `${rawTotal}`;
  return {
    text: `Risk breakdown: ${parts.join(", ")} = ${totalText}.`,
    capped,
  };
}

function severityClass(s) {
  switch ((s || "").toUpperCase()) {
    case "CRITICAL":
      return "finding finding--critical";
    case "HIGH":
      return "finding finding--high";
    case "MEDIUM":
      return "finding finding--medium";
    default:
      return "finding finding--low";
  }
}

function renderEvidenceValue(value) {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export default function FindingsPanel({ findings, riskScore }) {
  const breakdown = buildRiskBreakdown(findings, riskScore);

  if (!findings || findings.length === 0) {
    return (
      <div className="stack" style={{ gap: 12 }}>
        <div className="risk-breakdown">{breakdown.text}</div>
        <EmptyState
          title="No findings"
          hint="The deterministic validator did not flag any issues for this verification."
        />
      </div>
    );
  }
  return (
    <div className="stack" style={{ gap: 12 }}>
      <div className="risk-breakdown">
        {breakdown.text}
        {breakdown.capped ? (
          <div className="risk-breakdown__note">
            Risk breakdown total is capped at {SCORE_CAP}.
          </div>
        ) : null}
      </div>
      {findings.map((f, i) => {
        const friendly = FRIENDLY_TYPE[f.type] || f.type;
        const evidenceEntries = f.evidence
          ? Object.entries(f.evidence).filter(
              ([k]) => k !== undefined
            )
          : [];
        return (
          <article key={`${f.type}-${i}`} className={severityClass(f.severity)}>
            <header className="finding__head">
              <div className="row" style={{ gap: 8 }}>
                <span className="finding__type">{friendly}</span>
                {f.parameter ? (
                  <span className="badge badge--neutral">
                    {f.parameter}
                  </span>
                ) : null}
              </div>
              <div className="row" style={{ gap: 8 }}>
                <StatusBadge value={f.severity} kind="severity" />
                <span className="badge badge--neutral">+{f.score}</span>
              </div>
            </header>
            <div className="finding__code">Code: {f.type}</div>
            <p className="finding__msg">{f.message}</p>
            {evidenceEntries.length > 0 ? (
              <div className="finding__evidence">
                <dl>
                  {evidenceEntries.map(([k, v]) => (
                    <span key={k} style={{ display: "contents" }}>
                      <dt>{k}</dt>
                      <dd>{renderEvidenceValue(v)}</dd>
                    </span>
                  ))}
                </dl>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
