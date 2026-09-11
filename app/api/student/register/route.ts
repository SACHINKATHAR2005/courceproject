import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!serviceRoleKey || !url) {
        return NextResponse.json({ error: 'Registration is not configured.' }, { status: 503 });
    }

    let body: { fullName?: string; email?: string; phone?: string; password?: string; institution?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
    }

    const fullName = body.fullName?.trim();
    const email = body.email?.trim().toLowerCase();
    const phone = body.phone?.replace(/\D/g, '');
    const password = body.password;
    const institution = body.institution?.trim() || 'LearnHub Institute of Technology';
    if (!fullName || !email || !phone || !password || password.length < 8) {
        return NextResponse.json({ error: 'Name, mobile number, email, and a password of at least 8 characters are required.' }, { status: 400 });
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
        return NextResponse.json({ error: 'Enter a valid 10-digit Indian mobile number.' }, { status: 400 });
    }

    const adminClient = createClient(url, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
    });
    if (error || !data.user) {
        const duplicate = error?.message.toLowerCase().includes('already') || error?.message.toLowerCase().includes('exist');
        return NextResponse.json(
            { error: duplicate ? 'An account with this email already exists. Please sign in instead.' : 'Unable to create account.' },
            { status: duplicate ? 409 : 400 },
        );
    }

    const registrationNo = `REG-${new Date().getUTCFullYear()}-${crypto.randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;
    const { error: profileError } = await adminClient.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        email,
        phone,
        role: 'student',
    }, { onConflict: 'id' });
    const { error: registrationError } = await adminClient.from('registrations').insert({
        registration_no: registrationNo,
        student_id: data.user.id,
        student_name: fullName,
        email,
        institution,
        status: 'VALID',
    });

    if (profileError || registrationError) {
        await adminClient.auth.admin.deleteUser(data.user.id);
        return NextResponse.json({ error: 'Account setup failed. No account was created.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
