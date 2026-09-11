import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
    try {
        const body = await request.json() as { courseId?: string; razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string };
        const cookieStore = await cookies();
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!url || !key || !secret) return NextResponse.json({ error: 'Payment verification is not configured.' }, { status: 503 });

        const sessionClient = createServerClient(url, key, {
            cookies: { getAll: () => cookieStore.getAll(), setAll: () => undefined },
        });
        const { data: { user } } = await sessionClient.auth.getUser();
        if (!user || !body.courseId || !body.razorpay_order_id || !body.razorpay_payment_id || !body.razorpay_signature) {
            return NextResponse.json({ error: 'Invalid payment verification request.' }, { status: 400 });
        }

        const admin = createSupabaseAdminClient();
        const { data: payment } = await admin.from('payments').select('*')
            .eq('razorpay_order_id', body.razorpay_order_id)
            .eq('student_id', user.id)
            .eq('course_id', body.courseId)
            .maybeSingle();
        if (!payment) return NextResponse.json({ error: 'Payment record not found.' }, { status: 404 });

        const expected = crypto.createHmac('sha256', secret).update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`).digest('hex');
        const valid = crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(body.razorpay_signature));
        if (!valid) {
            await admin.from('payments').update({ status: 'failed' }).eq('id', payment.id);
            return NextResponse.json({ error: 'Payment signature could not be verified.' }, { status: 400 });
        }

        await admin.from('payments').update({
            razorpay_payment_id: body.razorpay_payment_id,
            razorpay_signature: body.razorpay_signature,
            status: 'paid',
            paid_at: new Date().toISOString(),
        }).eq('id', payment.id);

        const { error: enrollmentError } = await admin.from('enrollments').upsert({
            student_id: user.id,
            course_id: body.courseId,
            status: 'enrolled',
        }, { onConflict: 'student_id,course_id' });
        if (enrollmentError) return NextResponse.json({ error: 'Payment succeeded but enrollment could not be created.' }, { status: 500 });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Razorpay verification failed:', error);
        return NextResponse.json({ error: 'Unable to verify payment.' }, { status: 500 });
    }
}
