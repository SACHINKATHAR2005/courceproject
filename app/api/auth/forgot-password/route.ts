import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/ratelimit';

function getClientIp(request: Request) {
    const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    return forwardedFor || request.headers.get('x-real-ip') || 'unknown-client';
}

/**
 * Simple server-side math captcha verification.
 * The client sends { a, b, op, answer } where op is '+' | '-' | '*'
 * and answer is what the user typed. We verify server-side.
 */
function verifyCaptcha(captcha: { a?: number; b?: number; op?: string; answer?: number } | undefined): boolean {
    if (!captcha || typeof captcha.a !== 'number' || typeof captcha.b !== 'number' || typeof captcha.answer !== 'number') return false;
    const { a, b, op, answer } = captcha;
    switch (op) {
        case '+': return answer === a + b;
        case '-': return answer === a - b;
        case '*': return answer === a * b;
        default: return false;
    }
}

export async function POST(request: Request) {
    // Rate limit: 3 attempts per 15 minutes per IP
    const ip = getClientIp(request);
    const { limited, resetAt } = await checkRateLimit(`forgot-password:${ip}`, 3);
    if (limited) {
        const retryAfter = Math.ceil((resetAt.getTime() - Date.now()) / 1000);
        return NextResponse.json(
            { error: 'Too many password reset requests. Please try again later.' },
            { status: 429, headers: { 'Retry-After': String(retryAfter) } },
        );
    }

    let body: { email?: string; captcha?: { a?: number; b?: number; op?: string; answer?: number } };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
    }

    const email = body.email?.trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    // Verify captcha
    if (!verifyCaptcha(body.captcha)) {
        return NextResponse.json({ error: 'Captcha answer is incorrect. Please try again.' }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;
    if (!url || !serviceRoleKey) {
        return NextResponse.json({ error: 'Password reset is not configured.' }, { status: 503 });
    }

    const adminClient = createClient(url, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if email exists in profiles table
    const { data: profile } = await adminClient
        .from('profiles')
        .select('id, role')
        .eq('email', email)
        .maybeSingle();

    if (!profile) {
        // Tell the user clearly — no account found
        return NextResponse.json(
            { error: 'No account found with this email address. Please check the email or contact your instructor.' },
            { status: 404 },
        );
    }

    // Send Supabase password reset email
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const { error: resetError } = await adminClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
    });

    if (resetError) {
        console.error('Password reset email failed:', resetError);
        return NextResponse.json({ error: 'Failed to send reset email. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'Password reset email sent. Please check your inbox.' });
}
