import { useEffect, useState } from "react";

import EmptyState from "../components/EmptyState.jsx";
import MasterDataPanel from "../components/MasterDataPanel.jsx";
import Spinner from "../components/Spinner.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { api } from "../api.js";

export default function MasterDataPage() {
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

  useEffect(() => {
    let cancelled = false;
    api
      .listMaterials()
      .then((data) => {
        if (cancelled) return;
        setMaterials(data || []);
        if (data && data.length > 0) setSelectedCode(data[0].material_code);
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

  return (
    <div className="stack">
      <div className="masterdata-layout">
        <div className="card">
          <div className="card__header">
            <div>
              <h3 className="card__title">Materials</h3>
              <p className="card__subtitle">
                {materialsLoading
                  ? "Loading…"
                  : `${materials.length} record${materials.length === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>
          <div className="card__body" style={{ padding: 0 }}>
            {materialsErr ? (
              <div className="banner banner--error" style={{ margin: 16 }}>
                {materialsErr}
              </div>
            ) : materialsLoading ? (
              <div style={{ padding: 16 }}>
                <Spinner label="Loading materials…" />
              </div>
            ) : materials.length === 0 ? (
              <EmptyState title="No materials configured" />
            ) : (
              <ul className="material-list">
                {materials.map((m) => (
                  <li
                    key={m.material_code}
                    className={
                      "material-list__item" +
                      (selectedCode === m.material_code ? " is-active" : "")
                    }
                    onClick={() => setSelectedCode(m.material_code)}
                  >
                    <div className="material-list__name">
                      {m.material_name}
                    </div>
                    <div className="material-list__code">
                      {m.material_code} · {m.category || "—"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <MasterDataPanel
          material={detail}
          loading={detailLoading}
          error={detailErr}
        />
      </div>

      <div className="card">
        <div className="card__header">
          <div>
            <h3 className="card__title">All suppliers</h3>
            <p className="card__subtitle">
              Global supplier directory. Approval is granted per material above.
            </p>
          </div>
        </div>
        <div className="card__body" style={{ padding: 0 }}>
          {suppliersLoading ? (
            <div style={{ padding: 16 }}>
              <Spinner label="Loading suppliers…" />
            </div>
          ) : suppliersErr ? (
            <div className="banner banner--error" style={{ margin: 16 }}>
              {suppliersErr}
            </div>
          ) : suppliers.length === 0 ? (
            <EmptyState title="No suppliers configured" />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.supplier_name}>
                    <td>{s.supplier_name}</td>
                    <td>
                      <StatusBadge value={s.status} kind="supplier" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
