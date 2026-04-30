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
        <div className="info-tile__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12" y2="16.01" />
          </svg>
        </div>
        <div>
          <div className="info-tile__title">Verification requirements</div>
          <div className="info-tile__hint">
            Complete verification requires exactly <strong>1 Certificate of
            Analysis</strong> and <strong>1 Material Label</strong>. Supporting
            documents may be queued but are not analyzed in this release.
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
              <div className="verify-empty__title">No verification result yet</div>
              <div className="verify-empty__hint">
                Upload documents or try a sample case to see decision,
                findings, and evidence.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
