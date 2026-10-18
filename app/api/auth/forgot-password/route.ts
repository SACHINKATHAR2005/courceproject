import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { checkRateLimit } from '@/lib/ratelimit';

function getClientIp(request: Request) {
    const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    return forwardedFor || request.headers.get('x-real-ip') || 'unknown-client';
}

/**
 * Simple server-side math captcha verification.
 * The client sends { a, b, op, answer } where op is '+' | '-' | '*'
 * and answer is what the user typed. We verify server-side.
 */
function verifyCaptcha(captcha: { a?: number; b?: number; op?: string; answer?: number } | undefined): boolean {
    if (!captcha || typeof captcha.a !== 'number' || typeof captcha.b !== 'number' || typeof captcha.answer !== 'number') return false;
    const { a, b, op, answer } = captcha;
    switch (op) {
        case '+': return answer === a + b;
        case '-': return answer === a - b;
        case '*': return answer === a * b;
        default: return false;
    }
}

function escapeHtml(value: string) {
    return value.replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c] || c));
}

function getMailFrom() {
    const address = process.env.MAIL_FROM_ADDRESS || process.env.MAIL_FROM;
    if (!address) return undefined;
    return process.env.MAIL_FROM_ADDRESS
        ? `${process.env.MAIL_FROM_NAME || 'LearnHub'} <${address}>`
        : address;
}

async function sendPasswordResetEmail(toEmail: string, resetLink: string) {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;
    const from = getMailFrom();
    if (!host || !user || !password || !from) throw new Error('Email delivery is not configured.');

    const mailer = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass: password },
    });

    const safeLink = escapeHtml(resetLink);

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f8fafc; padding: 32px; color: #0f172a;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07);">
    <div style="background: #1e3a5f; padding: 28px 32px;">
      <h1 style="margin: 0; color: #b08d57; font-size: 22px; font-weight: 700;">LearnHub Certify</h1>
      <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">Password Reset Request</p>
    </div>
    <div style="padding: 32px;">
      <p style="font-size: 15px; margin: 0 0 12px;">Hi,</p>
      <p style="font-size: 14px; color: #475569; margin: 0 0 24px;">
        We received a request to reset your password for your <strong>LearnHub Certify</strong> account.
        Click the button below to choose a new password.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${safeLink}"
           style="display: inline-block; background: #1e3a5f; color: #ffffff; text-decoration: none;
                  padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">
          Reset My Password
        </a>
      </div>
      <p style="font-size: 12px; color: #64748b; margin: 0 0 8px;">
        Or copy and paste this link into your browser:
      </p>
      <p style="font-size: 11px; color: #94a3b8; word-break: break-all; margin: 0 0 24px;">
        ${safeLink}
      </p>
      <div style="background: #fef9ec; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 16px; font-size: 12px; color: #92400e;">
        ⚠️ This link will expire in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email.
      </div>
    </div>
    <div style="background: #f1f5f9; padding: 18px 32px; text-align: center; font-size: 11px; color: #94a3b8;">
      © ${new Date().getFullYear()} LearnHub Certify. All rights reserved.
    </div>
  </div>
</body>
</html>`;

    const text = `Reset your LearnHub Certify password\n\nWe received a request to reset your password.\n\nClick the link below to reset it:\n${resetLink}\n\nThis link expires in 1 hour. If you didn't request this, ignore this email.\n\n© ${new Date().getFullYear()} LearnHub Certify`;

    await mailer.sendMail({
        from,
        to: toEmail,
        subject: 'Reset your LearnHub Certify password',
        text,
        html,
    });
}

export async function POST(request: Request) {
    // Rate limit: 3 attempts per 15 minutes per IP
    const ip = getClientIp(request);
    const { limited, resetAt } = await checkRateLimit(`forgot-password:${ip}`, 3);
    if (limited) {
        const retryAfter = Math.ceil((resetAt.getTime() - Date.now()) / 1000);
        return NextResponse.json(
            { error: 'Too many password reset requests. Please try again later.' },
            { status: 429, headers: { 'Retry-After': String(retryAfter) } },
        );
    }

    let body: { email?: string; captcha?: { a?: number; b?: number; op?: string; answer?: number } };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Malformed request.' }, { status: 400 });
    }

    const email = body.email?.trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    // Verify captcha
    if (!verifyCaptcha(body.captcha)) {
        return NextResponse.json({ error: 'Captcha answer is incorrect. Please try again.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
        return NextResponse.json({ error: 'Password reset is not configured.' }, { status: 503 });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if email exists in profiles table
    const { data: profile } = await adminClient
        .from('profiles')
        .select('id, role')
        .eq('email', email)
        .maybeSingle();

    if (!profile) {
        return NextResponse.json(
            { error: 'No account found with this email address. Please check the email or contact your instructor.' },
            { status: 404 },
        );
    }

    // Generate a recovery token via Supabase admin — Supabase does NOT send any email here
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
        console.error('Generate reset link failed:', linkError);
        return NextResponse.json({ error: 'Failed to generate reset link. Please try again.' }, { status: 500 });
    }

    // Build our OWN reset link using NEXT_PUBLIC_SITE_URL — no supabase.co URL in the email
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const resetLink = `${siteUrl}/auth/verify-reset?token=${linkData.properties.hashed_token}&type=recovery`;

    // Send the reset email via our own SMTP (Gmail) with branded template
    try {
        await sendPasswordResetEmail(email, resetLink);
    } catch (emailError) {
        console.error('Password reset email send failed:', emailError);
        return NextResponse.json({ error: 'Failed to send reset email. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'Password reset email sent. Please check your inbox.' });
}
