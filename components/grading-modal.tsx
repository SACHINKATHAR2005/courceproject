'use client';

import React, { useState } from 'react';
import { AssignmentSubmission } from '@/lib/types';
import { useStore } from '@/lib/store/useStore';
import { CheckCircle, X, Award, ExternalLink, MessageSquare } from 'lucide-react';

interface GradingModalProps {
  submission: AssignmentSubmission;
  onClose: () => void;
}

export const GradingModal: React.FC<GradingModalProps> = ({ submission, onClose }) => {
  const { gradeSubmission, assignments } = useStore();
  const assignment = assignments.find((a) => a.id === submission.assignmentId);

  const [grade, setGrade] = useState<number>(submission.grade || 90);
  const [feedback, setFeedback] = useState<string>(
    submission.feedback || 'Great work! Assignment requirements have been verified.'
  );
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    gradeSubmission(submission.id, Number(grade), feedback);
    setIsSaved(true);
    setTimeout(() => {
      onClose();
    }, 1200);
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

        {isSaved ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto border border-indigo-500/40">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Grade Saved Successfully!</h3>
            <p className="text-sm text-slate-400">Student grade record has been updated.</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400 bg-indigo-400/10 px-2.5 py-1 rounded-md border border-indigo-400/20">
                Grade Submission
              </span>
              <h3 className="text-xl font-bold text-white mt-2">
                {assignment?.title || 'Assignment Grading'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Submitted by <span className="text-slate-200 font-semibold">{submission.studentName || 'Student'}</span>
              </p>
            </div>

            {/* Submission preview */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase">Student Solution Notes:</p>
              <p className="text-sm text-slate-200 whitespace-pre-wrap">{submission.submissionText}</p>

              {submission.fileUrl && (
                <div className="pt-2">
                  <a
                    href={submission.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs text-amber-400 hover:underline"
                  >
                    <span>View Submission Repository / File Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Score & Feedback Inputs */}
            <div className="space-y-4">
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

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-300 flex items-center space-x-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Instructor Feedback</span>
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  placeholder="Provide feedback for the student..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                />
              </div>
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
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Submit Grade</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
