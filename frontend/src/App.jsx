import { useState } from "react";

import SideNav from "./components/SideNav.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import MasterDataPage from "./pages/MasterDataPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import VerifyPage from "./pages/VerifyPage.jsx";

const NAV = [
  { id: "verify", label: "Verify", icon: "verify" },
  { id: "history", label: "History", icon: "history" },
  { id: "master", label: "Master Data", icon: "master" },
  { id: "settings", label: "Settings", icon: "settings" },
];

const PAGE_META = {
  verify: {
    title: "Verify material documents before release",
    subtitle:
      "Upload a COA and material label to check identity, supplier approval, expiry, and quality specifications.",
  },
  history: {
    title: "Verification history",
    subtitle:
      "Review past verifications, evidence, decisions, and document sources.",
  },
  master: {
    title: "Master data",
    subtitle:
      "Source-of-truth records used to validate materials, specifications, and supplier approval.",
  },
  settings: {
    title: "System status and verification policy",
    subtitle:
      "Review integrations, scoring rules, and how VeriTrace makes deterministic decisions.",
  },
};

const UPLOAD_ENABLED = true;

export default function App() {
  const [view, setView] = useState("verify");
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [navOpen, setNavOpen] = useState(false);

  const meta = PAGE_META[view] || PAGE_META.verify;
  const currentLabel = NAV.find((n) => n.id === view)?.label || "VeriTrace";

  return (
    <div className={"app" + (navOpen ? " app--nav-open" : "")}>
      <SideNav
        items={NAV}
        current={view}
        onChange={setView}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />
      <main className="app__main">
        <header className="app__header">
          <div className="shell shell--chrome app__header-left">
            <button
              type="button"
              className="nav-toggle"
              onClick={() => setNavOpen((v) => !v)}
              aria-label={navOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={navOpen}
              aria-controls="primary-nav"
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div className="app__header-text">
              <div className="app__header-crumb" aria-hidden="true">
                VeriTrace · {currentLabel}
              </div>
              <h1 className="app__title">{meta.title}</h1>
              <p className="app__subtitle">{meta.subtitle}</p>
            </div>
          </div>
        </header>
        <div className="app__content">
          <div
            className={
              "shell" + (view === "settings" ? " shell--narrow" : "")
            }
          >
            {view === "verify" ? (
              <VerifyPage
                uploadEnabled={UPLOAD_ENABLED}
                onVerified={() => setHistoryRefreshKey((k) => k + 1)}
              />
            ) : null}
            {view === "history" ? (
              <HistoryPage refreshKey={historyRefreshKey} />
            ) : null}
            {view === "master" ? <MasterDataPage /> : null}
            {view === "settings" ? <SettingsPage /> : null}
          </div>
        </div>
        <footer className="app__footer">
          <div className="shell shell--chrome app__footer-row">
            <div className="app__footer-brand">
              <div className="sidenav__brand-mark">VL</div>
              <div>
                <div className="app__footer-name">VeriTrace</div>
                <div className="app__footer-tag">
                  Material Verification Copilot
                </div>
              </div>
            </div>
            <div className="app__footer-meta">
              <span className="badge badge--info">Azure Document Intelligence</span>
              <span className="badge badge--neutral">Deterministic decision engine</span>
              <span className="badge badge--neutral">Sample data included</span>
              <span className="muted app__footer-copy">
                © {new Date().getFullYear()} VeriTrace
              </span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
