import { useEffect, useState } from "react";

import { ROUTES, navigate } from "../router.js";
import { consumeFlash } from "../auth/flash.js";
import { DEMO_CREDENTIALS, signIn } from "../auth/session.js";

function MIcon({ name, size = 18, className = "" }) {
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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [flash, setFlash] = useState(null);

  useEffect(() => {
    const next = consumeFlash();
    if (!next) return;
    setFlash(next);
    if (next.email) setEmail(next.email);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await signIn({ email, password });
      navigate(ROUTES.APP);
    } catch (err) {
      setError(err.message || "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo() {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
    setError(null);
  }

  return (
    <div className="auth">
      <div className="auth__panel">
        <button
          type="button"
          className="auth__back"
          onClick={() => navigate(ROUTES.LANDING)}
        >
          <MIcon name="arrow_back" size={16} />
          Back to landing
        </button>

        <div className="auth__brand">
          <div className="auth__brand-mark" aria-hidden="true">
            <MIcon name="verified" size={20} />
          </div>
          <div>
            <div className="auth__brand-name">VeriTrace</div>
            <div className="auth__brand-tag">Material Verification Copilot</div>
          </div>
        </div>

        <h1 className="auth__title">Sign in</h1>
        <p className="auth__sub">
          Continue to your verification workspace.
        </p>

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          <label className="auth__field">
            <span className="auth__label">Work email</span>
            <input
              type="email"
              autoComplete="email"
              className="auth__input"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </label>

          <label className="auth__field">
            <span className="auth__label">Password</span>
            <div className="auth__input-wrap">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="auth__input"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="auth__input-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                <MIcon name={showPassword ? "visibility_off" : "visibility"} size={18} />
              </button>
            </div>
          </label>

          {flash ? (
            <div className="auth__notice auth__notice--success" role="status">
              <MIcon name="check_circle" size={16} />
              <span>{flash.message}</span>
            </div>
          ) : null}

          {error ? (
            <div className="auth__error" role="alert">
              <MIcon name="error" size={16} />
              <span>{error}</span>
            </div>
          ) : null}

          <button
            type="submit"
            className="btn btn--primary btn--block btn--lg"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner" /> Signing in…
              </>
            ) : (
              <>
                Sign in
                <MIcon name="arrow_forward" size={16} />
              </>
            )}
          </button>
        </form>

        <div className="auth__hint">
          <MIcon name="info" size={14} />
          <span>
            Need a quick look?{" "}
            <button
              type="button"
              className="auth__link auth__link--inline"
              onClick={fillDemo}
            >
              Use the demo account
            </button>{" "}
            (<span className="mono">{DEMO_CREDENTIALS.email}</span> /{" "}
            <span className="mono">{DEMO_CREDENTIALS.password}</span>).
          </span>
        </div>

        <div className="auth__divider"><span>or</span></div>

        <div className="auth__alt">
          <span>Don't have an account?</span>
          <button
            type="button"
            className="auth__link"
            onClick={() => navigate(ROUTES.REGISTER)}
          >
            Request access
          </button>
        </div>
      </div>

      <aside className="auth__aside">
        <div className="auth__aside-inner">
          <div className="auth__aside-eyebrow">VeriTrace</div>
          <h2 className="auth__aside-title">
            Verify material documents before release.
          </h2>
          <p className="auth__aside-body">
            Cross-check Certificates of Analysis and material labels against
            approved master data — and produce an audit-ready record every time.
          </p>
          <ul className="auth__aside-list">
            <li><MIcon name="check_circle" size={16} /> Deterministic findings, transparent risk score</li>
            <li><MIcon name="check_circle" size={16} /> Approved supplier &amp; spec verification</li>
            <li><MIcon name="check_circle" size={16} /> Full audit trail per verification record</li>
          </ul>
          <div className="auth__aside-foot">
            Document extraction by Azure Document Intelligence.
          </div>
        </div>
      </aside>
    </div>
  );
}
