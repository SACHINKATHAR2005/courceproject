'use client';

import React from 'react';
import Link from 'next/link';
import { Award, ShieldCheck } from 'lucide-react';
import { useStore } from '@/lib/store/useStore';

export const Footer: React.FC = () => {
  const currentUser = useStore((state) => state.currentUser);

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 text-xs py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
          {/* Brand */}
          <div className="space-y-2">
            <Link href="/" className="inline-flex items-center space-x-2.5 group">
              <div className="p-2 rounded-lg bg-[#1E3A5F] text-[#B08D57] font-bold">
                <Award className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">
                LearnHub <span className="text-[#B08D57]">Certify</span>
              </span>
            </Link>
            <p className="text-slate-400 max-w-sm text-xs leading-relaxed">
              Official verification platform for educational digital credentials, course certificates, and institutional registration records.
            </p>
          </div>

          {/* Public links stay out of authenticated staff workspaces. */}
          {!currentUser && <div className="flex flex-wrap gap-8 text-xs font-medium">
            <div className="space-y-2">
              <span className="block font-semibold uppercase tracking-wider text-[11px] text-slate-400">Platform</span>
              <ul className="space-y-1.5">
                <li><Link href="/courses" className="hover:text-white transition-colors">Courses</Link></li>
                <li><Link href="/verify" className="hover:text-white transition-colors">Verify Credential</Link></li>
                <li><Link href="/#about" className="hover:text-white transition-colors">About</Link></li>
              </ul>
            </div>
            <div className="space-y-2">
              <span className="block font-semibold uppercase tracking-wider text-[11px] text-slate-400">Portals</span>
              <ul className="space-y-1.5">
                <li><Link href="/login" className="hover:text-white transition-colors">Student Sign In</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Student Registration</Link></li>
              </ul>
            </div>
            <div className="space-y-2">
              <span className="block font-semibold uppercase tracking-wider text-[11px] text-slate-400">Institutional</span>
              <ul className="space-y-1.5">
                <li><span className="text-slate-500">Privacy Policy</span></li>
                <li><span className="text-slate-500">Terms of Service</span></li>
                <li><span className="text-slate-500">Contact Institution</span></li>
              </ul>
            </div>
          </div>}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-slate-400 text-[11px] gap-3">
          <p>© {new Date().getFullYear()} LearnHub Certify. All rights reserved. Official Credential Verification System.</p>
          <div className="flex items-center space-x-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-[#B08D57]" />
            <span>Institutional Verification Portal</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
