'use client';

import React, { useState } from 'react';
import { AssignmentSubmission } from '@/lib/types';
import { useStore } from '@/lib/store/useStore';
import { CheckCircle, X, Award, ExternalLink, MessageSquare, Loader2, RotateCcw, FileText } from 'lucide-react';

interface GradingModalProps {
  submission: AssignmentSubmission;
  onClose: () => void;
}

export const GradingModal: React.FC<GradingModalProps> = ({ submission, onClose }) => {
  const { gradeSubmission, assignments, addNotification } = useStore();
  const assignment = assignments.find((a) => a.id === submission.assignmentId);

  const [decision, setDecision] = useState<'grade' | 'resubmit'>(
    submission.status === 'resubmit_required' ? 'resubmit' : 'grade'
  );
  const [grade, setGrade] = useState<number>(submission.grade ?? 90);
  const [feedback, setFeedback] = useState<string>(
    submission.feedback || 'Great work! Assignment requirements have been verified.'
  );
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const isPdf = submission.fileUrl?.toLowerCase().includes('.pdf');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError('');

    const targetStatus = decision === 'resubmit' ? 'resubmit_required' : 'graded';
    const finalGrade = decision === 'resubmit' ? undefined : Number(grade);

    if (decision === 'resubmit' && !feedback.trim()) {
      setIsSaving(false);
      setSaveError('Please provide feedback explaining what needs to be corrected before requesting resubmission.');
      return;
    }

    const res = await gradeSubmission(submission.id, finalGrade, feedback.trim(), targetStatus);
    setIsSaving(false);

    if (!res.ok) {
      setSaveError(res.error || 'Failed to save review. Please try again.');
      return;
    }

    // Send in-app notification to student
    if (decision === 'resubmit') {
      addNotification({
        userId: submission.studentId,
        title: 'Resubmission Requested',
        message: `Instructor requested revisions for "${assignment?.title || 'Assignment'}": ${feedback.trim()}`,
        type: 'resubmit_required',
        link: '/dashboard/assignments',
      });
    } else {
      addNotification({
        userId: submission.studentId,
        title: 'Assignment Graded',
        message: `Your work for "${assignment?.title || 'Assignment'}" received ${finalGrade}/${assignment?.maxScore || 100} points.`,
        type: 'assignment_graded',
        link: '/dashboard/assignments',
      });
    }

    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 1200);
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

        {isSaved ? (
          <div className="py-8 text-center space-y-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto border ${
              decision === 'resubmit'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
            }`}>
              {decision === 'resubmit' ? <RotateCcw className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
            </div>
            <h3 className="text-xl font-bold text-white">
              {decision === 'resubmit' ? 'Resubmission Requested!' : 'Grade Saved Successfully!'}
            </h3>
            <p className="text-sm text-slate-400">
              {decision === 'resubmit'
                ? 'The student has been notified to make corrections and resubmit.'
                : 'Student grade record has been updated in the database.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 bg-indigo-400/10 px-2.5 py-1 rounded-md border border-indigo-400/20">
                  Review Submission
                </span>
                {submission.status === 'resubmit_required' && (
                  <span className="text-xs uppercase font-bold text-red-400 bg-red-400/10 px-2.5 py-1 rounded-md border border-red-400/20">
                    Awaiting Revision
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white mt-2">
                {assignment?.title || 'Assignment Review'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Submitted by <span className="text-slate-200 font-semibold">{submission.studentName || 'Student'}</span>
              </p>
            </div>

            {/* Submission preview */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase">Student Solution Work:</p>
              <p className="text-sm text-slate-200 whitespace-pre-wrap">{submission.submissionText || 'No text submitted.'}</p>

              {submission.fileUrl && (
                <div className="pt-2 flex flex-wrap gap-2">
                  {isPdf ? (
                    <a
                      href={submission.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View / Download Submitted PDF</span>
                    </a>
                  ) : (
                    <a
                      href={submission.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors"
                    >
                      <span>Project URL / Repository</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Decision toggle: Grade vs Request Resubmission */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-300">Action Decision</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setDecision('grade')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    decision === 'grade'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Approve & Score</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDecision('resubmit');
                    if (feedback === 'Great work! Assignment requirements have been verified.') {
                      setFeedback('');
                    }
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    decision === 'resubmit'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Request Resubmission</span>
                </button>
              </div>
            </div>

            {/* Score input (only if approving) */}
            {decision === 'grade' && (
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-300 flex items-center justify-between">
                  <span className="flex items-center space-x-1.5">
                    <Award className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Grade Score (Max {assignment?.maxScore || 100})</span>
                  </span>
                  <span className="text-indigo-400 font-extrabold">{grade} / {assignment?.maxScore || 100}</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={assignment?.maxScore || 100}
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                />
              </div>
            )}

            {/* Feedback textarea */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-300 flex items-center space-x-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {decision === 'resubmit' ? 'Correction Instructions for Student *' : 'Instructor Feedback'}
                </span>
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                required={decision === 'resubmit'}
                placeholder={
                  decision === 'resubmit'
                    ? 'Explain what corrections or missing requirements the student needs to address before resubmitting...'
                    : 'Provide constructive feedback for the student...'
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
              />
            </div>

            {saveError && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
                {saveError}
              </p>
            )}

            <div className="pt-3 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={`px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg transition-all flex items-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${
                  decision === 'resubmit'
                    ? 'bg-red-600 hover:bg-red-500 shadow-red-600/20'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : decision === 'resubmit' ? (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>Send for Resubmission</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Submit Grade</span>
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
