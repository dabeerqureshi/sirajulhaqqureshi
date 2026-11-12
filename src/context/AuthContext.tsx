'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { UserRole, ResourceType } from '@/types/database';
import { isUserAdminByMeta } from '@/lib/auth/admin-check';

export interface PendingRequestSummary {
  id: string;
  resource_type: ResourceType;
  resource_id?: string | null;
}

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  hasAccess: boolean;
  isAdmin: boolean;
  loading: boolean;
  pendingRequests: PendingRequestSummary[];
  hasPendingRequestFor: (resourceType: string, resourceId?: string | null) => boolean;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  hasAccess: false,
  isAdmin: false,
  loading: true,
  pendingRequests: [],
  hasPendingRequestFor: () => false,
  refreshAuth: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<PendingRequestSummary[]>([]);

  const loadUserData = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) {
      setUser(null);
      setRole(null);
      setPendingRequests([]);
      setLoading(false);
      return;
    }

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (!currentUser) {
        setRole(null);
        setPendingRequests([]);
        setLoading(false);
        return;
      }

      // Check admin status first
      if (isUserAdminByMeta(currentUser)) {
        setRole('admin');
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .maybeSingle();

        setRole((profile?.role as UserRole) || 'user');
      }

      // Fetch pending requests for current user
      const { data: requests } = await supabase
        .from('access_requests')
        .select('id, resource_type, resource_id')
        .eq('status', 'pending')
        .or(`user_id.eq.${currentUser.id},user_email.eq.${currentUser.email?.toLowerCase() || ''}`);

      if (requests) {
        setPendingRequests(
          requests.map((r) => ({
            id: r.id,
            resource_type: r.resource_type as ResourceType,
            resource_id: r.resource_id,
          }))
        );
      }
    } catch (err) {
      console.warn('Failed to resolve auth session:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserData();

    const supabase = createClient();
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadUserData();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  const hasAccess = useMemo(() => {
    return role === 'admin' || role === 'approved_user';
  }, [role]);

  const isAdmin = useMemo(() => {
    return role === 'admin';
  }, [role]);

  const hasPendingRequestFor = useCallback(
    (resourceType: string, resourceId?: string | null) => {
      const targetType = resourceType.toLowerCase();
      return pendingRequests.some((req) => {
        const matchesType = req.resource_type === targetType || req.resource_type === 'all';
        if (resourceId && req.resource_id) {
          return req.resource_id === resourceId;
        }
        return matchesType;
      });
    },
    [pendingRequests]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        hasAccess,
        isAdmin,
        loading,
        pendingRequests,
        hasPendingRequestFor,
        refreshAuth: loadUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
