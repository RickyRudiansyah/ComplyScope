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
          <div>
            <div className="sidenav__section-title">QA Operations</div>
            <div className="sidenav__section-sub">Material Verification</div>
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

        <div className="sidenav__primary">
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
          <nav className="sidenav__nav" aria-label="Secondary">
            <button
              type="button"
              className={
                "sidenav__item sidenav__item--secondary" +
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
              className="sidenav__item sidenav__item--secondary"
              disabled
              title="Account management pending"
            >
              <MIcon name="logout" />
              <span>Sign Out</span>
              <span className="sidenav__item-hint">In dev</span>
            </button>
          </nav>
        </div>
      </aside>
    </>
  );
}
