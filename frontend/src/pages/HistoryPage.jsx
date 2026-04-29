import { useEffect, useMemo, useRef, useState } from "react";

import EmptyState from "../components/EmptyState.jsx";
import HistoryTable from "../components/HistoryTable.jsx";
import ResultTabs from "../components/ResultTabs.jsx";
import Spinner from "../components/Spinner.jsx";
import { api } from "../api.js";

const SOURCE_OPTIONS = [
  { id: "ALL", label: "All sources" },
  { id: "REAL_UPLOAD", label: "Uploaded Document" },
  { id: "DEMO_SAMPLE", label: "Sample Case" },
];

const DECISION_OPTIONS = [
  { id: "ALL", label: "All decisions" },
  { id: "APPROVED", label: "Approved" },
  { id: "NEEDS_REVIEW", label: "Needs review" },
  { id: "REJECTED", label: "Rejected" },
];

function applyFilters(logs, { source, decision, query }) {
  const q = query.trim().toLowerCase();
  return logs.filter((log) => {
    const logSource = log.source || "DEMO_SAMPLE";
    if (source !== "ALL" && logSource !== source) return false;
    if (decision !== "ALL" && (log.decision || "") !== decision) return false;
    if (q) {
      const hay = [
        log.analysis_id,
        log.material_name,
        log.material_code,
        log.supplier,
        log.scenario_id,
        log.source,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export default function HistoryPage({ refreshKey = 0 }) {
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsErr, setLogsErr] = useState(null);

  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErr, setDetailErr] = useState(null);

  const [sourceFilter, setSourceFilter] = useState("ALL");
  const [decisionFilter, setDecisionFilter] = useState("ALL");
  const [query, setQuery] = useState("");

  const detailRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    setLogsLoading(true);
    api
      .listVerifications()
      .then((data) => {
        if (cancelled) return;
        setLogs(data || []);
      })
      .catch((err) => !cancelled && setLogsErr(err.message))
      .finally(() => !cancelled && setLogsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    setDetailErr(null);
    api
      .getVerification(selectedId)
      .then((data) => !cancelled && setDetail(data))
      .catch((err) => !cancelled && setDetailErr(err.message))
      .finally(() => !cancelled && setDetailLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId || !detailRef.current) return;
    const el = detailRef.current;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
    return () => window.clearTimeout(t);
  }, [selectedId]);

  const filteredLogs = useMemo(
    () =>
      applyFilters(logs, {
        source: sourceFilter,
        decision: decisionFilter,
        query,
      }),
    [logs, sourceFilter, decisionFilter, query]
  );

  return (
    <div className="stack">
      <div className="filter-bar filter-bar--compact">
        <div className="filter-bar__group">
          <label className="filter-bar__label">Source</label>
          <div className="segmented">
            {SOURCE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                className={
                  "segmented__btn" +
                  (sourceFilter === opt.id ? " segmented__btn--active" : "")
                }
                onClick={() => setSourceFilter(opt.id)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-bar__group">
          <label className="filter-bar__label" htmlFor="decision-filter">
            Decision
          </label>
          <select
            id="decision-filter"
            className="filter-bar__select"
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
          >
            {DECISION_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-bar__group filter-bar__group--grow">
          <label className="filter-bar__label" htmlFor="history-search">
            Search
          </label>
          <input
            id="history-search"
            type="search"
            className="filter-bar__input"
            placeholder="Search analysis ID, material, supplier, or source"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="filter-bar__count">
          {logsLoading
            ? ""
            : `${filteredLogs.length} of ${logs.length} record${
                logs.length === 1 ? "" : "s"
              }`}
        </div>
      </div>

      {logsLoading ? (
        <div className="card">
          <div className="card__body">
            <Spinner label="Loading verification history..." />
          </div>
        </div>
      ) : logsErr ? (
        <div className="banner banner--error">{logsErr}</div>
      ) : (
        <HistoryTable
          logs={filteredLogs}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      )}

      <section ref={detailRef} className="history-detail-section">
        {!selectedId ? (
          <div className="card">
            <div className="card__body">
              <EmptyState
                title="Select a verification to inspect"
                hint="Pick any row above to review the decision, findings, and extracted details."
              />
            </div>
          </div>
        ) : detailLoading ? (
          <div className="card">
            <div className="card__body">
              <Spinner label="Loading verification..." />
            </div>
          </div>
        ) : detailErr ? (
          <div className="banner banner--error">{detailErr}</div>
        ) : detail ? (
          <ResultTabs verification={detail} />
        ) : null}
      </section>
    </div>
  );
}
