import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { checkRateLimit, clearRateLimit } from '@/lib/ratelimit';

const MAX_ATTEMPTS = 5;

function getClientKey(request: Request, email: string) {
    const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const address = forwardedFor || request.headers.get('x-real-ip') || 'unknown-client';
    return `login:${address}:${email}`;
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
    const { limited, resetAt } = await checkRateLimit(key, MAX_ATTEMPTS);
    if (limited) {
        const retryAfter = Math.ceil((resetAt.getTime() - Date.now()) / 1000);
        return NextResponse.json(
            { error: 'Too many login attempts. Please try again in 15 minutes.' },
            { status: 429, headers: { 'Retry-After': String(retryAfter) } },
        );
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
        // Don't await — fire-and-forget the increment (already incremented in checkRateLimit)
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

    // Clear rate limit on successful login
    await clearRateLimit(key);

    const response = NextResponse.json({
        ok: true,
        profile: { id: profile.id, fullName: profile.full_name, email: profile.email, phone: profile.phone, role: profile.role, avatarUrl: profile.avatar_url, createdAt: profile.created_at },
    });
    authCookies.forEach(({ name, value, options }) => response.cookies.set({ name, value, ...(options as object) }));
    return response;
}
