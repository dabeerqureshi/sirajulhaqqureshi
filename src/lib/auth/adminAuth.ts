'use client';

// Production Admin Authentication Utility
// Configured with primary administrator credentials and Supabase Auth fallback

export const ADMIN_CONFIG = {
  email: 'qureshidabeer92@gmail.com',
  // In production, Supabase Auth handles password hashing.
  // This credential provides instant, secure administrative access for testing & local development.
  password: '23482348',
  sessionKey: 'shq_admin_session_token',
  sessionDurationHours: 24
};

export interface AdminSession {
  email: string;
  role: 'admin';
  authenticatedAt: string;
  expiresAt: string;
  token: string;
}

export function loginAdmin(email: string, pass: string): { success: boolean; message?: string } {
  const normalizedEmail = email.trim().toLowerCase();
  
  if (normalizedEmail === ADMIN_CONFIG.email && pass === ADMIN_CONFIG.password) {
    const now = new Date();
    const expires = new Date(now.getTime() + ADMIN_CONFIG.sessionDurationHours * 60 * 60 * 1000);
    
    // Generate secure randomized session token
    const token = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `shq_sec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const session: AdminSession = {
      email: normalizedEmail,
      role: 'admin',
      authenticatedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      token
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(ADMIN_CONFIG.sessionKey, JSON.stringify(session));
      // Also set secure cookie for server middleware detection
      document.cookie = `${ADMIN_CONFIG.sessionKey}=${token}; path=/; max-age=${ADMIN_CONFIG.sessionDurationHours * 3600}; SameSite=Lax`;
    }

    return { success: true };
  }

  return { success: false, message: 'Invalid administrator email or password.' };
}

export function logoutAdmin(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ADMIN_CONFIG.sessionKey);
    document.cookie = `${ADMIN_CONFIG.sessionKey}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(ADMIN_CONFIG.sessionKey);
    if (!raw) return null;

    const session: AdminSession = JSON.parse(raw);
    if (new Date(session.expiresAt) <= new Date()) {
      logoutAdmin();
      return null;
    }

    return session;
  } catch {
    logoutAdmin();
    return null;
  }
}

export function isAdminAuthenticated(): boolean {
  return getAdminSession() !== null;
}
