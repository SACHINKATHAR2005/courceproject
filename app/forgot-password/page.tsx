'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, GraduationCap, ShieldCheck, RefreshCw } from 'lucide-react';

type CaptchaState = { a: number; b: number; op: '+' | '-' | '*'; question: string };

function generateCaptcha(): CaptchaState {
    const ops: Array<'+' | '-' | '*'> = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * 9) + 1;
    let b = Math.floor(Math.random() * 9) + 1;
    if (op === '-') { if (a < b) [a, b] = [b, a]; } // keep positive
    if (op === '*') { a = Math.floor(Math.random() * 5) + 1; b = Math.floor(Math.random() * 5) + 1; }
    const opLabel = op === '*' ? '×' : op;
    return { a, b, op, question: `What is ${a} ${opLabel} ${b}?` };
}

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [captcha, setCaptcha] = useState<CaptchaState | null>(null);
    const [captchaAnswer, setCaptchaAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => { setCaptcha(generateCaptcha()); }, []);

    const refreshCaptcha = () => {
        setCaptcha(generateCaptcha());
        setCaptchaAnswer('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!captcha) return;

        setLoading(true);
        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    captcha: { a: captcha.a, b: captcha.b, op: captcha.op, answer: Number(captchaAnswer) },
                }),
            });
            const result = await response.json();
            if (!response.ok) {
                setError(result.error || 'Something went wrong. Please try again.');
                refreshCaptcha();
            } else {
                setSuccess(true);
            }
        } catch {
            setError('Network error. Please check your connection and try again.');
            refreshCaptcha();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAFC] text-[#0F172A] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center px-4">
                <Link href="/" className="inline-flex flex-col items-center gap-3 mb-5 group">
                    <span className="flex items-center gap-3">
                        <span className="p-2.5 rounded-xl bg-[#1E3A5F] text-[#B08D57] font-bold shadow-sm group-hover:bg-[#162F4D] transition-colors">
                            <GraduationCap className="w-6 h-6" />
                        </span>
                        <span className="text-left">
                            <span className="block text-2xl font-bold leading-none tracking-tight text-[#0F172A]">
                                Learn<span className="text-[#1E3A5F]">Hub</span> <span className="text-[#B08D57]">Certify</span>
                            </span>
                            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#64748B]">
                                Learn. Practice. Progress.
                            </span>
                        </span>
                    </span>
                </Link>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1E3A5F] text-xs font-semibold uppercase tracking-wider mb-3">
                    <ShieldCheck className="w-3.5 h-3.5" /> Password Reset
                </div>
                <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight">
                    Forgot your password?
                </h1>
                <p className="mt-2 text-sm text-[#64748B] max-w-sm mx-auto leading-relaxed">
                    Enter your registered email address and we will send you a link to reset your password.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
                <div className="bg-white border border-[#E2E8F0] py-8 px-6 shadow-sm rounded-2xl sm:px-10">

                    {success ? (
                        <div className="text-center space-y-4">
                            <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mx-auto">
                                <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-bold text-[#0F172A]">Check your inbox</h2>
                            <p className="text-sm text-[#64748B]">
                                If an account with that email exists, a password reset link has been sent. Check your spam folder too.
                            </p>
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 mt-2 text-sm font-semibold text-[#1E3A5F] hover:underline"
                            >
                                Back to sign in
                            </Link>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                                    {error}
                                </div>
                            )}

                            <form className="space-y-5" onSubmit={handleSubmit}>
                                {/* Email */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-2">
                                        Registered Email <span className="text-[#B08D57]">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="samantha@example.com"
                                            className="w-full pl-10 pr-4 py-3 bg-white border border-[#CBD5E1] rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F] transition-colors"
                                        />
                                    </div>
                                </div>

                                {/* Math Captcha */}
                                {captcha && (
                                    <div>
                                        <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-2">
                                            Security Check <span className="text-[#B08D57]">*</span>
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl px-4 py-3">
                                                <span className="text-sm font-bold text-[#1E3A5F]">{captcha.question}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={refreshCaptcha}
                                                title="New question"
                                                className="p-3 rounded-xl border border-[#CBD5E1] hover:bg-[#F1F5F9] transition-colors text-[#64748B]"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <input
                                            type="number"
                                            required
                                            value={captchaAnswer}
                                            onChange={(e) => setCaptchaAnswer(e.target.value)}
                                            placeholder="Your answer"
                                            className="mt-2 w-full px-4 py-3 bg-white border border-[#CBD5E1] rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F] transition-colors"
                                        />
                                    </div>
                                )}

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-[#1E3A5F] hover:bg-[#162F4D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E3A5F] disabled:opacity-50 transition-all cursor-pointer"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Send Reset Link
                                            <ArrowRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <div className="mt-6 border-t border-[#E2E8F0] pt-5 text-center">
                                <Link href="/login" className="text-xs font-semibold text-[#1E3A5F] hover:underline">
                                    ← Back to sign in
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
