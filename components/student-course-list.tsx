'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Clock3, CheckCircle2 } from 'lucide-react';
import type { Course, Enrollment, AssignmentSubmission, Assignment } from '@/lib/types';

function formatCourseStartDate(value?: string) {
  if (!value) return 'Start date TBD';
  const clean = value.includes('T') ? value : `${value}T00:00:00`;
  const parsed = new Date(clean);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

export function StudentCourseList({
  courses,
  enrollments,
  assignments,
  submissions,
}: {
  courses: Course[];
  enrollments: Enrollment[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
}) {
  if (enrollments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <BookOpen className="mx-auto h-8 w-8 text-slate-400" />
        <h2 className="mt-4 text-lg font-semibold text-slate-950">Start your learning journey</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
          You aren&apos;t enrolled in a course yet. Explore available courses and find something to learn.
        </p>
        <Link
          href="/courses"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#18375f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#102a4a]"
        >
          Explore Courses
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {enrollments.map((enrollment) => {
        const course = courses.find((item) => item.id === enrollment.courseId);
        if (!course) return null;

        const courseAssignments: Assignment[] = assignments.filter((item) => item.courseId === course.id);

        // Filter submissions for this student and this course
        const studentSubmissions = submissions.filter(
          (item) => item.studentId === enrollment.studentId && courseAssignments.some((assignment) => assignment.id === item.assignmentId)
        );
        const submittedCount = studentSubmissions.length;

        // Target assignments: use course.totalAssignments if defined (>0), otherwise fall back to courseAssignments count
        const targetCount = course.totalAssignments && course.totalAssignments > 0
          ? course.totalAssignments
          : Math.max(courseAssignments.length, 1);

        const rawProgress = Math.round((submittedCount / targetCount) * 100);
        // User rule: if progress reaches >= 95%, count as 100% completed
        const isCompleted = enrollment.status === 'completed' || rawProgress >= 95;
        const progress = isCompleted ? 100 : Math.min(rawProgress, 100);

        return (
          <article
            key={enrollment.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                    {course.category}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-slate-950">{course.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">Instructor: {course.instructorName}</p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                    isCompleted
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isCompleted ? 'Completed' : course.status || 'ongoing'}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">
                    Progress ({submittedCount}/{targetCount} {targetCount === 1 ? 'assignment' : 'assignments'})
                  </span>
                  <span className={`font-bold ${isCompleted ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {progress}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCompleted ? 'bg-emerald-600' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock3 className="h-3.5 w-3.5" />
                Starts {formatCourseStartDate(course.startDate)}
              </span>
              <div className="flex items-center gap-2">
                {isCompleted && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Complete
                  </span>
                )}
                <Link
                  href={`/courses/${course.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#18375f] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#102a4a] transition-colors"
                >
                  Continue learning
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
