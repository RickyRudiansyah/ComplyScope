import { useEffect, useRef, useState } from "react";

/**
 * Header notifications bell with a static popover.
 *
 * No backend exists for notifications yet; the popover clearly
 * labels the feature as in development rather than faking content.
 */
export default function NotificationsMenu() {
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
        className="icon-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
        title="Notifications"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16l-2-2z" />
          <path d="M10 21h4" />
        </svg>
      </button>
      {open ? (
        <div className="menu-popover notif-popover" role="menu">
          <div className="menu-popover__head">
            <div className="menu-popover__name">Notifications</div>
            <div className="menu-popover__sub">
              Alerts for verifications that need review will appear here.
            </div>
          </div>
          <div className="notif-popover__body">
            <div className="dev-banner">
              <div className="dev-banner__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12" y2="16.01" />
                </svg>
              </div>
              <div>
                <strong>Notifications are in development.</strong>
                <div style={{ marginTop: 4 }}>
                  Backend integration pending. New alerts will surface here once
                  the notification service is connected.
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
