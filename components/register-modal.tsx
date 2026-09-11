'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store/useStore';
import { UserPlus, X, GraduationCap, CheckCircle2 } from 'lucide-react';

interface RegisterModalProps {
  onClose: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ onClose }) => {
  const { registerUser } = useStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    // By default, registration is for Student role only
    registerUser(fullName.trim(), email.trim(), 'student');
    setSubmitted(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 cursor-default my-8"
      >
        
        {/* Top Close Button (X) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Modal"
          className="absolute top-4 right-4 p-2.5 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-all shadow-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 pr-8">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
            <UserPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-white">Student Registration</h3>
            <p className="text-xs text-slate-400">Enroll in courses & earn verified certificates</p>
          </div>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-white">Registration Successful!</h4>
            <p className="text-xs text-slate-400">Welcome to LearnHub Certify, {fullName}.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-slate-300">Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Samantha Miller"
                required
                className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-slate-300">Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. samantha@example.com"
                required
                className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Default Student Badge Info */}
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center space-x-3">
              <GraduationCap className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-300">Student Account</p>
                <p className="text-[11px] text-slate-400">Default access to enroll, submit assignments & claim credentials.</p>
              </div>
            </div>

            {/* Action Buttons: Register + Cancel */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg transition-all"
              >
                Register & Start Learning
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors border border-slate-700"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
