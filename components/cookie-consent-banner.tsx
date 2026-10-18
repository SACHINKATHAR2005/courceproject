'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cookie } from 'lucide-react';
import { trackConsentGiven } from '@/lib/analytics';

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const consent = localStorage.getItem('lhc_cookie_consent');
      if (!consent) {
        setVisible(true);
        const timer = setTimeout(() => {
          setAnimating(true);
        }, 60);
        return () => clearTimeout(timer);
      }
    } catch {
      // LocalStorage access may fail in restrictive privacy mode
    }
  }, []);

  const handleAccept = async () => {
    setAnimating(false);
    setTimeout(() => setVisible(false), 300);

    try {
      localStorage.setItem('lhc_cookie_consent', 'accepted');
    } catch {
      // Ignore storage errors
    }

    try {
      fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accepted: true,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        }),
      }).catch(() => {});
    } catch {
      // Ignore network errors
    }

    try {
      trackConsentGiven(true);
    } catch {
      // Ignore tracking errors
    }
  };

  const handleDecline = async () => {
    setAnimating(false);
    setTimeout(() => setVisible(false), 300);

    try {
      localStorage.setItem('lhc_cookie_consent', 'declined');
    } catch {
      // Ignore storage errors
    }

    try {
      fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accepted: false,
        }),
      }).catch(() => {});
    } catch {
      // Ignore network errors
    }

    try {
      trackConsentGiven(false);
    } catch {
      // Ignore tracking errors
    }
  };

  if (!mounted || !visible) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label="Cookie Consent"
      className={`fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 transition-all duration-500 ease-out motion-reduce:transition-none motion-reduce:transform-none ${
        animating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      <div className="max-w-6xl mx-auto bg-white border border-[#E2E8F0] shadow-2xl rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
        <div className="flex items-start space-x-3.5 sm:space-x-4 flex-1">
          <div className="p-2.5 rounded-xl bg-[#1E3A5F]/10 text-[#1E3A5F] flex items-center justify-center shrink-0 border border-[#1E3A5F]/20">
            <Cookie className="w-5 h-5 sm:w-6 sm:h-6 text-[#1E3A5F]" />
          </div>
          <div className="space-y-1">
            <p className="text-xs sm:text-sm text-[#0F172A] leading-relaxed">
              We use essential cookies to keep the platform running and optional analytics cookies to improve your experience. Read our{' '}
              <Link
                href="/privacy-policy"
                className="text-[#1E3A5F] underline font-semibold hover:text-[#B08D57] transition-colors"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="flex flex-row items-center gap-3 w-full md:w-auto shrink-0 justify-end">
          <button
            type="button"
            onClick={handleDecline}
            className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#0F172A] text-xs sm:text-sm font-semibold transition-colors active:scale-95 motion-reduce:transform-none cursor-pointer text-center"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-[#1E3A5F] hover:bg-[#162a45] text-white text-xs sm:text-sm font-semibold shadow-md transition-colors active:scale-95 motion-reduce:transform-none cursor-pointer text-center"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}

export default CookieConsentBanner;
