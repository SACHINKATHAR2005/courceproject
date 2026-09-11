'use client';

import React, { useRef } from 'react';
import { RegistrationCard } from '@/lib/types';
import { CertificateQRCode } from '@/components/qr-code';
import { 
  ShieldCheck, 
  Printer, 
  GraduationCap, 
  Building2, 
  Calendar, 
  Mail, 
  UserCheck,
  ShieldAlert
} from 'lucide-react';

interface RegistrationCardComponentProps {
  registrationCard: RegistrationCard;
}

export const RegistrationCardComponent: React.FC<RegistrationCardComponentProps> = ({
  registrationCard,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const isValid = registrationCard.status !== 'REVOKED';
  const verificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/verify/${registrationCard.registrationNo}`
    : `https://learnhub.cert/verify/${registrationCard.registrationNo}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Action Bar */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center space-x-1.5 ${
            isValid
              ? 'bg-emerald-50 text-[#15803D] border-emerald-200'
              : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {isValid ? (
              <>
                <ShieldCheck className="w-4 h-4 text-[#15803D]" />
                <span>Verified Student Record</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4 text-red-700" />
                <span>Registration Revoked</span>
              </>
            )}
          </span>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 rounded-lg bg-white hover:bg-[#F8FAFC] text-[#0F172A] text-xs font-semibold border border-[#E2E8F0] transition-colors flex items-center space-x-1.5 cursor-pointer shadow-sm"
        >
          <Printer className="w-4 h-4 text-[#1E3A5F]" />
          <span>Print Document</span>
        </button>
      </div>

      {/* Visual Student Registration Card */}
      <div
        ref={cardRef}
        className="relative bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-10 shadow-sm space-y-6 print:border-2 print:border-black print:text-black"
      >
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E2E8F0] pb-6 gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#1E3A5F] text-[#B08D57] rounded-xl">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A] tracking-tight">
                {registrationCard.institution}
              </h2>
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                Official Student Registration Record
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right font-mono">
            <span className="text-[10px] text-[#64748B] uppercase font-bold tracking-wider block">Registration Outward No</span>
            <span className="text-base sm:text-lg font-bold text-[#1E3A5F] tracking-wider">
              {registrationCard.registrationNo}
            </span>
          </div>
        </div>

        {/* Card Body & Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          
          {/* Student Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider flex items-center space-x-1">
                <UserCheck className="w-3.5 h-3.5 text-[#15803D]" />
                <span>Registered Student</span>
              </span>
              <h3 className="text-2xl font-bold text-[#0F172A]">
                {registrationCard.studentName}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] space-y-1">
                <span className="text-[10px] text-[#64748B] uppercase font-semibold flex items-center space-x-1">
                  <Mail className="w-3 h-3 text-[#1E3A5F]" />
                  <span>Student Email</span>
                </span>
                <p className="font-semibold text-[#0F172A] truncate">{registrationCard.email}</p>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] space-y-1">
                <span className="text-[10px] text-[#64748B] uppercase font-semibold flex items-center space-x-1">
                  <Building2 className="w-3 h-3 text-[#1E3A5F]" />
                  <span>Department</span>
                </span>
                <p className="font-semibold text-[#0F172A]">{registrationCard.department || 'Applied Sciences'}</p>
              </div>
            </div>

            <div className="pt-2 text-xs flex items-center space-x-4 text-[#64748B]">
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Issue Date: <strong className="text-[#0F172A]">{new Date(registrationCard.issueDate).toLocaleDateString()}</strong></span>
              </span>
              <span className="flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#15803D]" />
                <span>Status: <strong className="text-[#15803D] font-bold uppercase">{registrationCard.status}</strong></span>
              </span>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-center space-y-2">
            <CertificateQRCode value={verificationUrl} size={110} />
            <p className="text-[10px] font-mono text-[#475569] font-semibold tracking-wider uppercase">
              Scan to Verify Online
            </p>
            <p className="text-[9px] text-[#64748B] font-mono truncate max-w-[140px]">
              {registrationCard.registrationNo}
            </p>
          </div>

        </div>

        {/* Card Footer Watermark */}
        <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-[10px] text-[#64748B] uppercase tracking-widest font-semibold">
          <span>LearnHub Academic Registry</span>
          <span>Official Registration Record</span>
        </div>

      </div>

    </div>
  );
};
