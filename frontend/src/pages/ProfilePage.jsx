/**
 * Profile screen — read-only view of the signed-in user.
 *
 * Data comes from the backend session (`useSession`). Editing the profile
 * is not implemented yet; the dev banner makes that clear.
 */
import { useSession } from "../auth/useSession.js";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProfilePage({ onBack }) {
  const session = useSession();
  const user = session?.user;

  if (!user) {
    return (
      <div className="stack">
        <div className="card">
          <div className="card__body">
            <p className="muted">No active session.</p>
          </div>
        </div>
        <div className="row" style={{ gap: 10 }}>
          <button type="button" className="btn" onClick={onBack}>
            Back
          </button>
        </div>
      </div>
    );
  }

  const fields = [
    ["Full name", user.name || "—"],
    ["Email", user.email],
    ["Role", user.role || "—"],
    ["Organization", user.organization || "—"],
    ["Member since", formatDate(user.created_at)],
    ["Access level", "Standard — Read / Verify"],
  ];

  return (
    <div className="stack">
      <div className="dev-banner" role="note">
        <div className="dev-banner__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12" y2="16.01" />
          </svg>
        </div>
        <div>
          <strong>Profile editing is in development.</strong>{" "}
          Account details below come from your VeriTrace login. Updating these
          fields and changing your password will land in a later release.
        </div>
      </div>

      <div className="card">
        <div className="card__body row" style={{ gap: 18, alignItems: "center" }}>
          <div
            className="avatar-btn"
            style={{ width: 64, height: 64, fontSize: 18, cursor: "default" }}
            aria-hidden="true"
          >
            {user.initials || "U"}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--c-text)" }}>
              {user.name || user.email}
            </div>
            <div className="muted" style={{ marginTop: 2 }}>
              {user.email}
            </div>
            <div style={{ marginTop: 8 }}>
              {user.role ? (
                <span className="badge badge--info">{user.role}</span>
              ) : null}
              {user.organization ? (
                <span className="muted" style={{ marginLeft: 8 }}>
                  {user.organization}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <div>
            <h3 className="card__title">Account details</h3>
            <p className="card__subtitle">
              Read-only preview. Editable account profile is in development.
            </p>
          </div>
        </div>
        <div className="card__body">
          {fields.map(([k, v]) => (
            <div key={k} className="kv">
              <span className="kv__label">{k}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="row" style={{ gap: 10 }}>
        <button type="button" className="btn" onClick={onBack}>
          Back
        </button>
        <button
          type="button"
          className="btn"
          disabled
          title="Account management is in development"
        >
          Manage profile
        </button>
      </div>
    </div>
  );
}
