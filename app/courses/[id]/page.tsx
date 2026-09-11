'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store/useStore';
import { supabaseService } from '@/lib/services/supabaseService';
import { enrollInCourse as enrollWithPayment } from '@/lib/services/paymentService';
import { AssignmentModal } from '@/components/assignment-modal';
import { Assignment } from '@/lib/types';
import {
  CheckCircle2,
  Clock,
  UserCheck,
  FileText,
  Upload,
  Award,
  ArrowLeft,
  CalendarDays,
} from 'lucide-react';
import Link from 'next/link';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const { courses, currentUser, enrollments, assignments, submissions, certificates } = useStore();

  const [activeAssignmentForSubmission, setActiveAssignmentForSubmission] = useState<Assignment | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState('');

  // Fetch courses from Supabase if store is empty (e.g. direct URL navigation)
  useEffect(() => {
    if (courses.length === 0) {
      supabaseService.fetchCourses().then((dbCourses) => {
        if (dbCourses.length > 0) useStore.setState({ courses: dbCourses });
      });
    }
  }, []);

  const course = courses.find((c) => c.id === courseId);
  const isEnrolled = currentUser
    ? enrollments.some((e) => e.studentId === currentUser.id && e.courseId === courseId)
    : false;
  const enrollment = currentUser
    ? enrollments.find((e) => e.studentId === currentUser.id && e.courseId === courseId)
    : undefined;

  const courseAssignments = assignments.filter((a) => a.courseId === courseId);
  const issuedCert = currentUser
    ? certificates.find((c) => c.studentId === currentUser.id && c.courseId === courseId)
    : undefined;

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Course Not Found</h2>
        <p className="text-sm text-slate-400">The requested course ID does not exist.</p>
        <Link href="/courses" className="text-amber-400 hover:underline font-bold text-sm">
          Return to Course Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Back button */}
      <Link
        href="/courses"
        className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Directory</span>
      </Link>

      {/* Course Banner Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="relative h-64 sm:h-80 w-full bg-slate-950">
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/60 to-transparent" />

          <div className="absolute bottom-6 left-6 right-6 space-y-3">
            <div className="inline-block px-3 py-1 bg-amber-500/20 border border-amber-500/30 rounded-full text-xs font-extrabold text-amber-300 uppercase tracking-widest">
              {course.category}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
              {course.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center space-x-1.5">
                <UserCheck className="w-4 h-4 text-amber-400" />
                <span>Instructor: <strong>{course.instructorName}</strong></span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Duration: <strong>{course.duration}</strong></span>
              </span>
              <span className="flex items-center space-x-1.5">
                <CalendarDays className="w-4 h-4 text-amber-400" />
                <span>Starts: <strong>{course.startDate ? new Date(`${course.startDate}T00:00:00`).toLocaleDateString() : 'Date TBD'}</strong></span>
              </span>
              <span className="font-bold text-emerald-300">
                {course.registrationFee ? `Fee: ₹${course.registrationFee.toFixed(2)}` : 'Free enrollment'}
              </span>
            </div>
          </div>
        </div>

        {/* Action strip */}
        <div className="p-6 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs text-slate-400">Enrollment Status:</p>
            <p className="text-sm font-bold text-white capitalize">
              {isEnrolled ? (
                <span className="text-emerald-400 flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Enrolled ({enrollment?.status})</span>
                </span>
              ) : (
                'Not Enrolled'
              )}
            </p>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {!isEnrolled ? (
              <button
                onClick={async () => {
                  if (!currentUser) {
                    router.push('/register');
                  } else {
                    setEnrolling(true);
                    setEnrollmentError('');
                    try {
                      await enrollWithPayment(course.id, course.registrationFee || 0, { fullName: currentUser.fullName, email: currentUser.email, phone: currentUser.phone });
                      router.push('/dashboard');
                    } catch (error) {
                      setEnrollmentError(error instanceof Error ? error.message : 'Enrollment failed.');
                    } finally {
                      setEnrolling(false);
                    }
                  }
                }}
                disabled={enrolling}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                {enrolling ? 'Processing...' : 'Enroll in Course'}
              </button>
            ) : issuedCert ? (
              <Link
                href={`/verify/${issuedCert.outwardNo}`}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center space-x-2"
              >
                <Award className="w-4 h-4" />
                <span>View Certificate ({issuedCert.outwardNo})</span>
              </Link>
            ) : (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all text-center"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
          {enrollmentError && <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-300">{enrollmentError}</p>}
        </div>
      </div>

      {/* Overview & Description */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 className="text-lg font-bold text-white">Course Overview</h3>
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
          {course.description}
        </p>
      </div>

      {/* Course Assignments List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <span>Course Assignments ({courseAssignments.length})</span>
          </h3>
        </div>

        {courseAssignments.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-sm">
            No assignments published yet for this course.
          </div>
        ) : (
          <div className="space-y-4">
            {courseAssignments.map((asg) => {
              const sub = currentUser
                ? submissions.find((s) => s.assignmentId === asg.id && s.studentId === currentUser.id)
                : undefined;

              return (
                <div
                  key={asg.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-slate-700 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-bold text-white">{asg.title}</h4>
                      <p className="text-xs text-slate-400 mt-1">{asg.description}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20">
                        Max Score: {asg.maxScore} pts
                      </span>
                    </div>
                  </div>

                  {/* Submission Status & Action */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      {sub ? (
                        <div className="text-xs space-y-0.5">
                          <p className="font-semibold text-emerald-400 flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Submitted ({sub.status})</span>
                          </p>
                          {sub.grade !== undefined && (
                            <p className="text-slate-300">Grade: <strong className="text-indigo-400">{sub.grade} / {asg.maxScore}</strong></p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">Not submitted yet</p>
                      )}
                    </div>

                    {isEnrolled && (
                      <button
                        onClick={() => setActiveAssignmentForSubmission(asg)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all flex items-center space-x-1.5"
                      >
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>{sub ? 'Edit Submission' : 'Submit Assignment'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submission Modal */}
      {activeAssignmentForSubmission && (
        <AssignmentModal
          assignment={activeAssignmentForSubmission}
          onClose={() => setActiveAssignmentForSubmission(null)}
        />
      )}
    </div>
  );
}
