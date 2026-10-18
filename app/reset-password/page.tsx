'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

function getSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
    return createBrowserClient(url, key);
}

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // Supabase sets the session from the URL hash after the callback redirect.
        // We just need to confirm the user is authenticated before showing the form.
        const supabase = getSupabase();
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) {
                router.replace('/forgot-password?error=expired');
            } else {
                setReady(true);
            }
        });
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const supabase = getSupabase();
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) {
                setError(updateError.message || 'Failed to update password. The link may have expired.');
            } else {
                setSuccess(true);
                // Sign out so they log in fresh with new password
                await supabase.auth.signOut();
                setTimeout(() => router.push('/login?message=password_reset'), 2500);
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!ready && !success) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-[#F8FAFC]">
                <div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

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
                                Learn<span className="text-[#1E3A5F]">Hub</span>{' '}
                                <span className="text-[#B08D57]">Certify</span>
                            </span>
                            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#64748B]">
                                Learn. Practice. Progress.
                            </span>
                        </span>
                    </span>
                </Link>

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#1E3A5F] text-xs font-semibold uppercase tracking-wider mb-3">
                    <ShieldCheck className="w-3.5 h-3.5" /> Set New Password
                </div>
                <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight">Choose a new password</h1>
                <p className="mt-2 text-sm text-[#64748B] max-w-sm mx-auto leading-relaxed">
                    Enter a strong new password for your account.
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
                            <h2 className="text-lg font-bold text-[#0F172A]">Password updated!</h2>
                            <p className="text-sm text-[#64748B]">
                                Your password has been reset successfully. Redirecting you to login…
                            </p>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                                    {error}
                                </div>
                            )}

                            <form className="space-y-5" onSubmit={handleSubmit}>
                                {/* New Password */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-2">
                                        New Password <span className="text-[#B08D57]">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                                            <KeyRound className="h-4 w-4" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            minLength={8}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Min. 8 characters"
                                            className="w-full pl-10 pr-10 py-3 bg-white border border-[#CBD5E1] rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F] transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#94A3B8] hover:text-[#475569]"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-2">
                                        Confirm Password <span className="text-[#B08D57]">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                                            <KeyRound className="h-4 w-4" />
                                        </div>
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            required
                                            value={confirm}
                                            onChange={(e) => setConfirm(e.target.value)}
                                            placeholder="Re-enter new password"
                                            className="w-full pl-10 pr-10 py-3 bg-white border border-[#CBD5E1] rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F] transition-colors"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm((v) => !v)}
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#94A3B8] hover:text-[#475569]"
                                            tabIndex={-1}
                                        >
                                            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-[#1E3A5F] hover:bg-[#162F4D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E3A5F] disabled:opacity-50 transition-all cursor-pointer"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        'Update Password'
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
