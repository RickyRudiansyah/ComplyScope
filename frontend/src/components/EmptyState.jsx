export default function EmptyState({ title, hint }) {
  return (
    <div className="empty">
      <div style={{ fontWeight: 600, color: "var(--c-text)", marginBottom: 4 }}>
        {title}
      </div>
      {hint ? <div>{hint}</div> : null}
    </div>
  );
}
