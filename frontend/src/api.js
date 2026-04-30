/**
 * Thin fetch client for the VeriTrace backend.
 *
 * In dev, calls go through the Vite proxy (`/api -> http://localhost:8000`).
 * Override with VITE_API_BASE_URL when serving against a remote backend.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

class ApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

// Pluggable token provider — set by the auth module so we don't import a
// session module from the API layer (which would create a cycle).
let _getAuthToken = () => null;
export function setAuthTokenProvider(fn) {
  _getAuthToken = typeof fn === "function" ? fn : () => null;
}

async function request(path, { method = "GET", body, signal, auth = true } = {}) {
  const url = `${API_BASE_URL}/api${path}`;
  const init = { method, signal, headers: {} };
  if (auth) {
    const token = _getAuthToken();
    if (token) init.headers["Authorization"] = `Bearer ${token}`;
  }
  if (body !== undefined) {
    if (body instanceof FormData) {
      // Let the browser set the multipart boundary in the Content-Type.
      init.body = body;
    } else {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }
  }
  let res;
  try {
    res = await fetch(url, init);
  } catch (err) {
    throw new ApiError(`Network error calling ${path}`, { status: 0 });
  }
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    const detail = extractErrorDetail(payload) || res.statusText;
    throw new ApiError(`${method} ${path} -> ${res.status}: ${detail}`, {
      status: res.status,
      body: payload,
    });
  }
  return payload;
}

function extractErrorDetail(payload) {
  if (!payload) return null;
  const d = payload.detail ?? payload.message;
  if (typeof d === "string") return d;
  // FastAPI validation errors come back as an array of { loc, msg, type }.
  if (Array.isArray(d)) {
    const first = d[0];
    if (first && typeof first.msg === "string") return first.msg;
  }
  return null;
}

export const api = {
  health: () => request("/health", { auth: false }),

  authRegister: (payload) =>
    request("/auth/register", { method: "POST", body: payload, auth: false }),
  authLogin: (payload) =>
    request("/auth/login", { method: "POST", body: payload, auth: false }),
  authMe: () => request("/auth/me"),

  listMaterials: () => request("/materials"),
  getMaterial: (code) => request(`/materials/${encodeURIComponent(code)}`),

  listSuppliers: () => request("/suppliers"),

  listDemoScenarios: () => request("/demo-scenarios"),
  runDemoScenario: (id) =>
    request(`/demo-scenarios/${encodeURIComponent(id)}/run`, { method: "POST" }),

  listVerifications: () => request("/verifications"),
  getVerification: (id) =>
    request(`/verifications/${encodeURIComponent(id)}`),

  createVerification: (coaFile, labelFile) => {
    const fd = new FormData();
    fd.append("coa_file", coaFile);
    fd.append("label_file", labelFile);
    return request("/verifications", { method: "POST", body: fd });
  },
};

export { ApiError };
