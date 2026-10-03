import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function getClientKey(request: Request, email: string) {
    const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const address = forwardedFor || request.headers.get('x-real-ip') || 'unknown-client';
    return `${address}:${email}`;
}

function getLimit(key: string) {
    const now = Date.now();
    const current = attempts.get(key);
    if (!current || current.resetAt <= now) {
        const next = { count: 0, resetAt: now + WINDOW_MS };
        attempts.set(key, next);
        return next;
    }
    return current;
}

export async function POST(request: Request) {
    let body: { email?: string; password?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Malformed login request.' }, { status: 400 });
    }

    const email = body.email?.trim().toLowerCase();
    const password = body.password || '';
    if (!email || !password) return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });

    const key = getClientKey(request, email);
    const limit = getLimit(key);
    if (limit.count >= MAX_ATTEMPTS) {
        return NextResponse.json({ error: 'Too many login attempts. Please try again in 15 minutes.' }, { status: 429, headers: { 'Retry-After': String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } });
    }

    const cookieStore = await cookies();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !anonKey) return NextResponse.json({ error: 'Authentication is not configured.' }, { status: 503 });

    const authCookies: Array<{ name: string; value: string; options: unknown }> = [];
    const sessionClient = createServerClient(url, anonKey, {
        cookies: {
            getAll: () => cookieStore.getAll(),
            setAll: (cookiesToSet) => cookiesToSet.forEach((cookie) => authCookies.push(cookie)),
        },
    });

    const { data, error } = await sessionClient.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
        limit.count += 1;
        return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const { data: profile } = await sessionClient.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
    if (!profile) {
        await sessionClient.auth.signOut();
        return NextResponse.json({ error: 'Your account profile is incomplete. Please contact support.' }, { status: 403 });
    }
    if (profile.role !== 'student') {
        await sessionClient.auth.signOut();
        return NextResponse.json({ error: 'Use the staff access page for Instructor or Admin accounts.' }, { status: 403 });
    }

    attempts.delete(key);
    const response = NextResponse.json({
        ok: true,
        profile: { id: profile.id, fullName: profile.full_name, email: profile.email, phone: profile.phone, role: profile.role, avatarUrl: profile.avatar_url, createdAt: profile.created_at },
    });
    authCookies.forEach(({ name, value, options }) => response.cookies.set({ name, value, ...(options as object) }));
    return response;
}
