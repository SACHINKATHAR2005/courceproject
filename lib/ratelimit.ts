import { createClient } from '@supabase/supabase-js';

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secret = process.env.SUPABASE_SECRET_KEY;
    if (!url || !secret) return null;
    return createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
}

/**
 * Checks if the given key has exceeded the max attempts within the window.
 * Uses the `rate_limits` table in Supabase for distributed, persistent tracking.
 */
export async function checkRateLimit(
    key: string,
    maxAttempts: number,
): Promise<{ limited: boolean; remaining: number; resetAt: Date }> {
    const admin = getAdminClient();
    if (!admin) {
        // If DB not configured, fail open (don't block traffic)
        return { limited: false, remaining: maxAttempts, resetAt: new Date(Date.now() + WINDOW_MS) };
    }

    const now = new Date();
    const resetAt = new Date(now.getTime() + WINDOW_MS);

    try {
        const { data } = await admin
            .from('rate_limits')
            .upsert(
                { key, count: 1, reset_at: resetAt.toISOString() },
                {
                    onConflict: 'key',
                    ignoreDuplicates: false,
                },
            )
            .select('count, reset_at')
            .maybeSingle();

        if (!data) {
            return { limited: false, remaining: maxAttempts - 1, resetAt };
        }

        const windowExpired = new Date(data.reset_at) <= now;
        if (windowExpired) {
            // Window expired — reset
            await admin
                .from('rate_limits')
                .update({ count: 1, reset_at: resetAt.toISOString() })
                .eq('key', key);
            return { limited: false, remaining: maxAttempts - 1, resetAt };
        }

        // Increment
        const newCount = (data.count || 0) + 1;
        await admin
            .from('rate_limits')
            .update({ count: newCount })
            .eq('key', key)
            .lt('reset_at', resetAt.toISOString());

        const limited = newCount > maxAttempts;
        return {
            limited,
            remaining: Math.max(0, maxAttempts - newCount),
            resetAt: new Date(data.reset_at),
        };
    } catch (e) {
        console.error('Rate limit check error:', e);
        return { limited: false, remaining: maxAttempts, resetAt };
    }
}

export async function clearRateLimit(key: string): Promise<void> {
    const admin = getAdminClient();
    if (!admin) return;
    try {
        await admin.from('rate_limits').delete().eq('key', key);
    } catch (e) {
        console.error('Rate limit clear error:', e);
    }
}
