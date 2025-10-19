import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./env";
import type { Database } from "./database.types";

const ACCESS_TOKEN_COOKIE = "sb-access-token";
const REFRESH_TOKEN_COOKIE = "sb-refresh-token";

export interface SessionPayload {
  username: string;
  accessToken: string;
  expiresAt: number;
}

/**
 * Creates an authenticated Supabase client with the user's session
 */
export function createAuthenticatedClient() {
  const cookieStore = cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
      autoRefreshToken: false
    },
    global: {
      headers: accessToken ? {
        Authorization: `Bearer ${accessToken}`
      } : {}
    }
  });

  return { supabase, accessToken, refreshToken };
}

/**
 * Gets the current session from cookies
 */
export async function getSession(): Promise<SessionPayload | null> {
  const { supabase, accessToken } = createAuthenticatedClient();
  
  if (!accessToken) {
    return null;
  }

  try {
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      clearSession();
      return null;
    }

    // Get username from user metadata
    const username = user.user_metadata?.username as string;
    
    if (!username) {
      clearSession();
      return null;
    }

    return {
      username,
      accessToken,
      expiresAt: user.user_metadata?.expires_at || Date.now() + 24 * 60 * 60 * 1000
    };
  } catch (error) {
    clearSession();
    return null;
  }
}

/**
 * Requires a valid session, throws if not authenticated
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized - Please log in");
  }
  return session;
}

/**
 * Creates a new session by generating JWT tokens
 */
export async function setSession(username: string, accessToken: string, refreshToken: string, expiresIn: number) {
  const cookieStore = cookies();
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  // Store access token
  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt
  });

  // Store refresh token (longer expiry)
  if (refreshToken) {
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      expires: refreshExpiresAt
    });
  }
}

/**
 * Clears the session cookies
 */
export function clearSession() {
  const cookieStore = cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}
