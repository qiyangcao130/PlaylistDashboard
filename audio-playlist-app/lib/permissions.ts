import "server-only";
import { READ_ONLY_USERS } from "./env";

/**
 * Check if a user has read-only access (cannot modify data)
 */
export function isReadOnlyUser(username: string): boolean {
  return READ_ONLY_USERS.has(username.toLowerCase());
}

/**
 * Check if a user can modify data
 */
export function canModifyData(username: string): boolean {
  return !isReadOnlyUser(username);
}

/**
 * Throw an error if user doesn't have permission to modify data
 */
export function requireModifyPermission(username: string): void {
  if (isReadOnlyUser(username)) {
    throw new Error("You do not have permission to modify data. This account is read-only.");
  }
}
