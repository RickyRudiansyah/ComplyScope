import FieldComparisonTable from "./FieldComparisonTable.jsx";
import StatusBadge from "./StatusBadge.jsx";

function fmt(value, fallback = "—") {
  return value === null || value === undefined || value === "" ? fallback : value;
}

function statusBadgeFor(value) {
  const s = String(value || "").toUpperCase();
  if (s === "PASS") return <StatusBadge value="PASS" kind="ok" />;
  if (s === "FAIL") return <StatusBadge value="FAIL" kind="bad" />;
  if (!value) return <span className="muted">—</span>;
  return <StatusBadge value={s} kind="info" />;
}

export default function ExtractedDetailsPanel({ extracted }) {
  const coa = extracted?.coa || {};
  const label = extracted?.label || {};
  const tests = Array.isArray(coa.test_results) ? coa.test_results : [];

  return (
    <div className="stack">
      <div className="card">
        <div className="card__header">
          <div>
            <h3 className="card__title">COA &amp; label fields</h3>
            <p className="card__subtitle">
              Side-by-side of extracted fields. Differences are highlighted.
            </p>
          </div>
        </div>
        <div className="card__body">
          <FieldComparisonTable extracted={extracted} />
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <div>
            <h3 className="card__title">Results of analysis</h3>
            <p className="card__subtitle">Test results extracted from the COA.</p>
          </div>
        </div>
        <div className="card__body" style={{ padding: 0 }}>
          {tests.length === 0 ? (
            <div className="empty">No test results extracted.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Method</th>
                  <th>Specification</th>
                  <th>Result</th>
                  <th>Unit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {tests.map((t, i) => (
                  <tr key={`${t.parameter || "p"}-${i}`}>
                    <td style={{ fontWeight: 600 }}>{fmt(t.parameter)}</td>
                    <td>{fmt(t.method)}</td>
                    <td>{fmt(t.specification)}</td>
                    <td style={{ fontFamily: "var(--font-mono)" }}>
                      {fmt(t.result)}
                    </td>
                    <td>{fmt(t.unit)}</td>
                    <td>{statusBadgeFor(t.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <div>
            <h3 className="card__title">COA header</h3>
            <p className="card__subtitle">Document-level fields extracted from the COA.</p>
          </div>
        </div>
        <div className="card__body">
          <table className="table compare">
            <tbody>
              {[
                ["COA number", coa.coa_no],
                ["Issue date", coa.issue_date],
                ["Manufacturer", coa.manufacturer],
                ["Conclusion", coa.conclusion],
                ["Authorized by", coa.authorized_by],
              ].map(([k, v]) => (
                <tr key={k}>
                  <td className="compare__field">{k}</td>
                  <td className="compare__cell">{fmt(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {Object.keys(label).length === 0 ? null : (
        <div className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Material label</h3>
              <p className="card__subtitle">
                Raw extracted label fields (already shown above; included for
                completeness).
              </p>
            </div>
          </div>
          <div className="card__body">
            <table className="table compare">
              <tbody>
                {Object.entries(label).map(([k, v]) => (
                  <tr key={k}>
                    <td className="compare__field">{k}</td>
                    <td className="compare__cell">{fmt(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
