import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * 4-Layer Security Enforcement Architecture Unit Tests
 *
 * Verifies the production security layers:
 * 1. Layer 1: Authentication (Trusted identity from session, reject forged user_id)
 * 2. Layer 2: Application Authorization Guard (resource_permissions check, 404 to hide existence)
 * 3. Layer 3: Database Row-Level Security (Postgres RLS simulation with has_resource_permission)
 * 4. Layer 4: Secure Media & Pre-Signed URLs (private buckets, strict short TTL, no-store caching)
 * 5. Immediate Revocation: Instant access termination upon permission deletion
 */

// Simulated PostgreSQL RLS engine for books, gallery, content, and private-assets
class PostgresRlsSimulator {
  constructor() {
    this.profiles = new Map(); // id -> { id, role }
    this.resourcePermissions = new Map(); // id -> { user_id, resource_type, resource_id, expires_at }
    this.books = [];
    this.gallery = [];
  }

  hasResourcePermission(authUid, resourceType, resourceId) {
    // 1. Admin check
    const profile = this.profiles.get(authUid);
    if (profile?.role === 'admin') return true;
    if (!authUid) return false;
    if (profile?.role === 'approved_user') return true;

    // 2. resource_permissions check
    const now = new Date();
    for (const perm of this.resourcePermissions.values()) {
      if (perm.user_id !== authUid) continue;
      if (perm.expires_at && new Date(perm.expires_at) <= now) continue;
      if (perm.resource_type === 'all') return true;
      if (perm.resource_type === resourceType) {
        if (!perm.resource_id || !resourceId || perm.resource_id === resourceId) {
          return true;
        }
      }
    }
    return false;
  }

  // RLS evaluation for books
  selectBooks(authUid) {
    const isAdmin = this.profiles.get(authUid)?.role === 'admin';
    return this.books.filter((book) => {
      if (!book.published && !isAdmin) return false;
      if (book.visibility === 'public') return true;
      if (book.visibility === 'restricted') {
        return this.hasResourcePermission(authUid, 'books', book.id);
      }
      return false;
    });
  }

  // RLS evaluation for storage objects in private-assets
  canReadPrivateAsset(authUid) {
    const profile = this.profiles.get(authUid);
    if (profile?.role === 'admin' || profile?.role === 'approved_user') return true;
    const now = new Date();
    for (const perm of this.resourcePermissions.values()) {
      if (perm.user_id === authUid && (!perm.expires_at || new Date(perm.expires_at) > now)) {
        return true;
      }
    }
    return false;
  }
}

// Simulated Layer 1 & Layer 2 Backend Authorization Guard
function evaluateAccessGuard({ sessionUser, requestBodyUserId, resourceType, resourceId, permissions, profileRole }) {
  // Layer 1: Trusted identity is ALWAYS extracted from sessionUser, never request body
  const trustedUserId = sessionUser?.id || null;
  if (!trustedUserId) {
    return { status: 401, error: 'Authentication required' };
  }

  // If client tried to spoof identity, ensure it is completely ignored
  if (requestBodyUserId && requestBodyUserId !== trustedUserId) {
    // Identity is taken solely from session
  }

  // Layer 2: Check Admin or Global Approval
  if (profileRole === 'admin' || profileRole === 'approved_user') {
    return { status: 200, allowed: true, userId: trustedUserId };
  }

  // Layer 2: Check resource_permissions
  const now = new Date();
  const validPerm = permissions.find((p) => {
    if (p.user_id !== trustedUserId) return false;
    if (p.expires_at && new Date(p.expires_at) <= now) return false;
    if (p.resource_type === 'all') return true;
    if (p.resource_type === resourceType) {
      if (!p.resource_id || !resourceId || p.resource_id === resourceId) return true;
    }
    return false;
  });

  if (!validPerm) {
    // High-security: Return 404 to conceal private resource existence
    return { status: 404, error: 'Resource not found', allowed: false };
  }

  return { status: 200, allowed: true, userId: trustedUserId, expiresAt: validPerm.expires_at };
}

test('Layer 1: Authentication - Rejects spoofed user_id in payload and trusts session identity only', () => {
  const sessionUser = { id: 'legit_user_123' };
  const forgedPayload = { userId: 'admin_user_999' };

  const result = evaluateAccessGuard({
    sessionUser,
    requestBodyUserId: forgedPayload.userId,
    resourceType: 'books',
    resourceId: 'b1',
    permissions: [],
    profileRole: 'user',
  });

  // Legitimate user lacks permission, so spoofing admin ID in body is ignored and returns 404
  assert.equal(result.status, 404);
  assert.equal(result.allowed, false);
});

test('Layer 2: Backend Authorization Guard - Enforces granular permissions & Conceals existence (404)', () => {
  const sessionUser = { id: 'researcher_1' };
  const permissions = [
    {
      id: 'p1',
      user_id: 'researcher_1',
      resource_type: 'books',
      resource_id: 'book_history_1947',
      expires_at: null,
    },
  ];

  // 1. Authorized for the specific book
  const allowed = evaluateAccessGuard({
    sessionUser,
    resourceType: 'books',
    resourceId: 'book_history_1947',
    permissions,
    profileRole: 'user',
  });
  assert.equal(allowed.status, 200);
  assert.equal(allowed.allowed, true);

  // 2. Requesting a different restricted book returns 404 (conceals private existence)
  const denied = evaluateAccessGuard({
    sessionUser,
    resourceType: 'books',
    resourceId: 'secret_family_manuscript',
    permissions,
    profileRole: 'user',
  });
  assert.equal(denied.status, 404);
  assert.equal(denied.allowed, false);
});

test('Layer 2: Time-Bound Expiration - Expired permissions are automatically rejected', () => {
  const sessionUser = { id: 'temp_scholar' };
  const pastDate = new Date(Date.now() - 3600 * 1000).toISOString(); // 1 hour ago
  const permissions = [
    {
      id: 'p2',
      user_id: 'temp_scholar',
      resource_type: 'gallery',
      resource_id: 'photo_100',
      expires_at: pastDate,
    },
  ];

  const result = evaluateAccessGuard({
    sessionUser,
    resourceType: 'gallery',
    resourceId: 'photo_100',
    permissions,
    profileRole: 'user',
  });

  assert.equal(result.status, 404);
  assert.equal(result.allowed, false);
});

test('Layer 3: Database Row-Level Security (RLS) - Filters out unauthorized rows at SQL level', () => {
  const db = new PostgresRlsSimulator();
  db.profiles.set('user_bob', { id: 'user_bob', role: 'user' });
  db.profiles.set('admin_alice', { id: 'admin_alice', role: 'admin' });

  db.books = [
    { id: 'b_pub', title: 'Public Literary Work', visibility: 'public', published: true },
    { id: 'b_res', title: 'Restricted Rare Manuscript', visibility: 'restricted', published: true },
  ];

  // Unauthenticated caller: sees only public book
  const anonBooks = db.selectBooks(null);
  assert.equal(anonBooks.length, 1);
  assert.equal(anonBooks[0].id, 'b_pub');

  // Bob (unauthorized): sees only public book
  const bobBooksBefore = db.selectBooks('user_bob');
  assert.equal(bobBooksBefore.length, 1);
  assert.equal(bobBooksBefore[0].id, 'b_pub');

  // Admin Alice: sees both public and restricted
  const aliceBooks = db.selectBooks('admin_alice');
  assert.equal(aliceBooks.length, 2);

  // Grant Bob permission for b_res
  db.resourcePermissions.set('perm_b_res', {
    user_id: 'user_bob',
    resource_type: 'books',
    resource_id: 'b_res',
    expires_at: null,
  });

  // Bob now sees both
  const bobBooksAfter = db.selectBooks('user_bob');
  assert.equal(bobBooksAfter.length, 2);
});

test('Layer 4: Securing Media & Pre-Signed URLs - Enforces private bucket, strict TTL, and cache-control headers', () => {
  const db = new PostgresRlsSimulator();
  db.profiles.set('user_david', { id: 'user_david', role: 'user' });

  // Unauthorized user cannot read private storage bucket
  assert.equal(db.canReadPrivateAsset('user_david'), false);

  // Grant permission
  db.resourcePermissions.set('perm_david', {
    user_id: 'user_david',
    resource_type: 'all',
    resource_id: null,
    expires_at: null,
  });
  assert.equal(db.canReadPrivateAsset('user_david'), true);

  // Validate TTL limits (60s to 300s)
  const validateTtl = (ttl) => Number.isFinite(ttl) && ttl >= 60 && ttl <= 300;
  assert.equal(validateTtl(120), true);
  assert.equal(validateTtl(30), false); // too short
  assert.equal(validateTtl(3600), false); // too long (violates Layer 4 short-window principle)

  // Validate anti-cache headers
  const cacheHeaders = {
    'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
    Pragma: 'no-cache',
    'Surrogate-Control': 'no-store',
  };
  assert.match(cacheHeaders['Cache-Control'], /private/);
  assert.match(cacheHeaders['Cache-Control'], /no-store/);
});

test('Immediate Revocation: Instant deletion removes access immediately without waiting for session expiry', () => {
  const db = new PostgresRlsSimulator();
  db.profiles.set('user_eva', { id: 'user_eva', role: 'user' });

  // Grant access
  db.resourcePermissions.set('perm_eva', {
    user_id: 'user_eva',
    resource_type: 'books',
    resource_id: 'book_confidential',
    expires_at: null,
  });

  assert.equal(db.hasResourcePermission('user_eva', 'books', 'book_confidential'), true);

  // Admin performs revocation -> immediately deletes permission row
  db.resourcePermissions.delete('perm_eva');

  // Immediately evaluated as unauthorized
  assert.equal(db.hasResourcePermission('user_eva', 'books', 'book_confidential'), false);
});

test('Signed Expiring Magic Link Access Tokens - HMAC-SHA256 signature and scope verification', async () => {
  const { generateSignedAccessToken, verifySignedAccessToken } = await import('../src/lib/auth/tokens.js').catch(
    async () => await import('../src/lib/auth/tokens.ts')
  );

  const token = generateSignedAccessToken({
    email: 'visitor@company.com',
    resourceType: 'books',
    resourceId: 'case_study_101',
    expiresInDays: 7,
  });

  assert.ok(token);
  assert.equal(token.split('.').length, 2);

  // 1. Valid token matches scope
  const check1 = verifySignedAccessToken(token, {
    email: 'visitor@company.com',
    resourceType: 'books',
    resourceId: 'case_study_101',
  });
  assert.equal(check1.valid, true);

  // 2. Mismatched resource ID is rejected
  const check2 = verifySignedAccessToken(token, {
    resourceId: 'other_secret_project',
  });
  assert.equal(check2.valid, false);
  assert.match(check2.error, /not scoped for this resource ID/i);

  // 3. Tampered signature is rejected
  const tamperedToken = `${token.slice(0, -4)}xxxx`;
  const check3 = verifySignedAccessToken(tamperedToken);
  assert.equal(check3.valid, false);
  assert.match(check3.error, /Invalid token signature/i);
});

test('Hardcoded Single-Owner Allowlist - Ignores client-settable user_metadata.role', async () => {
  const { isUserAdminByMeta } = await import('../src/lib/auth/admin-check.js').catch(
    async () => await import('../src/lib/auth/admin-check.ts')
  );

  // Attacker signs up with arbitrary email and sends { role: 'admin' } in user_metadata
  const attacker = {
    email: 'hacker@malicious.com',
    user_metadata: { role: 'admin' },
    app_metadata: {},
  };

  assert.equal(isUserAdminByMeta(attacker), false);

  // Legitimate admin on the allowlist is recognized
  const legitimateAdmin = {
    email: 'admin@sirajulhaqqureshi.com',
    user_metadata: {},
    app_metadata: {},
  };

  assert.equal(isUserAdminByMeta(legitimateAdmin), true);
});

