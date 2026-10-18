import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /auth/verify-reset?token=<hashed_token>&type=recovery
 *
 * This route is linked from our branded password-reset email.
 * The link uses our own domain (courceproject.vercel.app) — not supabase.co.
 * It verifies the OTP token with Supabase, sets the session cookie,
 * then redirects the user to /reset-password to choose a new password.
 */
export async function GET(request: NextRequest) {
    const { searchParams, origin } = request.nextUrl;
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (!token || type !== 'recovery') {
        return NextResponse.redirect(new URL('/forgot-password?error=invalid_link', origin));
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !anonKey) {
        return NextResponse.redirect(new URL('/forgot-password?error=config', origin));
    }

    let response = NextResponse.next();

    const supabase = createServerClient(supabaseUrl, anonKey, {
        cookies: {
            getAll: () => request.cookies.getAll(),
            setAll: (cookiesToSet) => {
                cookiesToSet.forEach(({ name, value, options }) =>
                    response.cookies.set(name, value, options),
                );
            },
        },
    });

    // Exchange the hashed token for a session (recovery type)
    const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery',
    });

    if (error) {
        console.error('verify-reset OTP error:', error);
        // Link expired or already used — send back to forgot-password with a clear message
        return NextResponse.redirect(new URL('/forgot-password?error=expired', origin));
    }

    // Session is now set — redirect to the reset-password page
    const redirectResponse = NextResponse.redirect(new URL('/reset-password', origin));
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
}
