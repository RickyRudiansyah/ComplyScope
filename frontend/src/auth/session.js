/**
 * Backend-backed session for the VeriTrace frontend.
 *
 * - Calls /api/auth/* on the FastAPI backend (see backend/routes/auth.py).
 * - Caches { user, token } in localStorage so a refresh keeps the session.
 * - On boot, validates the cached token via /api/auth/me. If invalid, the
 *   session is cleared.
 *
 * The public surface (signIn / signUp / signOut / getSession / subscribe) is
 * intentionally backend-agnostic — the same contract worked for the prior
 * local-only implementation, and would slot in for an OAuth/IdP integration
 * later (e.g. Entra ID) without changing the UI.
 */

import { ApiError, api, setAuthTokenProvider } from "../api.js";

const STORAGE_KEY = "veritrace.session.v2";
const LEGACY_KEYS = ["veritrace.session.v1", "veritrace.users.v1"];

export const DEMO_CREDENTIALS = {
  email: "demo@veritrace.com",
  password: "demo1234",
};

const listeners = new Set();

function readJSON(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJSON(key, value) {
  try {
    if (value === null || value === undefined) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Quota / private mode — fail silently for prototype.
  }
}

function clearLegacy() {
  for (const k of LEGACY_KEYS) {
    try { window.localStorage.removeItem(k); } catch { /* ignore */ }
  }
}

function deriveInitials(name, email) {
  const source = (name || email || "").trim();
  if (!source) return "U";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function decorate(user) {
  if (!user) return null;
  return { ...user, initials: deriveInitials(user.name, user.email) };
}

function notify() {
  const session = getSession();
  for (const l of listeners) {
    try { l(session); } catch { /* ignore subscriber errors */ }
  }
}

let _session = readJSON(STORAGE_KEY);

// Tell the API client how to find the bearer token.
setAuthTokenProvider(() => (_session ? _session.token : null));

function setSession(next) {
  _session = next;
  writeJSON(STORAGE_KEY, next);
  if (!next) clearLegacy();
  notify();
}

export function getSession() {
  return _session;
}

export function getCurrentUser() {
  return _session ? _session.user : null;
}

export function isAuthenticated() {
  return !!_session;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Validate the cached token against /auth/me. If invalid, the session is
 * cleared. Safe to call repeatedly. Returns the refreshed user (or null).
 */
export async function refreshSession() {
  if (!_session) return null;
  try {
    const me = await api.authMe();
    setSession({ ..._session, user: decorate(me) });
    return _session.user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      setSession(null);
      return null;
    }
    // Network / 5xx — keep the cached session so the UI doesn't get booted
    // by a transient backend hiccup. The next protected call will surface
    // the real error.
    return _session ? _session.user : null;
  }
}

export async function signIn({ email, password }) {
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanPassword = password || "";
  if (!cleanEmail || !cleanPassword) {
    throw new Error("Email and password are required.");
  }
  let res;
  try {
    res = await api.authLogin({ email: cleanEmail, password: cleanPassword });
  } catch (err) {
    throw normalizeAuthError(err, "Unable to sign in.");
  }
  setSession({ user: decorate(res.user), token: res.token, createdAt: Date.now() });
  return _session;
}

export async function signUp({
  name,
  email,
  organization,
  role,
  password,
  confirmPassword,
}) {
  const cleanName = (name || "").trim();
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanOrg = (organization || "").trim();
  const cleanRole = (role || "").trim();
  const pwd = password || "";

  if (!cleanName || !cleanEmail || !cleanOrg || !cleanRole || !pwd) {
    throw new Error("All fields are required.");
  }
  if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
    throw new Error("Please enter a valid work email address.");
  }
  if (pwd.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }
  if (pwd !== confirmPassword) {
    throw new Error("Passwords do not match.");
  }

  let res;
  try {
    res = await api.authRegister({
      name: cleanName,
      email: cleanEmail,
      organization: cleanOrg,
      role: cleanRole,
      password: pwd,
      confirm_password: confirmPassword,
    });
  } catch (err) {
    throw normalizeAuthError(err, "Unable to create account.");
  }
  // The backend issues a token on register, but for the prototype we keep
  // register and login as distinct steps: the user is asked to sign in
  // explicitly after creating their account. The returned token is discarded.
  return { user: decorate(res.user) };
}

export function signOut() {
  setSession(null);
}

function normalizeAuthError(err, fallback) {
  if (err instanceof ApiError) {
    // If the backend is unreachable, surface a clear message.
    if (err.status === 0) {
      return new Error(
        "Cannot reach the VeriTrace backend. Make sure the API is running."
      );
    }
    const detail =
      (err.body && (err.body.detail || err.body.message)) || err.message;
    if (typeof detail === "string" && detail) return new Error(detail);
    if (Array.isArray(detail) && detail[0] && detail[0].msg) {
      return new Error(detail[0].msg);
    }
  }
  return err instanceof Error ? err : new Error(fallback);
}
