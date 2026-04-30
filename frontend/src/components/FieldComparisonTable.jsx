const COMPARED_FIELDS = [
  { key: "material_name", label: "Material name" },
  { key: "material_code", label: "Material code" },
  { key: "supplier", label: "Supplier" },
  { key: "batch_no", label: "Batch number" },
  { key: "mfg_date", label: "Mfg date" },
  { key: "expiry_date", label: "Expiry date" },
  { key: "quantity", label: "Quantity" },
  { key: "storage_condition", label: "Storage condition" },
];

function normalize(v) {
  return String(v ?? "").trim().toLowerCase();
}

function matchState(coa, label) {
  const a = normalize(coa);
  const b = normalize(label);
  if (!a && !b) return "missing";
  if (!a || !b) return "missing";
  return a === b ? "match" : "mismatch";
}

function display(value) {
  if (value === null || value === undefined || value === "") {
    return <span className="compare__cell--miss">missing</span>;
  }
  return value;
}

export default function FieldComparisonTable({ extracted }) {
  const coa = extracted?.coa || {};
  const label = extracted?.label || {};

  return (
    <table className="table compare">
      <thead>
        <tr>
          <th>Field</th>
          <th>COA value</th>
          <th>Label value</th>
          <th style={{ width: 110 }}>Match</th>
        </tr>
      </thead>
      <tbody>
        {COMPARED_FIELDS.map(({ key, label: lbl }) => {
          const state = matchState(coa[key], label[key]);
          return (
            <tr
              key={key}
              className={state === "mismatch" ? "compare__row--mismatch" : ""}
            >
              <td className="compare__field">{lbl}</td>
              <td className={state === "mismatch" ? "compare__cell--diff" : ""}>
                {display(coa[key])}
              </td>
              <td className={state === "mismatch" ? "compare__cell--diff" : ""}>
                {display(label[key])}
              </td>
              <td>
                {state === "match" ? (
                  <span className="badge badge--ok">Match</span>
                ) : state === "mismatch" ? (
                  <span className="badge badge--bad">Mismatch</span>
                ) : (
                  <span className="badge badge--neutral">Missing</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
