export default function RecommendationCard({ verification }) {
  if (!verification) return null;
  const { recommendation, reviewer_note, summary } = verification;
  return (
    <div className="card">
      <div className="card__header">
        <div>
          <h3 className="card__title">Summary &amp; recommendation</h3>
          <p className="card__subtitle">
            Plain-language read-out of the validator findings.
          </p>
        </div>
      </div>
      <div className="card__body stack" style={{ gap: 14 }}>
        <div>
          <div
            className="muted"
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            Summary
          </div>
          <div>{summary || "—"}</div>
        </div>
        <div>
          <div
            className="muted"
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 4,
            }}
          >
            Recommendation
          </div>
          <div>{recommendation || "—"}</div>
        </div>
        {reviewer_note ? (
          <div>
            <div
              className="muted"
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 4,
              }}
            >
              Reviewer note
            </div>
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {reviewer_note}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  );
}
