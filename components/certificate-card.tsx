'use client';

import React, { useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Certificate } from '@/lib/types';
import { CertificateQRCode } from './qr-code';
import { Award, Printer, ShieldCheck, Share2, ExternalLink, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface CertificateCardProps {
  certificate: Certificate;
  triggerConfettiOnLoad?: boolean;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  certificate,
  triggerConfettiOnLoad = true,
}) => {
  const certRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  // Construct absolute verification URL for QR code
  const verificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/verify/${certificate.outwardNo}`
    : `https://learnhub.cert/verify/${certificate.outwardNo}`;

  useEffect(() => {
    if (triggerConfettiOnLoad) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#1E3A5F', '#B08D57', '#15803D'],
        });
      } catch (err) {
        console.error('Confetti error:', err);
      }
    }
  }, [triggerConfettiOnLoad]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formattedDate = new Date(certificate.issueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6">
      {/* Certificate Frame Box */}
      <div
        ref={certRef}
        id="printable-certificate"
        className="relative bg-white text-[#0F172A] p-8 sm:p-12 md:p-14 rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden max-w-4xl mx-auto print:border-2 print:border-black print:shadow-none"
      >
        {/* Subtle Decorative Gold Frame Lines */}
        <div className="absolute top-3 left-3 w-10 h-10 border-t-2 border-l-2 border-[#B08D57]" />
        <div className="absolute top-3 right-3 w-10 h-10 border-t-2 border-r-2 border-[#B08D57]" />
        <div className="absolute bottom-3 left-3 w-10 h-10 border-b-2 border-l-2 border-[#B08D57]" />
        <div className="absolute bottom-3 right-3 w-10 h-10 border-b-2 border-r-2 border-[#B08D57]" />

        {/* Top Header & Outward No Banner */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6 mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-[#1E3A5F] text-[#B08D57] flex items-center justify-center font-bold">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[#0F172A] uppercase">
                {certificate.institution || 'LearnHub Institute of Technology'}
              </h2>
              <p className="text-[11px] font-semibold text-[#64748B] tracking-wider uppercase">
                Verified Digital Credential
              </p>
            </div>
          </div>

          {/* Outward Number Tag */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-2 rounded-lg text-center">
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              Credential Outward No.
            </p>
            <p className="text-base font-mono font-bold text-[#1E3A5F] tracking-wider">
              {certificate.outwardNo}
            </p>
          </div>
        </div>

        {/* Certificate Main Content */}
        <div className="text-center space-y-5 my-8">
          <div className="inline-block px-3 py-1 rounded-full bg-[#F1F5F9] text-[#1E3A5F] border border-[#E2E8F0] text-xs font-semibold uppercase tracking-wider print:hidden">
            Official Credential Record
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#0F172A] tracking-tight">
            Certificate of Completion
          </h1>

          <p className="text-[#64748B] text-sm font-medium">
            This official institutional record certifies that
          </p>

          {/* Student Name */}
          <div className="py-2 border-b-2 border-[#B08D57] max-w-md mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-wide">
              {certificate.studentName}
            </h2>
          </div>

          <p className="text-[#64748B] text-xs sm:text-sm font-medium max-w-xl mx-auto leading-relaxed">
            has successfully fulfilled all academic requirements, submitted required assignments, and completed the course
          </p>

          {/* Course Name */}
          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl max-w-2xl mx-auto">
            <h3 className="text-lg sm:text-xl font-bold text-[#1E3A5F]">
              {certificate.courseName}
            </h3>
          </div>
        </div>

        {/* Footer: Signatures, Stamp & QR Code */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-6 border-t border-[#E2E8F0] mt-8">
          
          {/* Left: Issue Date */}
          <div className="text-center md:text-left space-y-1">
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              Date of Issuance
            </p>
            <p className="text-xs font-semibold text-[#0F172A]">
              {formattedDate}
            </p>
            <div className="pt-1 flex items-center justify-center md:justify-start space-x-1 text-[#15803D] text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Authentic</span>
            </div>
          </div>

          {/* Center: Official Seal Badge */}
          <div className="flex flex-col items-center justify-center space-y-1">
            <div className="w-16 h-16 rounded-full border-2 border-[#B08D57] bg-[#F8FAFC] flex items-center justify-center relative">
              <Award className="w-7 h-7 text-[#B08D57]" />
            </div>
            <p className="text-[9px] text-[#64748B] font-medium tracking-wide uppercase">
              Official Seal
            </p>
          </div>

          {/* Right: QR Code */}
          <div className="flex flex-col items-center md:items-end space-y-1.5">
            <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider text-center md:text-right">
              Scan to Verify Online
            </p>

            <CertificateQRCode value={verificationUrl} size={90} />

            <p className="text-[9px] text-[#64748B] font-mono text-center md:text-right">
              {certificate.outwardNo}
            </p>
          </div>
        </div>

        {/* Instructor Signature line */}
        <div className="mt-6 pt-4 flex justify-between items-center text-[11px] text-[#64748B] border-t border-[#E2E8F0]">
          <div>
            <span className="font-semibold text-[#0F172A]">Instructor:</span> {certificate.instructorName}
          </div>
          <div>
            <span className="font-semibold text-[#0F172A]">Registry System:</span> LearnHub Certify
          </div>
        </div>
      </div>

      {/* Action Buttons Toolbar (Hidden on Print) */}
      <div className="flex flex-wrap items-center justify-center gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="px-5 py-2.5 rounded-lg bg-[#1E3A5F] hover:bg-[#162F4D] text-white font-semibold text-xs shadow-sm transition-colors flex items-center space-x-2 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save PDF</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="px-5 py-2.5 rounded-lg bg-white hover:bg-[#F8FAFC] text-[#0F172A] font-semibold text-xs border border-[#E2E8F0] transition-colors flex items-center space-x-2 cursor-pointer"
        >
          {copied ? <CheckCircle className="w-4 h-4 text-[#15803D]" /> : <Share2 className="w-4 h-4 text-[#475569]" />}
          <span>{copied ? 'Link Copied!' : 'Share Verification Link'}</span>
        </button>

        <Link
          href={`/verify/${certificate.outwardNo}`}
          className="px-5 py-2.5 rounded-lg bg-white hover:bg-[#F8FAFC] text-[#1E3A5F] font-semibold text-xs border border-[#E2E8F0] transition-colors flex items-center space-x-2"
        >
          <ExternalLink className="w-4 h-4 text-[#1E3A5F]" />
          <span>Verification Page</span>
        </Link>
      </div>
    </div>
  );
};
