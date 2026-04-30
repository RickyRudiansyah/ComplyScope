import { useState } from "react";

import NotificationsMenu from "./components/NotificationsMenu.jsx";
import PolicyDrawer from "./components/PolicyDrawer.jsx";
import ProfileMenu from "./components/ProfileMenu.jsx";
import SideNav from "./components/SideNav.jsx";
import FullReportPage from "./pages/FullReportPage.jsx";
import HelpPage from "./pages/HelpPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import MasterDataPage from "./pages/MasterDataPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import VerifyPage from "./pages/VerifyPage.jsx";

const NAV = [
  { id: "verify", label: "Verify", icon: "verify", mIcon: "fact_check" },
  { id: "history", label: "History", icon: "history", mIcon: "history_edu" },
  { id: "master", label: "Master Data", icon: "master", mIcon: "storage" },
  { id: "settings", label: "Settings", icon: "settings", mIcon: "settings" },
];

const PAGE_META = {
  verify: {
    label: "Verify",
    title: "Material Verification",
    subtitle:
      "Submit a Certificate of Analysis and Material Label to run an automated verification record.",
    icon: "fact_check",
  },
  history: {
    label: "History",
    title: "Verification History",
    subtitle:
      "Audit trail of all verification records, with decision, risk, and source for each.",
    icon: "history_edu",
  },
  master: {
    label: "Master Data",
    title: "Master Data",
    subtitle:
      "Approved materials, specifications, and suppliers used as the source of truth for verification.",
    icon: "storage",
  },
  settings: {
    label: "Settings",
    title: "System Settings",
    subtitle:
      "Service status, verification pipeline, and the deterministic scoring policy.",
    icon: "settings",
  },
  // Secondary views — not in primary nav
  help: {
    label: "Help",
    title: "Help & Documentation",
    subtitle:
      "Reference material for QA reviewers: upload, results, findings, history, and master data.",
    icon: "help_outline",
  },
  profile: {
    label: "Profile",
    title: "User Profile",
    subtitle:
      "Account management — backend integration pending.",
    icon: "account_circle",
  },
  report: {
    label: "Full Report",
    title: "Full Verification Report",
    subtitle:
      "Decision, findings, and extracted evidence for the selected verification record.",
    icon: "description",
  },
};

const UPLOAD_ENABLED = true;

// Material Symbols Outlined inline icon
function MIcon({ name, size = 20, className = "" }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: size }}
    >
      {name}
    </span>
  );
}

export default function App() {
  const [view, setView] = useState("verify");
  const [reportId, setReportId] = useState(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const [policyTopic, setPolicyTopic] = useState(null);

  const meta = PAGE_META[view] || PAGE_META.verify;

  function goPrimary(id) {
    setView(id);
    setReportId(null);
    // Auto-collapse sidebar after selecting an item (per design requirement).
    setNavOpen(false);
  }

  function openReport(analysisId) {
    setReportId(analysisId);
    setView("report");
  }

  return (
    <div className={"app" + (navOpen ? " app--nav-open" : "")}>
      <SideNav
        items={NAV}
        current={view}
        onChange={goPrimary}
        open={navOpen}
        onClose={() => setNavOpen(false)}
        onOpenHelp={() => goPrimary("help")}
      />
      <PolicyDrawer
        topic={policyTopic}
        onClose={() => setPolicyTopic(null)}
      />

      <div className="app__main">
        <header className="app__header">
          <div className="shell shell--chrome app__header-row">
            <div className="app__header-left">
              <button
                type="button"
                className="nav-toggle"
                onClick={() => setNavOpen((v) => !v)}
                aria-label={navOpen ? "Close navigation" : "Open navigation"}
                aria-expanded={navOpen}
                aria-controls="primary-nav"
                title={navOpen ? "Hide sidebar" : "Show sidebar"}
              >
                <MIcon name="menu" size={24} />
              </button>
              <div className="app__brand">
                <div className="app__brand-name">VeriTrace</div>
                <div className="app__brand-tag">Material Verification Copilot</div>
              </div>
            </div>
            <div className="app__header-right">
              <span
                className="engine-indicator"
                title="Deterministic decision engine"
              >
                <MIcon name="bolt" size={14} />
                Deterministic engine
              </span>
              <NotificationsMenu />
              <ProfileMenu onOpenProfile={() => goPrimary("profile")} />
            </div>
          </div>
        </header>

        <div className="app__content">
          <div
            className={
              "shell" + (view === "settings" ? " shell--narrow" : "")
            }
          >
            <section className="page-hero">
              <div className="page-hero__icon" aria-hidden="true">
                <MIcon name={meta.icon || "fact_check"} size={26} />
              </div>
              <div className="page-hero__main">
                <h2 className="page-hero__title">{meta.title}</h2>
                <p className="page-hero__subtitle">{meta.subtitle}</p>
              </div>
            </section>
            {view === "verify" ? (
              <VerifyPage
                uploadEnabled={UPLOAD_ENABLED}
                onVerified={() => setHistoryRefreshKey((k) => k + 1)}
              />
            ) : null}
            {view === "history" ? (
              <HistoryPage
                refreshKey={historyRefreshKey}
                onOpenReport={openReport}
              />
            ) : null}
            {view === "master" ? <MasterDataPage /> : null}
            {view === "settings" ? <SettingsPage /> : null}
            {view === "help" ? <HelpPage /> : null}
            {view === "profile" ? (
              <ProfilePage onBack={() => goPrimary("verify")} />
            ) : null}
            {view === "report" ? (
              <FullReportPage
                analysisId={reportId}
                onBack={() => goPrimary("history")}
              />
            ) : null}
          </div>
        </div>

        <footer className="app__footer">
          <div className="shell shell--chrome app__footer-row">
            <span className="app__footer-copy">
              © {new Date().getFullYear()} VeriTrace · Material Verification Copilot
            </span>
            <div className="app__footer-meta">
              <button
                type="button"
                className="app__footer-link"
                onClick={() => setPolicyTopic("privacy")}
              >
                Privacy Policy
              </button>
              <button
                type="button"
                className="app__footer-link"
                onClick={() => setPolicyTopic("audit")}
              >
                Audit Log Protocol
              </button>
              <button
                type="button"
                className="app__footer-link"
                onClick={() => setPolicyTopic("support")}
              >
                Contact Support
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
