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
    title: "Verify a material batch",
    subtitle:
      "Upload a Certificate of Analysis and matching label, or run a sample case.",
  },
  history: {
    title: "Verification History",
    subtitle:
      "Audit trail of verification runs, including uploaded documents and sample cases.",
  },
  master: {
    title: "Master Data",
    subtitle:
      "Read-only source of truth for materials, required tests, and approved suppliers.",
  },
  settings: {
    title: "System & help",
    subtitle: "API status, integrations, and how the verification pipeline works.",
  },
};

// POST /api/verifications is not implemented yet — keep upload disabled.
const UPLOAD_ENABLED = false;

export default function App() {
  const [view, setView] = useState("verify");
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const meta = PAGE_META[view] || PAGE_META.verify;

  return (
    <div className="app">
      <SideNav items={NAV} current={view} onChange={setView} />
      <main className="app__main">
        <header className="app__header">
          <h1 className="app__title">{meta.title}</h1>
          <p className="app__subtitle">{meta.subtitle}</p>
        </header>
        <div className="app__content">
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
      </main>
    </div>
  );
}
