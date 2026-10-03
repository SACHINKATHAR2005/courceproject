'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import {
  Search,
  BookOpen,
  ShieldCheck,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  Check
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { courses, currentUser, enrollInCourse, enrollments } = useStore();
  const [searchOutwardNo, setSearchOutwardNo] = useState('');

  const handleVerifySearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchOutwardNo.trim()) return;
    router.push(`/verify/${encodeURIComponent(searchOutwardNo.trim().toUpperCase())}`);
  };

  const handleEnrollClick = (courseId: string) => {
    if (!currentUser) {
      router.push('/login');
    } else {
      enrollInCourse(currentUser.id, courseId);
      router.push('/dashboard');
    }
  };

  return (
    <div className="space-y-24 pb-24 text-[#0F172A]">

      {/* 1. HERO SECTION */}
      <section className="pt-16 pb-12 lg:pt-24 lg:pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-[#1E3A5F] text-xs font-semibold">
              <GraduationCap className="w-4 h-4 text-[#15803D]" />
              <span>Learning that moves you forward</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0F172A] leading-[1.15]">
              Learn skills. Build confidence. Open new doors.
            </h1>

            <p className="text-base sm:text-lg text-[#475569] leading-relaxed max-w-2xl font-normal">
              Practical courses, patient guidance, and a place to turn curiosity into capability. Learn at your pace, practice with purpose, and grow into the opportunities ahead.
            </p>

            {/* CTAs */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              <Link
                href="/courses"
                className="px-6 py-3.5 rounded-lg bg-[#1E3A5F] hover:bg-[#162F4D] text-white font-semibold text-sm transition-all shadow-sm flex items-center space-x-2"
              >
                <span>Start learning</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/verify"
                className="px-6 py-3.5 rounded-lg bg-white hover:bg-[#F8FAFC] text-[#0F172A] font-semibold text-sm border border-[#E2E8F0] transition-all flex items-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4 text-[#15803D]" />
                <span>See how it works</span>
              </Link>
            </div>

            <div className="pt-4 flex items-center space-x-6 text-xs text-[#64748B]">
              <span className="flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-[#15803D]" />
                <span>Learn by doing</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Check className="w-4 h-4 text-[#15803D]" />
                <span>Progress you can see</span>
              </span>
            </div>
          </div>

          {/* Hero Right: Learning journey preview */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-md bg-emerald-50 text-[#15803D]">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#0F172A]">Your learning path</p>
                    <p className="text-[10px] text-[#64748B]">Small steps. Real progress.</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-[#F1F5F9] text-[#1E3A5F] border border-[#E2E8F0] text-[10px] font-bold uppercase tracking-wider">
                  Keep going
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#B08D57]">A course that meets you where you are</span>
                  <h3 className="text-xl font-bold text-[#0F172A] mt-0.5">Build something you are proud of.</h3>
                </div>

                <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#0F172A]">Course progress</span>
                    <span className="font-bold text-[#15803D]">60%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#E2E8F0] overflow-hidden"><div className="h-full w-3/5 rounded-full bg-[#15803D]" /></div>
                  <p className="text-xs text-[#475569]">Learn a concept, try it yourself, then use it in a meaningful project.</p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-b border-[#E2E8F0] py-3">
                  <div><BookOpen className="w-4 h-4 mx-auto mb-1 text-[#1E3A5F]" /><span className="font-semibold text-[#0F172A]">Learn</span></div>
                  <div><CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-[#15803D]" /><span className="font-semibold text-[#0F172A]">Practice</span></div>
                  <div><GraduationCap className="w-4 h-4 mx-auto mb-1 text-[#B08D57]" /><span className="font-semibold text-[#0F172A]">Grow</span></div>
                </div>

                <div className="flex items-center space-x-2 pt-1 text-xs text-[#64748B]">
                  <ShieldCheck className="w-4 h-4 text-[#15803D]" />
                  <span>When you finish, your achievement can be verified too.</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. TRUST / VALUE SECTION */}
      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 lg:p-12 space-y-10 shadow-sm">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs uppercase font-semibold tracking-wider text-[#B08D57]">Education first</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A]">A place to learn, practice, and move forward.</h2>
            <p className="text-xs sm:text-sm text-[#64748B]">
              The record matters because the learning came first. We help students build useful skills and give instructors a clear way to support their progress.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3 p-6 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <span className="text-xs font-bold text-[#B08D57]">01</span>
              <h3 className="text-base font-bold text-[#0F172A]">Learn with direction</h3>
              <p className="text-xs text-[#475569] leading-relaxed">
                Follow thoughtful courses led by instructors who make complex ideas approachable and useful.
              </p>
            </div>

            <div className="space-y-3 p-6 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <span className="text-xs font-bold text-[#B08D57]">02</span>
              <h3 className="text-base font-bold text-[#0F172A]">Practice with purpose</h3>
              <p className="text-xs text-[#475569] leading-relaxed">
                Work through assignments and projects that turn new knowledge into confidence you can carry forward.
              </p>
            </div>

            <div className="space-y-3 p-6 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <span className="text-xs font-bold text-[#B08D57]">03</span>
              <h3 className="text-base font-bold text-[#0F172A]">Carry proof of your growth</h3>
              <p className="text-xs text-[#475569] leading-relaxed">
                A verifiable certificate is there when you need it, as a record of the work you have actually completed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HOW VERIFICATION WORKS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <span className="text-xs uppercase font-semibold tracking-wider text-[#B08D57]">Credential Verification</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A]">Verify a credential in seconds.</h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Three simple steps connect authentic student work to official institutional records.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-[#E2E8F0] p-6 rounded-xl space-y-3">
            <div className="text-xs font-bold text-[#1E3A5F] bg-[#F1F5F9] px-2.5 py-1 rounded inline-block">
              01 — Credential Issued
            </div>
            <h4 className="text-sm font-bold text-[#0F172A]">Course Completion</h4>
            <p className="text-xs text-[#475569] leading-relaxed">
              Student completes the required course or training assignments specified by the institution.
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-6 rounded-xl space-y-3">
            <div className="text-xs font-bold text-[#1E3A5F] bg-[#F1F5F9] px-2.5 py-1 rounded inline-block">
              02 — Unique Credential ID
            </div>
            <h4 className="text-sm font-bold text-[#0F172A]">Outward Record Generation</h4>
            <p className="text-xs text-[#475569] leading-relaxed">
              The platform assigns a unique outward number (`CERT-2026-XXXXXX` or `REG-2026-XXXXXX`).
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] p-6 rounded-xl space-y-3">
            <div className="text-xs font-bold text-[#1E3A5F] bg-[#F1F5F9] px-2.5 py-1 rounded inline-block">
              03 — Verify
            </div>
            <h4 className="text-sm font-bold text-[#0F172A]">Public Validation</h4>
            <p className="text-xs text-[#475569] leading-relaxed">
              Anyone can enter the ID or scan the QR code to view the official record on the platform.
            </p>
          </div>
        </div>
      </section>

      {/* 4. VERIFICATION SEARCH WIDGET SECTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#1E3A5F] text-white rounded-2xl p-8 sm:p-10 space-y-6 shadow-md text-center">
          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-white">Verify a credential</h2>
            <p className="text-xs text-slate-300">
              Enter a certificate or student registration ID to view its official record in our database.
            </p>
          </div>

          <form onSubmit={handleVerifySearch} className="max-w-xl mx-auto flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchOutwardNo}
                onChange={(e) => setSearchOutwardNo(e.target.value)}
                placeholder="Enter a certificate or registration ID"
                className="w-full bg-white text-[#0F172A] placeholder-slate-400 rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#B08D57] font-mono"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-[#B08D57] hover:bg-[#997948] text-white font-semibold text-xs uppercase tracking-wider rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              Verify
            </button>
          </form>

        </div>
      </section>

      {/* 5. COURSES DISCOVERY SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs uppercase font-semibold tracking-wider text-[#B08D57]">Curriculum</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A]">Explore Courses</h2>
          </div>
          <Link
            href="/courses"
            className="text-xs font-semibold text-[#1E3A5F] hover:text-[#162F4D] flex items-center space-x-1"
          >
            <span>View All Courses</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.map((course) => {
            const isEnrolled = currentUser
              ? enrollments.some((e) => e.studentId === currentUser.id && e.courseId === course.id)
              : false;

            return (
              <div
                key={course.id}
                className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden hover:border-slate-300 transition-all flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="relative h-44 w-full bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-0.5 bg-white/90 backdrop-blur-sm rounded text-[10px] uppercase font-bold tracking-wider text-[#1E3A5F] border border-[#E2E8F0]">
                      {course.category}
                    </div>
                  </div>

                  <div className="p-5 space-y-2.5">
                    <h3 className="text-base font-bold text-[#0F172A] line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>

                    <div className="pt-2 flex items-center justify-between text-xs text-[#475569] border-t border-[#E2E8F0]">
                      <span>Instructor: <strong className="text-[#0F172A]">{course.instructorName}</strong></span>
                      <span>{course.duration}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/courses/${course.id}`}
                      className="flex-1 py-2 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0F172A] font-semibold text-xs text-center border border-[#E2E8F0] transition-colors"
                    >
                      View Course
                    </Link>

                    {isEnrolled ? (
                      <span className="px-3 py-2 rounded-lg bg-emerald-50 text-[#15803D] border border-emerald-200 text-xs font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Enrolled</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleEnrollClick(course.id)}
                        className="px-4 py-2 rounded-lg bg-[#1E3A5F] hover:bg-[#162F4D] text-white font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Enroll Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
