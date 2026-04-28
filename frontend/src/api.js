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

async function request(path, { method = "GET", body, signal } = {}) {
  const url = `${API_BASE_URL}/api${path}`;
  const init = { method, signal, headers: {} };
  if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
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
    const detail =
      (payload && (payload.detail || payload.message)) || res.statusText;
    throw new ApiError(`${method} ${path} -> ${res.status}: ${detail}`, {
      status: res.status,
      body: payload,
    });
  }
  return payload;
}

export const api = {
  health: () => request("/health"),

  listMaterials: () => request("/materials"),
  getMaterial: (code) => request(`/materials/${encodeURIComponent(code)}`),

  listSuppliers: () => request("/suppliers"),

  listDemoScenarios: () => request("/demo-scenarios"),
  runDemoScenario: (id) =>
    request(`/demo-scenarios/${encodeURIComponent(id)}/run`, { method: "POST" }),

  listVerifications: () => request("/verifications"),
  getVerification: (id) =>
    request(`/verifications/${encodeURIComponent(id)}`),
};

export { ApiError };
