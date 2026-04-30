import { useEffect, useState } from "react";

import ResultTabs from "../components/ResultTabs.jsx";
import SampleCasesPanel from "../components/SampleCasesPanel.jsx";
import UploadPanel from "../components/UploadPanel.jsx";
import { api } from "../api.js";

export default function VerifyPage({ uploadEnabled = false, onVerified }) {
  const [scenarios, setScenarios] = useState([]);
  const [scenariosErr, setScenariosErr] = useState(null);
  const [scenariosLoading, setScenariosLoading] = useState(true);

  const [verification, setVerification] = useState(null);
  const [runningId, setRunningId] = useState(null);
  const [runError, setRunError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setScenariosLoading(true);
    api
      .listDemoScenarios()
      .then((data) => {
        if (!cancelled) setScenarios(data || []);
      })
      .catch((err) => {
        if (!cancelled) setScenariosErr(err.message);
      })
      .finally(() => {
        if (!cancelled) setScenariosLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRunSample(id) {
    setRunningId(id);
    setRunError(null);
    try {
      const result = await api.runDemoScenario(id);
      setVerification(result);
      onVerified?.(result);
    } catch (err) {
      setRunError(err.message);
    } finally {
      setRunningId(null);
    }
  }

  // Throws so UploadPanel can show its own error banner; also clears the
  // shared run-error so an old failure doesn't linger.
  async function handleAnalyzeUpload({ coaFile, labelFile }) {
    setRunError(null);
    const result = await api.createVerification(coaFile, labelFile);
    setVerification(result);
    onVerified?.(result);
    return result;
  }

  return (
    <div className="stack">
      <div className="info-tile" role="note">
        <span
          className="material-symbols-outlined info-tile__mi"
          aria-hidden="true"
        >
          info
        </span>
        <div>
          <div className="info-tile__title">Verification requirements</div>
          <div className="info-tile__hint">
            A verification record requires exactly one Certificate of Analysis
            and one Material Label.
          </div>
        </div>
      </div>

      <div className="verify-grid">
        <UploadPanel
          uploadEnabled={uploadEnabled}
          onAnalyze={handleAnalyzeUpload}
        />
        <SampleCasesPanel
          scenarios={scenarios}
          loading={scenariosLoading}
          error={scenariosErr}
          runningId={runningId}
          onRun={handleRunSample}
        />
      </div>

      {runError ? (
        <div className="banner banner--error">{runError}</div>
      ) : null}

      {verification ? (
        <ResultTabs verification={verification} />
      ) : (
        <div className="card">
          <div className="verify-empty">
            <div className="verify-empty__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4" />
                <path d="M12 3l8 4v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7l8-4z" />
              </svg>
            </div>
            <div>
              <div className="verify-empty__title">No verification record yet</div>
              <div className="verify-empty__hint">
                Submit a source document set or run a sample case to produce a
                decision, findings, and supporting evidence.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
