import crypto from 'node:crypto';
import type { ResourceType } from '@/types/database';

export interface AccessTokenPayload {
  email: string;
  resourceType: ResourceType;
  resourceId?: string | null;
  exp: number; // Unix timestamp in seconds
  iat: number; // Issued at Unix timestamp
}

function getTokenSecret(): string {
  return (
    process.env.ACCESS_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXTAUTH_SECRET ||
    'siraj-digital-archive-secure-secret-key-salt-2026'
  );
}

/**
 * Generate a cryptographically signed, time-limited access token (e.g., valid for 7 days)
 * scoped specifically to a resourceId / resourceType and visitor email.
 */
export function generateSignedAccessToken({
  email,
  resourceType,
  resourceId,
  expiresInDays = 7,
}: {
  email: string;
  resourceType: ResourceType;
  resourceId?: string | null;
  expiresInDays?: number;
}): string {
  const secret = getTokenSecret();
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInDays * 24 * 60 * 60;

  const payload: AccessTokenPayload = {
    email: email.trim().toLowerCase(),
    resourceType,
    resourceId: resourceId || null,
    iat,
    exp,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

/**
 * Verify a cryptographically signed access token.
 * Validates HMAC-SHA256 signature, expiry, and scope match.
 */
export function verifySignedAccessToken(
  token: string,
  expected?: { resourceType?: ResourceType; resourceId?: string | null; email?: string }
): { valid: boolean; payload?: AccessTokenPayload; error?: string } {
  try {
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Token is missing' };
    }

    const parts = token.split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'Malformed token format' };
    }

    const [encodedPayload, providedSignature] = parts;
    const secret = getTokenSecret();

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(encodedPayload)
      .digest('base64url');

    // Constant-time comparison to prevent timing attacks
    const sigA = Buffer.from(providedSignature);
    const sigB = Buffer.from(expectedSignature);
    if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
      return { valid: false, error: 'Invalid token signature' };
    }

    const json = Buffer.from(encodedPayload, 'base64url').toString('utf-8');
    const payload = JSON.parse(json) as AccessTokenPayload;

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Token has expired' };
    }

    // Check scope if expected conditions provided
    if (expected?.resourceType && payload.resourceType !== 'all') {
      if (payload.resourceType !== expected.resourceType) {
        return { valid: false, error: 'Token is not scoped for this resource type' };
      }
    }

    if (expected?.resourceId && payload.resourceId) {
      if (payload.resourceId !== expected.resourceId) {
        return { valid: false, error: 'Token is not scoped for this resource ID' };
      }
    }

    if (expected?.email && payload.email) {
      if (payload.email.toLowerCase() !== expected.email.toLowerCase()) {
        return { valid: false, error: 'Token does not match visitor email' };
      }
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: 'Failed to parse access token' };
  }
}
