'use client';

import React, { useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Certificate } from '@/lib/types';
import { CertificateQRCode } from './qr-code';
import { Award, Printer, ShieldCheck, Share2, ExternalLink, CheckCircle, Download, FileImage } from 'lucide-react';
import Link from 'next/link';
import { useStore } from '@/lib/store/useStore';

interface CertificateCardProps {
  certificate: Certificate;
  triggerConfettiOnLoad?: boolean;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  certificate,
  triggerConfettiOnLoad = true,
}) => {
  const { certificateSettings } = useStore();
  const certRef = useRef<HTMLDivElement>(null);
  const [downloadingPng, setDownloadingPng] = React.useState(false);
  const [downloadingPdf, setDownloadingPdf] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Exact sanitized certificate outward identifier
  const cleanOutwardNo = certificate.outwardNo.trim();

  // Dynamic live verification link holding strictly: domainname/verify/<outwardNo>
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://courceproject.vercel.app');
  const baseDomain = siteUrl.replace(/\/+$/, '');
  const verificationUrl = `${baseDomain}/verify/${cleanOutwardNo}`;

  useEffect(() => {
    if (triggerConfettiOnLoad) {
      try {
        confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 }, colors: ['#1E3A5F', '#B08D57', '#15803D', '#FFF8E1'] });
      } catch (err) {
        console.error('Confetti error:', err);
      }
    }
  }, [triggerConfettiOnLoad]);

  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    const element = document.getElementById('printable-certificate') || certRef.current;
    if (!element) return;
    setDownloadingPdf(true);
    try {
      const { toPng } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));

      const pngUrl = await toPng(element, {
        pixelRatio: 3, // Ultra-crisp 3x resolution
        backgroundColor: '#fffef7',
        cacheBust: true,
      });

      // Load image into HTMLImageElement to read actual natural dimensions
      const img = new Image();
      img.src = pngUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      // Create landscape A4 PDF (297mm x 210mm)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Fit certificate maintaining exact aspect ratio with clean 10mm margins
      const margin = 10;
      const targetWidth = pageWidth - margin * 2;
      const targetHeight = (img.height * targetWidth) / img.width;

      let finalWidth = targetWidth;
      let finalHeight = targetHeight;
      let posX = margin;
      let posY = (pageHeight - targetHeight) / 2;

      if (targetHeight > pageHeight - margin * 2) {
        finalHeight = pageHeight - margin * 2;
        finalWidth = (img.width * finalHeight) / img.height;
        posX = (pageWidth - finalWidth) / 2;
        posY = margin;
      }

      pdf.addImage(pngUrl, 'PNG', posX, posY, finalWidth, finalHeight);
      pdf.save(`${cleanOutwardNo}.pdf`);
    } catch (err) {
      console.error('Error generating PDF certificate:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadPng = async () => {
    const element = document.getElementById('printable-certificate') || certRef.current;
    if (!element) return;
    setDownloadingPng(true);
    try {
      const { toPng } = await import('html-to-image');
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      await new Promise((resolve) => setTimeout(resolve, 200));

      const pngUrl = await toPng(element, {
        pixelRatio: 3, // 3x ultra-sharp resolution for crystal clear certificate and 100% scannable QR code
        backgroundColor: '#fffef7',
        cacheBust: true,
      });

      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `${cleanOutwardNo}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error generating PNG certificate:', err);
    } finally {
      setDownloadingPng(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const formattedDate = new Date(certificate.issueDate).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isRevoked = certificate.status === 'REVOKED';

  return (
    <div className="space-y-6">

      {/* ─── Premium Certificate Frame ─────────────────────────────────────── */}
      <div
        ref={certRef}
        id="printable-certificate"
        className="relative max-w-4xl mx-auto overflow-hidden print:shadow-none"
        style={{
          background: '#fffef7',
          border: '5px solid #B08D57',
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}
      >
        {/* Inner border line */}
        <div className="absolute inset-[10px] border border-[#1E3A5F] pointer-events-none z-10" />

        {/* Faint diagonal CERTIFIED watermark */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden"
          aria-hidden
        >
          <span
            className="text-[#B08D57] font-black select-none"
            style={{
              fontSize: 'clamp(60px, 10vw, 110px)',
              opacity: 0.055,
              transform: 'rotate(-28deg)',
              whiteSpace: 'nowrap',
              fontFamily: 'Georgia, serif',
              letterSpacing: '12px',
            }}
          >
            CERTIFIED
          </span>
        </div>

        {/* Corner ornaments */}
        {[
          'top-[14px] left-[14px] border-t-[3px] border-l-[3px]',
          'top-[14px] right-[14px] border-t-[3px] border-r-[3px]',
          'bottom-[14px] left-[14px] border-b-[3px] border-l-[3px]',
          'bottom-[14px] right-[14px] border-b-[3px] border-r-[3px]',
        ].map((pos, i) => (
          <div key={i} className={`absolute w-[70px] h-[70px] border-[#B08D57] z-20 ${pos}`} />
        ))}

        {/* ── HEADER BAND ── */}
        <div className="relative z-20 bg-[#1E3A5F] px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-[#B08D57] bg-[rgba(176,141,87,0.15)] flex items-center justify-center text-[#B08D57]">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
                {certificate.institution || certificateSettings?.institutionName || 'LearnHub Institute of Technology'}
              </p>
              <p className="text-white/50 text-[9px] uppercase tracking-[2px] font-semibold">
                Verified Digital Credential
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/40 text-[9px] uppercase tracking-wider font-semibold">Outward No.</p>
            <p className="text-[#B08D57] font-mono font-bold text-sm tracking-widest">
              {certificate.outwardNo}
            </p>
          </div>
        </div>

        {/* ── CERTIFICATE BODY ── */}
        <div className="relative z-10 px-10 sm:px-16 py-8">

          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#B08D57]" />
            <div className="w-2.5 h-2.5 rotate-45 bg-[#B08D57]" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#B08D57]" />
          </div>

          {/* REVOKED stamp overlay */}
          {isRevoked && (
            <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
              <div
                className="border-4 border-red-600 text-red-600 font-black text-5xl px-6 py-2 rotate-[-20deg] opacity-80"
                style={{ fontFamily: 'Georgia, serif', letterSpacing: '4px' }}
              >
                REVOKED
              </div>
            </div>
          )}

          {/* Certificate Title */}
          <h1
            className="text-center text-4xl sm:text-5xl font-bold text-[#1E3A5F] mb-2"
            style={{ fontFamily: 'Georgia, "Playfair Display", serif' }}
          >
            Certificate of Completion
          </h1>

          <p className="text-center text-[#64748B] text-sm italic mb-4">
            This is to certify that
          </p>

          {/* Student Name */}
          <div className="text-center mb-6">
            <h2
              className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-wide"
              style={{ fontFamily: 'Georgia, "Playfair Display", serif' }}
            >
              {certificate.studentName}
            </h2>
            <div className="mx-auto mt-2 h-0.5 w-72 sm:w-96 bg-gradient-to-r from-transparent via-[#B08D57] to-transparent" />
          </div>

          <p className="text-center text-[#64748B] text-sm mb-4">
            has successfully fulfilled all academic requirements and completed the course
          </p>

          {/* Course Name */}
          <div
            className="mx-auto max-w-2xl text-center rounded-lg border-[1.5px] border-[#1E3A5F] px-6 py-4 mb-3"
            style={{ background: 'linear-gradient(135deg, rgba(30,58,95,0.03), rgba(176,141,87,0.06))' }}
          >
            <h3
              className="text-xl sm:text-2xl font-bold text-[#1E3A5F]"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {certificate.courseName}
            </h3>
          </div>

          {/* Duration pill */}
          {certificate.duration && (
            <div className="text-center mb-6">
              <span className="inline-block border border-[#E2E8F0] bg-[#F8FAFC] rounded-full px-4 py-1 text-xs font-semibold text-[#475569]">
                Duration: {certificate.duration}
              </span>
            </div>
          )}

          {/* ── FOOTER: Date | Seal | QR ── */}
          <div className="pt-5 border-t border-[#E2E8F0] grid grid-cols-3 gap-4 items-end">

            {/* Left: Date + Verified */}
            <div className="space-y-1">
              <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-[1.5px]">
                Date of Issue
              </p>
              <p className="text-sm font-bold text-[#0F172A]">{formattedDate}</p>
              <div className="flex items-center gap-1.5 text-[#15803D] text-[11px] font-semibold mt-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified Authentic</span>
              </div>
            </div>

            {/* Center: Stamp / Official Seal */}
            <div className="flex flex-col items-center gap-1.5">
              {certificateSettings?.stampUrl ? (
                <div className="w-[80px] h-[80px] flex items-center justify-center relative">
                  <img
                    src={certificateSettings.stampUrl}
                    alt="Official Institutional Seal"
                    className="max-w-full max-h-full object-contain filter drop-shadow-sm select-none"
                    crossOrigin="anonymous"
                  />
                </div>
              ) : (
                <div
                  className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
                  style={{
                    border: '3px solid #B08D57',
                    background: 'linear-gradient(135deg, #fffef7, #fef9ec)',
                    boxShadow: '0 0 0 2px rgba(176,141,87,0.25), inset 0 0 0 2px rgba(176,141,87,0.12)',
                  }}
                >
                  <div className="w-12 h-12 rounded-full border border-[#B08D57]/40 flex items-center justify-center">
                    <Award className="w-6 h-6 text-[#B08D57]" />
                  </div>
                </div>
              )}
              <p className="text-[8px] font-bold text-[#64748B] uppercase tracking-[2px]">
                Official Seal
              </p>
            </div>

            {/* Right: QR Code */}
            <div className="flex flex-col items-end gap-1">
              <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-[1.5px]">
                Scan to Verify
              </p>
              <CertificateQRCode value={verificationUrl} size={96} />
              <p className="text-[10px] font-mono font-semibold text-[#64748B] tracking-wider">
                {cleanOutwardNo}
              </p>
            </div>
          </div>

          {/* ── Signature Block ── */}
          <div className="mt-5 pt-4 border-t border-[#E2E8F0] flex items-end justify-between">
            {/* Instructor Signature */}
            <div className="text-center min-w-[176px]">
              <div className="h-12 flex items-end justify-center mb-1">
                {certificateSettings?.instructorSignatureUrl ? (
                  <img
                    src={certificateSettings.instructorSignatureUrl}
                    alt="Instructor E-Signature"
                    className="max-h-12 max-w-[160px] object-contain select-none"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <span className="font-serif italic text-sm text-[#1E3A5F]/70 select-none">
                    {certificate.instructorName}
                  </span>
                )}
              </div>
              <div className="w-44 h-px bg-[#94A3B8] mx-auto mb-1.5" />
              <p className="text-xs font-bold text-[#0F172A]">{certificate.instructorName}</p>
              <p className="text-[10px] text-[#64748B]">Course Instructor</p>
            </div>

            {/* Middle Registry Note */}
            <div className="text-center hidden sm:block">
              <p className="text-[9px] text-[#94A3B8] font-mono">LearnHub Certify · Registry System</p>
            </div>

            {/* Director Signature */}
            <div className="text-center min-w-[176px]">
              <div className="h-12 flex items-end justify-center mb-1">
                {certificateSettings?.directorSignatureUrl ? (
                  <img
                    src={certificateSettings.directorSignatureUrl}
                    alt="Director E-Signature"
                    className="max-h-12 max-w-[160px] object-contain select-none"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <span className="font-serif italic text-sm text-[#1E3A5F]/70 select-none">
                    {certificateSettings?.directorName || 'Director'}
                  </span>
                )}
              </div>
              <div className="w-44 h-px bg-[#94A3B8] mx-auto mb-1.5" />
              <p className="text-xs font-bold text-[#0F172A]">
                {certificateSettings?.directorName || 'Director'}
              </p>
              <p className="text-[10px] text-[#64748B]">
                {certificateSettings?.directorTitle || 'LearnHub Certify'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Action Buttons ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-3 print:hidden">
        <button
          onClick={handleDownloadPng}
          disabled={downloadingPng || downloadingPdf}
          className="px-6 py-2.5 rounded-lg bg-[#B08D57] hover:bg-[#967442] text-white font-semibold text-xs shadow-md transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-60"
        >
          {downloadingPng ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating PNG...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download PNG Certificate</span>
            </>
          )}
        </button>

        <button
          onClick={handleDownloadPdf}
          disabled={downloadingPng || downloadingPdf}
          className="px-5 py-2.5 rounded-lg bg-[#1E3A5F] hover:bg-[#162F4D] text-white font-semibold text-xs shadow-sm transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-60"
        >
          {downloadingPdf ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </>
          )}
        </button>

        <button
          onClick={handlePrint}
          className="px-4 py-2.5 rounded-lg bg-white hover:bg-[#F8FAFC] text-[#0F172A] font-semibold text-xs border border-[#E2E8F0] shadow-sm transition-colors flex items-center space-x-2 cursor-pointer"
        >
          <Printer className="w-4 h-4 text-[#1E3A5F]" />
          <span>Print</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="px-4 py-2.5 rounded-lg bg-white hover:bg-[#F8FAFC] text-[#0F172A] font-semibold text-xs border border-[#E2E8F0] transition-colors flex items-center space-x-2 cursor-pointer"
        >
          {copied ? <CheckCircle className="w-4 h-4 text-[#15803D]" /> : <Share2 className="w-4 h-4 text-[#475569]" />}
          <span>{copied ? 'Link Copied!' : 'Share Verify Link'}</span>
        </button>

        <Link
          href={`/verify/${cleanOutwardNo}`}
          className="px-4 py-2.5 rounded-lg bg-white hover:bg-[#F8FAFC] text-[#1E3A5F] font-semibold text-xs border border-[#E2E8F0] transition-colors flex items-center space-x-2"
        >
          <ExternalLink className="w-4 h-4 text-[#1E3A5F]" />
          <span>Verify Page</span>
        </Link>
      </div>
    </div>
  );
};
