import "server-only";

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

export const SUPABASE_URL = requireEnv("SUPABASE_URL");
export const SUPABASE_SERVICE_ROLE_KEY = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
export const SUPABASE_STORAGE_BUCKET = requireEnv("SUPABASE_STORAGE_BUCKET");
export const SUPABASE_STORAGE_PREFIX = process.env.SUPABASE_STORAGE_PREFIX ?? requireEnv("SUPABASE_STORAGE_BUCKET");

// Read-only user configuration
// Format: "userA,userB,userC" - comma-separated list of users who have read-only access
const readOnlyUsersEnv = process.env.READ_ONLY_USERS ?? "";
export const READ_ONLY_USERS = new Set(
  readOnlyUsersEnv
    .split(",")
    .map(u => u.trim().toLowerCase())
    .filter(u => u.length > 0)
);
