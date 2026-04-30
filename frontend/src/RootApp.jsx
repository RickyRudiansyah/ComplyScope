import { useEffect } from "react";

import App from "./App.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import { ROUTES, navigate, useRoute } from "./router.js";
import { refreshSession } from "./auth/session.js";
import { useSession } from "./auth/useSession.js";

/**
 * Top-level router for the VeriTrace frontend.
 *
 * Routes are hash-based (`#/landing`, `#/login`, `#/register`, `#/app`) so the
 * static build does not need server-side rewrites. The dashboard `<App />` is
 * mounted only when there is an active session — otherwise the user is
 * redirected back to /login.
 */
export default function RootApp() {
  const route = useRoute();
  const session = useSession();

  // On boot, validate any cached token against /auth/me. If the backend says
  // the token is invalid, the session module will clear it and useSession
  // will re-render with no session.
  useEffect(() => {
    refreshSession();
  }, []);

  // Redirect rules: protect /app, and bounce signed-in users away from the
  // auth pages so they don't keep hitting them after a refresh.
  useEffect(() => {
    if (route === ROUTES.APP && !session) {
      navigate(ROUTES.LOGIN);
      return;
    }
    if (session && (route === ROUTES.LOGIN || route === ROUTES.REGISTER)) {
      navigate(ROUTES.APP);
    }
  }, [route, session]);

  if (route === ROUTES.LOGIN) return <LoginPage />;
  if (route === ROUTES.REGISTER) return <RegisterPage />;
  if (route === ROUTES.APP) {
    if (!session) return null; // brief flicker while the redirect effect runs
    return <App user={session.user} />;
  }
  return <LandingPage />;
}
