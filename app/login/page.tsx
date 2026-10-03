'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, GraduationCap, ShieldCheck } from 'lucide-react';
import { useStore } from '@/lib/store/useStore';

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

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail, password: loginPassword }),
    });
    const result = await response.json();
    if (!response.ok || !result.profile) {
      setError(result.error || 'Unable to sign in.');
      setLoading(false);
      return;
    }
    setUser(result.profile);
    router.push('/dashboard');
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

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[#15803D] text-xs font-semibold uppercase tracking-wider mb-3">
          <ShieldCheck className="w-3.5 h-3.5" /> Student learning portal
        </div>
        <h1 className="text-3xl font-bold text-[#0F172A] tracking-tight">
          Welcome back to your learning
        </h1>
        <p className="mt-2 text-sm text-[#64748B] max-w-sm mx-auto leading-relaxed">
          Sign in to continue your courses, submit your work, and see the progress you are building.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-white border border-[#E2E8F0] py-8 px-6 shadow-sm rounded-2xl sm:px-10">

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center justify-between">
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-2">
                Student Email <span className="text-[#B08D57]">*</span>
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

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-[#475569] uppercase tracking-wider mb-2">
                Password <span className="text-[#B08D57]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94A3B8]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#CBD5E1] rounded-xl text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F] transition-colors"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-[#1E3A5F] hover:bg-[#162F4D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E3A5F] disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-[#E2E8F0] pt-5 text-center">
            <p className="text-xs text-[#64748B]">
              Student accounts are created by an authorized instructor or administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
