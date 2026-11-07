import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: 'healthy' | 'unhealthy' | 'unconfigured'; latencyMs?: number; message?: string }> = {};

  let isHealthy = true;

  // 1. Supabase Database Ping Check
  try {
    const supabase = createClient();
    if (!supabase) {
      checks.database = { status: 'unconfigured', message: 'NEXT_PUBLIC_SUPABASE_URL or key missing' };
      isHealthy = false;
    } else {
      const dbStart = Date.now();
      const { error } = await supabase.from('content').select('id').limit(1);
      const dbLatency = Date.now() - dbStart;

      if (error) {
        checks.database = { status: 'unhealthy', latencyMs: dbLatency, message: error.message };
        isHealthy = false;
      } else {
        checks.database = { status: 'healthy', latencyMs: dbLatency };
      }
    }
  } catch (err) {
    checks.database = { status: 'unhealthy', message: err instanceof Error ? err.message : 'Unknown database error' };
    isHealthy = false;
  }

  // 2. Storage Bucket Health Check
  try {
    const supabase = createClient();
    if (supabase) {
      const storageStart = Date.now();
      const { error } = await supabase.storage.from('public-assets').list('', { limit: 1 });
      const storageLatency = Date.now() - storageStart;

      if (error) {
        checks.storage = { status: 'unhealthy', latencyMs: storageLatency, message: error.message };
      } else {
        checks.storage = { status: 'healthy', latencyMs: storageLatency };
      }
    }
  } catch (err) {
    checks.storage = { status: 'unhealthy', message: err instanceof Error ? err.message : 'Unknown storage error' };
  }

  const totalDurationMs = Date.now() - startTime;

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime ? Math.floor(process.uptime()) : 0,
      totalDurationMs,
      checks,
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
