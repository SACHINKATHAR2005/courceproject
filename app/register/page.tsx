'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, User, Mail, Lock, Building, Phone, ArrowRight, CheckCircle, Sparkles, GraduationCap } from 'lucide-react';
import { useStore } from '@/lib/store/useStore';
import { supabase } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const currentUser = useStore((state) => state.currentUser);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [institution, setInstitution] = useState('LearnHub Institute of Technology');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect to dashboard
  React.useEffect(() => {
    if (currentUser) {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const registrationName = fullName.trim();
    const registrationEmail = email.trim().toLowerCase();
    const registrationPhone = phone.replace(/\D/g, '');
    const registrationPassword = password;
    const registrationInstitution = institution.trim();
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setInstitution('');

    if (!registrationName) {
      setError('Please enter your full legal name.');
      return;
    }
    if (!registrationEmail || !registrationEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(registrationPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (registrationPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      if (!supabase) throw new Error('Authentication is not configured.');
      const response = await fetch('/api/student/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: registrationName, email: registrationEmail, phone: registrationPhone, password: registrationPassword, institution: registrationInstitution }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Registration failed.');

      await supabase.auth.signOut();
      router.push('/login?registered=1');
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegistration = async () => {
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
      {/* Dynamic Background Glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-width-md z-10 text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            Learn<span className="text-amber-400">Hub</span>
          </span>
        </Link>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Official Student Registration
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Create Your Student Account
        </h1>
        <p className="mt-2 text-sm text-slate-400 max-w-sm mx-auto">
          Enroll in verified courses, build verified credentials, and receive an authentic tamper-proof Student Registration Card.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 relative">

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Full Legal Name <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Samantha Vance"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Email Address <span className="text-amber-400">*</span>
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
                Mobile Number <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  type="tel"
                  required
                  inputMode="numeric"
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="10-digit mobile number"
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
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>
            </div>

            {/* Institution */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Educational Institution
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Building className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="LearnHub Institute of Technology"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-colors"
                />
              </div>
            </div>

            {/* Live Registration Card Preview Badge */}
            <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs text-amber-300/90 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-300">Registration Card Preview:</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Upon registration, a unique Outward Registration Number (<code className="text-amber-400 font-mono">REG-2026-XXXXXX</code>) and QR code card will be generated for your student profile.
                </p>
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
                  Register & Open Student Dashboard
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
          <button type="button" onClick={handleGoogleRegistration} className="w-full rounded-xl border border-slate-700 bg-white py-3 text-sm font-bold text-slate-900 hover:bg-slate-100">
            Continue with Google
          </button>

          {/* Footer Link to Login */}
          <div className="mt-6 border-t border-slate-800 pt-5 text-center">
            <p className="text-xs text-slate-400">
              Already registered as a student?{' '}
              <Link href="/login" className="font-semibold text-amber-400 hover:text-amber-300 transition-colors">
                Sign in to your account
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          LearnHub Credential System &bull; Verified Student Enrollment &bull; Tamper-Proof QR Security
        </p>
      </div>
    </div>
  );
}
