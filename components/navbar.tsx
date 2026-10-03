'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  X,
  CheckCheck,
  FileText,
  GraduationCap,
  RefreshCw,
  StickyNote,
  BadgeCheck,
  AlertCircle,
} from 'lucide-react';
import { AppNotification } from '@/lib/types';

// ─── Relative time helper ────────────────────────────────────────────────────
function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Notification type → icon ─────────────────────────────────────────────
function NotifIcon({ type }: { type: AppNotification['type'] }) {
  const cls = 'w-4 h-4 flex-shrink-0 mt-0.5';
  switch (type) {
    case 'assignment_posted':
      return <ClipboardList className={`${cls} text-blue-500`} />;
    case 'assignment_submitted':
      return <FileText className={`${cls} text-indigo-500`} />;
    case 'assignment_graded':
      return <GraduationCap className={`${cls} text-emerald-500`} />;
    case 'resubmit_required':
      return <RefreshCw className={`${cls} text-amber-500`} />;
    case 'note_added':
      return <StickyNote className={`${cls} text-violet-500`} />;
    case 'certificate_issued':
      return <BadgeCheck className={`${cls} text-yellow-500`} />;
    default:
      return <AlertCircle className={`${cls} text-slate-400`} />;
  }
}

// ─── Notification Popover ────────────────────────────────────────────────────
function NotificationPopover({
  currentUserId,
  onClose,
}: {
  currentUserId: string;
  onClose: () => void;
}) {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } =
    useStore();
  const router = useRouter();

  const userNotifs = notifications
    .filter((n) => n.userId === currentUserId)
    .slice(0, 30); // cap at 30

  const unreadCount = userNotifs.filter((n) => !n.read).length;

  function handleClick(notif: AppNotification) {
    markNotificationAsRead(notif.id);
    onClose();
    if (notif.link) router.push(notif.link);
  }

  return (
    <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-[#E2E8F0] bg-white shadow-xl z-[999] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9]">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#1E3A5F]" />
          <span className="font-semibold text-sm text-[#0F172A]">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5 leading-none">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllNotificationsAsRead(currentUserId)}
            className="flex items-center gap-1 text-[11px] font-medium text-[#1E3A5F] hover:text-[#162F4D] transition-colors"
            title="Mark all as read"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="max-h-[400px] overflow-y-auto divide-y divide-[#F1F5F9]">
        {userNotifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <Bell className="w-8 h-8 text-[#CBD5E1] mb-2" />
            <p className="text-sm font-medium text-[#94A3B8]">
              No notifications yet
            </p>
            <p className="text-xs text-[#CBD5E1] mt-1">
              You&apos;ll see updates here when there&apos;s activity.
            </p>
          </div>
        ) : (
          userNotifs.map((notif) => (
            <button
              key={notif.id}
              onClick={() => handleClick(notif)}
              className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[#F8FAFC] transition-colors ${
                !notif.read ? 'bg-blue-50/60' : ''
              }`}
            >
              <NotifIcon type={notif.type} />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-[13px] leading-snug ${
                    !notif.read
                      ? 'font-semibold text-[#0F172A]'
                      : 'font-medium text-[#334155]'
                  }`}
                >
                  {notif.title}
                </p>
                <p className="text-[12px] text-[#64748B] mt-0.5 line-clamp-2">
                  {notif.message}
                </p>
                <p className="text-[10px] text-[#94A3B8] mt-1">
                  {relativeTime(notif.createdAt)}
                </p>
              </div>
              {!notif.read && (
                <span className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-blue-500" />
              )}
            </button>
          ))
        )}
      </div>

      {userNotifs.length > 0 && (
        <div className="px-4 py-2.5 border-t border-[#F1F5F9] bg-[#F8FAFC]">
          <p className="text-[11px] text-[#94A3B8] text-center">
            Showing last {userNotifs.length} notification
            {userNotifs.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Navbar ─────────────────────────────────────────────────────────────
export const Navbar: React.FC = () => {
  const router = useRouter();
  const { currentUser, logoutUser, notifications, markAllNotificationsAsRead } =
    useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Unread count for the current user
  const unreadCount = currentUser
    ? notifications.filter((n) => n.userId === currentUser.id && !n.read).length
    : 0;

  // Close popover when clicking outside
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showNotifications]);

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
            <Link href="/dashboard" className="px-3.5 py-2 rounded-lg text-sm font-semibold text-[#15803D]"><span>Dashboard</span></Link>
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
              {/* ── Notification Bell ── */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  title="Notifications"
                  aria-label="Notifications"
                  onClick={() => setShowNotifications((prev) => !prev)}
                  className="relative rounded-lg border border-[#E2E8F0] bg-white p-2 text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#18375f]"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <NotificationPopover
                    currentUserId={currentUser.id}
                    onClose={() => setShowNotifications(false)}
                  />
                )}
              </div>

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
          {/* Mobile notification bell */}
          {currentUser && (
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                title="Notifications"
                aria-label="Notifications"
                onClick={() => setShowNotifications((prev) => !prev)}
                className="relative rounded-lg border border-[#E2E8F0] bg-white p-2 text-[#64748B]"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <NotificationPopover
                  currentUserId={currentUser.id}
                  onClose={() => setShowNotifications(false)}
                />
              )}
            </div>
          )}
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
