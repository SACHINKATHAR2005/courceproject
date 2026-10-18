import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

async function hashIp(ip: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(ip);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => ({}));
        const accepted = Boolean(body.accepted);
        const userAgent =
            typeof body.userAgent === 'string' && body.userAgent.trim().length > 0
                ? body.userAgent.trim()
                : request.headers.get('user-agent') || 'unknown';

        const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
        const rawIp = forwardedFor || request.headers.get('x-real-ip') || '127.0.0.1';
        const ip_hash = await hashIp(rawIp);

        try {
            const admin = createSupabaseAdminClient();
            await admin.from('cookie_consents').insert({
                ip_hash,
                accepted,
                user_agent: userAgent,
                created_at: new Date().toISOString(),
            });
        } catch (dbErr) {
            console.error('[Cookie Consent] Failed to insert consent record:', dbErr);
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('[Cookie Consent] POST handler error:', err);
        return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET() {
    try {
        const admin = createSupabaseAdminClient();

        const [acceptedRes, declinedRes] = await Promise.all([
            admin.from('cookie_consents').select('*', { count: 'exact', head: true }).eq('accepted', true),
            admin.from('cookie_consents').select('*', { count: 'exact', head: true }).eq('accepted', false),
        ]);

        const accepted = acceptedRes.count ?? 0;
        const declined = declinedRes.count ?? 0;
        const total = accepted + declined;
        const acceptanceRate = total > 0 ? Number(((accepted / total) * 100).toFixed(2)) : 0;

        return NextResponse.json({
            total,
            accepted,
            declined,
            acceptanceRate,
        });
    } catch (err) {
        console.error('[Cookie Consent] GET handler error:', err);
        return NextResponse.json({
            total: 0,
            accepted: 0,
            declined: 0,
            acceptanceRate: 0,
        });
    }
}
