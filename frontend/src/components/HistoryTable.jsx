import EmptyState from "./EmptyState.jsx";
import StatusBadge from "./StatusBadge.jsx";

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default function HistoryTable({ logs, selectedId, onSelect }) {
  if (!logs || logs.length === 0) {
    return (
      <EmptyState
        title="No matching verifications"
        hint="Adjust the filters above, or run a sample case from the Verify page."
      />
    );
  }
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <table className="table table--clickable history-table">
        <thead>
          <tr>
            <th className="col-when">When</th>
            <th className="col-analysis">Analysis</th>
            <th className="col-material">Material</th>
            <th className="col-supplier">Supplier</th>
            <th className="col-decision">Decision</th>
            <th className="col-score" style={{ textAlign: "right" }}>
              Score
            </th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const isSample = (log.source || "DEMO_SAMPLE") === "DEMO_SAMPLE";
            return (
              <tr
                key={log.analysis_id}
                className={selectedId === log.analysis_id ? "is-selected" : ""}
                onClick={() => onSelect?.(log.analysis_id)}
              >
                <td className="col-when">{formatDate(log.created_at)}</td>
                <td className="col-analysis">
                  <div className="analysis-cell">
                    <div className="analysis-cell__id">{log.analysis_id}</div>
                    <div className="analysis-cell__meta">
                      <StatusBadge value={log.source} kind="source" />
                      {isSample && log.scenario_id ? (
                        <span className="analysis-cell__scenario">
                          {log.scenario_id}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="col-material">
                  <div style={{ fontWeight: 600 }} title={log.material_name || ""}>
                    {log.material_name || "—"}
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {log.material_code || ""}
                  </div>
                </td>
                <td
                  className="col-supplier"
                  title={log.supplier || ""}
                >
                  {log.supplier || "—"}
                </td>
                <td className="col-decision">
                  <StatusBadge value={log.decision} kind="decision" />
                </td>
                <td
                  className="col-score"
                  style={{
                    textAlign: "right",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                  }}
                >
                  {log.risk_score ?? "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
