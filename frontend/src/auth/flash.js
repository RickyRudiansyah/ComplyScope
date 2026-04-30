/**
 * One-shot flash messages for cross-page handoffs (e.g. "account created"
 * shown on /login after a successful /register).
 *
 * Backed by sessionStorage so the message survives the hash navigation, but
 * consumed-once so a refresh of the destination page doesn't show it again.
 */

const KEY = "veritrace.flash.v1";

export function setFlash(payload) {
  try {
    if (!payload) {
      window.sessionStorage.removeItem(KEY);
      return;
    }
    window.sessionStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage unavailable — flash is best-effort.
  }
}

export function consumeFlash() {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
