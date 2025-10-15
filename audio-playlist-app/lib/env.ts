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
