import Razorpay from 'razorpay';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
    try {
        const body = await request.json() as { courseId?: string };
        const courseId = body.courseId;
        const cookieStore = await cookies();
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
        if (!url || !key) return NextResponse.json({ error: 'Supabase is not configured.' }, { status: 503 });

        const sessionClient = createServerClient(url, key, {
            cookies: { getAll: () => cookieStore.getAll(), setAll: () => undefined },
        });
        const { data: { user } } = await sessionClient.auth.getUser();
        if (!user || !courseId) return NextResponse.json({ error: 'You must be signed in as a student.' }, { status: 401 });

        const admin = createSupabaseAdminClient();
        const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
        if (profile?.role !== 'student') return NextResponse.json({ error: 'Only students can enroll.' }, { status: 403 });

        const { data: course } = await admin.from('courses').select('id, title, registration_fee').eq('id', courseId).maybeSingle();
        if (!course) return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
        const amountPaise = Math.round(Number(course.registration_fee || 0) * 100);
        if (amountPaise <= 0) return NextResponse.json({ error: 'This course is free.', free: true }, { status: 400 });

        const razorpayKey = process.env.RAZORPAY_KEY_ID;
        const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!razorpayKey || !razorpaySecret) {
            return NextResponse.json({
                error: 'Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local, then restart the dev server.',
            }, { status: 503 });
        }

        const razorpay = new Razorpay({ key_id: razorpayKey, key_secret: razorpaySecret });
        // Razorpay receipts must be 56 characters or fewer. Keep the full UUIDs
        // in notes and our payment row, while using a compact receipt identifier.
        const receipt = `course_${courseId.slice(0, 8)}_${user.id.slice(0, 8)}_${Date.now()}`;
        const order = await razorpay.orders.create({
            amount: amountPaise,
            currency: 'INR',
            receipt,
            notes: { course_id: courseId, student_id: user.id },
        });

        const { error: paymentError } = await admin.from('payments').insert({
            razorpay_order_id: order.id,
            student_id: user.id,
            course_id: courseId,
            amount_paise: amountPaise,
            currency: 'INR',
            status: 'pending',
        });
        if (paymentError) {
            console.error('Payment ledger insert failed:', paymentError);
            return NextResponse.json({
                error: `Could not create payment record: ${paymentError.message}`,
                code: paymentError.code,
            }, { status: 500 });
        }

        return NextResponse.json({ orderId: order.id, amount: amountPaise, currency: 'INR', keyId: razorpayKey, courseTitle: course.title });
    } catch (error) {
        console.error('Razorpay order creation failed:', error);
        return NextResponse.json({ error: 'Unable to start payment.' }, { status: 500 });
    }
}
