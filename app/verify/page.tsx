'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Search, Award, BookOpen, FileCheck } from 'lucide-react';

export default function VerifyPortalPage() {
  const router = useRouter();
  const [outwardNo, setOutwardNo] = useState('');
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outwardNo.trim()) return;
    router.push(`/verify/${encodeURIComponent(outwardNo.trim().toUpperCase())}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 text-[#0F172A]">

      {/* Hero Header */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-[#1E3A5F] text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-[#15803D]" />
          <span>Certificate Verification Portal</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A]">
          Verify Official Certificates
        </h1>

        <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
          Enter a certificate outward number (e.g.{' '}
          <code className="text-[#1E3A5F] font-mono">CERT-2026-XXXXXX</code>) to
          verify an official course completion credential.
        </p>
      </div>

      {/* Verification Search Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 max-w-2xl mx-auto">
        <form onSubmit={handleSearch} className="space-y-3">
          <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider block">
            Certificate Outward Number
          </label>

          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-4 text-[#64748B]" />
            <input
              type="text"
              value={outwardNo}
              onChange={(e) => setOutwardNo(e.target.value)}
              placeholder="e.g. CERT-2026-894120"
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-11 pr-32 py-3 text-sm text-[#0F172A] placeholder-slate-400 font-mono uppercase focus:outline-none focus:border-[#1E3A5F] focus:ring-1 focus:ring-[#1E3A5F]"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-5 py-2 bg-[#1E3A5F] hover:bg-[#162F4D] text-white font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
            >
              Verify
            </button>
          </div>
        </form>
      </div>

      {/* Trust Info Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] text-[#1E3A5F] flex items-center justify-center font-bold text-xs">
            01
          </div>
          <h3 className="text-sm font-bold text-[#0F172A]">Institutional Issuance</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            All certificates are issued directly by authorized instructors under institutional registries.
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] text-[#1E3A5F] flex items-center justify-center font-bold text-xs">
            02
          </div>
          <h3 className="text-sm font-bold text-[#0F172A]">Instant Lookup</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Certificate IDs resolve instantly to recipient name, course, and date metadata.
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] text-[#1E3A5F] flex items-center justify-center font-bold text-xs">
            03
          </div>
          <h3 className="text-sm font-bold text-[#0F172A]">Status Accountability</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Records display clear active verification or revocation status flags.
          </p>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="max-w-2xl mx-auto bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-amber-900">Privacy Notice</p>
          <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
            This portal verifies <strong>course certificates only</strong>. Student registration records are private
            and accessible exclusively to authorized institutional staff.
          </p>
        </div>
      </div>

    </div>
  );
}
