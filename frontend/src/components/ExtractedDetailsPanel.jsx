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
  const hasConclusion = !!(coa.conclusion && String(coa.conclusion).trim());
  const labelHasContent = Object.values(label).some(
    (v) => v !== null && v !== undefined && v !== ""
  );

  return (
    <div className="stack">
      <div className="card">
        <div className="card__header">
          <div>
            <h3 className="card__title">Field comparison</h3>
            <p className="card__subtitle">
              Side-by-side key fields extracted from the COA and material
              label. Differences are highlighted.
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
            <h3 className="card__title">COA test results</h3>
            <p className="card__subtitle">
              Quality test results extracted from the Certificate of Analysis.
            </p>
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
            <h3 className="card__title">COA metadata</h3>
            <p className="card__subtitle">
              Document-level information extracted from the COA.
            </p>
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
          {hasConclusion ? (
            <p className="muted source-note">
              This conclusion comes from the source COA, not from VeriTrace.
            </p>
          ) : null}
        </div>
      </div>

      {labelHasContent ? (
        <div className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Material label fields</h3>
              <p className="card__subtitle">
                Fields extracted from the material label.
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
      ) : null}
    </div>
  );
}
