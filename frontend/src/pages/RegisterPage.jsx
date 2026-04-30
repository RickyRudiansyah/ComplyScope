import { useState } from "react";

import { ROUTES, navigate } from "../router.js";
import { setFlash } from "../auth/flash.js";
import { signUp } from "../auth/session.js";

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

const ROLES = [
  "QA Reviewer",
  "QA Manager",
  "Supplier Quality",
  "Regulatory Affairs",
  "Operations",
  "Other",
];

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const { user } = await signUp({
        name,
        email,
        organization,
        role,
        password,
        confirmPassword,
      });
      // Account is created on the backend, but we deliberately do NOT sign
      // the user in here — they go to /login and authenticate with the
      // credentials they just chose. A flash message + prefilled email
      // smooths the handoff.
      const firstName = (user?.name || name).split(" ")[0] || "reviewer";
      setFlash({
        type: "success",
        message: `Account created successfully. Welcome, ${firstName} — sign in to continue.`,
        email: user?.email || email.trim().toLowerCase(),
      });
      navigate(ROUTES.LOGIN);
    } catch (err) {
      setError(err.message || "Unable to create account.");
    } finally {
      setSubmitting(false);
    }
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
          Back to VeriTrace
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

        <h1 className="auth__title">Request access</h1>
        <p className="auth__sub">
          Create a reviewer account to start verifying material documents.
        </p>

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          <label className="auth__field">
            <span className="auth__label">Full name</span>
            <input
              type="text"
              autoComplete="name"
              className="auth__input"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </label>

          <label className="auth__field">
            <span className="auth__label">Work email</span>
            <input
              type="email"
              autoComplete="email"
              className="auth__input"
              placeholder="jane@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <div className="auth__row">
            <label className="auth__field">
              <span className="auth__label">Organization</span>
              <input
                type="text"
                autoComplete="organization"
                className="auth__input"
                placeholder="Company name"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                required
              />
            </label>

            <label className="auth__field">
              <span className="auth__label">Role</span>
              <select
                className="auth__input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="auth__field">
            <span className="auth__label">Password</span>
            <div className="auth__input-wrap">
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                className="auth__input"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
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

          <label className="auth__field">
            <span className="auth__label">Confirm password</span>
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className="auth__input"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>

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
                <span className="spinner" /> Creating account…
              </>
            ) : (
              <>
                Create account
                <MIcon name="arrow_forward" size={16} />
              </>
            )}
          </button>
        </form>

        <div className="auth__hint">
          <MIcon name="info" size={14} />
          <span>
            Accounts are created on the VeriTrace backend with a hashed
            password — no email verification in this prototype.
          </span>
        </div>

        <div className="auth__divider"><span>or</span></div>

        <div className="auth__alt">
          <span>Already have an account?</span>
          <button
            type="button"
            className="auth__link"
            onClick={() => navigate(ROUTES.LOGIN)}
          >
            Sign in
          </button>
        </div>
      </div>

      <RegisterAside />
    </div>
  );
}

function RegisterAside() {
  return (
    <aside className="auth__aside">
      <div className="auth__aside-inner">
        <div className="auth__aside-eyebrow">Why VeriTrace</div>
        <h2 className="auth__aside-title">
          Built for QA reviewers who need defensible decisions.
        </h2>
        <p className="auth__aside-body">
          Every verification produces a record with extracted fields, findings,
          a deterministic recommendation, and a full audit trail.
        </p>
        <ul className="auth__aside-list">
          <li><MIcon name="check_circle" size={16} /> COA &amp; label cross-check</li>
          <li><MIcon name="check_circle" size={16} /> Approved supplier validation</li>
          <li><MIcon name="check_circle" size={16} /> Required test &amp; spec checks</li>
          <li><MIcon name="check_circle" size={16} /> Audit-ready evidence per record</li>
        </ul>
        <div className="auth__aside-foot">
          Document extraction by Azure Document Intelligence.
        </div>
      </div>
    </aside>
  );
}
