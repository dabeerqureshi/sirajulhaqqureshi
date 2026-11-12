import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * Access Request Business Rules Unit Tests
 * Verifies core principles and generic state machine transitions:
 * 1. User already has access -> Reject new submission / Don't allow redundant requests
 * 2. Request already pending -> Prevent duplicate submission (409 Conflict)
 * 3. User requests again after rejection -> Allow new request
 * 4. Unauthorized person approves -> Reject operation (403 Forbidden)
 * 5. Admin approves -> Grant permissions
 * 6. Admin revokes -> Remove permissions
 */

// Pure state machine simulation matching route handlers
class AccessRequestEngine {
  constructor() {
    this.profiles = new Map(); // id -> { id, email, role: 'admin' | 'approved_user' | 'user' }
    this.requests = new Map(); // id -> { id, user_id, user_email, resource_type, resource_id, status: 'pending'|'approved'|'rejected', admin_notes }
    this.auditLogs = [];
  }

  submitRequest({ name, email, resource_type, resource_id, reason }) {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (typeof name === 'string' && name.trim()) || cleanEmail.split('@')[0];

    // 1. Check existing permissions: User already has access
    const existingProfile = Array.from(this.profiles.values()).find((p) => p.email === cleanEmail);
    if (existingProfile && (existingProfile.role === 'admin' || existingProfile.role === 'approved_user')) {
      return { status: 400, error: 'You already have approved access to restricted resources.' };
    }

    // 2. Check for duplicate pending requests
    const existingPending = Array.from(this.requests.values()).find((r) => {
      if (r.user_email !== cleanEmail || r.status !== 'pending') return false;
      if (r.resource_type === 'all' || resource_type === 'all') return true;
      if (r.resource_type === resource_type) {
        if (!resource_id || !r.resource_id) return true;
        return r.resource_id === resource_id;
      }
      return false;
    });

    if (existingPending) {
      return { status: 409, error: 'A request for this resource is already pending review by an administrator.' };
    }

    // Create pending request
    const reqId = `req_${Date.now()}_${Math.random()}`;
    const newRequest = {
      id: reqId,
      user_id: existingProfile?.id || null,
      user_name: cleanName,
      user_email: cleanEmail,
      resource_type,
      resource_id: resource_id || null,
      reason,
      status: 'pending',
    };

    this.requests.set(reqId, newRequest);
    this.auditLogs.push({ action: 'create', entity_id: reqId, email: cleanEmail });
    return { status: 200, success: true, requestId: reqId };
  }

  reviewRequest({ callerRole, requestId, action, admin_notes }) {
    // 3. Security Rule: Unauthorized person reviews -> Reject operation
    if (callerRole !== 'admin') {
      return { status: 403, error: 'Forbidden: Administrator privileges required.' };
    }

    const request = this.requests.get(requestId);
    if (!request) {
      return { status: 404, error: 'Access request not found.' };
    }

    if (action === 'approve') {
      request.status = 'approved';
      request.admin_notes = admin_notes || null;
      // Grant permissions: promote role to approved_user
      let profile = Array.from(this.profiles.values()).find((p) => p.email === request.user_email);
      if (!profile) {
        const newProf = { id: `prof_${Date.now()}`, email: request.user_email, role: 'approved_user' };
        this.profiles.set(newProf.id, newProf);
      } else {
        profile.role = 'approved_user';
      }
      this.auditLogs.push({ action: 'approve', entity_id: requestId });
      return { status: 200, success: true, statusText: 'approved' };
    }

    if (action === 'reject') {
      request.status = 'rejected';
      request.admin_notes = admin_notes || 'Rejected by admin';
      // Permissions unchanged
      this.auditLogs.push({ action: 'reject', entity_id: requestId });
      return { status: 200, success: true, statusText: 'rejected' };
    }

    if (action === 'revoke') {
      request.status = 'rejected';
      request.admin_notes = admin_notes || 'Access revoked by administrator';
      // Remove permissions: demote back to user
      const profile = Array.from(this.profiles.values()).find((p) => p.email === request.user_email);
      if (profile && profile.role !== 'admin') {
        profile.role = 'user';
      }
      this.auditLogs.push({ action: 'update', revocation: true, entity_id: requestId });
      return { status: 200, success: true, statusText: 'rejected', revoked: true };
    }

    return { status: 400, error: 'Unsupported action' };
  }
}

test('Access Request - Business Rule 1: User already has access blocks new submission', () => {
  const engine = new AccessRequestEngine();
  engine.profiles.set('p1', { id: 'p1', email: 'scholar@oxford.edu', role: 'approved_user' });

  const res = engine.submitRequest({
    name: 'Dr. Scholar',
    email: 'scholar@oxford.edu',
    resource_type: 'video',
    reason: 'Want to re-request',
  });

  assert.equal(res.status, 400);
  assert.match(res.error, /already have approved access/i);
});

test('Access Request - Business Rule 2: Request already pending prevents duplicate submission (409)', () => {
  const engine = new AccessRequestEngine();

  // First request passes
  const first = engine.submitRequest({
    name: 'Researcher',
    email: 'researcher@gmail.com',
    resource_type: 'books',
    resource_id: 'book-123',
    reason: 'Research thesis',
  });
  assert.equal(first.status, 200);

  // Duplicate request for same resource while pending must be rejected with 409
  const duplicate = engine.submitRequest({
    name: 'Researcher',
    email: 'researcher@gmail.com',
    resource_type: 'books',
    resource_id: 'book-123',
    reason: 'Submitting again while waiting',
  });
  assert.equal(duplicate.status, 409);
  assert.match(duplicate.error, /already pending review/i);
});

test('Access Request - Business Rule 3: User can re-request after rejection', () => {
  const engine = new AccessRequestEngine();

  const first = engine.submitRequest({
    name: 'Student',
    email: 'student@edu.pk',
    resource_type: 'gallery',
    reason: 'Initial vague reason',
  });
  assert.equal(first.status, 200);

  // Admin rejects first request
  const review = engine.reviewRequest({
    callerRole: 'admin',
    requestId: first.requestId,
    action: 'reject',
    admin_notes: 'Please provide university ID or affiliation',
  });
  assert.equal(review.status, 200);
  assert.equal(review.statusText, 'rejected');

  // Since previous is rejected (not pending), student can submit new request with updated details
  const second = engine.submitRequest({
    name: 'Student',
    email: 'student@edu.pk',
    resource_type: 'gallery',
    reason: 'Affiliated with Department of Urdu, Punjab University, Student ID #4590',
  });
  assert.equal(second.status, 200);
  assert.ok(second.requestId);
});

test('Access Request - Business Rule 4: Unauthorized person cannot approve (403)', () => {
  const engine = new AccessRequestEngine();

  const sub = engine.submitRequest({
    name: 'User A',
    email: 'user_a@example.com',
    resource_type: 'video',
    reason: 'Personal study',
  });

  // Regular user tries to call approve endpoint
  const unauthorized = engine.reviewRequest({
    callerRole: 'user',
    requestId: sub.requestId,
    action: 'approve',
  });
  assert.equal(unauthorized.status, 403);
  assert.match(unauthorized.error, /Forbidden/i);
});

test('Access Request - Business Rule 5 & 6: Admin approval grants access; Revocation removes access', () => {
  const engine = new AccessRequestEngine();

  const sub = engine.submitRequest({
    name: 'Historian',
    email: 'historian@archives.org',
    resource_type: 'all',
    reason: 'Biographical cross-referencing',
  });

  // Admin approves
  const approveRes = engine.reviewRequest({
    callerRole: 'admin',
    requestId: sub.requestId,
    action: 'approve',
  });
  assert.equal(approveRes.status, 200);

  // Check profile promoted
  const approvedProfile = Array.from(engine.profiles.values()).find(
    (p) => p.email === 'historian@archives.org'
  );
  assert.equal(approvedProfile?.role, 'approved_user');

  // Admin revokes access
  const revokeRes = engine.reviewRequest({
    callerRole: 'admin',
    requestId: sub.requestId,
    action: 'revoke',
  });
  assert.equal(revokeRes.status, 200);
  assert.equal(revokeRes.revoked, true);

  // Check profile demoted back to user
  assert.equal(approvedProfile?.role, 'user');
});
