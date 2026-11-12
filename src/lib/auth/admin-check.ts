/**
 * Centralized Admin Authorization & Verification Utilities.
 * Handles single or comma-separated admin emails from environment variables,
 * default repository admin emails, and Supabase user metadata / profile checks.
 */

export const DEFAULT_ADMIN_EMAILS = [
  'qureshidabeer92@gmail.com',
  'admin@sirajulhaqqureshi.com',
];

/**
 * Returns a normalized, lowercase list of all authorized administrator email addresses.
 * Merges defaults with NEXT_PUBLIC_ADMIN_EMAIL and ADMIN_EMAIL environment variables.
 */
export function getAdminEmails(): string[] {
  const envRaw =
    (typeof process !== 'undefined' &&
      (process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.ADMIN_EMAIL)) ||
    '';

  const envEmails = envRaw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const set = new Set([
    ...DEFAULT_ADMIN_EMAILS.map((e) => e.toLowerCase()),
    ...envEmails,
  ]);

  return Array.from(set);
}

/**
 * Checks if a user is an administrator based on email address or JWT metadata.
 *
 * Security Hardening:
 * Never trusts user_metadata.role because user_metadata is client-writable
 * during signup in Supabase. Only allows exact email match against the
 * hardcoded/env allowlist or server-controlled app_metadata.
 */
export function isUserAdminByMeta(user?: {
  email?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
} | null): boolean {
  if (!user) return false;

  const adminEmails = getAdminEmails();
  const email = (user.email || '').trim().toLowerCase();
  const isEmailAdmin = Boolean(email && adminEmails.includes(email));

  // Only trust server-side app_metadata. Never trust client-writable user_metadata.
  const isServerRoleAdmin = user.app_metadata?.role === 'admin';

  return isEmailAdmin || isServerRoleAdmin;
}

/**
 * Checks if a database profile carries the admin role.
 */
export function isProfileAdmin(profile?: { role?: string | null } | null): boolean {
  return profile?.role === 'admin';
}

/**
 * Comprehensive admin check combining profile role and user metadata/email.
 */
export function isAuthorizedAdminUser(
  user?: {
    email?: string | null;
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
  } | null,
  profile?: { role?: string | null } | null
): boolean {
  return isProfileAdmin(profile) || isUserAdminByMeta(user);
}
