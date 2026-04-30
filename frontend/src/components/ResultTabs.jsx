import { useState } from "react";

import DecisionCard from "./DecisionCard.jsx";
import ExtractedDetailsPanel from "./ExtractedDetailsPanel.jsx";
import FindingsPanel from "./FindingsPanel.jsx";
import RecommendationCard from "./RecommendationCard.jsx";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "evidence", label: "Findings & Evidence" },
  { id: "extracted", label: "Extracted Details" },
];

export default function ResultTabs({ verification }) {
  const [tab, setTab] = useState("overview");
  if (!verification) return null;

  return (
    <div className="stack">
      <DecisionCard verification={verification} />

      <div className="result-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={
              "result-tabs__btn" +
              (tab === t.id ? " result-tabs__btn--active" : "")
            }
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.id === "evidence" && verification.findings?.length ? (
              <span className="result-tabs__count">
                {verification.findings.length}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div>
        {tab === "overview" ? (
          <RecommendationCard verification={verification} />
        ) : null}
        {tab === "evidence" ? (
          <FindingsPanel
            findings={verification.findings}
            riskScore={verification.risk_score}
          />
        ) : null}
        {tab === "extracted" ? (
          <ExtractedDetailsPanel extracted={verification.extracted_fields} />
        ) : null}
      </div>
    </div>
  );
}
