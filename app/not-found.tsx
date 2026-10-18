'use client';

import React from 'react';
import Link from 'next/link';
import { GraduationCap, Home, Compass, ArrowRight, ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 bg-[#F8FAFC] text-[#0F172A]">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 sm:p-12 md:p-16 max-w-xl w-full text-center space-y-8 shadow-sm relative overflow-hidden">
        {/* Decorative corner accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#B08D57]/10 via-[#1E3A5F]/5 to-transparent rounded-bl-full pointer-events-none" />

        {/* Animated Illustration */}
        <div className="relative mx-auto w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
          {/* Subtle rotating dashed orbital ring */}
          <div
            className="absolute inset-0 rounded-full border-2 border-dashed border-[#B08D57]/30 animate-spin motion-reduce:animate-none"
            style={{ animationDuration: '24s' }}
            aria-hidden="true"
          />

          {/* Pulsing halo */}
          <div
            className="absolute inset-3 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] animate-pulse motion-reduce:animate-none"
            aria-hidden="true"
          />

          {/* Floating / Bouncing central element */}
          <div
            className="relative z-10 p-5 sm:p-6 rounded-2xl bg-[#1E3A5F] text-[#B08D57] shadow-xl border border-[#1E3A5F]/20 animate-bounce motion-reduce:animate-none"
            style={{ animationDuration: '3s' }}
          >
            <GraduationCap className="w-12 h-12 sm:w-16 sm:h-16 text-[#B08D57]" strokeWidth={2} />
          </div>

          {/* Orbiting badge 1 - Green check/shield */}
          <div
            className="absolute -top-1 -right-1 z-20 p-2 rounded-xl bg-white border border-[#E2E8F0] text-[#15803D] shadow-md animate-pulse motion-reduce:animate-none"
            style={{ animationDuration: '2.5s' }}
            aria-hidden="true"
          >
            <Compass className="w-4 h-4" />
          </div>

          {/* Orbiting badge 2 - Warning accent */}
          <div
            className="absolute -bottom-1 -left-1 z-20 p-2 rounded-xl bg-white border border-[#E2E8F0] text-[#B08D57] shadow-md animate-pulse motion-reduce:animate-none"
            style={{ animationDuration: '3.5s' }}
            aria-hidden="true"
          >
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-[#1E3A5F] text-xs font-semibold">
            <span>Error 404</span>
          </div>

          <h1 className="text-7xl sm:text-8xl md:text-9xl font-black tracking-tight text-[#1E3A5F] leading-none select-none">
            404
          </h1>

          <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">
            Oops! Page not found
          </h2>

          <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-[#1E3A5F] hover:bg-[#162F4D] text-white font-semibold text-sm transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:ring-offset-2"
          >
            <Home className="w-4 h-4" />
            <span>Go Home</span>
          </Link>

          <Link
            href="/courses"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#0F172A] font-semibold text-sm border border-[#E2E8F0] transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#B08D57] focus:ring-offset-2"
          >
            <GraduationCap className="w-4 h-4 text-[#B08D57]" />
            <span>Browse Courses</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
