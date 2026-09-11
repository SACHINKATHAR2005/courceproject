'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, ArrowRight, Sparkles, GraduationCap, ShieldCheck } from 'lucide-react';
import { useStore } from '@/lib/store/useStore';
import { supabase } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const currentUser = useStore((state) => state.currentUser);
  const setUser = useStore((state) => state.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect to dashboard
  React.useEffect(() => {
    if (currentUser) {
      router.push(currentUser.role === 'admin' ? '/admin' : currentUser.role === 'instructor' ? '/instructor' : '/dashboard');
    }
  }, [currentUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const loginEmail = email.trim().toLowerCase();
    const loginPassword = password;
    setEmail('');
    setPassword('');

    if (!loginEmail) {
      setError('Please enter your student email address.');
      return;
    }

    setLoading(true);

    if (!supabase) {
      setError('Authentication is not configured.');
      setLoading(false);
      return;
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    if (authError || !data.user) {
      setError(authError?.message || 'Invalid email or password.');
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();
    if (profileError || !profile) {
      await supabase.auth.signOut();
      setError('Your account profile is incomplete. Please contact support.');
      setLoading(false);
      return;
    }
    if (profile.role !== 'student') {
      await supabase.auth.signOut();
      setError('Use the staff access page for Instructor or Admin accounts.');
      setLoading(false);
      return;
    }
    setUser({ id: profile.id, fullName: profile.full_name, email: profile.email, phone: profile.phone, role: profile.role, avatarUrl: profile.avatar_url, createdAt: profile.created_at });
    router.push('/dashboard');
  };

  const handleGoogleLogin = async () => {
    setError('');
    if (!supabase) {
      setError('Authentication is not configured.');
      return;
    }
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthError) setError(oauthError.message);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-10 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/3 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            Learn<span className="text-amber-400">Hub</span>
          </span>
        </Link>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider mb-3">
          <ShieldCheck className="w-3.5 h-3.5" /> Student Access Portal
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Welcome Back, Student
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
          Sign in to access your course progress, submitted work, and authentic student registration card.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center justify-between">
              <span>{error}</span>
              <Link href="/register" className="underline font-bold text-red-300 hover:text-white">
                Register now
              </Link>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Student Email <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="samantha@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-400 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[10px] uppercase tracking-wider text-slate-500">
            <span className="h-px flex-1 bg-slate-800" />
            <span>or</span>
            <span className="h-px flex-1 bg-slate-800" />
          </div>
          <button type="button" onClick={handleGoogleLogin} className="w-full rounded-xl border border-slate-700 bg-white py-3 text-sm font-bold text-slate-900 hover:bg-slate-100">
            Continue with Google
          </button>

          {/* Footer Link to Register */}
          <div className="mt-6 border-t border-slate-800 pt-5 text-center">
            <p className="text-xs text-slate-400">
              Don&apos;t have a student account yet?{' '}
              <Link href="/register" className="font-semibold text-amber-400 hover:text-amber-300 transition-colors">
                Create new registration
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
