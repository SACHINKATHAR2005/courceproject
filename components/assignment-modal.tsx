'use client';

import React, { useState } from 'react';
import { Assignment } from '@/lib/types';
import { useStore } from '@/lib/store/useStore';
import { Upload, X, CheckCircle, FileText, Link2, Loader2, AlertCircle, FileCheck } from 'lucide-react';

interface AssignmentModalProps {
  assignment: Assignment;
  onClose: () => void;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({ assignment, onClose }) => {
  const { currentUser, courses, submissions, addNotification } = useStore();

  const existingSubmission = currentUser
    ? submissions.find((s) => s.assignmentId === assignment.id && s.studentId === currentUser.id)
    : undefined;

  const [submissionText, setSubmissionText] = useState(existingSubmission?.submissionText || '');
  const [fileUrl, setFileUrl] = useState(existingSubmission?.fileUrl || '');
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const course = courses.find((c) => c.id === assignment.courseId);
  const hasExistingPdf = Boolean(existingSubmission?.fileUrl?.toLowerCase().includes('.pdf'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionText.trim() || !currentUser) return;

    // Check mandatory PDF
    if (assignment.pdfRequired && !selectedPdf && !hasExistingPdf) {
      setSubmitError('A PDF document is mandatory for this assignment. Please select a PDF file to upload.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const formData = new FormData();
      formData.append('submissionText', submissionText.trim());
      if (fileUrl.trim()) formData.append('fileUrl', fileUrl.trim());
      if (selectedPdf) formData.append('file', selectedPdf);

      const response = await fetch(`/api/assignments/${assignment.id}/submit`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || 'Submission failed. Please check your file and try again.');
      }

      // Update store submissions
      const savedSubmission = result.submission;
      useStore.setState((state) => {
        const existingIdx = state.submissions.findIndex(
          (s) => s.assignmentId === assignment.id && s.studentId === currentUser.id
        );
        if (existingIdx >= 0) {
          const updated = [...state.submissions];
          updated[existingIdx] = { ...savedSubmission, studentName: currentUser.fullName };
          return { submissions: updated };
        }
        return {
          submissions: [{ ...savedSubmission, studentName: currentUser.fullName }, ...state.submissions],
        };
      });

      // Dispatch in-app notification to instructor
      if (course?.instructorId) {
        addNotification({
          userId: course.instructorId,
          title: 'Assignment Submitted',
          message: `${currentUser.fullName} submitted work for "${assignment.title}" in ${course.title}.`,
          type: 'assignment_submitted',
          link: '/instructor',
        });
      }

      setIsSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit assignment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Assignment Submitted!</h3>
            <p className="text-sm text-slate-400">
              Your instructor has been notified to review and grade your submission.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20">
                  {existingSubmission ? 'Update Work' : 'Submit Assignment'}
                </span>
                {assignment.pdfRequired && (
                  <span className="text-xs uppercase font-bold text-rose-400 bg-rose-400/10 px-2.5 py-1 rounded-md border border-rose-400/20">
                    PDF Mandatory
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white mt-2">{assignment.title}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-3">{assignment.description}</p>
            </div>

            {/* Notice for mandatory PDF */}
            {assignment.pdfRequired && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">PDF Document Upload Required</p>
                  <p className="text-rose-300/80 mt-0.5">
                    The instructor has configured this assignment to require a PDF file. Please select and upload your project report or solution document.
                  </p>
                </div>
              </div>
            )}

            {/* Solution Notes Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-300 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Submission Work / Solution Description *</span>
              </label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Describe your implementation details, approach, or key findings..."
                required
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
              />
            </div>

            {/* PDF File Upload Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-300 flex items-center justify-between">
                <span className="flex items-center space-x-1.5">
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    Upload PDF Document {assignment.pdfRequired ? '*' : '(Optional)'}
                  </span>
                </span>
                {hasExistingPdf && !selectedPdf && (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <FileCheck className="w-3 h-3" /> PDF already attached
                  </span>
                )}
              </label>

              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  setSelectedPdf(f);
                }}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-500/20 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-amber-200 hover:file:bg-amber-500/30 cursor-pointer"
              />
              <p className="text-[11px] text-slate-500">
                PDF only, max 25 MB.
              </p>
            </div>

            {/* External URL Input (Optional) */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-300 flex items-center space-x-1.5">
                <Link2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Project Repository or Live URL (Optional)</span>
              </label>
              <input
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://github.com/your-username/assignment-repo"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
              />
            </div>

            {/* Inline error message */}
            {submitError && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                {submitError}
              </p>
            )}

            <div className="pt-3 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading & Saving...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>{existingSubmission ? 'Update Work' : 'Submit Assignment'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
