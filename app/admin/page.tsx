'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store/useStore';
import { supabaseService } from '@/lib/services/supabaseService';
import { CertificateCard } from '@/components/certificate-card';
import { Certificate, Payment, UserProfile, UserRole } from '@/lib/types';
import {
  Shield,
  Users,
  BookOpen,
  GraduationCap,
  Award,
  UserCheck,
  Trash2,
  ShieldAlert,
  ExternalLink,
  CheckCircle2,
  Search,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  X,
  Plus
} from 'lucide-react';

import { AuthAccessGate } from '../../components/auth-access-gate';

export default function AdminDashboardPage() {
  return (
    <AuthAccessGate requiredRole="admin">
      <AdminDashboardContent />
    </AuthAccessGate>
  );
}

function AdminDashboardContent() {
  const {
    currentUser,
    allUsers,
    courses,
    enrollments,
    assignments,
    submissions,
    certificates,
    deleteCourse,
    updateUserRole,
    revokeCertificate
  } = useStore();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'instructors' | 'courses' | 'students' | 'certificates' | 'payments'>('instructors');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCertForModal, setSelectedCertForModal] = useState<Certificate | null>(null);

  useEffect(() => {
    setMounted(true);
    // Hydrate store from Supabase (store starts empty — no mock data)
    useStore.getState().hydrateFromSupabase();
    supabaseService.fetchPayments().then(setPayments);
  }, []);

  if (!mounted) return null;

  // Filter users by role
  const instructors = allUsers.filter((u) => u.role === 'instructor');
  const students = allUsers.filter((u) => u.role === 'student');

  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center font-bold text-2xl">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{currentUser.fullName}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] uppercase font-bold tracking-wider">
                Admin Control Center
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Master authority view for running instructors, courses, students, and certificates.</p>
          </div>
        </div>

        {/* Action Tabs */}
        <div className="flex flex-wrap gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('instructors')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'instructors'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            Instructors ({instructors.length})
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'courses'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            Courses ({courses.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'students'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            Students ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'certificates'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
              }`}
          >
            Certificates Audit ({certificates.length})
          </button>
          <button type="button" onClick={() => setActiveTab('payments')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'payments' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}>
            Payments ({payments.filter((payment) => payment.status === 'paid').length})
          </button>
        </div>
      </div>

      {/* TELEMETRY STATS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-indigo-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Instructors</span>
            <UserCheck className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-white">{instructors.length}</p>
          <p className="text-[11px] text-slate-400">Active Educators</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Courses</span>
            <BookOpen className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-white">{courses.length}</p>
          <p className="text-[11px] text-slate-400">Running Curriculum</p>
        </div>

        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Students</span>
            <GraduationCap className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-white">{students.length}</p>
          <p className="text-[11px] text-slate-400">Enrolled Learners</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-teal-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Enrollments</span>
            <Users className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-white">{enrollments.length}</p>
          <p className="text-[11px] text-slate-400">Active Subscriptions</p>
        </div>

        <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-4 space-y-1 shadow-lg col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Certificates</span>
            <Award className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-amber-300">{certificates.length}</p>
          <p className="text-[11px] text-slate-400">Verified Outwards</p>
        </div>
      </div>

      {/* TAB 1: INSTRUCTORS MANAGEMENT */}
      {activeTab === 'instructors' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                <span>Running Instructors & Their Courses</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">Detailed breakdown of active instructors and courses assigned under their management.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {instructors.map((inst) => {
              const instCourses = courses.filter(
                (c) => c.instructorId === inst.id || c.instructorName.toLowerCase() === inst.fullName.toLowerCase()
              );
              const totalStudentsTaught = instCourses.reduce(
                (acc, c) => acc + enrollments.filter((e) => e.courseId === c.id).length,
                0
              );

              return (
                <div
                  key={inst.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
                          {inst.fullName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white">{inst.fullName}</h3>
                          <p className="text-xs text-slate-400">{inst.email}</p>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase">
                        Instructor
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Running Courses</p>
                        <p className="text-base font-extrabold text-white">{instCourses.length}</p>
                      </div>
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Total Students Taught</p>
                        <p className="text-base font-extrabold text-emerald-400">{totalStudentsTaught}</p>
                      </div>
                    </div>

                    {/* Courses List */}
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Courses Managed:</p>
                      {instCourses.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No courses currently published.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {instCourses.map((c) => {
                            const cEnrolled = enrollments.filter((e) => e.courseId === c.id).length;
                            return (
                              <div
                                key={c.id}
                                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs"
                              >
                                <span className="font-semibold text-slate-200 truncate max-w-[200px]">{c.title}</span>
                                <span className="text-[11px] text-amber-400 font-bold">{cEnrolled} enrolled</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: COURSES MANAGEMENT */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span>Master Course Registry ({courses.length})</span>
            </h2>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider">
                    <th className="p-4">Course Details</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Instructor</th>
                    <th className="p-4 text-center">Enrolled Students</th>
                    <th className="p-4 text-center">Assignments</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {courses.map((c) => {
                    const enrolledCount = enrollments.filter((e) => e.courseId === c.id).length;
                    const asgCount = assignments.filter((a) => a.courseId === c.id).length;

                    return (
                      <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-white text-sm">{c.title}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{c.description}</p>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-md bg-slate-950 text-amber-300 border border-amber-500/20 font-bold text-[10px]">
                            {c.category}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-slate-200">
                          {c.instructorName}
                        </td>
                        <td className="p-4 text-center font-bold text-emerald-400">
                          {enrolledCount}
                        </td>
                        <td className="p-4 text-center font-bold text-indigo-400">
                          {asgCount}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <Link
                            href={`/courses/${c.id}`}
                            className="inline-flex items-center p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete course: ${c.title}?`)) {
                                deleteCourse(c.id);
                              }
                            }}
                            className="inline-flex items-center p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STUDENTS ROSTER */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
              <GraduationCap className="w-5 h-5 text-emerald-400" />
              <span>Registered Student Roster ({students.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {students.map((st) => {
              const stEnrollments = enrollments.filter((e) => e.studentId === st.id);
              const stSubmissions = submissions.filter((s) => s.studentId === st.id);
              const stCerts = certificates.filter((c) => c.studentId === st.id);

              return (
                <div
                  key={st.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                          {st.fullName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white">{st.fullName}</h3>
                          <p className="text-xs text-slate-400">{st.email}</p>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase">
                        Student
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center text-xs">
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Enrolled</p>
                        <p className="text-base font-extrabold text-white">{stEnrollments.length}</p>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Submitted</p>
                        <p className="text-base font-extrabold text-indigo-400">{stSubmissions.length}</p>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <p className="text-[10px] text-slate-500 uppercase font-bold">Certificates</p>
                        <p className="text-base font-extrabold text-amber-400">{stCerts.length}</p>
                      </div>
                    </div>
                  </div>

                  {/* Promote User Role Action */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-400 font-semibold">Role Action:</span>
                    <button
                      onClick={() => {
                        updateUserRole(st.id, 'instructor');
                        alert(`${st.fullName} promoted to Instructor!`);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all flex items-center space-x-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Promote to Instructor</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: ISSUED CERTIFICATES AUDIT */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <h2 className="text-xl font-extrabold text-white">Payment Ledger ({payments.length})</h2>
          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-slate-950 text-slate-400 uppercase">
                <tr><th className="p-4">Student</th><th className="p-4">Course</th><th className="p-4">Amount</th><th className="p-4">Status</th><th className="p-4">Date</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {payments.map((payment) => {
                  const student = allUsers.find((user) => user.id === payment.studentId);
                  const course = courses.find((item) => item.id === payment.courseId);
                  return <tr key={payment.id}>
                    <td className="p-4 font-semibold text-white">{student?.fullName || payment.studentId}</td>
                    <td className="p-4">{course?.title || payment.courseId}</td>
                    <td className="p-4 font-bold text-emerald-300">₹{(payment.amountPaise / 100).toFixed(2)}</td>
                    <td className="p-4 uppercase">{payment.status}</td>
                    <td className="p-4 text-slate-400">{new Date(payment.createdAt).toLocaleString()}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ISSUED CERTIFICATES AUDIT */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Master Outward Certificate Audit Log ({certificates.length})</span>
            </h2>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider">
                    <th className="p-4">Outward Number</th>
                    <th className="p-4">Recipient Student</th>
                    <th className="p-4">Course Name</th>
                    <th className="p-4">Issuing Instructor</th>
                    <th className="p-4">Issue Date</th>
                    <th className="p-4 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {certificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-mono font-extrabold text-amber-400">
                        {cert.outwardNo}
                      </td>
                      <td className="p-4 font-bold text-white">
                        {cert.studentName}
                      </td>
                      <td className="p-4 text-slate-200">
                        {cert.courseName}
                      </td>
                      <td className="p-4 text-indigo-300 font-medium">
                        {cert.instructorName}
                      </td>
                      <td className="p-4 text-slate-400">
                        {new Date(cert.issueDate).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] border ${cert.status === 'REVOKED'
                          ? 'bg-red-500/20 text-red-300 border-red-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          }`}>
                          {cert.status || 'VALID'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => setSelectedCertForModal(cert)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all"
                        >
                          View Card
                        </button>
                        {cert.status !== 'REVOKED' && (
                          <button
                            onClick={() => {
                              if (confirm(`Revoke certificate ${cert.outwardNo}?`)) {
                                revokeCertificate(cert.id);
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs border border-red-500/30 transition-all"
                          >
                            Revoke
                          </button>
                        )}
                        <Link
                          href={`/verify/${cert.outwardNo}`}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all inline-flex items-center space-x-1"
                        >
                          <span>Public URL</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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
            <CertificateCard certificate={selectedCertForModal} triggerConfettiOnLoad={false} />
          </div>
        </div>
      )}

    </div>
  );
}
