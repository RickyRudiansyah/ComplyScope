import { useEffect, useRef, useState } from "react";

/**
 * Header avatar with a dropdown menu.
 *
 * Mirrors the Claude/Stitch profile dropdown but does not pretend
 * authentication is wired up: "Sign Out" and account management
 * are clearly labeled as in development.
 */
export default function ProfileMenu({ onOpenProfile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

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
        title="Account"
      >
        QA
      </button>
      {open ? (
        <div className="menu-popover" role="menu">
          <div className="menu-popover__head">
            <div className="menu-popover__name">QA Personnel</div>
            <div className="menu-popover__sub">qa@veritrace.com (placeholder)</div>
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
            <span className="menu-item__hint">Static</span>
          </button>
          <button
            type="button"
            className="menu-item menu-item--danger"
            onClick={() => setOpen(false)}
            role="menuitem"
            title="Authentication backend integration pending"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
            <span className="menu-item__hint">In dev</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
