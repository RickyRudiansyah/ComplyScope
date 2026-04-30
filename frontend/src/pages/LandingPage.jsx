import { useEffect, useState } from "react";

import { ROUTES, navigate } from "../router.js";

function MIcon({ name, size = 20, className = "" }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: size }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

const FEATURES = [
  {
    icon: "compare_arrows",
    title: "COA & label cross-check",
    body: "Document-to-document consistency between Certificate of Analysis values and printed material label fields.",
  },
  {
    icon: "verified_user",
    title: "Supplier approval verification",
    body: "Match the supplier on the COA against your approved supplier list before any material is released.",
  },
  {
    icon: "rule",
    title: "Required test / spec validation",
    body: "Enforce the test panel and acceptance criteria defined in your master specification for every material.",
  },
  {
    icon: "speed",
    title: "Risk scoring transparency",
    body: "Every decision is composed of explicit, weighted findings — no hidden score, no opaque inference.",
  },
  {
    icon: "history_edu",
    title: "Audit trail",
    body: "Every verification record is preserved with its inputs, extracted fields, findings, and final decision.",
  },
  {
    icon: "psychology",
    title: "LLM-assisted explanation",
    body: "Plain-language rationale on top of a deterministic decision — the model explains, it does not decide.",
  },
];

const STEPS = [
  {
    n: 1,
    icon: "upload_file",
    title: "Upload",
    body: "Submit a Certificate of Analysis and the corresponding material label.",
  },
  {
    n: 2,
    icon: "document_scanner",
    title: "Extract",
    body: "Azure Document Intelligence extracts structured fields from each document.",
  },
  {
    n: 3,
    icon: "rule_folder",
    title: "Compare",
    body: "Extracted values are compared against approved material specs and supplier records.",
  },
  {
    n: 4,
    icon: "checklist",
    title: "Review",
    body: "Examine findings, evidence, and the deterministic recommendation.",
  },
  {
    n: 5,
    icon: "save",
    title: "Record",
    body: "Save the verification with full audit trail for downstream review.",
  },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function goRegister() {
    navigate(ROUTES.REGISTER);
  }
  function goLogin() {
    navigate(ROUTES.LOGIN);
  }
  function goSample() {
    navigate(ROUTES.LOGIN);
  }

  return (
    <div className="landing">
      <header className={"landing__nav" + (scrolled ? " landing__nav--scrolled" : "")}>
        <div className="landing__nav-row">
          <div className="landing__brand">
            <div className="landing__brand-mark" aria-hidden="true">
              <MIcon name="verified" size={20} />
            </div>
            <div>
              <div className="landing__brand-name">VeriTrace</div>
              <div className="landing__brand-tag">Material Verification Copilot</div>
            </div>
          </div>
          <nav className="landing__nav-links" aria-label="Sections">
            <a href="#problem" className="landing__nav-link">Problem</a>
            <a href="#solution" className="landing__nav-link">Solution</a>
            <a href="#how" className="landing__nav-link">How it works</a>
            <a href="#features" className="landing__nav-link">Features</a>
          </nav>
          <div className="landing__nav-actions">
            <button type="button" className="btn btn--ghost" onClick={goLogin}>
              Sign in
            </button>
            <button type="button" className="btn btn--primary" onClick={goRegister}>
              Get started
            </button>
          </div>
        </div>
      </header>

      <main className="landing__main">
        {/* HERO */}
        <section className="landing__hero">
          <div className="landing__hero-inner">
            <div className="landing__hero-eyebrow">
              <span className="landing__pill">
                <MIcon name="bolt" size={14} />
                Deterministic decision engine
              </span>
              <span className="landing__pill landing__pill--muted">
                Azure Document Intelligence inside
              </span>
            </div>
            <h1 className="landing__hero-title">
              Verify material documents <span className="landing__hero-accent">before release.</span>
            </h1>
            <p className="landing__hero-sub">
              AI-assisted material verification for regulated supply chains.
              VeriTrace cross-checks Certificates of Analysis and material
              labels against your approved master data — and produces an
              audit-ready record every time.
            </p>
            <div className="landing__hero-cta">
              <button type="button" className="btn btn--primary btn--lg" onClick={goRegister}>
                Get started
                <MIcon name="arrow_forward" size={18} />
              </button>
              <button type="button" className="btn btn--lg" onClick={goSample}>
                <MIcon name="play_circle" size={18} />
                Try sample verification
              </button>
            </div>
            <div className="landing__hero-trust">
              <span><MIcon name="lock" size={14} /> Audit-trail by default</span>
              <span><MIcon name="task_alt" size={14} /> Deterministic findings</span>
              <span><MIcon name="auto_awesome" size={14} /> LLM-assisted explanations</span>
            </div>
          </div>

          <div className="landing__hero-card" aria-hidden="true">
            <div className="landing__mock">
              <div className="landing__mock-head">
                <div className="landing__mock-dot landing__mock-dot--ok" />
                <div className="landing__mock-title">Verification · VR-2026-0481</div>
                <span className="badge badge--ok">RELEASE</span>
              </div>
              <div className="landing__mock-row">
                <span className="landing__mock-label">Material</span>
                <span className="landing__mock-value">MAT-104 · Lactose Monohydrate</span>
              </div>
              <div className="landing__mock-row">
                <span className="landing__mock-label">Supplier</span>
                <span className="landing__mock-value">Acme Pharma Ingredients · Approved</span>
              </div>
              <div className="landing__mock-row">
                <span className="landing__mock-label">Lot</span>
                <span className="landing__mock-value mono">LM-26A-0418</span>
              </div>
              <div className="landing__mock-findings">
                <div className="landing__mock-finding landing__mock-finding--ok">
                  <MIcon name="check_circle" size={16} /> Loss on Drying within spec
                </div>
                <div className="landing__mock-finding landing__mock-finding--ok">
                  <MIcon name="check_circle" size={16} /> Particle size matches spec
                </div>
                <div className="landing__mock-finding landing__mock-finding--info">
                  <MIcon name="info" size={16} /> Lot # matches label
                </div>
              </div>
              <div className="landing__mock-foot">
                <span><MIcon name="bolt" size={12} /> Deterministic engine</span>
                <span className="mono">risk 0.08</span>
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEM */}
        <section className="landing__section" id="problem">
          <div className="landing__section-head">
            <div className="landing__eyebrow">The problem</div>
            <h2 className="landing__section-title">
              Manual COA and label checks are slow, inconsistent, and hard to audit.
            </h2>
            <p className="landing__section-sub">
              Reviewers compare PDFs side-by-side, transcribe values into spreadsheets,
              and chase suppliers for missing tests. The same material is reviewed
              differently by different people, and the evidence is scattered across
              email threads, shared drives, and printouts.
            </p>
          </div>
          <div className="landing__problem-grid">
            <div className="landing__problem-card">
              <MIcon name="schedule" size={20} className="landing__problem-icon" />
              <div className="landing__problem-title">Time per release</div>
              <div className="landing__problem-body">
                Reviewers spend 20–40 minutes per material reconciling COA fields
                against approved specifications.
              </div>
            </div>
            <div className="landing__problem-card">
              <MIcon name="error" size={20} className="landing__problem-icon" />
              <div className="landing__problem-title">Inconsistent decisions</div>
              <div className="landing__problem-body">
                Two reviewers can reach different conclusions on the same lot —
                without a recorded reason.
              </div>
            </div>
            <div className="landing__problem-card">
              <MIcon name="folder_off" size={20} className="landing__problem-icon" />
              <div className="landing__problem-title">Audit gaps</div>
              <div className="landing__problem-body">
                Source documents, justifications, and approval evidence live in
                separate systems — or get lost entirely.
              </div>
            </div>
          </div>
        </section>

        {/* SOLUTION */}
        <section className="landing__section landing__section--inverse" id="solution">
          <div className="landing__section-head landing__section-head--center">
            <div className="landing__eyebrow landing__eyebrow--inverse">The solution</div>
            <h2 className="landing__section-title landing__section-title--inverse">
              One verification record. Every decision, defensible.
            </h2>
            <p className="landing__section-sub landing__section-sub--inverse">
              VeriTrace extracts COA and label data, compares documents against each
              other and your master data, then produces deterministic findings, a risk
              score, and audit-ready evidence — in a single record per lot.
            </p>
          </div>
          <div className="landing__solution-row">
            <div className="landing__solution-col">
              <div className="landing__solution-stat">Deterministic</div>
              <div className="landing__solution-cap">
                Decisions are computed from explicit findings, not opinions or
                model outputs.
              </div>
            </div>
            <div className="landing__solution-col">
              <div className="landing__solution-stat">Traceable</div>
              <div className="landing__solution-cap">
                Each finding links back to a source field on the COA, label, or
                master spec.
              </div>
            </div>
            <div className="landing__solution-col">
              <div className="landing__solution-stat">Reviewable</div>
              <div className="landing__solution-cap">
                A reviewer can re-open any record, see what was extracted, and
                why a decision landed where it did.
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="landing__section" id="how">
          <div className="landing__section-head">
            <div className="landing__eyebrow">How it works</div>
            <h2 className="landing__section-title">From documents to a defensible decision.</h2>
            <p className="landing__section-sub">
              Five steps. Each one produces evidence the next step depends on,
              and the final record carries all of them forward.
            </p>
          </div>
          <ol className="landing__steps">
            {STEPS.map((s) => (
              <li key={s.n} className="landing__step">
                <div className="landing__step-num">{s.n}</div>
                <div className="landing__step-icon">
                  <MIcon name={s.icon} size={20} />
                </div>
                <div className="landing__step-title">{s.title}</div>
                <div className="landing__step-body">{s.body}</div>
              </li>
            ))}
          </ol>
        </section>

        {/* FEATURES */}
        <section className="landing__section" id="features">
          <div className="landing__section-head">
            <div className="landing__eyebrow">Capabilities</div>
            <h2 className="landing__section-title">Built for regulated supply chains.</h2>
            <p className="landing__section-sub">
              The pieces that matter for QA reviewers, auditors, and the supplier
              quality team — without the SaaS theatrics.
            </p>
          </div>
          <div className="landing__features">
            {FEATURES.map((f) => (
              <div key={f.title} className="landing__feature">
                <div className="landing__feature-icon">
                  <MIcon name={f.icon} size={20} />
                </div>
                <div className="landing__feature-title">{f.title}</div>
                <div className="landing__feature-body">{f.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="landing__cta">
          <div className="landing__cta-inner">
            <h2 className="landing__cta-title">
              Start verifying material documents with VeriTrace.
            </h2>
            <p className="landing__cta-sub">
              Spin up a reviewer account and run a verification against the bundled
              sample dataset in under a minute.
            </p>
            <div className="landing__cta-actions">
              <button type="button" className="btn btn--primary btn--lg" onClick={goRegister}>
                Request access
                <MIcon name="arrow_forward" size={18} />
              </button>
              <button type="button" className="btn btn--lg" onClick={goLogin}>
                Sign in
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing__footer">
        <div className="landing__footer-row">
          <span>© {new Date().getFullYear()} VeriTrace · Material Verification Copilot</span>
          <span className="landing__footer-meta">
            Document extraction by Azure Document Intelligence ·
            Decisions remain deterministic
          </span>
        </div>
      </footer>
    </div>
  );
}
