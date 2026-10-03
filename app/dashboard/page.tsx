'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Medal,
  ShieldCheck,
  Sparkles,
  X,
  AlertCircle,
} from 'lucide-react';
import { useState } from 'react';
import { RegistrationCardComponent } from '@/components/registration-card-component';
import { useStudentData } from '@/lib/hooks/use-student-data';
import type { RegistrationCard } from '@/lib/types';

function LoadingState() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-200" />
        ))}
      </div>
    </div>
  );
}

export default function StudentDashboardPage() {
  const {
    ready,
    currentUser,
    myEnrollments,
    myAssignments,
    mySubmissions,
    myCertificates,
    myRegistrationCard,
  } = useStudentData();
  const [selectedRegistration, setSelectedRegistration] = useState<RegistrationCard | null>(null);

  if (!ready) return <LoadingState />;
  if (!currentUser) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10">
          <GraduationCap className="mx-auto h-8 w-8 text-slate-400" />
          <h2 className="mt-4 text-lg font-semibold text-slate-950">Sign in to continue learning</h2>
          <p className="mt-2 text-sm text-slate-500">
            Your courses, assignments, credentials, and student identity all live in one place.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#18375f] px-4 py-2.5 text-sm font-semibold text-white"
          >
            Sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const pending = myAssignments.filter(
    (assignment) => !mySubmissions.some((submission) => submission.assignmentId === assignment.id)
  );
  const resubmissions = mySubmissions.filter((sub) => sub.status === 'resubmit_required');
  const graded = mySubmissions.filter((sub) => sub.status === 'graded');
  const underReview = mySubmissions.filter((sub) => sub.status === 'submitted');

  const completed = myEnrollments.filter((enrollment) => enrollment.status === 'completed').length;
  const completion = myEnrollments.length ? Math.round((completed / myEnrollments.length) * 100) : 0;

  const nextAction =
    resubmissions.length > 0
      ? {
          icon: AlertCircle,
          title: `${resubmissions.length} revision${resubmissions.length === 1 ? '' : 's'} requested`,
          description: 'Your instructor requested revisions on your work. Please review their feedback and resubmit.',
          href: '/dashboard/assignments',
          action: 'Revise & Resubmit',
          urgent: true,
        }
      : pending.length > 0
      ? {
          icon: ClipboardList,
          title: `${pending.length} assignment${pending.length === 1 ? '' : 's'} pending`,
          description: 'Keep your learning moving by completing your next project submission.',
          href: '/dashboard/assignments',
          action: 'View assignments',
          urgent: false,
        }
      : myCertificates.length > 0
      ? {
          icon: Medal,
          title: 'Credential available',
          description: 'You have a verified achievement ready to view and share.',
          href: '/dashboard/certificates',
          action: 'View credentials',
          urgent: false,
        }
      : null;

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Welcome Section */}
        <section className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#18375f] text-white">
              <LayoutDashboard className="h-7 w-7" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Student dashboard
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Welcome back, {currentUser.fullName.split(' ')[0]} <span aria-hidden="true">👋</span>
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Here&apos;s what&apos;s happening with your learning, assignments, and credentials.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:min-w-72">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">
              {currentUser.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-slate-900">{currentUser.fullName}</p>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Verified Student
                </span>
              </div>
              <p className="mt-1 truncate font-mono text-[11px] text-slate-500">
                {myRegistrationCard?.registrationNo || 'Registration preparing'}
              </p>
            </div>
          </div>
        </section>

        {/* Overview Telemetry Stats */}
        <section aria-label="Student overview" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              label: 'Enrolled courses',
              value: myEnrollments.length,
              context: 'Your active learning paths',
              icon: BookOpen,
              color: 'text-blue-700 bg-blue-50',
            },
            {
              label: 'Assignments',
              value: myAssignments.length,
              context: `${graded.length} graded • ${pending.length} pending`,
              icon: ClipboardList,
              color: resubmissions.length > 0 ? 'text-red-700 bg-red-50' : 'text-amber-700 bg-amber-50',
            },
            {
              label: 'Certificates',
              value: myCertificates.length,
              context: 'Verified digital credentials',
              icon: Award,
              color: 'text-emerald-700 bg-emerald-50',
            },
            {
              label: 'Completion',
              value: `${completion}%`,
              context: 'Across your enrolled courses',
              icon: CheckCircle2,
              color: 'text-teal-700 bg-teal-50',
            },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </span>
                <span className="text-2xl font-bold text-slate-950">{stat.value}</span>
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-900">{stat.label}</p>
              <p className="mt-1 text-xs text-slate-500">{stat.context}</p>
            </div>
          ))}
        </section>

        {/* Priority Next Steps & Identity */}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Priority</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">Your next steps</h2>
              </div>
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>

            {nextAction ? (
              <div
                className={`mt-6 flex items-start gap-4 rounded-xl border p-4 ${
                  nextAction.urgent
                    ? 'border-red-200 bg-red-50/70'
                    : 'border-amber-200 bg-amber-50'
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white ${
                    nextAction.urgent ? 'text-red-700 shadow-sm' : 'text-amber-700'
                  }`}
                >
                  <nextAction.icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className={`font-semibold ${nextAction.urgent ? 'text-red-950 font-bold' : 'text-slate-950'}`}>
                    {nextAction.title}
                  </h3>
                  <p className={`mt-1 text-sm leading-6 ${nextAction.urgent ? 'text-red-800' : 'text-slate-600'}`}>
                    {nextAction.description}
                  </p>
                  <Link
                    href={nextAction.href}
                    className={`mt-3 inline-flex items-center gap-1.5 text-sm font-bold ${
                      nextAction.urgent ? 'text-red-700 hover:text-red-900 underline' : 'text-amber-800'
                    }`}
                  >
                    {nextAction.action}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-6 flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                <div>
                  <h3 className="font-semibold text-slate-950">You&apos;re all caught up 🎉</h3>
                  <p className="mt-1 text-sm text-slate-600">No pending assignments or revisions require your attention.</p>
                </div>
              </div>
            )}
          </div>

          <section className="rounded-2xl bg-[#18375f] p-6 text-white shadow-sm sm:p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-200">Verified identity</p>
                <h2 className="mt-1 text-xl font-bold">Student Registration</h2>
              </div>
              <ShieldCheck className="h-6 w-6 text-emerald-300" />
            </div>

            {myRegistrationCard ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-white/15 bg-white/10 p-4">
                  <p className="text-xs text-blue-100">Registered student</p>
                  <p className="mt-1 font-semibold">{myRegistrationCard.studentName}</p>
                  <p className="mt-4 text-xs text-blue-100">Registration number</p>
                  <p className="mt-1 font-mono text-sm font-semibold text-emerald-200">
                    {myRegistrationCard.registrationNo}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRegistration(myRegistrationCard)}
                    className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#18375f] hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    View credential
                  </button>
                  <Link
                    href={`/verify/${myRegistrationCard.registrationNo}`}
                    className="rounded-lg border border-white/25 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
                  >
                    Verify online
                  </Link>
                </div>
              </div>
            ) : (
              <p className="mt-6 text-sm text-blue-100">Your verified registration card will appear here shortly.</p>
            )}
          </section>
        </section>
      </div>

      {selectedRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="relative my-8 w-full max-w-3xl">
            <button
              type="button"
              onClick={() => setSelectedRegistration(null)}
              aria-label="Close registration credential"
              className="fixed right-5 top-5 z-50 rounded-full bg-slate-900 p-3 text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <RegistrationCardComponent registrationCard={selectedRegistration} />
          </div>
        </div>
      )}
    </main>
  );
}
