import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

async function getStaff() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !anonKey) return null;
    const cookieStore = await cookies();
    const sessionClient = createServerClient(url, anonKey, { cookies: { getAll: () => cookieStore.getAll(), setAll: () => undefined } });
    const { data: { user } } = await sessionClient.auth.getUser();
    if (!user) return null;
    const { data: profile } = await sessionClient.from('profiles').select('role').eq('id', user.id).maybeSingle();
    return profile?.role === 'admin' || profile?.role === 'instructor' ? profile.role : null;
}

function getMailFrom() {
    const address = process.env.MAIL_FROM_ADDRESS || process.env.MAIL_FROM;
    if (!address) return undefined;
    return process.env.MAIL_FROM_ADDRESS
        ? `${process.env.MAIL_FROM_NAME || 'LearnHub'} <${address}>`
        : address;
}

export async function POST(request: Request) {
    if (!await getStaff()) return NextResponse.json({ error: 'Only authenticated staff can process the email queue.' }, { status: 403 });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secret = process.env.SUPABASE_SECRET_KEY;
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;
    if (!url || !secret || !host || !user || !password || !getMailFrom()) return NextResponse.json({ error: 'Email queue is not configured.' }, { status: 503 });

    const admin = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } });
    const mailer = nodemailer.createTransport({ host, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', auth: { user, pass: password } });
    const body = await request.json().catch(() => ({})) as { retryFailed?: boolean };
    if (body.retryFailed) {
        await admin.from('email_queue').update({ status: 'pending', last_error: null }).eq('status', 'failed');
    }
    const { data: pending } = await admin.from('email_queue').select('id, to_email, recipient_name, initial_password, subject, attempts').eq('status', 'pending').order('queued_at', { ascending: true });
    let sent = 0;
    let failed = 0;
    for (const item of pending || []) {
        const { data: claimed } = await admin.from('email_queue').update({ status: 'sending', attempts: item.attempts + 1, last_error: null }).eq('id', item.id).eq('status', 'pending').select('id').maybeSingle();
        if (!claimed) continue;
        try {
            await mailer.sendMail({
                from: getMailFrom(),
                to: item.to_email,
                subject: item.subject,
                text: `Hello ${item.recipient_name},\n\nYou have been registered on LearnHub.\n\nEmail: ${item.to_email}\nInitial password: ${item.initial_password}\n\nPlease sign in and change your password after signing in.`,
            });
            await admin.from('email_queue').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', item.id);
            sent += 1;
        } catch (error) {
            await admin.from('email_queue').update({ status: 'failed', last_error: error instanceof Error ? error.message : 'Email delivery failed.' }).eq('id', item.id);
            failed += 1;
        }
    }
    return NextResponse.json({ ok: true, sent, failed, processed: sent + failed });
}
