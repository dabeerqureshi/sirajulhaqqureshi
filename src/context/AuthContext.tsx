'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { UserRole, ResourceType, ResourcePermission } from '@/types/database';
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
  permissions: ResourcePermission[];
  hasAccessFor: (resourceType: string, resourceId?: string | null) => boolean;
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
  permissions: [],
  hasAccessFor: () => false,
  pendingRequests: [],
  hasPendingRequestFor: () => false,
  refreshAuth: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<ResourcePermission[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequestSummary[]>([]);

  const loadUserData = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) {
      setUser(null);
      setRole(null);
      setPermissions([]);
      setPendingRequests([]);
      setLoading(false);
      return;
    }

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (!currentUser) {
        setRole(null);
        setPermissions([]);
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

      // Fetch active resource permissions for current user
      const { data: perms } = await supabase
        .from('resource_permissions')
        .select('*')
        .eq('user_id', currentUser.id);

      if (perms) {
        const now = new Date();
        const activePerms = (perms as ResourcePermission[]).filter(
          (p) => !p.expires_at || new Date(p.expires_at) > now
        );
        setPermissions(activePerms);
      } else {
        setPermissions([]);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async session initialization
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

  const isAdmin = useMemo(() => {
    return role === 'admin';
  }, [role]);

  const hasAccess = useMemo(() => {
    return role === 'admin' || role === 'approved_user' || permissions.length > 0;
  }, [role, permissions]);

  const hasAccessFor = useCallback(
    (resourceType: string, resourceId?: string | null) => {
      if (role === 'admin' || role === 'approved_user') return true;
      const targetType = resourceType.toLowerCase();
      const now = new Date();
      return permissions.some((perm) => {
        if (perm.expires_at && new Date(perm.expires_at) <= now) return false;
        if (perm.resource_type === 'all') return true;
        if (perm.resource_type === targetType) {
          if (!perm.resource_id || !resourceId || perm.resource_id === resourceId) {
            return true;
          }
        }
        return false;
      });
    },
    [role, permissions]
  );

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
        permissions,
        hasAccessFor,
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
