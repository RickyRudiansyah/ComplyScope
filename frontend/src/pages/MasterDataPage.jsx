import { useEffect, useMemo, useState } from "react";

import EmptyState from "../components/EmptyState.jsx";
import MasterDataPanel from "../components/MasterDataPanel.jsx";
import Spinner from "../components/Spinner.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { api } from "../api.js";

const TABS = [
  { id: "materials", label: "Materials" },
  { id: "specifications", label: "Specifications" },
  { id: "suppliers", label: "Suppliers" },
  { id: "supplier_status", label: "Supplier status" },
];

function describeSpec(spec) {
  switch (spec.spec_type) {
    case "range":
      return `${spec.spec_min} - ${spec.spec_max} ${spec.unit || ""}`.trim();
    case "max":
      return `<= ${spec.spec_max} ${spec.unit || ""}`.trim();
    case "min":
      return `>= ${spec.spec_min} ${spec.unit || ""}`.trim();
    case "text_equals":
      return spec.expected_text ?? "—";
    case "positive":
      return "Positive / conforms";
    default:
      return spec.spec_type || "—";
  }
}

export default function MasterDataPage() {
  const [tab, setTab] = useState("materials");

  const [materials, setMaterials] = useState([]);
  const [materialsErr, setMaterialsErr] = useState(null);
  const [materialsLoading, setMaterialsLoading] = useState(true);

  const [selectedCode, setSelectedCode] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErr, setDetailErr] = useState(null);

  const [suppliers, setSuppliers] = useState([]);
  const [suppliersErr, setSuppliersErr] = useState(null);
  const [suppliersLoading, setSuppliersLoading] = useState(true);

  // Fetched material details cache so the Specifications and Supplier Status
  // tabs can render aggregated tables without extra clicks.
  const [allDetails, setAllDetails] = useState({});

  useEffect(() => {
    let cancelled = false;
    api
      .listMaterials()
      .then((data) => {
        if (cancelled) return;
        setMaterials(data || []);
      })
      .catch((err) => !cancelled && setMaterialsErr(err.message))
      .finally(() => !cancelled && setMaterialsLoading(false));
    api
      .listSuppliers()
      .then((data) => !cancelled && setSuppliers(data || []))
      .catch((err) => !cancelled && setSuppliersErr(err.message))
      .finally(() => !cancelled && setSuppliersLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch each material's full detail so the cross-tabs (Specifications, Supplier Status)
  // can render aggregated tables. Uses existing /api/materials/:code endpoint.
  useEffect(() => {
    if (!materials || materials.length === 0) return;
    let cancelled = false;
    Promise.all(
      materials.map((m) =>
        api
          .getMaterial(m.material_code)
          .then((d) => [m.material_code, d])
          .catch(() => [m.material_code, null])
      )
    ).then((entries) => {
      if (cancelled) return;
      const map = {};
      for (const [k, v] of entries) if (v) map[k] = v;
      setAllDetails(map);
    });
    return () => {
      cancelled = true;
    };
  }, [materials]);

  useEffect(() => {
    if (!selectedCode) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetailErr(null);
    api
      .getMaterial(selectedCode)
      .then((data) => !cancelled && setDetail(data))
      .catch((err) => !cancelled && setDetailErr(err.message))
      .finally(() => !cancelled && setDetailLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selectedCode]);

  const allSpecRows = useMemo(() => {
    const out = [];
    for (const m of materials) {
      const d = allDetails[m.material_code];
      if (!d?.specs) continue;
      for (const s of d.specs) {
        out.push({
          material_name: m.material_name,
          material_code: m.material_code,
          ...s,
        });
      }
    }
    return out;
  }, [materials, allDetails]);

  const supplierStatusRows = useMemo(() => {
    const out = [];
    for (const m of materials) {
      const d = allDetails[m.material_code];
      if (!d?.approved_suppliers) continue;
      for (const s of d.approved_suppliers) {
        out.push({
          supplier_name: s.supplier_name,
          status: s.status,
          material_name: m.material_name,
          material_code: m.material_code,
          category: m.category,
        });
      }
    }
    return out;
  }, [materials, allDetails]);

  return (
    <div className="stack">
      <div className="readonly-banner" role="note">
        <div className="readonly-banner__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12" y2="16.01" />
          </svg>
        </div>
        <div>
          Master data is treated as the approved source of truth for verification.
          The MVP is read-only; updates are managed through controlled QA processes.
          Editable workflows are <span className="dev-badge dev-badge--neutral">In development</span>.
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div className="tabs tabs--inline">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={
                "tabs__btn" + (tab === t.id ? " tabs__btn--active" : "")
              }
              onClick={() => {
                setTab(t.id);
                if (t.id !== "materials") setSelectedCode(null);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 18 }}>
          {materialsErr ? (
            <div className="banner banner--error">{materialsErr}</div>
          ) : materialsLoading ? (
            <Spinner label="Loading master data…" />
          ) : (
            <>
              {tab === "materials" ? (
                selectedCode ? (
                  <div className="stack">
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => setSelectedCode(null)}
                      style={{ alignSelf: "flex-start" }}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12" />
                        <polyline points="12 19 5 12 12 5" />
                      </svg>
                      Back to materials
                    </button>
                    <MasterDataPanel
                      material={detail}
                      loading={detailLoading}
                      error={detailErr}
                    />
                  </div>
                ) : materials.length === 0 ? (
                  <EmptyState title="No materials configured" />
                ) : (
                  <div className="material-card-grid">
                    {materials.map((m) => {
                      const d = allDetails[m.material_code];
                      const supplierCount = d?.approved_suppliers?.length;
                      return (
                        <div
                          key={m.material_code}
                          className="material-card"
                          onClick={() => setSelectedCode(m.material_code)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedCode(m.material_code);
                            }
                          }}
                        >
                          <div className="material-card__top">
                            <div className="material-card__code">
                              {m.material_code}
                            </div>
                            <span className="badge badge--info">
                              {m.category || "—"}
                            </span>
                          </div>
                          <div className="material-card__name">
                            {m.material_name}
                          </div>
                          <div className="material-card__foot">
                            <span className="muted">Approved suppliers</span>
                            <span className="material-card__foot-count">
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="9" />
                                <path d="M9 12l2 2 4-4" />
                              </svg>
                              {supplierCount ?? "—"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : null}

              {tab === "specifications" ? (
                allSpecRows.length === 0 ? (
                  <Spinner label="Loading specifications…" />
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Material</th>
                        <th>Parameter</th>
                        <th>Specification</th>
                        <th>Method</th>
                        <th>Required</th>
                        <th>Criticality</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allSpecRows.map((r, i) => (
                        <tr key={`${r.material_code}-${r.parameter}-${i}`}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{r.material_name}</div>
                            <div className="muted" style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}>
                              {r.material_code}
                            </div>
                          </td>
                          <td>{r.parameter}</td>
                          <td style={{ fontFamily: "var(--font-mono)" }}>
                            {describeSpec(r)}
                          </td>
                          <td>{r.method || "—"}</td>
                          <td>
                            {r.required ? (
                              <StatusBadge value="Required" kind="ok" />
                            ) : (
                              <span className="muted">Optional</span>
                            )}
                          </td>
                          <td>
                            <StatusBadge value={r.criticality} kind="severity" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : null}

              {tab === "suppliers" ? (
                suppliersLoading ? (
                  <Spinner label="Loading suppliers…" />
                ) : suppliersErr ? (
                  <div className="banner banner--error">{suppliersErr}</div>
                ) : suppliers.length === 0 ? (
                  <EmptyState title="No suppliers configured" />
                ) : (
                  <div className="supplier-card-grid">
                    {suppliers.map((s) => (
                      <div key={s.supplier_name} className="supplier-card">
                        <div className="supplier-card__icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 21V7l9-4 9 4v14" />
                            <path d="M9 21v-6h6v6" />
                          </svg>
                        </div>
                        <div className="supplier-card__main">
                          <div className="supplier-card__name">
                            {s.supplier_name}
                          </div>
                          <div className="supplier-card__meta">
                            Directory record
                          </div>
                        </div>
                        <StatusBadge value={s.status} kind="supplier" />
                      </div>
                    ))}
                  </div>
                )
              ) : null}

              {tab === "supplier_status" ? (
                supplierStatusRows.length === 0 ? (
                  <Spinner label="Loading supplier status…" />
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Supplier</th>
                        <th>Material</th>
                        <th>Code</th>
                        <th>Category</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplierStatusRows.map((r, i) => (
                        <tr key={`${r.material_code}-${r.supplier_name}-${i}`}>
                          <td style={{ fontWeight: 600 }}>{r.supplier_name}</td>
                          <td>{r.material_name}</td>
                          <td style={{ fontFamily: "var(--font-mono)" }}>
                            {r.material_code}
                          </td>
                          <td>
                            <span className="badge badge--info">
                              {r.category || "—"}
                            </span>
                          </td>
                          <td>
                            <StatusBadge value={r.status} kind="supplier" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
