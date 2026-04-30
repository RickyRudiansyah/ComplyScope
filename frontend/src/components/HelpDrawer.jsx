import { useEffect } from "react";

export default function HelpDrawer({ open, onClose }) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <>
      <div
        className={"drawer-backdrop" + (open ? " drawer-backdrop--shown" : "")}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={"drawer" + (open ? " drawer--open" : "")}
        role="dialog"
        aria-label="VeriTrace help"
        aria-hidden={!open}
      >
        <div className="drawer__header">
          <h3 className="drawer__title">How VeriTrace works</h3>
          <button
            type="button"
            className="drawer__close"
            onClick={onClose}
            aria-label="Close help"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="drawer__body">
          <h4>What VeriTrace does</h4>
          <p>
            VeriTrace verifies uploaded material documents before material
            release. It extracts structured fields from a Certificate of Analysis
            and Material Label, compares them against approved master data, and
            calculates a transparent risk score and decision.
          </p>

          <h4>What you need to verify</h4>
          <p>Complete verification requires exactly:</p>
          <ul>
            <li>1 Certificate of Analysis (COA)</li>
            <li>1 Material Label</li>
          </ul>
          <p>
            Supporting documents may be added to the queue, but VeriTrace only
            analyzes the COA and Material Label pair.
          </p>

          <h4>How the decision is made</h4>
          <p>
            VeriTrace runs a deterministic decision engine over the extracted
            fields. The risk score is the sum of finding scores (capped at 100).
            See <strong>Settings → Decision &amp; risk scoring</strong> for the
            weight matrix.
          </p>

          <h4>The role of the LLM</h4>
          <p>
            The LLM only generates plain-language explanations of findings.
            It does not decide final status. Final material release remains with
            authorized QA personnel.
          </p>

          <h4>Where things are</h4>
          <ul>
            <li>
              <strong>Verify</strong> — upload documents and run a verification
              or try a sample case.
            </li>
            <li>
              <strong>History</strong> — review past verifications and their
              evidence.
            </li>
            <li>
              <strong>Master Data</strong> — read-only view of approved
              materials, specifications, and suppliers.
            </li>
            <li>
              <strong>Settings</strong> — system status and the deterministic
              risk-scoring policy.
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
}
