import { useEffect, useState } from "react";

import HelpDrawer from "./components/HelpDrawer.jsx";
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
import { api } from "./api.js";

const NAV = [
  { id: "verify", label: "Verify", icon: "verify", mIcon: "fact_check" },
  { id: "history", label: "History", icon: "history", mIcon: "history_edu" },
  { id: "master", label: "Master Data", icon: "master", mIcon: "storage" },
  { id: "settings", label: "Settings", icon: "settings", mIcon: "settings" },
];

const PAGE_META = {
  verify: {
    eyebrow: "Verify",
    label: "Verify",
    title: "New Material Verification",
    subtitle:
      "Upload required documentation to initiate automated compliance check. Complete verification needs one Certificate of Analysis and one Material Label.",
    icon: "fact_check",
  },
  history: {
    eyebrow: "History",
    label: "History",
    title: "Verification History",
    subtitle:
      "Comprehensive audit log of all material verification activities.",
    icon: "history_edu",
  },
  master: {
    eyebrow: "Master Data",
    label: "Master Data",
    title: "Master Data Hub",
    subtitle:
      "Source-of-truth records used to validate materials, specifications, and supplier approval.",
    icon: "storage",
  },
  settings: {
    eyebrow: "Settings",
    label: "Settings",
    title: "System Status & Governance",
    subtitle:
      "Review integrations, scoring rules, and how VeriTrace makes deterministic decisions.",
    icon: "settings",
  },
  // Secondary views — not in primary nav
  help: {
    eyebrow: "Help",
    label: "Help",
    title: "Help & Documentation",
    subtitle:
      "How to upload documents, read findings, navigate the audit trail, and contact support.",
    icon: "help_outline",
  },
  profile: {
    eyebrow: "Profile",
    label: "Profile",
    title: "User Profile",
    subtitle:
      "Static preview — account management is in development.",
    icon: "account_circle",
  },
  report: {
    eyebrow: "Full Report",
    label: "Full Report",
    title: "Full Verification Report",
    subtitle:
      "Audit-style report with full metadata, decision, findings, and extracted details.",
    icon: "description",
  },
};

const UPLOAD_ENABLED = true;
const PRIMARY_VIEWS = new Set(["verify", "history", "master", "settings"]);

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
  const [helpOpen, setHelpOpen] = useState(false);
  const [policyTopic, setPolicyTopic] = useState(null);

  const [systemOk, setSystemOk] = useState(null);
  useEffect(() => {
    let cancelled = false;
    api
      .health()
      .then((data) => !cancelled && setSystemOk(data?.status === "ok"))
      .catch(() => !cancelled && setSystemOk(false));
    return () => {
      cancelled = true;
    };
  }, []);

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
      <HelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
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
              <div className="app__brand-strip" aria-hidden="true">
                <div className="sidenav__brand-mark">VT</div>
                <div className="app__brand-strip-name">VeriTrace</div>
              </div>
              <div className="app__header-text">
                <div className="app__header-crumb">
                  <span>VeriTrace</span>
                  <span className="app__header-crumb-sep">/</span>
                  <span>{meta.label}</span>
                </div>
                <h1 className="app__title">{meta.title}</h1>
              </div>
            </div>
            <div className="app__header-right">
              <span className="prototype-pill" title="VeriTrace prototype mode">
                <span className="prototype-pill__dot" aria-hidden="true" />
                Prototype Mode — Not for Production Use
              </span>
              <span
                className={
                  "status-pill " +
                  (systemOk === false
                    ? "status-pill--warn"
                    : systemOk === null
                    ? "status-pill--neutral"
                    : "")
                }
                title={
                  systemOk === false
                    ? "Backend not reachable"
                    : systemOk === null
                    ? "Checking backend status"
                    : "Backend reachable"
                }
              >
                <span className="status-pill__dot" aria-hidden="true" />
                {systemOk === false
                  ? "System offline"
                  : systemOk === null
                  ? "Checking…"
                  : "System operational"}
              </span>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setHelpOpen(true)}
                aria-label="Open quick help"
                title="Quick help"
              >
                <MIcon name="help_outline" size={22} />
              </button>
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
                <div className="page-hero__eyebrow">{meta.eyebrow}</div>
                <h2 className="page-hero__title">{meta.title}</h2>
                <p className="page-hero__subtitle">{meta.subtitle}</p>
              </div>
              <div className="page-hero__chips">
                {PRIMARY_VIEWS.has(view) ? (
                  <>
                    <span className="badge badge--info">Azure Document Intelligence</span>
                    <span className="badge badge--neutral">Deterministic engine</span>
                  </>
                ) : (
                  <span className="dev-badge dev-badge--neutral">Secondary view</span>
                )}
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
            {view === "help" ? (
              <HelpPage onOpenPolicy={(t) => setPolicyTopic(t)} />
            ) : null}
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
              © {new Date().getFullYear()} VeriTrace Pharma Systems · Lab-Grade
              Verification Protocol v4.2.
            </span>
            <div className="app__footer-meta">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setPolicyTopic("privacy")}
                style={{ padding: "4px 10px", fontSize: 12 }}
              >
                Privacy Policy
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setPolicyTopic("audit")}
                style={{ padding: "4px 10px", fontSize: 12 }}
              >
                Audit Log Protocol
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setPolicyTopic("status")}
                style={{ padding: "4px 10px", fontSize: 12 }}
              >
                System Status
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setPolicyTopic("support")}
                style={{ padding: "4px 10px", fontSize: 12 }}
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
