import { useEffect, useRef, useState } from "react";

/**
 * Header avatar with a dropdown menu.
 *
 * Shows the current signed-in user (passed from RootApp via App.jsx) and
 * exposes a Sign out action that clears the local session.
 */
export default function ProfileMenu({ user, onOpenProfile, onSignOut }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const initials = user?.initials || deriveInitials(user?.name, user?.email) || "QA";
  const displayName = user?.name || "Reviewer";
  const displayEmail = user?.email || "qa@veritrace.com";

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function handleKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="menu-anchor" ref={ref}>
      <button
        type="button"
        className="avatar-btn"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={displayEmail}
      >
        {initials}
      </button>
      {open ? (
        <div className="menu-popover" role="menu">
          <div className="menu-popover__head">
            <div className="menu-popover__name">{displayName}</div>
            <div className="menu-popover__sub">{displayEmail}</div>
          </div>
          <button
            type="button"
            className="menu-item"
            onClick={() => {
              setOpen(false);
              onOpenProfile?.();
            }}
            role="menuitem"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21a8 8 0 0 1 16 0" />
            </svg>
            View profile
          </button>
          <button
            type="button"
            className="menu-item menu-item--danger"
            onClick={() => {
              setOpen(false);
              onSignOut?.();
            }}
            role="menuitem"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

function deriveInitials(name, email) {
  const source = (name || email || "").trim();
  if (!source) return "";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}
