'use client';

import React, { useState } from 'react';
import { Assignment } from '@/lib/types';
import { useStore } from '@/lib/store/useStore';
import { Upload, X, CheckCircle, FileText, Link2 } from 'lucide-react';

interface AssignmentModalProps {
  assignment: Assignment;
  onClose: () => void;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({ assignment, onClose }) => {
  const { currentUser, submitAssignment, submissions } = useStore();

  const existingSubmission = currentUser
    ? submissions.find((s) => s.assignmentId === assignment.id && s.studentId === currentUser.id)
    : undefined;

  const [submissionText, setSubmissionText] = useState(
    existingSubmission?.submissionText || ''
  );
  const [fileUrl, setFileUrl] = useState(existingSubmission?.fileUrl || '');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!submissionText.trim() || !currentUser) return;

    submitAssignment({
      assignmentId: assignment.id,
      studentId: currentUser.id,
      submissionText: submissionText.trim(),
      fileUrl: fileUrl.trim() || undefined,
    });

    setIsSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800"
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
              Your instructor has been notified to review your submission.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20">
                Submit Assignment
              </span>
              <h3 className="text-xl font-bold text-white mt-2">{assignment.title}</h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-3">{assignment.description}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-300 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Submission Work / Solution Description *</span>
              </label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Describe your implementation details, project approach, or copy solution text here..."
                required
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
              />
            </div>

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

            <div className="pt-3 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>{existingSubmission ? 'Update Submission' : 'Submit Assignment'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
