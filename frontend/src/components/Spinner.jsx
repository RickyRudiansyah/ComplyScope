export default function Spinner({ label = "Loading…" }) {
  return (
    <span className="row" style={{ gap: 10 }} aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span className="muted" style={{ fontSize: 13 }}>
        {label}
      </span>
    </span>
  );
}
