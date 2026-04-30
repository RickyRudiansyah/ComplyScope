import { useEffect } from "react";

/**
 * Sidebar — Claude Design "QA Operations" panel.
 *
 * - 256px wide, slides in from the left as an overlay on small viewports
 *   and pushes content on >=1024px (controlled by .app--nav-open).
 * - Caps-style nav labels with Material Symbols Outlined icons.
 * - Resources section pinned to the bottom (Help / Sign Out).
 * - Auto-collapses after item selection (App.jsx onChange handler closes it).
 */

function MIcon({ name, size = 18 }) {
  return (
    <span
      className="material-symbols-outlined sidenav__item-icon"
      style={{ fontSize: size }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

export default function SideNav({
  items,
  current,
  onChange,
  open = true,
  onClose,
  onOpenHelp,
}) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  function handleSelect(id) {
    onChange(id);
    onClose?.();
  }

  return (
    <>
      <div
        className={"sidenav-backdrop" + (open ? " sidenav-backdrop--shown" : "")}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        id="primary-nav"
        className={"sidenav" + (open ? " sidenav--open" : " sidenav--closed")}
        aria-hidden={!open}
      >
        <div className="sidenav__top">
          <div className="sidenav__brand">
            <div className="sidenav__brand-mark">VT</div>
            <div>
              <div className="sidenav__brand-name">VeriTrace</div>
              <div className="sidenav__brand-tag">Material Verification Copilot</div>
            </div>
          </div>
          <button
            type="button"
            className="sidenav__close"
            onClick={onClose}
            aria-label="Close navigation"
            title="Close navigation"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              close
            </span>
          </button>
        </div>

        <div>
          <div className="sidenav__section-label">QA Operations</div>
          <div
            style={{
              fontSize: 11,
              color: "var(--c-outline)",
              padding: "0 24px 8px",
              marginTop: -4,
            }}
          >
            Institutional Grade Verification
          </div>
          <nav className="sidenav__nav" aria-label="Primary">
            {items.map((it) => (
              <button
                key={it.id}
                type="button"
                className={
                  "sidenav__item" +
                  (current === it.id ? " sidenav__item--active" : "")
                }
                onClick={() => handleSelect(it.id)}
                tabIndex={open ? 0 : -1}
              >
                <MIcon name={it.mIcon || "circle"} />
                <span>{it.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="sidenav__meta">
          <div className="sidenav__meta-pill" title="Deterministic decision engine">
            <span className="sidenav__meta-pill-dot" aria-hidden="true" />
            Deterministic engine
          </div>
          <div className="sidenav__section-label" style={{ paddingTop: 8 }}>
            Resources
          </div>
          <nav className="sidenav__nav" aria-label="Secondary">
            <button
              type="button"
              className={
                "sidenav__item" +
                (current === "help" ? " sidenav__item--active" : "")
              }
              onClick={() => {
                onOpenHelp?.();
                onClose?.();
              }}
              tabIndex={open ? 0 : -1}
            >
              <MIcon name="help_outline" />
              <span>Help</span>
            </button>
            <button
              type="button"
              className="sidenav__item"
              disabled
              title="Authentication backend integration pending"
              style={{ opacity: 0.55, cursor: "not-allowed" }}
            >
              <MIcon name="logout" />
              <span>Sign Out</span>
              <span style={{
                marginLeft: "auto",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                color: "var(--c-nav-text-soft)",
              }}>In dev</span>
            </button>
          </nav>
          <div className="sidenav__footer" style={{ marginTop: 8 }}>
            VeriTrace · Material Verification Copilot
            <div style={{ marginTop: 2, opacity: 0.8 }}>
              Institutional-grade verification
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
