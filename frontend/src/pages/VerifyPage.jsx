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

  return (
    <div className="stack">
      <div className="verify-grid">
        <UploadPanel uploadEnabled={uploadEnabled} />
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
          <div className="card__body empty">
            Upload documents or run a sample case to see a verification result.
          </div>
        </div>
      )}
    </div>
  );
}
