import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
    const body = await request.json() as { courseId?: string };
    const cookieStore = await cookies();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key || !body.courseId) return NextResponse.json({ error: 'Invalid enrollment request.' }, { status: 400 });

    const sessionClient = createServerClient(url, key, {
        cookies: { getAll: () => cookieStore.getAll(), setAll: () => undefined },
    });
    const { data: { user } } = await sessionClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });

    const admin = createSupabaseAdminClient();
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
    const { data: course } = await admin.from('courses').select('registration_fee').eq('id', body.courseId).maybeSingle();
    if (profile?.role !== 'student' || !course) return NextResponse.json({ error: 'Student or course not found.' }, { status: 403 });
    if (Number(course.registration_fee || 0) > 0) return NextResponse.json({ error: 'Payment is required for this course.' }, { status: 402 });

    const { error } = await admin.from('enrollments').upsert({
        student_id: user.id,
        course_id: body.courseId,
        status: 'enrolled',
    }, { onConflict: 'student_id,course_id' });
    if (error) return NextResponse.json({ error: 'Could not create enrollment.' }, { status: 500 });
    return NextResponse.json({ ok: true });
}
