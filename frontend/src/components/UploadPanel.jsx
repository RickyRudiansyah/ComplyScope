import { useMemo, useRef, useState } from "react";

/**
 * Document upload workflow.
 *
 * UX model:
 *   1. One drop area accepts multiple files at once (PDF / PNG / JPG).
 *   2. Each added file becomes a row with a document-type dropdown.
 *   3. Filename hints set a default type, but the user always overrides.
 *   4. Analyze sends exactly one COA and one Label file as multipart/form-data
 *      to POST /api/verifications.
 *
 * Supporting documents are accepted in the UI but are not sent to the
 * backend; the backend pipeline processes one COA + one
 * material label.
 */

const TYPE_OPTIONS = [
  { value: "COA", label: "Certificate of Analysis (COA)" },
  { value: "LABEL", label: "Material Label" },
  { value: "SUPPORTING", label: "Supporting Document" },
  // { value: "IGNORE", label: "Ignore" },
];

const ACCEPT = ".pdf,.png,.jpg,.jpeg";

function inferType(filename) {
  const name = (filename || "").toLowerCase();
  if (name.includes("coa")) return "COA";
  if (name.includes("label")) return "LABEL";
  return "SUPPORTING";
}

function nextId() {
  return `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPanel({ uploadEnabled = false, onAnalyze }) {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]); // [{ id, file, type }]
  const [dragActive, setDragActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);

  function addFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    const incoming = Array.from(fileList).map((file) => ({
      id: nextId(),
      file,
      type: inferType(file.name),
    }));
    setFiles((prev) => [...prev, ...incoming]);
    setAnalyzeError(null);
  }

  function removeFile(id) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setAnalyzeError(null);
  }

  function setFileType(id, type) {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, type } : f)));
    setAnalyzeError(null);
  }

  function clearAll() {
    setFiles([]);
    setAnalyzeError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onPickClick() {
    inputRef.current?.click();
  }

  function onPickChange(e) {
    addFiles(e.target.files);
    // Allow re-selecting the same file again later.
    if (inputRef.current) inputRef.current.value = "";
  }

  function onDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!dragActive) setDragActive(true);
  }
  function onDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }
  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer?.files) addFiles(e.dataTransfer.files);
  }

  const counts = useMemo(() => {
    // const c = { COA: 0, LABEL: 0, SUPPORTING: 0, IGNORE: 0 };
    const c = { COA: 0, LABEL: 0, SUPPORTING: 0};
    for (const f of files) c[f.type] = (c[f.type] || 0) + 1;
    return c;
  }, [files]);

  const ready = counts.COA === 1 && counts.LABEL === 1;
  const tooMany = counts.COA > 1 || counts.LABEL > 1;

  let validationMessage = null;
  if (files.length > 0) {
    if (tooMany) {
      validationMessage =
        "Only one COA and one Material Label can be analyzed at a time.";
    } else if (!ready) {
      validationMessage =
        "Assign one file as COA and one as Material Label to continue.";
    }
  }

  async function handleAnalyze() {
    if (!ready || analyzing) return;
    const coa = files.find((f) => f.type === "COA");
    const label = files.find((f) => f.type === "LABEL");
    if (!coa || !label) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      await onAnalyze?.({ coaFile: coa.file, labelFile: label.file });
    } catch (err) {
      setAnalyzeError(err?.message || "Upload failed.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <section className="card">
      <div className="card__header">
        <div>
          <h3 className="card__title">Upload documents</h3>
          <p className="card__subtitle">
            Attach a Certificate of Analysis and a Material Label, then run verification.
          </p>
        </div>
      </div>

      <div className="card__body">
        <div
          className={
            "upload-drop" + (dragActive ? " upload-drop--active" : "")
          }
          role="button"
          tabIndex={0}
          onClick={onPickClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onPickClick();
            }
          }}
          onDragOver={onDragOver}
          onDragEnter={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <span
            className="material-symbols-outlined upload-drop__icon"
            aria-hidden="true"
          >
            upload_file
          </span>
          <p className="upload-drop__title">Drag &amp; drop files here</p>
          <p className="upload-drop__hint">
            or click to browse (PDF, PNG, JPG)
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPT}
            onChange={onPickChange}
            style={{ display: "none" }}
          />
        </div>

        {files.length > 0 ? (
          <ul className="file-list">
            {files.map((f) => {
              const isImage = /\.(png|jpe?g)$/i.test(f.file.name);
              return (
                <li key={f.id} className="file-row">
                  <span
                    className="material-symbols-outlined file-row__icon"
                    aria-hidden="true"
                  >
                    {isImage ? "image" : "description"}
                  </span>
                  <div className="file-row__main">
                    <div className="file-row__name" title={f.file.name}>
                      {f.file.name}
                    </div>
                    <div className="file-row__status">
                      <span
                        className="material-symbols-outlined file-row__status-icon"
                        aria-hidden="true"
                      >
                        check_circle
                      </span>
                      Ready · {formatBytes(f.file.size)}
                    </div>
                  </div>
                  <select
                    aria-label="Document type"
                    className="file-row__select"
                    value={f.type}
                    onChange={(e) => setFileType(f.id, e.target.value)}
                    disabled={analyzing}
                  >
                    {TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="file-row__remove"
                    onClick={() => removeFile(f.id)}
                    disabled={analyzing}
                    aria-label={`Remove ${f.file.name}`}
                    title="Remove file"
                  >
                    <span
                      className="material-symbols-outlined"
                      aria-hidden="true"
                      style={{ fontSize: 18 }}
                    >
                      close
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        {!uploadEnabled ? (
          <div className="banner banner--info" style={{ marginTop: 12 }}>
            Upload is not available in this environment. Sample cases remain available for review.
          </div>
        ) : validationMessage ? (
          <div
            className={
              "banner " + (tooMany ? "banner--warn" : "banner--info")
            }
            style={{ marginTop: 12 }}
          >
            {validationMessage}
          </div>
        ) : null}

        {analyzeError ? (
          <div className="banner banner--error" style={{ marginTop: 12 }}>
            {analyzeError}
          </div>
        ) : null}

        <div className="upload-actions">
          <div className="upload-actions__status">
            {ready && !tooMany ? (
              <>
                <span
                  className="material-symbols-outlined upload-actions__icon upload-actions__icon--ok"
                  aria-hidden="true"
                >
                  check_circle
                </span>
                Requirements met (1 COA, 1 Material Label)
              </>
            ) : files.length === 0 ? (
              <>
                <span
                  className="material-symbols-outlined upload-actions__icon"
                  aria-hidden="true"
                >
                  info
                </span>
                Add a COA and a Material Label to enable verification.
              </>
            ) : null}
          </div>
          <div className="row" style={{ gap: 10 }}>
            <button
              type="button"
              className="btn"
              onClick={clearAll}
              disabled={files.length === 0 || analyzing}
            >
              Clear
            </button>
            <button
              type="button"
              className="btn btn--primary"
              disabled={!uploadEnabled || !ready || analyzing}
              onClick={handleAnalyze}
            >
              {analyzing ? "Verifying…" : "Run verification"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
