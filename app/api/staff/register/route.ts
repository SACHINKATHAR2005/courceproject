import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/ratelimit';

const allowedRoles = new Set(['instructor', 'admin']);

function getClientIp(request: Request) {
    const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    return forwardedFor || request.headers.get('x-real-ip') || 'unknown-client';
}

export async function POST(request: Request) {
    // Rate limit: 5 attempts per 15 minutes per IP
    const ip = getClientIp(request);
    const { limited, resetAt } = await checkRateLimit(`staff-register:${ip}`, 5);
    if (limited) {
        const retryAfter = Math.ceil((resetAt.getTime() - Date.now()) / 1000);
        return NextResponse.json(
            { error: 'Too many registration attempts. Please try again later.' },
            { status: 429, headers: { 'Retry-After': String(retryAfter) } },
        );
    }

    const registrationCode = process.env.STAFF_REGISTRATION_CODE;
    const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!registrationCode || !serviceRoleKey || !url) {
        return NextResponse.json({ error: 'Staff registration is not configured.' }, { status: 503 });
    }

    let body: { fullName?: string; email?: string; password?: string; role?: string; code?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
    }

    const fullName = body.fullName?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const role = body.role;

    if (!fullName || !email || !password || !role || !allowedRoles.has(role) || body.code !== registrationCode) {
        return NextResponse.json({ error: 'Invalid staff registration request.' }, { status: 403 });
    }
    if (password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const adminClient = createClient(url, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
    });

    if (error || !data.user) {
        // Return the same generic error regardless of whether email is duplicate
        // to prevent email enumeration
        return NextResponse.json(
            { error: 'Unable to complete staff registration. Please try again.' },
            { status: 400 },
        );
    }

    const { error: profileError } = await adminClient
        .from('profiles')
        .upsert({ id: data.user.id, full_name: fullName, email, role }, { onConflict: 'id' });

    if (profileError) {
        await adminClient.auth.admin.deleteUser(data.user.id);
        return NextResponse.json({ error: 'Staff profile creation failed.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
