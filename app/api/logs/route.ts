import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/ratelimit';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

function getClientIp(request: Request): string {
    const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    return forwardedFor || request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: Request) {
    const ip = getClientIp(request);

    // Rate limit: 100 requests per minute per IP
    const { limited } = await checkRateLimit(`logs:${ip}`, 100);
    if (limited) {
        return NextResponse.json(
            { ok: false, error: 'Too many requests' },
            { status: 429 }
        );
    }

    try {
        const body = await request.json().catch(() => null);

        if (body && typeof body === 'object') {
            const event_type = typeof body.event_type === 'string' ? body.event_type : 'unknown';
            const payload = body.payload && typeof body.payload === 'object' ? body.payload : {};
            const user_id = typeof body.user_id === 'string' ? body.user_id : null;

            try {
                const admin = createSupabaseAdminClient();
                await admin.from('audit_logs').insert({
                    event_type,
                    payload,
                    user_id,
                    ip,
                    created_at: new Date().toISOString(),
                });
            } catch (dbError) {
                // Silently succeeds even if Supabase write fails (don't expose errors)
                console.error('[Audit Log] Failed to write log to Supabase:', dbError);
            }
        }
    } catch {
        // Silently succeeds
    }

    return NextResponse.json({ ok: true });
}
