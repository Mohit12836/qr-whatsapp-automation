/**
 * Master SaaS Founder emails permitted to access /superadmin and
 * cross-tenant management APIs.
 *
 * IMPORTANT: Never rely on `accountRole === 'owner'` for platform-level
 * SuperAdmin checks, because every shopkeeper tenant is the `'owner'`
 * of their own isolated account.
 */
export const FOUNDER_EMAILS = ['mohit12836@gmail.com'] as const;

export function isFounderEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return (FOUNDER_EMAILS as readonly string[]).includes(normalized);
}
