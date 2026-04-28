import { useState } from "react";

import DecisionCard from "./DecisionCard.jsx";
import ExtractedDetailsPanel from "./ExtractedDetailsPanel.jsx";
import FindingsPanel from "./FindingsPanel.jsx";
import RecommendationCard from "./RecommendationCard.jsx";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "evidence", label: "Evidence" },
  { id: "extracted", label: "Extracted Details" },
];

export default function ResultTabs({ verification }) {
  const [tab, setTab] = useState("overview");
  if (!verification) return null;

  return (
    <div className="stack">
      <DecisionCard verification={verification} />

      <div className="card" style={{ overflow: "hidden" }}>
        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={
                "tabs__btn" + (tab === t.id ? " tabs__btn--active" : "")
              }
              onClick={() => setTab(t.id)}
            >
              {t.label}
              {t.id === "evidence" && verification.findings?.length ? (
                <span
                  className="badge badge--neutral"
                  style={{ marginLeft: 8 }}
                >
                  {verification.findings.length}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <div style={{ padding: 20 }}>
          {tab === "overview" ? (
            <RecommendationCard verification={verification} />
          ) : null}
          {tab === "evidence" ? (
            <FindingsPanel findings={verification.findings} />
          ) : null}
          {tab === "extracted" ? (
            <ExtractedDetailsPanel extracted={verification.extracted_fields} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
