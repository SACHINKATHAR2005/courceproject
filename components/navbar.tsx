'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import { supabase } from '@/lib/supabase/client';
import {
  Award,
  ClipboardList,
  Bell,
  ShieldCheck,
  LogOut,
  Menu,
  X
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const { currentUser, logoutUser } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase?.auth.signOut();
    logoutUser();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md transition-all">
      <div className="w-full px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">

        {/* Brand Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="p-2 rounded-lg bg-[#1E3A5F] text-[#B08D57] shadow-sm group-hover:bg-[#162F4D] transition-colors">
            <Award className="w-5 h-5 font-semibold" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-[#0F172A] group-hover:text-[#1E3A5F] transition-colors">
              LearnHub <span className="text-[#1E3A5F]">Certify</span>
            </span>
            <span className="hidden sm:block text-[10px] uppercase font-semibold text-[#64748B] tracking-wider">
              Verified Credentials
            </span>
          </div>
        </Link>

        {/* Role-specific navigation */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {!currentUser && <>
            <Link href="/courses" className="px-3.5 py-2 rounded-lg text-sm font-medium text-[#475569] hover:bg-[#F8FAFC]">Courses</Link>
            <Link href="/verify" className="px-3.5 py-2 rounded-lg text-sm font-medium text-[#475569] hover:bg-[#F8FAFC] flex items-center space-x-1.5"><ShieldCheck className="w-4 h-4 text-[#15803D]" /><span>Verify Credential</span></Link>
            <Link href="/#about" className="px-3.5 py-2 rounded-lg text-sm font-medium text-[#475569] hover:bg-[#F8FAFC]">About</Link>
          </>}
          {currentUser?.role === 'student' && <>
            <Link
              href="/dashboard"
              className="px-3.5 py-2 rounded-lg text-sm font-semibold text-[#15803D]"
            >
              <span>Dashboard</span>
            </Link>
            <Link href="/dashboard/courses" className="px-3.5 py-2 rounded-lg text-sm font-medium text-[#475569]">My Courses</Link>
            <Link href="/dashboard/assignments" className="px-3.5 py-2 rounded-lg text-sm font-medium text-[#475569] flex items-center gap-1.5"><ClipboardList className="h-3.5 w-3.5" />Assignments</Link>
            <Link href="/dashboard/certificates" className="px-3.5 py-2 rounded-lg text-sm font-medium text-[#475569] flex items-center gap-1.5"><Award className="h-3.5 w-3.5" />Certificates</Link>
            <Link href="/verify" className="px-3.5 py-2 rounded-lg text-sm font-medium text-[#475569]">Verify</Link>
          </>}
          {currentUser?.role === 'instructor' && <Link href="/instructor" className="px-3.5 py-2 rounded-lg text-sm font-semibold text-indigo-700">Instructor Portal</Link>}
          {currentUser?.role === 'admin' && <Link href="/admin" className="px-3.5 py-2 rounded-lg text-sm font-semibold text-amber-700">Admin Portal</Link>}
        </nav>

        {/* Right Auth CTA Controls */}
        <div className="hidden md:flex items-center space-x-3">
          {currentUser ? (
            <div className="flex items-center space-x-3">
              <button type="button" title="Notifications" aria-label="Notifications" className="relative rounded-lg border border-[#E2E8F0] bg-white p-2 text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#18375f]">
                <Bell className="h-4 w-4" />
              </button>
              {/* Profile Pill */}
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#0F172A]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-800">{currentUser.fullName.charAt(0).toUpperCase()}</span>
                <span className="font-semibold truncate max-w-35">{currentUser.fullName}</span>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={handleLogout}
                title="Sign out"
                className="p-2 rounded-lg bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg text-[#475569] hover:text-[#0F172A] font-semibold text-xs transition-colors"
              >
                Sign In
              </Link>

            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="md:hidden flex items-center space-x-2">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-[#475569] hover:text-[#0F172A]"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#E2E8F0] px-4 pt-3 pb-6 space-y-3">
          {!currentUser && <>
            <Link href="/courses" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-[#0F172A] text-sm font-medium">Courses</Link>
            <Link href="/verify" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-[#15803D] text-sm font-medium">Verify Credential</Link>
            <Link href="/#about" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-[#475569] text-sm font-medium">About Platform</Link>
          </>}
          {currentUser ? (
            <>
              <Link
                href={currentUser.role === 'admin' ? '/admin' : currentUser.role === 'instructor' ? '/instructor' : '/dashboard'}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-[#15803D] bg-emerald-50 text-sm font-semibold"
              >
                {currentUser.role === 'admin' ? 'Admin Portal' : currentUser.role === 'instructor' ? 'Instructor Portal' : `Student Dashboard (${currentUser.fullName})`}
              </Link>
              {currentUser.role === 'student' && <Link href="/dashboard/courses" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-[#0F172A] text-sm font-medium">My Courses</Link>}
              {currentUser.role === 'student' && <Link href="/dashboard/assignments" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-[#0F172A] text-sm font-medium">Assignments & Notes</Link>}
              {currentUser.role === 'student' && <Link href="/dashboard/certificates" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-lg text-[#0F172A] text-sm font-medium">Certificates</Link>}
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-red-700 hover:bg-[#F8FAFC] text-sm font-medium"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-2 border-t border-[#E2E8F0] flex flex-col space-y-2">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center px-4 py-2 rounded-lg bg-[#F1F5F9] text-[#0F172A] font-semibold text-sm"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
