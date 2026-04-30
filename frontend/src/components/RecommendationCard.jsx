export default function RecommendationCard({ verification }) {
  if (!verification) return null;
  const { recommendation, reviewer_note, summary } = verification;

  return (
    <div className="card">
      <div className="card__header">
        <div>
          <h3 className="card__title">Summary &amp; recommendation</h3>
          <p className="card__subtitle">
            Summary of the verification result and recommended QA action.
          </p>
        </div>
      </div>
      <div className="card__body stack" style={{ gap: 18 }}>
        <div>
          <div className="section-label">Summary</div>
          <div className="text-block-preserve-lines body-copy-md">
            {summary || "-"}
          </div>
        </div>
        <div>
          <div className="section-label">Recommendation</div>
          <div className="text-block-preserve-lines body-copy-md">
            {recommendation || "-"}
          </div>
        </div>
        {reviewer_note ? (
          <div>
            <div className="section-label">Reviewer note</div>
            <pre
              className="body-copy-md"
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                fontFamily: "var(--font-sans)",
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
