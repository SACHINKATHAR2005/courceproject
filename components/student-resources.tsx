'use client';

import { useEffect, useState } from 'react';
import {
  BookOpen,
  Download,
  FileText,
  ClipboardList,
  Loader2,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  ExternalLink,
} from 'lucide-react';
import type { Assignment, Course, Enrollment } from '@/lib/types';
import { useStore } from '@/lib/store/useStore';
import { AssignmentModal } from '@/components/assignment-modal';

type ResourceAssignment = Assignment & {
  courseTitle: string;
  material?: { file_name: string; url: string };
};
type Note = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  file_name?: string;
  url?: string | null;
  courseTitle: string;
};

export function StudentResources({
  courses,
  enrollments,
  assignments,
}: {
  courses: Course[];
  enrollments: Enrollment[];
  assignments: Assignment[];
}) {
  const { currentUser, submissions } = useStore();
  const [activeTab, setActiveTab] = useState<'assignments' | 'notes'>('assignments');
  const [assignmentResources, setAssignmentResources] = useState<ResourceAssignment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  useEffect(() => {
    let active = true;
    const enrolledCourseIds = new Set(enrollments.map((enrollment) => enrollment.courseId));
    const enrolledAssignments = assignments
      .filter((assignment) => enrolledCourseIds.has(assignment.courseId))
      .map((assignment) => ({
        ...assignment,
        courseTitle: courses.find((course) => course.id === assignment.courseId)?.title || 'Course',
      }));

    const loadResources = async () => {
      const assignmentResults = await Promise.all(
        enrolledAssignments.map(async (assignment) => {
          try {
            const response = await fetch(`/api/assignments/${assignment.id}/material`);
            const result = await response.json();
            return response.ok && result.material
              ? { ...assignment, material: result.material }
              : assignment;
          } catch {
            return assignment;
          }
        })
      );

      const noteResults = await Promise.all(
        [...enrolledCourseIds].map(async (courseId) => {
          try {
            const response = await fetch(`/api/courses/${courseId}/notes`);
            const result = await response.json();
            if (!response.ok) return [];
            return (result.notes || []).map((note: Omit<Note, 'courseTitle'>) => ({
              ...note,
              courseTitle: courses.find((course) => course.id === courseId)?.title || 'Course',
            }));
          } catch {
            return [];
          }
        })
      );

      if (active) {
        setAssignmentResources(assignmentResults);
        setNotes(noteResults.flat());
        setLoading(false);
      }
    };

    void loadResources();
    return () => {
      active = false;
    };
  }, [assignments, courses, enrollments]);

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-950">
            <BookOpen className="h-5 w-5 text-emerald-700" />
            Learning Resources
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Assignments, project deadlines, and notes shared with your enrolled courses.
          </p>
        </div>
        <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('assignments')}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'assignments'
                ? 'bg-white text-[#18375f] shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ClipboardList className="mr-1 inline h-3.5 w-3.5" />
            Assignments ({assignmentResources.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'notes'
                ? 'bg-white text-[#18375f] shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <BookOpen className="mr-1 inline h-3.5 w-3.5" />
            Notes ({notes.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-emerald-700" />
          Loading course materials...
        </div>
      ) : activeTab === 'assignments' ? (
        assignmentResources.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No assignments have been shared with your enrolled courses yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {assignmentResources.map((assignment) => {
              const submission = currentUser
                ? submissions.find(
                    (s) => s.assignmentId === assignment.id && s.studentId === currentUser.id
                  )
                : undefined;

              const isGraded = submission?.status === 'graded';
              const isResubmitRequired = submission?.status === 'resubmit_required';
              const isSubmitted = submission?.status === 'submitted';

              return (
                <article
                  key={assignment.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                          {assignment.courseTitle}
                        </p>
                        <h3 className="mt-1 text-base font-bold text-slate-950">{assignment.title}</h3>
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {isGraded ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Graded: {submission.grade ?? 0}/{assignment.maxScore || 100}
                          </span>
                        ) : isResubmitRequired ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Resubmission Needed
                          </span>
                        ) : isSubmitted ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-indigo-300 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                            <Clock className="h-3.5 w-3.5" />
                            Under Review
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
                            Pending Submission
                          </span>
                        )}

                        {assignment.pdfRequired && (
                          <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                            PDF Mandatory
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-sm leading-6 text-slate-600 line-clamp-3">
                      {assignment.description}
                    </p>

                    {/* Resubmission feedback alert */}
                    {isResubmitRequired && submission?.feedback && (
                      <div className="rounded-xl border border-red-200 bg-red-50/70 p-3 text-xs text-red-900 space-y-1">
                        <p className="font-bold flex items-center gap-1 text-red-800">
                          <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                          Instructor Feedback / Changes Required:
                        </p>
                        <p className="italic pl-4 text-red-800">&ldquo;{submission.feedback}&rdquo;</p>
                      </div>
                    )}

                    {/* Graded feedback alert */}
                    {isGraded && submission?.feedback && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 space-y-1">
                        <p className="font-bold flex items-center gap-1 text-emerald-800">
                          <Award className="h-3.5 w-3.5 text-emerald-600" />
                          Instructor Feedback:
                        </p>
                        <p className="italic pl-4 text-emerald-800">&ldquo;{submission.feedback}&rdquo;</p>
                      </div>
                    )}
                  </div>

                  {/* Footer actions */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="text-slate-500 font-medium">
                      Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'TBD'}
                    </span>

                    <div className="flex items-center gap-2">
                      {assignment.material && (
                        <a
                          href={assignment.material.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Instructions PDF
                        </a>
                      )}

                      {/* Primary Submission CTA Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedAssignment(assignment)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-bold transition-all shadow-sm ${
                          isResubmitRequired
                            ? 'bg-red-600 hover:bg-red-500 text-white'
                            : isSubmitted
                            ? 'bg-slate-800 hover:bg-slate-700 text-white'
                            : isGraded
                            ? 'border border-emerald-300 bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        }`}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>
                          {isResubmitRequired
                            ? 'Resubmit Work'
                            : isSubmitted
                            ? 'Update Submission'
                            : isGraded
                            ? 'View Submission'
                            : 'Submit Assignment'}
                        </span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : notes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No notes have been shared with your enrolled courses yet.
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <article key={note.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                {note.courseTitle}
              </p>
              <h3 className="mt-1 flex items-center gap-2 text-base font-bold text-slate-950">
                <FileText className="h-4 w-4 text-amber-600" />
                {note.title}
              </h3>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{note.content}</p>
              {note.url && (
                <a
                  href={note.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-[#18375f] hover:bg-slate-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download attachment
                </a>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Assignment Submission Modal */}
      {selectedAssignment && (
        <AssignmentModal
          assignment={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
        />
      )}
    </section>
  );
}
