/**
 * Client-safe & server-safe logging utility.
 */

export async function logEvent(
    event_type: string,
    payload: Record<string, unknown>,
    userId?: string
): Promise<void> {
    try {
        if (typeof window !== 'undefined') {
            // Client-side: POST to /api/logs
            await fetch('/api/logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    event_type,
                    payload,
                    user_id: userId,
                }),
                keepalive: true,
            }).catch((err) => {
                // Silently swallow fetch failure to avoid breaking app flow
                console.warn('[Logger] Failed to post event to /api/logs:', err);
            });
        } else {
            // Server-side: write directly to Supabase audit_logs if available
            try {
                const { createSupabaseAdminClient } = await import('@/lib/supabase/admin');
                const admin = createSupabaseAdminClient();
                await admin.from('audit_logs').insert({
                    event_type,
                    payload: payload || {},
                    user_id: userId || null,
                    ip: 'server-internal',
                    created_at: new Date().toISOString(),
                });
            } catch (serverErr) {
                // Fallback to console if DB write fails
                console.info('[Server Event]', event_type, { userId, payload, error: serverErr });
            }
        }
    } catch {
        // Never throw
    }
}

export async function logError(
    message: string,
    error: unknown,
    context?: Record<string, unknown>
): Promise<void> {
    try {
        console.error(`[Logger Error] ${message}:`, error, context);

        const serializedError: Record<string, unknown> =
            error instanceof Error
                ? {
                      name: error.name,
                      message: error.message,
                      stack: error.stack,
                  }
                : typeof error === 'object' && error !== null
                ? (error as Record<string, unknown>)
                : { raw: String(error) };

        await logEvent('error', {
            message,
            error: serializedError,
            ...(context || {}),
        });
    } catch {
        // Never throw
    }
}
