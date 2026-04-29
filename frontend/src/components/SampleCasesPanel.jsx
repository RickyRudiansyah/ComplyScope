import EmptyState from "./EmptyState.jsx";
import Spinner from "./Spinner.jsx";

/**
 * Secondary panel for trying the pipeline against curated sample cases.
 * Frames the cards as user-friendly examples, not internal fixtures.
 */

// Friendlier copy keyed by scenario_id. Falls back to whatever the backend
// supplies if a scenario doesn't have an override (e.g. new cases added later).
const SCENARIO_COPY = {
  valid: {
    title: "Valid match",
    description:
      "All key fields match and required test results are within specification.",
  },
  batch_mismatch: {
    title: "Batch number mismatch",
    description: "COA and label reference different batch numbers.",
  },
  test_result_out_of_spec: {
    title: "Test result out of specification",
    description:
      "A required quality test falls outside the approved specification range.",
  },
  supplier_not_approved: {
    title: "Supplier not approved",
    description:
      "The supplier is not approved for this material in master data.",
  },
  multiple_issues: {
    title: "Multiple issues",
    description:
      "COA and label have two independent problems at the same time: a batch number mismatch and an unapproved supplier.",
  },
};

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
          <h3 className="card__title">Sample cases</h3>
          <p className="card__subtitle">
            Common verification outcomes built from included sample records.
          </p>
        </div>
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
            {scenarios.map((s) => {
              const copy = SCENARIO_COPY[s.scenario_id] || {};
              const title = copy.title || s.title;
              const description = copy.description || s.description;
              return (
                <li key={s.scenario_id} className="sample-item">
                  <div>
                    <div className="sample-item__title">{title}</div>
                    <div className="sample-item__desc">{description}</div>
                  </div>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => onRun?.(s.scenario_id)}
                    disabled={runningId === s.scenario_id}
                  >
                    {runningId === s.scenario_id ? "Running…" : "Try"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
