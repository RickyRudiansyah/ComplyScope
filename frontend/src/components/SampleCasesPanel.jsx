import EmptyState from "./EmptyState.jsx";
import Spinner from "./Spinner.jsx";

/**
 * Secondary panel for trying the pipeline against curated extracted-fields
 * fixtures. Intentionally framed as "Sample Verification Cases", not a demo,
 * so it complements the primary upload workflow.
 */
export default function SampleCasesPanel({
  scenarios,
  loading,
  error,
  runningId,
  onRun,
}) {
  return (
    <section className="card">
      <div className="card__header">
        <div>
          <h3 className="card__title">Sample Verification Cases</h3>
          <p className="card__subtitle">
            Curated extracted-fields fixtures. The validator and risk engine
            still compute the decision live.
          </p>
        </div>
        <span className="badge badge--neutral">Optional</span>
      </div>
      <div className="card__body" style={{ paddingTop: 12 }}>
        {loading ? (
          <Spinner label="Loading sample cases…" />
        ) : error ? (
          <div className="banner banner--error">{error}</div>
        ) : !scenarios || scenarios.length === 0 ? (
          <EmptyState title="No sample cases available" />
        ) : (
          <ul className="sample-list">
            {scenarios.map((s) => (
              <li key={s.scenario_id} className="sample-item">
                <div>
                  <div className="sample-item__title">{s.title}</div>
                  <div className="sample-item__desc">{s.description}</div>
                </div>
                <button
                  type="button"
                  className="btn"
                  onClick={() => onRun?.(s.scenario_id)}
                  disabled={runningId === s.scenario_id}
                >
                  {runningId === s.scenario_id ? "Running…" : "Run"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
