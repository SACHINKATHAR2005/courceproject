import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

const publicPaths = ['/courses', '/verify', '/'];
const authPaths = ['/login', '/register', '/staff-auth'];

function matchesPath(pathname: string, path: string) {
    return pathname === path || pathname.startsWith(`${path}/`);
}

export async function proxy(request: NextRequest) {
    let response = NextResponse.next({ request });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) return response;

    const supabase = createServerClient(url, key, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                response = NextResponse.next({ request });
                cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
            },
        },
    });

    const { data: { user } } = await supabase.auth.getUser();
    let role: 'student' | 'instructor' | 'admin' | null = null;

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
        role = profile?.role ?? null;
    }

    const pathname = request.nextUrl.pathname;
    const redirect = (path: string) => NextResponse.redirect(new URL(path, request.url));

    // Protected staff routes — require auth + correct role
    if (matchesPath(pathname, '/admin')) {
        if (!user) return redirect('/staff-auth?next=/admin');
        if (role !== 'admin') return redirect('/access-denied');
    }

    if (matchesPath(pathname, '/instructor')) {
        if (!user) return redirect('/staff-auth?next=/instructor');
        if (role !== 'instructor') return redirect('/access-denied');
    }

    // Protected student dashboard — require auth + student role
    if (matchesPath(pathname, '/dashboard')) {
        if (!user) return redirect('/login');
        if (role === 'admin') return redirect('/admin');
        if (role === 'instructor') return redirect('/instructor');
        if (role && role !== 'student') return redirect('/access-denied');
    }

    // Authenticated users do not return to the public landing shell.
    if (user && pathname === '/') {
        if (role === 'admin') return redirect('/admin');
        if (role === 'instructor') return redirect('/instructor');
        if (role === 'student') return redirect('/dashboard');
    }

    // Staff use their dedicated portal instead of the public course catalog.
    if (user && role === 'admin' && matchesPath(pathname, '/courses')) return redirect('/admin');
    if (user && role === 'instructor' && matchesPath(pathname, '/courses')) return redirect('/instructor');

    // If already logged-in student hits /login or /register, redirect to dashboard
    if (user && role === 'student' && authPaths.slice(0, 2).some((path) => matchesPath(pathname, path))) {
        return redirect('/dashboard');
    }

    // If already logged-in staff hits /staff-auth, redirect to their panel
    if (user && matchesPath(pathname, '/staff-auth')) {
        if (role === 'admin') return redirect('/admin');
        if (role === 'instructor') return redirect('/instructor');
    }

    return response;
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
