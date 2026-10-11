'use client';

import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, Trash2, AlertCircle, FileText, UserCheck, HardDrive, RefreshCw } from 'lucide-react';
import type { Course } from '@/lib/types';

type StudentSubmissionItem = {
    studentId: string;
    studentName: string;
    studentEmail: string;
    hasCertificate: boolean;
    certificateOutwardNo?: string;
    submissions: Array<{
        assignmentId: string;
        assignmentTitle: string;
        fileUrl: string | null;
        hasStorageFile: boolean;
        status: string;
    }>;
    storageFileCount: number;
};

export function BulkCertificateIssue({ courses, onComplete }: { courses: Course[]; onComplete: () => void }) {
    const [courseId, setCourseId] = useState(courses[0]?.id || '');
    const [deleteOnIssue, setDeleteOnIssue] = useState(true);
    const [loading, setLoading] = useState(false);
    const [cleaning, setCleaning] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const [studentsData, setStudentsData] = useState<StudentSubmissionItem[]>([]);
    const [fileCount, setFileCount] = useState(0);
    const [loadingStudents, setLoadingStudents] = useState(false);

    const loadCourseSubmissions = async (selectedId: string) => {
        if (!selectedId) {
            setStudentsData([]);
            setFileCount(0);
            return;
        }
        setLoadingStudents(true);
        setError('');
        try {
            const res = await fetch(`/api/instructor/course-submissions?courseId=${selectedId}`);
            if (res.ok) {
                const data = await res.json();
                setStudentsData(data.students || []);
                setFileCount(data.fileCount || 0);
            }
        } catch (err) {
            console.error('Failed to load submissions for course:', err);
        } finally {
            setLoadingStudents(false);
        }
    };

    useEffect(() => {
        if (courseId) {
            loadCourseSubmissions(courseId);
        }
    }, [courseId]);

    const issueCertificates = async () => {
        if (!courseId) return;
        setLoading(true);
        setMessage('');
        setError('');
        try {
            const response = await fetch('/api/instructor/certificates/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId,
                    deleteSubmissionsOnComplete: deleteOnIssue,
                }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Bulk certificate issuing failed.');
            let successMsg = `${result.issued} certificate${result.issued === 1 ? '' : 's'} issued. ${result.skipped} student${result.skipped === 1 ? '' : 's'} skipped.`;
            if (result.freedFilesCount && result.freedFilesCount > 0) {
                const approxMb = ((result.freedFilesCount * 2 * 1024 * 1024) / (1024 * 1024)).toFixed(1);
                successMsg += ` Auto-deleted ${result.freedFilesCount} assignment files (~${approxMb} MB freed from 1 GB quota).`;
            }
            setMessage(successMsg);
            loadCourseSubmissions(courseId);
            onComplete();
        } catch (issueError) {
            setError(issueError instanceof Error ? issueError.message : 'Bulk certificate issuing failed.');
        } finally {
            setLoading(false);
        }
    };

    const handleCleanStorageOnly = async () => {
        if (!courseId) return;
        const confirmDelete = window.confirm(
            'Are you sure you want to delete all uploaded assignment submission files for this course from 1GB storage? Graded records and certificates will remain preserved.'
        );
        if (!confirmDelete) return;

        setCleaning(true);
        setMessage('');
        setError('');
        try {
            const res = await fetch('/api/instructor/clean-storage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, deleteAllForCourse: true }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Failed to delete assignment files.');
            setMessage(result.message || 'Storage cleaned up successfully.');
            loadCourseSubmissions(courseId);
            onComplete();
        } catch (cleanErr) {
            setError(cleanErr instanceof Error ? cleanErr.message : 'Failed to clean storage.');
        } finally {
            setCleaning(false);
        }
    };

    // Calculate how much space this course's submissions are taking (approx 2MB per file)
    const estimatedCourseMb = ((fileCount * 2 * 1024 * 1024) / (1024 * 1024)).toFixed(1);

    return (
        <section className="rounded-3xl border border-amber-500/30 bg-slate-900 p-6 shadow-xl sm:p-8 space-y-6">
            <div>
                <div className="flex items-center gap-2 text-amber-300">
                    <Award className="h-5 w-5" />
                    <h2 className="text-xl font-bold text-white">Issue Course Certificates & Free Storage Space</h2>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                    Issue verifiable HTML completion certificates to students who submitted all assignments.
                    You can optionally delete their assignment files from the 1 GB cloud storage upon certificate issuance or purge them now to prevent running out of storage.
                </p>
            </div>

            {/* Course Selector & Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <select
                    value={courseId}
                    onChange={(event) => setCourseId(event.target.value)}
                    className="w-full sm:flex-1 rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-200 focus:outline-none focus:border-amber-400"
                >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                            {course.title} ({course.status})
                        </option>
                    ))}
                </select>

                <button
                    type="button"
                    onClick={issueCertificates}
                    disabled={!courseId || loading}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 transition-all disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-md shadow-amber-500/20"
                >
                    <Award className="h-4 w-4" />
                    {loading ? 'Issuing & Cleaning...' : 'Issue Certificates'}
                </button>

                {fileCount > 0 && (
                    <button
                        type="button"
                        onClick={handleCleanStorageOnly}
                        disabled={cleaning || loading}
                        title="Delete all submission files for this course to free up space"
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-950/40 hover:bg-red-900/50 px-4 py-3 text-sm font-semibold text-red-200 transition-all cursor-pointer"
                    >
                        <Trash2 className="h-4 w-4 text-red-400" />
                        {cleaning ? 'Deleting Files...' : `Purge Files (${fileCount} files, ~${estimatedCourseMb} MB)`}
                    </button>
                )}
            </div>

            {/* Checkbox: Auto-delete files on issue */}
            <div className="flex items-center gap-3 bg-slate-950/70 border border-slate-800 p-3.5 rounded-2xl">
                <input
                    type="checkbox"
                    id="deleteOnIssueCheckbox"
                    checked={deleteOnIssue}
                    onChange={(e) => setDeleteOnIssue(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900"
                />
                <label htmlFor="deleteOnIssueCheckbox" className="text-xs text-slate-300 font-medium cursor-pointer">
                    <strong className="text-white">Auto-delete assignment files from 1 GB storage</strong> as soon as each student's certificate is successfully issued to reclaim cloud quota.
                </label>
            </div>

            {/* List of students who submitted assignments */}
            {courseId && (
                <div className="border border-slate-800 rounded-2xl bg-slate-950/50 p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-amber-400" />
                            <h3 className="text-sm font-bold text-white">Students with Submissions in this Course ({studentsData.length})</h3>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1.5">
                                <HardDrive className="h-3.5 w-3.5 text-indigo-400" />
                                Storage used by this course: <strong className="text-white">{fileCount} files (~{estimatedCourseMb} MB)</strong>
                            </span>
                            <button
                                type="button"
                                onClick={() => loadCourseSubmissions(courseId)}
                                className="p-1 text-slate-400 hover:text-white"
                                title="Reload submissions"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${loadingStudents ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {loadingStudents ? (
                        <p className="text-xs text-slate-500 py-3 text-center">Loading submitted assignments...</p>
                    ) : studentsData.length === 0 ? (
                        <p className="text-xs text-slate-500 py-3 text-center">No assignment submissions recorded for this course yet.</p>
                    ) : (
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                            {studentsData.map((st) => (
                                <div
                                    key={st.studentId}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 text-xs"
                                >
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-white">{st.studentName}</span>
                                            <span className="text-slate-400">({st.studentEmail})</span>
                                            {st.hasCertificate && (
                                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                                                    Cert Issued: {st.certificateOutwardNo}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-slate-400">
                                            Submissions: {st.submissions.length} assignment(s) · {st.storageFileCount} PDF file(s) in 1GB storage
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-semibold ${
                                            st.storageFileCount > 0
                                                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                                : 'bg-slate-800 text-slate-400'
                                        }`}>
                                            {st.storageFileCount > 0 ? `Uses ~${(st.storageFileCount * 2).toFixed(1)} MB` : 'No file in storage'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {message && (
                <p className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{message}</span>
                </p>
            )}

            {error && (
                <p className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </p>
            )}
        </section>
    );
}
