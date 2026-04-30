const SEVERITY_CLASS = {
  CRITICAL: "badge--bad",
  HIGH: "badge--warn",
  MEDIUM: "badge--info",
  LOW: "badge--neutral",
};

const DECISION_CLASS = {
  APPROVED: "badge--ok",
  NEEDS_REVIEW: "badge--warn",
  REJECTED: "badge--bad",
};

const RISK_CLASS = {
  LOW: "badge--ok",
  MEDIUM: "badge--warn",
  HIGH: "badge--bad",
};

const SUPPLIER_CLASS = {
  APPROVED: "badge--ok",
  CONDITIONAL: "badge--warn",
  SUSPENDED: "badge--bad",
  UNDER_REVIEW: "badge--info",
  NOT_APPROVED: "badge--bad",
  PENDING: "badge--warn",
};

const SOURCE_CLASS = {
  DEMO_SAMPLE: "badge--neutral",
  REAL_UPLOAD: "badge--info",
};

const SOURCE_LABEL = {
  DEMO_SAMPLE: "Sample Case",
  REAL_UPLOAD: "Uploaded Document",
};

const DECISION_LABEL = {
  APPROVED: "Approved",
  NEEDS_REVIEW: "Needs review",
  REJECTED: "Rejected",
};

export default function StatusBadge({ value, kind = "default", label }) {
  const safe = value ? String(value).toUpperCase().replace(/\s+/g, "_") : "-";
  let cls = "badge";
  let display = label;

  if (kind === "severity")
    cls += " " + (SEVERITY_CLASS[safe] || "badge--neutral");
  else if (kind === "decision")
    cls += " " + (DECISION_CLASS[safe] || "badge--neutral");
  else if (kind === "risk")
    cls += " " + (RISK_CLASS[safe] || "badge--neutral");
  else if (kind === "supplier")
    cls += " " + (SUPPLIER_CLASS[safe] || "badge--neutral");
  else if (kind === "source") {
    cls += " " + (SOURCE_CLASS[safe] || "badge--neutral");
    if (!display) display = SOURCE_LABEL[safe] || "Unknown";
  } else if (kind === "ok") cls += " badge--ok";
  else if (kind === "bad") cls += " badge--bad";
  else if (kind === "warn") cls += " badge--warn";
  else if (kind === "info") cls += " badge--info";
  else cls += " badge--neutral";

  if (!display && kind === "decision") display = DECISION_LABEL[safe];

  return <span className={cls}>{display || safe.replace(/_/g, " ")}</span>;
}
