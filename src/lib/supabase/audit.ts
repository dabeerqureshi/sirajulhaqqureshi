import { createClient } from '@/lib/supabase/client';

export type AuditAction = 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'login';
export type AuditEntityType = 'poetry' | 'book' | 'gallery' | 'video' | 'access_request' | 'profile' | 'hamd';

/**
 * Record an administrative audit log event in Supabase.
 * Fails gracefully without interrupting client operations.
 */
export async function recordAuditLog(
  action: AuditAction,
  entityType: AuditEntityType,
  entityId?: string | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createClient();
    if (!supabase) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();

    await supabase.from('audit_logs').insert([
      {
        admin_id: session?.user?.id || null,
        action,
        entity_type: entityType,
        entity_id: entityId || null,
        metadata: {
          ...(metadata || {}),
          user_email: session?.user?.email || 'admin',
          timestamp: new Date().toISOString(),
        },
      },
    ]);
  } catch (err) {
    console.warn('Audit log write error:', err);
  }
}
