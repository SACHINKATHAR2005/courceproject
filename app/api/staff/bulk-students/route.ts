import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import nodemailer, { type Transporter } from 'nodemailer';
import * as XLSX from 'xlsx';

type StudentRow = { name?: unknown; email?: unknown; password?: unknown; department?: unknown };
type ImportResult = { row: number; name: string; email: string; status: 'created' | 'failed'; message: string };
type QueueRow = { id: string; to_email: string; recipient_name: string; initial_password: string; subject: string; attempts: number };

const normalizeHeader = (value: unknown) => String(value ?? '').trim().toLowerCase().replace(/[\s_-]+/g, '');

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
}[character] || character));

function mapRows(rows: unknown[][]): StudentRow[] {
    const headers = (rows.shift() || []).map(normalizeHeader);
    const nameIndex = headers.findIndex((header) => ['name', 'fullname', 'studentname'].includes(header));
    const emailIndex = headers.indexOf('email');
    const passwordIndex = headers.findIndex((header) => ['password', 'initialpassword', 'initialpass'].includes(header));
    const departmentIndex = headers.findIndex((header) => ['department', 'dept', 'branch'].includes(header));
    if (nameIndex < 0 || emailIndex < 0 || passwordIndex < 0) throw new Error('The file must contain name, email, and initial password columns.');
    return rows.filter((row) => row.some((cell) => String(cell ?? '').trim())).map((row) => ({
        name: row[nameIndex],
        email: row[emailIndex],
        password: row[passwordIndex],
        department: departmentIndex >= 0 ? row[departmentIndex] : undefined,
    }));
}

async function getStaffRole() {
    const cookieStore = await cookies();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !anonKey) return null;
    const sessionClient = createServerClient(url, anonKey, { cookies: { getAll: () => cookieStore.getAll(), setAll: () => undefined } });
    const { data: { user } } = await sessionClient.auth.getUser();
    if (!user) return null;
    const { data: profile } = await sessionClient.from('profiles').select('role').eq('id', user.id).maybeSingle();
    return profile?.role === 'admin' || profile?.role === 'instructor' ? profile.role : null;
}

function createMailer() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;
    if (!host || !user || !password) return null;
    return nodemailer.createTransport({ host, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true', auth: { user, pass: password } });
}

function getMailFrom() {
    const address = process.env.MAIL_FROM_ADDRESS || process.env.MAIL_FROM;
    if (!address) return undefined;
    return process.env.MAIL_FROM_ADDRESS
        ? `${process.env.MAIL_FROM_NAME || 'LearnHub'} <${address}>`
        : address;
}

async function processEmailQueue(adminClient: SupabaseClient, mailer: Transporter) {
    const { data: queued } = await adminClient
        .from('email_queue')
        .select('id, to_email, recipient_name, initial_password, subject, attempts')
        .eq('status', 'pending')
        .order('queued_at', { ascending: true });

    const outcomes = new Map<string, 'sent' | 'failed'>();
    for (const item of (queued || []) as QueueRow[]) {
        const { data: claimed } = await adminClient
            .from('email_queue')
            .update({ status: 'sending', attempts: item.attempts + 1, last_error: null })
            .eq('id', item.id)
            .eq('status', 'pending')
            .select('id')
            .maybeSingle();
        if (!claimed) continue;

        try {
            const safeName = escapeHtml(item.recipient_name);
            const safeEmail = escapeHtml(item.to_email);
            const safePassword = escapeHtml(item.initial_password);
            await mailer.sendMail({
                from: getMailFrom(),
                to: item.to_email,
                subject: item.subject,
                text: `Hello ${item.recipient_name},\n\nYou have been registered on LearnHub.\n\nEmail: ${item.to_email}\nInitial password: ${item.initial_password}\n\nPlease sign in and change your password after signing in.`,
                html: `<p>Hello ${safeName},</p><p>You have been registered on LearnHub.</p><p><strong>Email:</strong> ${safeEmail}<br><strong>Initial password:</strong> ${safePassword}</p><p>Please sign in and change your password after signing in.</p>`,
            });
            // Clear the plaintext password from the DB after successful send
            await adminClient.from('email_queue').update({
                status: 'sent',
                sent_at: new Date().toISOString(),
                initial_password: null,
            }).eq('id', item.id);
            outcomes.set(item.to_email, 'sent');
        } catch (error) {
            await adminClient.from('email_queue').update({ status: 'failed', last_error: error instanceof Error ? error.message : 'Email delivery failed.' }).eq('id', item.id);
            outcomes.set(item.to_email, 'failed');
        }
    }
    return outcomes;
}

export async function POST(request: Request) {
    const role = await getStaffRole();
    if (!role) return NextResponse.json({ error: 'Only authenticated instructors and admins can import students.' }, { status: 403 });
    const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const mailer = createMailer();
    if (!serviceRoleKey || !url) return NextResponse.json({ error: 'Student registration is not configured.' }, { status: 503 });
    if (!mailer || !getMailFrom()) return NextResponse.json({ error: 'Email delivery is not configured.' }, { status: 503 });

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Choose a CSV or Excel file.' }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'The file must be smaller than 5 MB.' }, { status: 400 });
    if (!/\.(csv|xlsx|xls)$/i.test(file.name)) return NextResponse.json({ error: 'Only CSV and Excel files are supported.' }, { status: 400 });

    let studentRows: StudentRow[];
    try {
        const workbook = XLSX.read(Buffer.from(await file.arrayBuffer()), { type: 'buffer' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!firstSheet) throw new Error('The file has no worksheet.');
        studentRows = mapRows(XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1, defval: '' }));
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to read the file.' }, { status: 400 });
    }
    if (studentRows.length === 0) return NextResponse.json({ error: 'The file contains no student rows.' }, { status: 400 });
    if (studentRows.length > 500) return NextResponse.json({ error: 'Import up to 500 students at a time.' }, { status: 400 });

    const adminClient = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const results: ImportResult[] = [];
    const seenEmails = new Set<string>();
    for (const [index, row] of studentRows.entries()) {
        const name = String(row.name ?? '').trim();
        const email = String(row.email ?? '').trim().toLowerCase();
        const password = String(row.password ?? '').trim();
        const department = String(row.department ?? '').trim() || undefined;
        const resultBase = { row: index + 2, name, email };
        if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
            results.push({ ...resultBase, status: 'failed', message: 'Name, valid email, and password of at least 8 characters are required.' });
            continue;
        }
        if (seenEmails.has(email)) {
            results.push({ ...resultBase, status: 'failed', message: 'Duplicate email in this file.' });
            continue;
        }
        seenEmails.add(email);
        const { data, error } = await adminClient.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } });
        if (error || !data.user) {
            const duplicate = error?.message.toLowerCase().includes('already') || error?.message.toLowerCase().includes('exist');
            results.push({ ...resultBase, status: 'failed', message: duplicate ? 'An account with this email already exists.' : error?.message || 'Unable to create account.' });
            continue;
        }
        const registrationNo = `REG-${new Date().getUTCFullYear()}-${crypto.randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;
        const { error: profileError } = await adminClient.from('profiles').upsert({ id: data.user.id, full_name: name, email, role: 'student' }, { onConflict: 'id' });
        const { error: registrationError } = await adminClient.from('registrations').insert({ registration_no: registrationNo, student_id: data.user.id, student_name: name, email, department: department ?? null, status: 'VALID' });
        if (profileError || registrationError) {
            await adminClient.auth.admin.deleteUser(data.user.id);
            results.push({ ...resultBase, status: 'failed', message: 'Account setup failed.' });
            continue;
        }
        const { error: queueError } = await adminClient.from('email_queue').insert({
            to_email: email,
            recipient_name: name,
            initial_password: password,
        });
        if (queueError) {
            results.push({ ...resultBase, status: 'failed', message: 'Account created, but the welcome email could not be queued.' });
        } else {
            results.push({ ...resultBase, status: 'created', message: 'Account created; welcome email queued.' });
        }
    }
    const queueOutcomes = await processEmailQueue(adminClient, mailer);
    const updatedResults = results.map((result) => {
        const outcome = queueOutcomes.get(result.email);
        if (outcome === 'sent') return { ...result, message: 'Account created and email sent.' };
        if (outcome === 'failed') return { ...result, message: 'Account created, but email delivery failed and can be retried from the queue.' };
        return result;
    });
    return NextResponse.json({ ok: true, created: updatedResults.filter((result) => result.status === 'created').length, failed: updatedResults.filter((result) => result.status === 'failed').length, results: updatedResults, importedBy: role });
}