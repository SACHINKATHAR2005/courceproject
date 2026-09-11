'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Search,
  Award,
  CreditCard,
  Building2,
  FileCheck
} from 'lucide-react';

export default function VerifyPortalPage() {
  const router = useRouter();
  const [outwardNo, setOutwardNo] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
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
          <span>Credential Verification Portal</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F172A]">
          Verify Official Credentials
        </h1>

        <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
          Enter a certificate outward number (<code className="text-[#1E3A5F] font-mono">CERT-2026-XXXXXX</code>) or registration number (<code className="text-[#1E3A5F] font-mono">REG-2026-XXXXXX</code>) to view the official record.
        </p>
      </div>

      {/* Verification Search Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 max-w-2xl mx-auto">
        <form onSubmit={handleSearch} className="space-y-3">
          <label className="text-xs font-bold text-[#0F172A] uppercase tracking-wider block">
            Credential or Registration ID
          </label>

          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-4 text-[#64748B]" />
            <input
              type="text"
              value={outwardNo}
              onChange={(e) => setOutwardNo(e.target.value)}
              placeholder="e.g. CERT-2026-894120 or REG-2026-894120"
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
            All credentials are created directly under authorized institutional department registries.
          </p>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] text-[#1E3A5F] flex items-center justify-center font-bold text-xs">
            02
          </div>
          <h3 className="text-sm font-bold text-[#0F172A]">Instant Lookup</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Outward IDs resolve directly to official recipient, course, and date metadata.
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

    </div>
  );
}
