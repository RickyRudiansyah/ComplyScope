import { useEffect, useState } from "react";

import { getSession, subscribe } from "./session.js";

export function useSession() {
  const [session, setSession] = useState(() => getSession());
  useEffect(() => subscribe(setSession), []);
  return session;
}
