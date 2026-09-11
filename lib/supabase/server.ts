import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient() {
    const cookieStore = await cookies();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
        throw new Error('Supabase server configuration is missing.');
    }

    return createServerClient(url, key, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll() {
                // Server components cannot write cookies. Route handlers and proxy do that.
            },
        },
    });
}
