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

function cellClass(coa, label) {
  const a = normalize(coa);
  const b = normalize(label);
  if (!a || !b) return "compare__cell";
  return a === b ? "compare__cell" : "compare__cell compare__diff";
}

function display(value) {
  if (value === null || value === undefined || value === "") {
    return <span className="compare__cell compare__cell--miss">missing</span>;
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
          <th>COA</th>
          <th>Label</th>
        </tr>
      </thead>
      <tbody>
        {COMPARED_FIELDS.map(({ key, label: lbl }) => {
          const cls = cellClass(coa[key], label[key]);
          return (
            <tr key={key}>
              <td className="compare__field">{lbl}</td>
              <td className={cls}>{display(coa[key])}</td>
              <td className={cls}>{display(label[key])}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
