import { useEffect, useMemo, useState } from "react";

import EmptyState from "../components/EmptyState.jsx";
import HistoryTable from "../components/HistoryTable.jsx";
import Spinner from "../components/Spinner.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
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

const SOURCE_LABEL = {
  REAL_UPLOAD: "Uploaded Document",
  DEMO_SAMPLE: "Sample Case",
};

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

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

export default function HistoryPage({ refreshKey = 0, onOpenReport }) {
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
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

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

  const filteredLogs = useMemo(
    () =>
      applyFilters(logs, {
        source: sourceFilter,
        decision: decisionFilter,
        query,
      }),
    [logs, sourceFilter, decisionFilter, query]
  );

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedLogs = useMemo(
    () => filteredLogs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filteredLogs, safePage]
  );

  useEffect(() => {
    setPage(1);
  }, [sourceFilter, decisionFilter, query, refreshKey]);

  const selectedRow = useMemo(
    () => logs.find((l) => l.analysis_id === selectedId),
    [logs, selectedId]
  );

  const coa = detail?.extracted_fields?.coa || {};
  const findings = detail?.findings || [];

  const filtersDirty =
    sourceFilter !== "ALL" || decisionFilter !== "ALL" || query.trim() !== "";

  function clearFilters() {
    setSourceFilter("ALL");
    setDecisionFilter("ALL");
    setQuery("");
  }

  return (
    <div className="stack">
      <div className="filter-bar">
        <div className="filter-bar__search">
          <span
            className="material-symbols-outlined filter-bar__search-icon"
            aria-hidden="true"
          >
            search
          </span>
          <input
            id="history-search"
            type="search"
            className="filter-bar__input"
            placeholder="Search analysis ID, material, or supplier"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search verifications"
          />
        </div>
        <select
          aria-label="Filter by source"
          className="filter-bar__select"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
        >
          {SOURCE_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              Source: {opt.label.replace(/^All sources$/, "All")}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by decision"
          className="filter-bar__select"
          value={decisionFilter}
          onChange={(e) => setDecisionFilter(e.target.value)}
        >
          {DECISION_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              Decision: {opt.label.replace(/^All decisions$/, "All")}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="filter-bar__clear"
          onClick={clearFilters}
          disabled={!filtersDirty}
        >
          Clear filters
        </button>
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
        <div className="history-grid">
          <div className="stack" style={{ gap: 12, minWidth: 0 }}>
            <HistoryTable
              logs={pagedLogs}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
            {filteredLogs.length > 0 ? (
              <div className="pagination" role="navigation" aria-label="History pagination">
                <span className="pagination__count">
                  {(safePage - 1) * PAGE_SIZE + 1}–
                  {Math.min(safePage * PAGE_SIZE, filteredLogs.length)} of{" "}
                  {filteredLogs.length}
                </span>
                <div className="pagination__controls">
                  <button
                    type="button"
                    className="pagination__btn"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage <= 1}
                  >
                    Previous
                  </button>
                  <span className="pagination__page">
                    Page {safePage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    className="pagination__btn"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage >= totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {selectedId ? (
            <aside className="history-detail-side" aria-label="Selected verification">
              {detailLoading ? (
                <Spinner label="Loading verification…" />
              ) : detailErr ? (
                <div className="banner banner--error">{detailErr}</div>
              ) : detail ? (
                <>
                  <div className="row row--between" style={{ alignItems: "flex-start" }}>
                    <div style={{ minWidth: 0 }}>
                      <div
                        className="muted"
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          wordBreak: "break-all",
                        }}
                      >
                        {detail.analysis_id}
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <StatusBadge value={detail.decision} kind="decision" />
                      </div>
                      <div style={{ fontWeight: 600, marginTop: 6 }}>
                        {coa.material_name || selectedRow?.material_name || "—"}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="history-detail-side__close"
                      onClick={() => setSelectedId(null)}
                      aria-label="Close detail"
                      title="Close"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  <div>
                    <h4>Verification summary</h4>
                    <dl>
                      <div>
                        <dt>Risk score</dt>
                        <dd>
                          {detail.risk_score ?? "—"}/100 ·{" "}
                          {detail.risk_level || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt>Source</dt>
                        <dd>{SOURCE_LABEL[detail.source] || "—"}</dd>
                      </div>
                      <div>
                        <dt>Timestamp</dt>
                        <dd style={{ textAlign: "right" }}>
                          {formatDate(detail.created_at)}
                        </dd>
                      </div>
                      <div>
                        <dt>Human review</dt>
                        <dd>{detail.human_review_required ? "Required" : "Not required"}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4>Entity details</h4>
                    <dl>
                      <div>
                        <dt>Supplier</dt>
                        <dd>{coa.supplier || "—"}</dd>
                      </div>
                      <div>
                        <dt>Batch</dt>
                        <dd>{coa.batch_no || "—"}</dd>
                      </div>
                      <div>
                        <dt>Manufacturer</dt>
                        <dd>{coa.manufacturer || "—"}</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4>Key findings</h4>
                    {findings.length === 0 ? (
                      <ul>
                        <li>
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--c-ok)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="9" />
                            <path d="M9 12l2 2 4-4" />
                          </svg>
                          <span>No findings — all checks passed.</span>
                        </li>
                      </ul>
                    ) : (
                      <ul>
                        {findings.slice(0, 5).map((f, i) => (
                          <li key={`${f.type}-${i}`}>
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--c-warn)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 9v4" />
                              <path d="M12 17h.01" />
                              <path d="M10.3 3.86l-8.3 14.4A2 2 0 0 0 3.7 21h16.6a2 2 0 0 0 1.7-2.74L13.7 3.86a2 2 0 0 0-3.4 0z" />
                            </svg>
                            <span>{f.message || f.type}</span>
                          </li>
                        ))}
                        {findings.length > 5 ? (
                          <li className="muted" style={{ fontSize: 11 }}>
                            + {findings.length - 5} more in the full report
                          </li>
                        ) : null}
                      </ul>
                    )}
                  </div>

                  {detail.recommendation ? (
                    <div>
                      <h4>Recommendation</h4>
                      <p
                        className="muted"
                        style={{ margin: 0, fontSize: 12, lineHeight: 1.5 }}
                      >
                        {detail.recommendation}
                      </p>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    className="btn btn--block"
                    onClick={() => onOpenReport?.(detail.analysis_id)}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 3h7v7" />
                      <path d="M10 14L21 3" />
                      <path d="M21 14v7H3V3h7" />
                    </svg>
                    View full report
                  </button>
                </>
              ) : null}
            </aside>
          ) : (
            <aside className="history-detail-side" aria-label="No selection">
              <EmptyState
                title="Select a verification"
                hint="Choose a record from the table to review decision, risk, findings, and evidence."
              />
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
