import EmptyState from "./EmptyState.jsx";
import StatusBadge from "./StatusBadge.jsx";

function fmt(value, fallback = "-") {
  return value === null || value === undefined || value === "" ? fallback : value;
}

function describeSpec(spec) {
  switch (spec.spec_type) {
    case "range":
      return `${spec.spec_min} - ${spec.spec_max} ${spec.unit || ""}`.trim();
    case "max":
      return `<= ${spec.spec_max} ${spec.unit || ""}`.trim();
    case "min":
      return `>= ${spec.spec_min} ${spec.unit || ""}`.trim();
    case "text_equals":
      return spec.expected_text ?? "-";
    case "positive":
      return "Positive / conforms";
    default:
      return spec.spec_type || "-";
  }
}

export default function MasterDataPanel({ material, loading, error }) {
  if (loading) {
    return (
      <div className="card">
        <div className="card__body">Loading material...</div>
      </div>
    );
  }
  if (error) {
    return <div className="banner banner--error">{error}</div>;
  }
  if (!material) {
    return (
      <EmptyState
        title="Select a material"
        hint="Choose a material from the list to see its specifications and approved suppliers."
      />
    );
  }

  return (
    <div className="masterdata-detail-grid">
      <div className="card masterdata-summary-card">
        <div className="card__header">
          <div>
            <h3 className="card__title">{material.material_name}</h3>
            <p className="card__subtitle">
              {material.material_code} · {fmt(material.category)}
            </p>
          </div>
        </div>
        <div className="card__body">
          <div className="summary-list">
            <div className="summary-list__item">
              <span>Minimum shelf life</span>
              <strong>{fmt(material.min_shelf_life_days)} days</strong>
            </div>
            <div className="summary-list__item">
              <span>Storage requirement</span>
              <strong>{fmt(material.storage_requirement)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="card masterdata-spec-card">
        <div className="card__header">
          <div>
            <h3 className="card__title">Required tests and specifications</h3>
            <p className="card__subtitle">
              Parameters used to evaluate COA results for this material.
            </p>
          </div>
        </div>
        <div className="card__body" style={{ padding: 0 }}>
          {material.specs?.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Method</th>
                  <th>Specification</th>
                  <th>Required</th>
                  <th>Criticality</th>
                </tr>
              </thead>
              <tbody>
                {material.specs.map((spec) => (
                  <tr key={spec.parameter}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{spec.parameter}</div>
                      {spec.aliases?.length ? (
                        <div className="muted" style={{ fontSize: 11 }}>
                          Aliases: {spec.aliases.join(", ")}
                        </div>
                      ) : null}
                    </td>
                    <td>{fmt(spec.method)}</td>
                    <td style={{ fontFamily: "var(--font-mono)" }}>
                      {describeSpec(spec)}
                    </td>
                    <td>
                      {spec.required ? (
                        <StatusBadge value="Required" kind="ok" />
                      ) : (
                        <span className="muted">Optional</span>
                      )}
                    </td>
                    <td>
                      <StatusBadge value={spec.criticality} kind="severity" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty">No specifications defined.</div>
          )}
        </div>
      </div>

      <div className="card masterdata-suppliers-card">
        <div className="card__header">
          <div>
            <h3 className="card__title">Approved suppliers</h3>
            <p className="card__subtitle">
              Suppliers approved for this material.
            </p>
          </div>
        </div>
        <div className="card__body" style={{ padding: 0 }}>
          {material.approved_suppliers?.length ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {material.approved_suppliers.map((s) => (
                  <tr key={s.supplier_name}>
                    <td>{s.supplier_name}</td>
                    <td>
                      <StatusBadge value={s.status} kind="supplier" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty">No approved suppliers configured.</div>
          )}
        </div>
      </div>
    </div>
  );
}
