'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { useStore } from '@/lib/store/useStore';
import type { UserRole } from '@/lib/types';

const staffRoles = ['instructor', 'admin'] as const;
type StaffRole = (typeof staffRoles)[number];

function StaffAuthForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const setUser = useStore((state) => state.setUser);
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [role, setRole] = useState<StaffRole>('instructor');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (searchParams.get('registered') === '1') setMode('login');
    }, [searchParams]);

    useEffect(() => {
        if (!supabase) return;
        const client = supabase;
        client.auth.getUser().then(async ({ data }) => {
            if (!data.user) return;
            const { data: profile } = await client.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
            if (profile?.role === 'admin' || profile?.role === 'instructor') {
                router.replace(profile.role === 'admin' ? '/admin' : '/instructor');
            }
        });
    }, [router]);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError('');
        const loginEmail = email.trim().toLowerCase();
        const loginPassword = password;
        const registrationName = fullName.trim();
        const registrationCode = code;
        setFullName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setCode('');
        if (!supabase) {
            setError('Authentication is not configured.');
            return;
        }
        if (mode === 'register' && password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            if (mode === 'register') {
                const response = await fetch('/api/staff/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullName: registrationName, email: loginEmail, password: loginPassword, role, code: registrationCode }),
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Staff registration failed.');
                await supabase.auth.signOut();
                router.replace('/staff-auth?registered=1');
                return;
            }

            const { error: loginError } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
            if (loginError) throw new Error(loginError.message);
            const { data: userData } = await supabase.auth.getUser();
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', userData.user?.id).maybeSingle();
            if (!profile || !['admin', 'instructor'].includes(profile.role)) {
                await supabase.auth.signOut();
                throw new Error('This account is not authorized for staff access.');
            }
            setUser({
                id: profile.id,
                fullName: profile.full_name,
                email: profile.email,
                phone: profile.phone,
                role: profile.role as UserRole,
                avatarUrl: profile.avatar_url,
                createdAt: profile.created_at,
            });
            const requestedPath = searchParams.get('next');
            const destination = profile.role === 'admin'
                ? '/admin'
                : requestedPath === '/instructor' ? '/instructor' : '/instructor';
            router.replace(destination);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Staff authentication failed.');
        } finally {
            setLoading(false);
        }
    };

    const next = searchParams.get('next');
    return (
        <main className="min-h-screen bg-slate-950 px-4 py-16 text-slate-100">
            <div className="mx-auto max-w-md space-y-6">
                <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-amber-400">Restricted access</p>
                    <h1 className="mt-2 text-3xl font-bold text-white">Staff Access</h1>
                    <p className="mt-2 text-sm text-slate-400">Authorized Instructor and Admin authentication.</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-950 p-1">
                        {staffRoles.map((staffRole) => (
                            <button key={staffRole} type="button" onClick={() => setRole(staffRole)} className={`rounded-lg px-3 py-2 text-sm font-semibold capitalize ${role === staffRole ? 'bg-amber-400 text-slate-950' : 'text-slate-400'}`}>
                                {staffRole}
                            </button>
                        ))}
                    </div>
                    <div className="mt-5 flex gap-4 border-b border-slate-800 text-sm">
                        <button type="button" onClick={() => setMode('login')} className={`pb-3 ${mode === 'login' ? 'border-b-2 border-amber-400 text-white' : 'text-slate-500'}`}>Sign In</button>
                        <button type="button" onClick={() => setMode('register')} className={`pb-3 ${mode === 'register' ? 'border-b-2 border-amber-400 text-white' : 'text-slate-500'}`}>Create Staff Account</button>
                    </div>
                    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                        {mode === 'register' && <input required value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Full name" className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white" />}
                        <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Work email" className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white" />
                        <input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white" />
                        {mode === 'register' && <>
                            <input required minLength={8} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm password" className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white" />
                            <input required value={code} onChange={(event) => setCode(event.target.value)} placeholder="Authorized registration code" className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-sm text-white" />
                        </>}
                        {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
                        <button disabled={loading} className="w-full rounded-lg bg-amber-400 px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-50">{loading ? 'Working...' : mode === 'login' ? `Sign In as ${role}` : `Register ${role}`}</button>
                    </form>
                    {next && <p className="mt-4 text-xs text-slate-500">Requested destination: {next}</p>}
                </div>
                <Link href="/" className="block text-center text-sm text-slate-400 hover:text-white">Return to public site</Link>
            </div>
        </main>
    );
}

export default function StaffAuthPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
            <StaffAuthForm />
        </Suspense>
    );
}
