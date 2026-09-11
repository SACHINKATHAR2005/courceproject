import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get('code');
    const origin = request.nextUrl.origin;
    let response = NextResponse.next();

    if (!code) return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));

    const supabase = createServerClient(url, key, {
        cookies: {
            getAll: () => request.cookies.getAll(),
            setAll: (cookiesToSet) => {
                cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
            },
        },
    });

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.redirect(new URL('/login?error=oauth_failed', request.url));

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

    if (profile?.role !== 'student') {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL('/login?error=student_only', origin));
    }

    const redirectResponse = NextResponse.redirect(new URL('/dashboard', origin));
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
}
