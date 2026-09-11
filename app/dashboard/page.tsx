'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store/useStore';
import { supabaseService } from '@/lib/services/supabaseService';
import { CertificateCard } from '@/components/certificate-card';
import { RegistrationCardComponent } from '@/components/registration-card-component';
import { Certificate, RegistrationCard } from '@/lib/types';
import {
  GraduationCap,
  BookOpen,
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  Upload,
  ArrowRight,
  ShieldCheck,
  X,
  CreditCard,
  QrCode
} from 'lucide-react';

export default function StudentDashboardPage() {
  const {
    currentUser,
    enrollments,
    courses,
    submissions,
    assignments,
    certificates,
    registrationCards,
    getRegistrationByStudentId,
    issueRegistrationCard,
    completeEnrollment
  } = useStore();

  const [mounted, setMounted] = useState(false);
  const [selectedCertForModal, setSelectedCertForModal] = useState<Certificate | null>(null);
  const [selectedRegCardForModal, setSelectedRegCardForModal] = useState<RegistrationCard | null>(null);

  useEffect(() => {
    let active = true;
    const hydrateDashboard = async () => {
      if (!currentUser) {
        if (active) setMounted(true);
        return;
      }
      const [profiles, dbCourses, dbEnrollments, dbCertificates, dbRegistrations] = await Promise.all([
        supabaseService.fetchProfiles(),
        supabaseService.fetchCourses(),
        supabaseService.fetchEnrollments(),
        supabaseService.fetchCertificates(),
        supabaseService.fetchRegistrations(),
      ]);
      if (active) {
        const profile = profiles.find((item) => item.id === currentUser.id);
        useStore.setState({
          allUsers: profiles,
          courses: dbCourses,
          enrollments: dbEnrollments,
          certificates: dbCertificates,
          registrationCards: dbRegistrations,
          assignments: [],
          submissions: [],
          currentUser: profile || null,
        });
      }
      if (active) setMounted(true);
    };
    hydrateDashboard();
    return () => { active = false; };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!mounted || !currentUser || currentUser.role !== 'student') return;
    const hasRegistrationCard = registrationCards.some((card) => card.studentId === currentUser.id);
    if (!hasRegistrationCard) {
      issueRegistrationCard(currentUser.id, currentUser.fullName, currentUser.email);
    }
  }, [mounted, currentUser, registrationCards, issueRegistrationCard]);

  if (!mounted) return null;

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-20 px-4 text-center">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white">Student Dashboard Access</h2>
            <p className="text-sm text-slate-400 mt-2">
              Please sign in or register for a student account to view your enrolled courses, assignments, certificates, and official registration card.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition-all text-center"
            >
              Sign In to Account
            </Link>
            <Link
              href="/register"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-extrabold text-sm transition-all text-center shadow-lg"
            >
              Create New Registration
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Student specific data
  const myEnrollments = enrollments.filter((e) => e.studentId === currentUser.id);
  const activeEnrollments = myEnrollments.filter((enrollment) => {
    const course = courses.find((item) => item.id === enrollment.courseId);
    return course?.status === 'upcoming' || course?.status === 'ongoing';
  });
  const mySubmissions = submissions.filter((s) => s.studentId === currentUser.id);
  const myCertificates = certificates.filter((c) => c.studentId === currentUser.id);

  const myRegCard = getRegistrationByStudentId(currentUser.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-2xl">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{currentUser.fullName}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] uppercase font-bold tracking-wider">
                Student Account
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">{currentUser.email}</p>
          </div>
        </div>

        {/* Quick Stats Pill */}
        <div className="flex items-center gap-4 bg-slate-950/80 p-3 px-5 rounded-2xl border border-slate-800">
          <div className="text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Reg Card</p>
            <p className="text-sm font-mono font-extrabold text-amber-400">{myRegCard?.registrationNo || 'Active'}</p>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Enrolled</p>
            <p className="text-xl font-extrabold text-white">{myEnrollments.length}</p>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Certificates</p>
            <p className="text-xl font-extrabold text-emerald-400">{myCertificates.length}</p>
          </div>
        </div>
      </div>

      {/* MY STUDENT REGISTRATION CARD BANNER */}
      {myRegCard && (
        <section className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-2 border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400">Verifiable Student ID</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">Student Registration Card</h2>
            <p className="text-xs text-slate-400 max-w-xl">
              Registration Outward No: <strong className="font-mono text-amber-400 font-bold text-sm">{myRegCard.registrationNo}</strong>. Your registration card contains your verified student ID and embedded QR code.
            </p>
          </div>

          <div className="flex items-center space-x-3 w-full md:w-auto">
            <button
              onClick={() => setSelectedRegCardForModal(myRegCard)}
              className="flex-1 md:flex-none px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center space-x-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>View & Download Card</span>
            </button>

            <Link
              href={`/verify/${myRegCard.registrationNo}`}
              className="flex-1 md:flex-none px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs border border-slate-700 transition-all flex items-center justify-center space-x-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verify Online</span>
            </Link>
          </div>
        </section>
      )}

      {/* MY ENROLLED COURSES SECTION */}
      <section id="my-courses" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span>My Courses ({myEnrollments.length})</span>
          </h2>
        </div>

        {myEnrollments.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
            <p className="text-slate-400 text-sm">You are not enrolled in an upcoming or ongoing course.</p>
            <Link href="/courses" className="inline-block px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs">
              Explore Course Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myEnrollments.map((enrollment) => {
              const course = courses.find((item) => item.id === enrollment.courseId);
              if (!course) return null;
              const isEnrolled = true;
              const cert = myCertificates.find((c) => c.courseId === course.id);
              const isCompleted = enrollment?.status === 'completed' || Boolean(cert);

              return (
                <div
                  key={course.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-slate-950 text-amber-300 border border-amber-500/20">
                        {course.category}
                      </span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${course.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : course.status === 'ongoing'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                        {course.status === 'ongoing' ? 'Ongoing' : course.status === 'completed' ? 'Completed' : 'Upcoming'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white">{course.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{course.description}</p>
                    <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs">
                      <span className="font-bold text-emerald-300">
                        {course.registrationFee && course.registrationFee > 0
                          ? `₹${course.registrationFee.toFixed(2)}`
                          : 'Free (₹0)'}
                      </span>
                      <span className="text-slate-400">
                        {course.startDate
                          ? `Starts ${new Date(`${course.startDate}T00:00:00`).toLocaleDateString()}`
                          : 'Start date TBD'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <Link
                      href={`/courses/${course.id}`}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
                    >
                      View Curriculum
                    </Link>

                    {!isEnrolled ? (
                      <Link href={`/courses/${course.id}`} className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all">
                        View & Enroll
                      </Link>
                    ) : cert ? (
                      <button
                        onClick={() => setSelectedCertForModal(cert)}
                        className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center space-x-1.5"
                      >
                        <Award className="w-4 h-4" />
                        <span>Download Certificate</span>
                      </button>
                    ) : (
                      <span className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-semibold border border-slate-700">
                        Awaiting instructor approval
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ISSUED CERTIFICATES GALLERY */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-400" />
            <span>My Issued Credentials ({myCertificates.length})</span>
          </h2>
        </div>

        {myCertificates.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center text-slate-400 text-sm">
            No certificates issued yet. Complete a course to earn your verified credential!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myCertificates.map((cert) => (
              <div
                key={cert.id}
                className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-amber-500/30 rounded-3xl p-6 space-y-4 shadow-2xl relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Outward Number</span>
                    <p className="text-lg font-mono font-extrabold text-white">{cert.outwardNo}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <Award className="w-6 h-6" />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white line-clamp-1">{cert.courseName}</h4>
                  <p className="text-xs text-slate-400">Issued: {new Date(cert.issueDate).toLocaleDateString()}</p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedCertForModal(cert)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center space-x-1.5"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>View & Download</span>
                  </button>

                  <Link
                    href={`/verify/${cert.outwardNo}`}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold border border-slate-700 transition-all flex items-center space-x-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Public Verify</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MY SUBMISSIONS HISTORY */}
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
          <Upload className="w-5 h-5 text-amber-400" />
          <span>My Assignment Submissions ({mySubmissions.length})</span>
        </h2>

        {mySubmissions.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center text-slate-400 text-sm">
            You haven&apos;t submitted any assignments yet.
          </div>
        ) : (
          <div className="space-y-3">
            {mySubmissions.map((sub) => {
              const asg = assignments.find((a) => a.id === sub.assignmentId);

              return (
                <div
                  key={sub.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white">{asg?.title || 'Assignment'}</h4>
                    <p className="text-xs text-slate-400 line-clamp-1">{sub.submissionText}</p>
                    <p className="text-[11px] text-slate-500">Submitted: {new Date(sub.submittedAt).toLocaleString()}</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase border ${sub.status === 'graded'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}>
                        {sub.status}
                      </span>
                      {sub.grade !== undefined && (
                        <p className="text-xs text-slate-300 mt-1">Score: <strong className="text-amber-400">{sub.grade} pts</strong></p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Full Certificate Modal */}
      {selectedCertForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto my-8">
            <button
              onClick={() => setSelectedCertForModal(null)}
              className="fixed top-6 right-6 z-50 p-3 bg-slate-900 text-white rounded-full border border-slate-700 shadow-2xl hover:bg-slate-800"
            >
              <X className="w-6 h-6" />
            </button>
            <CertificateCard certificate={selectedCertForModal} triggerConfettiOnLoad={true} />
          </div>
        </div>
      )}

      {/* Full Registration Card Modal */}
      {selectedRegCardForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto my-8">
            <button
              onClick={() => setSelectedRegCardForModal(null)}
              className="fixed top-6 right-6 z-50 p-3 bg-slate-900 text-white rounded-full border border-slate-700 shadow-2xl hover:bg-slate-800"
            >
              <X className="w-6 h-6" />
            </button>
            <RegistrationCardComponent registrationCard={selectedRegCardForModal} />
          </div>
        </div>
      )}

    </div>
  );
}
