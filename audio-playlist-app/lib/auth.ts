import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "playlistdash_session";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

export interface SessionPayload {
  username: string;
  expiresAt: string;
}

export function getSession(): SessionPayload | null {
  const cookieStore = cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as SessionPayload;
    if (new Date(parsed.expiresAt).getTime() < Date.now()) {
      cookieStore.delete(SESSION_COOKIE_NAME);
      return null;
    }
    return parsed;
  } catch (error) {
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }
}

export function requireSession(): SessionPayload {
  const session = getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export function setSession(username: string) {
  const cookieStore = cookies();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify({ username, expiresAt: expiresAt.toISOString() }), {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: true,
    expires: expiresAt
  });
}

export function clearSession() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
