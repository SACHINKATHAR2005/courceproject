'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store/useStore';
import { GradingModal } from '@/components/grading-modal';
import { Assignment, AssignmentSubmission, Course } from '@/lib/types';
import {
  LayoutDashboard,
  PlusCircle,
  BookOpen,
  FileText,
  CheckCircle2,
  Award,
  UserCheck,
  Clock,
  AwardIcon,
  ShieldAlert
} from 'lucide-react';

import { AuthAccessGate } from '../../components/auth-access-gate';

export default function InstructorPortalPage() {
  return (
    <AuthAccessGate requiredRole="instructor">
      <InstructorPortalContent />
    </AuthAccessGate>
  );
}

function InstructorPortalContent() {
  const {
    currentUser,
    courses,
    assignments,
    submissions,
    certificates,
    addCourse,
    updateCourse,
    addAssignment,
    updateAssignment,
    issueCertificateForStudent,
    enrollments,
    allUsers
  } = useStore();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'submissions' | 'courses' | 'assignments' | 'students'>('submissions');
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmission | null>(null);

  // New Course Form State
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');
  const [newCourseCategory, setNewCourseCategory] = useState('Web Development');
  const [newCourseDuration, setNewCourseDuration] = useState('6 Weeks');
  const [newCourseFee, setNewCourseFee] = useState('0');
  const [newCourseStartDate, setNewCourseStartDate] = useState('');
  const [newCourseStatus, setNewCourseStatus] = useState<'upcoming' | 'ongoing' | 'completed'>('upcoming');

  // New Assignment Form State
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [asgTitle, setAsgTitle] = useState('');
  const [asgDesc, setAsgDesc] = useState('');
  const [asgMaxScore, setAsgMaxScore] = useState(100);
  const [asgDueDate, setAsgDueDate] = useState('');
  const [courseError, setCourseError] = useState('');
  const [assignmentError, setAssignmentError] = useState('');
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Hydrate store from Supabase (store starts empty — no mock data)
    useStore.getState().hydrateFromSupabase();
    if (courses.length > 0) {
      setSelectedCourseId(courses[0].id);
    }
  }, []);

  const myCourses = currentUser
    ? courses.filter((course) => course.instructorId === currentUser.id)
    : [];

  useEffect(() => {
    if (myCourses.length > 0 && !myCourses.some((course) => course.id === selectedCourseId)) {
      setSelectedCourseId(myCourses[0].id);
    }
  }, [myCourses, selectedCourseId]);

  if (!mounted) return null;

  // Security check: Warn if logged in as student or guest
  if (!currentUser || currentUser.role === 'student') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/40">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-white">Instructor Access Required</h2>
        <p className="text-sm text-slate-400">
          You are currently signed in as <strong className="text-emerald-400">{currentUser ? `Student (${currentUser.fullName})` : 'Guest User'}</strong>. Please sign in through the authorized staff access page to gain access to the <strong className="text-indigo-400">Instructor Portal</strong>.
        </p>
      </div >
    );
  }

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseTitle.trim() || !newCourseStartDate) return;
    setCourseError('');

    const createdCourse = await addCourse({
      title: newCourseTitle,
      description: newCourseDesc,
      category: newCourseCategory,
      duration: newCourseDuration,
      registrationFee: Number(newCourseFee) || 0,
      startDate: newCourseStartDate,
      status: newCourseStatus,
      instructorId: currentUser.id,
      instructorName: currentUser.fullName,
      thumbnailUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
    });

    if (!createdCourse) {
      setCourseError('Course could not be saved. Check your staff session and Supabase permissions.');
      return;
    }

    setNewCourseTitle('');
    setNewCourseDesc('');
    setNewCourseFee('0');
    setNewCourseStartDate('');
    setNewCourseStatus('upcoming');
    setSelectedCourseId(createdCourse.id);
    alert('New Course Created Successfully!');
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asgTitle.trim() || !asgDesc.trim() || !selectedCourseId || !asgDueDate) {
      setAssignmentError('Select a course and complete the title, instructions, and deadline.');
      return;
    }

    setAssignmentError('');
    addAssignment({
      courseId: selectedCourseId,
      title: asgTitle,
      description: asgDesc,
      maxScore: Number(asgMaxScore),
      dueDate: new Date(`${asgDueDate}T23:59:59`).toISOString(),
    }).then((result) => {
      if (!result.assignment) {
        setAssignmentError(result.error || 'Assignment could not be saved. Check your Supabase permissions.');
        return;
      }
      setAsgTitle('');
      setAsgDesc('');
      setAsgDueDate('');
      alert('Assignment Published Successfully!');
    });
  };

  const myAssignments = assignments.filter((assignment) => myCourses.some((course) => course.id === assignment.courseId));

  const startEditingAssignment = (assignment: Assignment) => {
    setEditingAssignmentId(assignment.id);
    setSelectedCourseId(assignment.courseId);
    setAsgTitle(assignment.title);
    setAsgDesc(assignment.description);
    setAsgMaxScore(assignment.maxScore);
    setAsgDueDate(assignment.dueDate ? assignment.dueDate.slice(0, 10) : '');
    setAssignmentError('');
  };

  const cancelEditingAssignment = () => {
    setEditingAssignmentId(null);
    setAsgTitle('');
    setAsgDesc('');
    setAsgMaxScore(100);
    setAsgDueDate('');
  };

  const handleSaveAssignment = async (event: React.FormEvent) => {
    event.preventDefault();
    const assignment = assignments.find((item) => item.id === editingAssignmentId);
    if (!assignment || !asgTitle.trim() || !asgDesc.trim() || !asgDueDate) {
      setAssignmentError('Complete the assignment title, instructions, and deadline.');
      return;
    }
    const result = await updateAssignment({
      ...assignment,
      title: asgTitle.trim(),
      description: asgDesc.trim(),
      maxScore: Number(asgMaxScore),
      dueDate: new Date(`${asgDueDate}T23:59:59`).toISOString(),
    });
    if (!result.ok) {
      setAssignmentError(result.error || 'Assignment could not be updated.');
      return;
    }
    cancelEditingAssignment();
  };

  const startEditingCourse = (course: Course) => {
    setEditingCourseId(course.id);
    setNewCourseTitle(course.title);
    setNewCourseDesc(course.description);
    setNewCourseCategory(course.category);
    setNewCourseDuration(course.duration);
    setNewCourseFee(String(course.registrationFee || 0));
    setNewCourseStartDate(course.startDate || '');
    setNewCourseStatus(course.status || 'upcoming');
    setCourseError('');
  };

  const cancelEditingCourse = () => {
    setEditingCourseId(null);
    setNewCourseTitle('');
    setNewCourseDesc('');
    setNewCourseFee('0');
    setNewCourseStartDate('');
  };

  const handleUpdateCourse = async (event: React.FormEvent) => {
    event.preventDefault();
    const course = courses.find((item) => item.id === editingCourseId);
    if (!course || !newCourseTitle.trim() || !newCourseStartDate) return;

    const saved = await updateCourse({
      ...course,
      title: newCourseTitle.trim(),
      description: newCourseDesc.trim(),
      category: newCourseCategory,
      duration: newCourseDuration,
      registrationFee: Number(newCourseFee) || 0,
      startDate: newCourseStartDate,
      status: newCourseStatus,
    });
    if (!saved) {
      setCourseError('Course changes could not be saved. Check your Supabase permissions.');
      return;
    }
    cancelEditingCourse();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* Header */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-6 bg-[#111936] p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-indigo-300/30 bg-indigo-400/15 text-indigo-200">
                <LayoutDashboard className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-300">Instructor workspace</p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">Welcome back, {currentUser.fullName}</h1>
                </div>
                <p className="text-xs text-slate-400 mt-1">Manage curriculum, evaluate assignment submissions, and issue credentials.</p>
              </div>
            </div>

            {/* Action Tabs */}
          </div>
          <div className="grid grid-cols-2 gap-2 border-t border-slate-200 bg-white p-3 sm:grid-cols-4 md:min-w-140 md:grid-cols-4">
            <button
              onClick={() => setActiveTab('submissions')}
              className={`rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all ${activeTab === 'submissions'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
            >
              Review Submissions ({submissions.length})
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all ${activeTab === 'courses'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
            >
              My Courses ({myCourses.length})
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all ${activeTab === 'assignments'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
            >
              Post Assignment
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`rounded-xl px-3 py-2.5 text-left text-xs font-bold transition-all ${activeTab === 'students'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
            >
              Enrolled Students ({enrollments.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">My courses</p><p className="mt-2 text-2xl font-bold text-slate-900">{myCourses.length}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Students</p><p className="mt-2 text-2xl font-bold text-slate-900">{enrollments.length}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Submissions</p><p className="mt-2 text-2xl font-bold text-slate-900">{submissions.length}</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Assignments</p><p className="mt-2 text-2xl font-bold text-slate-900">{assignments.length}</p></div>
        </div>

        {/* SUBMISSIONS QUEUE TAB */}
        {activeTab === 'submissions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span>Student Submissions Queue</span>
              </h2>
            </div>

            {submissions.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 text-sm">
                No submissions to review.
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((sub) => {
                  const asg = assignments.find((a) => a.id === sub.assignmentId);
                  const course = courses.find((c) => c.id === asg?.courseId);

                  return (
                    <div
                      key={sub.id}
                      className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-200">{sub.studentName || 'Student'}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-xs text-indigo-300 font-semibold">{course?.title}</span>
                        </div>

                        <h4 className="text-base font-bold text-white">{asg?.title || 'Assignment'}</h4>
                        <p className="text-xs text-slate-400 bg-slate-950 p-3 rounded-xl border border-slate-800">
                          {sub.submissionText}
                        </p>

                        {sub.feedback && (
                          <p className="text-xs text-emerald-400 italic">
                            Feedback: &ldquo;{sub.feedback}&rdquo;
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end space-y-3 min-w-45">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border uppercase ${sub.status === 'graded'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}>
                          {sub.status} {sub.grade !== undefined && `(${sub.grade} pts)`}
                        </span>

                        <button
                          onClick={() => setGradingSubmission(sub)}
                          className="w-full px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{sub.status === 'graded' ? 'Edit Grade' : 'Grade Submission'}</span>
                        </button>

                        {/* Issue Cert Button */}
                        {course && (
                          <button
                            onClick={() => {
                              issueCertificateForStudent(sub.studentId, course.id).then((result) => {
                                if (result.certificate) alert(`Certificate Issued! Outward No: ${result.certificate.outwardNo}`);
                                else alert(result.error);
                              });
                            }}
                            className="w-full px-4 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center justify-center space-x-1"
                          >
                            <Award className="w-3.5 h-3.5" />
                            <span>Approve & Certify</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CREATE COURSE TAB */}
        {activeTab === 'courses' && (
          <div className="space-y-6">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-indigo-400" />
                  <span>Courses Created By You ({myCourses.length})</span>
                </h2>
              </div>

              {myCourses.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 text-sm">
                  You have not created a course yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {myCourses.map((course) => (
                    <article key={course.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-bold text-indigo-300">{course.category}</p>
                          <h3 className="mt-1 text-lg font-bold text-white">{course.title}</h3>
                        </div>
                        <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold uppercase text-emerald-300">Published</span>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-400 line-clamp-3">{course.description}</p>
                      <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
                        <span>{course.duration}</span>
                        <span>{course.registrationFee ? `₹${course.registrationFee.toFixed(2)}` : 'Free'}</span>
                        <span>{course.startDate ? new Date(`${course.startDate}T00:00:00`).toLocaleDateString() : 'Date TBD'}</span>
                        <span className="capitalize">{course.status || 'upcoming'}</span>
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => startEditingCourse(course)} className="font-bold text-amber-300 hover:text-white">Edit</button>
                          <Link href={`/courses/${course.id}`} className="font-bold text-indigo-300 hover:text-white">View course</Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto shadow-2xl space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" />
                <span>{editingCourseId ? 'Edit Published Course' : 'Create New Course'}</span>
              </h2>

              <form onSubmit={editingCourseId ? handleUpdateCourse : handleCreateCourse} className="space-y-4">
                {courseError && <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{courseError}</p>}
                <div>
                  <label className="text-xs font-bold uppercase text-slate-300">Course Title *</label>
                  <input
                    type="text"
                    value={newCourseTitle}
                    onChange={(e) => setNewCourseTitle(e.target.value)}
                    placeholder="e.g. Advanced TypeScript & Clean Code Architecture"
                    required
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-300">Description *</label>
                  <textarea
                    value={newCourseDesc}
                    onChange={(e) => setNewCourseDesc(e.target.value)}
                    rows={3}
                    placeholder="Brief course overview and curriculum topics..."
                    required
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-300">Category</label>
                    <select
                      value={newCourseCategory}
                      onChange={(e) => setNewCourseCategory(e.target.value)}
                      className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-400"
                    >
                      <option value="Web Development">Web Development</option>
                      <option value="Backend & Cloud">Backend & Cloud</option>
                      <option value="UI/UX Design">UI/UX Design</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-slate-300">Duration</label>
                    <input
                      type="text"
                      value={newCourseDuration}
                      onChange={(e) => setNewCourseDuration(e.target.value)}
                      placeholder="e.g. 6 Weeks"
                      className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-300">Registration Fee</label>
                    <div className="relative mt-1">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newCourseFee}
                        onChange={(e) => setNewCourseFee(e.target.value)}
                        placeholder="0 for free"
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 pl-8 text-sm text-white focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">Enter 0 to offer this course for free.</p>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-slate-300">Course Start Date *</label>
                    <input
                      type="date"
                      required
                      value={newCourseStartDate}
                      onChange={(e) => setNewCourseStartDate(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-white focus:outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-300">Course Status</label>
                  <select
                    value={newCourseStatus}
                    onChange={(e) => setNewCourseStatus(e.target.value as 'upcoming' | 'ongoing' | 'completed')}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-white focus:outline-none focus:border-indigo-400"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all"
                >
                  {editingCourseId ? 'Save Course Changes' : 'Publish Course'}
                </button>
                {editingCourseId && <button type="button" onClick={cancelEditingCourse} className="w-full rounded-xl border border-slate-700 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800">Cancel Editing</button>}
              </form>
            </section>
          </div>
        )}

        {/* POST ASSIGNMENT TAB */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <span>My Assignments ({myAssignments.length})</span>
                </h2>
              </div>
              {myAssignments.length === 0 ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
                  No assignments published yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {myAssignments.map((assignment) => {
                    const courseEnrollments = enrollments.filter((enrollment) => enrollment.courseId === assignment.courseId);
                    const completedCount = submissions.filter((submission) => submission.assignmentId === assignment.id).length;
                    const remainingCount = Math.max(courseEnrollments.length - completedCount, 0);
                    const course = courses.find((item) => item.id === assignment.courseId);
                    return (
                      <article key={assignment.id} className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">{course?.title || 'Course'}</p>
                            <h3 className="mt-1 text-lg font-bold text-white">{assignment.title}</h3>
                          </div>
                          <button type="button" onClick={() => startEditingAssignment(assignment)} className="text-xs font-bold text-amber-300 hover:text-white">Edit</button>
                        </div>
                        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-400">{assignment.description}</p>
                        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-800 pt-4 text-center">
                          <div><p className="text-[10px] uppercase text-slate-500">Enrolled</p><p className="mt-1 text-lg font-bold text-white">{courseEnrollments.length}</p></div>
                          <div><p className="text-[10px] uppercase text-slate-500">Completed</p><p className="mt-1 text-lg font-bold text-emerald-300">{completedCount}</p></div>
                          <div><p className="text-[10px] uppercase text-slate-500">Remaining</p><p className="mt-1 text-lg font-bold text-amber-300">{remainingCount}</p></div>
                        </div>
                        <p className="mt-4 text-xs text-slate-400">Deadline: <strong className="text-slate-200">{new Date(assignment.dueDate).toLocaleDateString()}</strong></p>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
              <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span>{editingAssignmentId ? 'Edit Assignment' : 'Post Course Assignment'}</span>
              </h2>

              <form onSubmit={editingAssignmentId ? handleSaveAssignment : handleCreateAssignment} className="space-y-4">
                {assignmentError && <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{assignmentError}</p>}
                <div>
                  <label className="text-xs font-bold uppercase text-slate-300">Select Target Course *</label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    disabled={myCourses.length === 0}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-400"
                  >
                    {myCourses.length === 0 ? (
                      <option value="">Create a course first</option>
                    ) : myCourses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-300">Assignment Title *</label>
                  <input
                    type="text"
                    value={asgTitle}
                    onChange={(e) => setAsgTitle(e.target.value)}
                    placeholder="e.g. Implement Supabase Realtime Subscriptions"
                    required
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-300">Assignment Instructions *</label>
                  <textarea
                    value={asgDesc}
                    onChange={(e) => setAsgDesc(e.target.value)}
                    rows={3}
                    placeholder="Detailed instructions for student project submission..."
                    required
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-300">Max Score (Points)</label>
                  <input
                    type="number"
                    value={asgMaxScore}
                    onChange={(e) => setAsgMaxScore(Number(e.target.value))}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-300">Assignment Deadline *</label>
                  <input
                    type="date"
                    required
                    value={asgDueDate}
                    onChange={(e) => setAsgDueDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={myCourses.length === 0}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all"
                >
                  {editingAssignmentId ? 'Save Assignment Changes' : 'Post Assignment'}
                </button>
                {editingAssignmentId && <button type="button" onClick={cancelEditingAssignment} className="w-full rounded-xl border border-slate-700 py-3 text-sm font-bold text-slate-300 hover:bg-slate-800">Cancel Editing</button>}
              </form>
            </section>
          </div>
        )}

        {/* ENROLLED STUDENTS TAB */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                <span>Enrolled Students Across Courses ({enrollments.length})</span>
              </h2>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider">
                      <th className="p-4">Student Name</th>
                      <th className="p-4">Course Enrolled</th>
                      <th className="p-4">Enrollment Date</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {enrollments.map((enr) => {
                      const student = allUsers.find((u) => u.id === enr.studentId);
                      const course = courses.find((c) => c.id === enr.courseId);
                      const courseAssignments = assignments.filter((assignment) => assignment.courseId === enr.courseId);
                      const studentCompletedAll = courseAssignments.length > 0 && courseAssignments.every((assignment) => submissions.some((submission) => submission.assignmentId === assignment.id && submission.studentId === enr.studentId));
                      const alreadyCertified = certificates.some((certificate) => certificate.courseId === enr.courseId && certificate.studentId === enr.studentId);

                      return (
                        <tr key={enr.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 font-bold text-white">
                            {student?.fullName || 'Student User'}
                          </td>
                          <td className="p-4 text-indigo-300 font-medium">
                            {course?.title || 'Course'}
                          </td>
                          <td className="p-4 text-slate-400">
                            {new Date(enr.enrolledAt).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] border ${enr.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                              }`}>
                              {enr.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => issueCertificateForStudent(enr.studentId, enr.courseId).then((result) => {
                                if (result.certificate) alert(`Certificate Issued to ${student?.fullName}! Outward No: ${result.certificate.outwardNo}`);
                                else alert(result.error);
                              })}
                              disabled={!course || course.status !== 'completed' || !studentCompletedAll || alreadyCertified}
                              className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold text-xs transition-all inline-flex items-center space-x-1 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>{alreadyCertified ? 'Issued' : 'Issue Certificate'}</span>
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

        {/* Grading Modal */}
        {gradingSubmission && (
          <GradingModal
            submission={gradingSubmission}
            onClose={() => setGradingSubmission(null)}
          />
        )}

      </div>
    </div>
  );
}
