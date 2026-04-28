import { useRef, useState } from "react";

/**
 * Primary verification workflow.
 *
 * The Analyze action is wired but disabled until the backend exposes
 * POST /api/verifications (Azure Document Intelligence integration).
 * Files are still selectable so the UX is real and ready to enable.
 */
export default function UploadPanel({ uploadEnabled = false, onAnalyze }) {
  const coaRef = useRef(null);
  const labelRef = useRef(null);
  const [coa, setCoa] = useState(null);
  const [label, setLabel] = useState(null);

  const ready = !!coa && !!label;

  function reset() {
    setCoa(null);
    setLabel(null);
    if (coaRef.current) coaRef.current.value = "";
    if (labelRef.current) labelRef.current.value = "";
  }

  return (
    <section className="card">
      <div className="card__header">
        <div>
          <h3 className="card__title">Verify a material batch</h3>
          <p className="card__subtitle">
            Upload the supplier Certificate of Analysis (COA) and the material
            label. VeriTrace cross-checks them against approved specifications
            and supplier master data.
          </p>
        </div>
        <span className="badge badge--info">Primary workflow</span>
      </div>

      <div className="card__body">
        <div className="upload-drop">
          <strong>Upload COA + Material Label</strong>
          <div style={{ marginTop: 4, fontSize: 12 }}>
            Accepted formats: PDF, PNG, JPG. Both files are required.
          </div>
        </div>

        <div className="upload-row">
          <div className="upload-slot">
            <div className="upload-slot__label">Certificate of Analysis</div>
            <input
              ref={coaRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setCoa(e.target.files?.[0] || null)}
              style={{ width: "100%" }}
            />
            {coa ? (
              <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                {coa.name} ({Math.round(coa.size / 1024)} KB)
              </div>
            ) : null}
          </div>
          <div className="upload-slot">
            <div className="upload-slot__label">Material label</div>
            <input
              ref={labelRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setLabel(e.target.files?.[0] || null)}
              style={{ width: "100%" }}
            />
            {label ? (
              <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                {label.name} ({Math.round(label.size / 1024)} KB)
              </div>
            ) : null}
          </div>
        </div>

        {!uploadEnabled ? (
          <div className="banner banner--info" style={{ marginBottom: 12 }}>
            Azure upload mode coming next. The Analyze button will be enabled
            once Azure Document Intelligence extraction is wired in. In the
            meantime, use the Sample Verification Cases on the right to
            exercise the full pipeline end-to-end.
          </div>
        ) : null}

        <div className="row" style={{ justifyContent: "flex-end", gap: 10 }}>
          <button
            type="button"
            className="btn"
            onClick={reset}
            disabled={!coa && !label}
          >
            Clear
          </button>
          <button
            type="button"
            className="btn btn--primary"
            disabled={!uploadEnabled || !ready}
            onClick={() => uploadEnabled && onAnalyze?.({ coa, label })}
            title={
              !uploadEnabled
                ? "Azure Document Intelligence upload not yet enabled"
                : !ready
                ? "Select both files first"
                : "Run verification"
            }
          >
            Analyze
          </button>
        </div>
      </div>

      <div className="card__footer">
        Files are processed against the master data shown in the Master Data
        tab. The deterministic validator + risk engine compute the decision;
        no LLM decides.
      </div>
    </section>
  );
}
