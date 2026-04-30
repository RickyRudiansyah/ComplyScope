/**
 * Hash-based router for the VeriTrace prototype.
 *
 * Avoids adding react-router as a dependency for what is currently four
 * top-level views. If routing requirements grow (nested routes, route
 * params, deep links beyond /app), swap this for react-router-dom — the
 * route names defined here can map 1:1 to route paths.
 */

import { useEffect, useState } from "react";

export const ROUTES = {
  LANDING: "/landing",
  LOGIN: "/login",
  REGISTER: "/register",
  APP: "/app",
};

const VALID = new Set(Object.values(ROUTES));

export function getCurrentRoute() {
  if (typeof window === "undefined") return ROUTES.LANDING;
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw || raw === "/" || raw === "") return ROUTES.LANDING;
  // Allow trailing segments (e.g. /app/whatever) but match by prefix.
  for (const r of VALID) {
    if (raw === r || raw.startsWith(r + "/")) return r;
  }
  return ROUTES.LANDING;
}

export function navigate(route) {
  if (typeof window === "undefined") return;
  if (!VALID.has(route)) {
    window.location.hash = ROUTES.LANDING;
    return;
  }
  if (window.location.hash !== "#" + route) {
    window.location.hash = route;
  } else {
    // Force a re-evaluation if the route is the same.
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }
}

export function useRoute() {
  const [route, setRoute] = useState(() => getCurrentRoute());
  useEffect(() => {
    function handler() {
      setRoute(getCurrentRoute());
    }
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);
  return route;
}
