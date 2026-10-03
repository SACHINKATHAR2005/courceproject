'use client';

import React, { useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Certificate } from '@/lib/types';
import { CertificateQRCode } from './qr-code';
import { Award, Printer, ShieldCheck, Share2, ExternalLink, CheckCircle, Download } from 'lucide-react';
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

  const verificationUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/verify/${certificate.outwardNo}`
    : `https://learnhub.cert/verify/${certificate.outwardNo}`;

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

  const handleDownloadHtml = () => {
    if (!certRef.current) return;
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${certificate.outwardNo}</title><style>
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=Inter:wght@400;500;600;700&display=swap');
      *{box-sizing:border-box;margin:0;padding:0}
      body{background:#f0f4f8;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:32px;font-family:'Inter',sans-serif}
      .certificate{width:1122px;min-height:793px;background:#fffef7;position:relative;border:6px solid #B08D57;padding:0;overflow:hidden;box-shadow:0 25px 60px rgba(0,0,0,0.25)}
      .inner-border{position:absolute;inset:10px;border:1.5px solid #1E3A5F;pointer-events:none;z-index:1}
      .watermark{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:120px;font-weight:900;color:rgba(176,141,87,0.07);white-space:nowrap;pointer-events:none;z-index:0;font-family:'Playfair Display',serif}
      .corner{position:absolute;width:80px;height:80px;z-index:2}
      .tl{top:14px;left:14px;border-top:3px solid #B08D57;border-left:3px solid #B08D57}
      .tr{top:14px;right:14px;border-top:3px solid #B08D57;border-right:3px solid #B08D57}
      .bl{bottom:14px;left:14px;border-bottom:3px solid #B08D57;border-left:3px solid #B08D57}
      .br{bottom:14px;right:14px;border-bottom:3px solid #B08D57;border-right:3px solid #B08D57}
      .header{background:#1E3A5F;padding:18px 40px;display:flex;align-items:center;justify-content:space-between;position:relative;z-index:3}
      .header-left{display:flex;align-items:center;gap:14px}
      .seal-mini{width:44px;height:44px;border-radius:50%;border:2px solid #B08D57;background:rgba(176,141,87,0.15);display:flex;align-items:center;justify-content:center;color:#B08D57;font-size:20px}
      .institution{color:#fff;font-size:20px;font-weight:700;font-family:'Playfair Display',serif;letter-spacing:0.5px}
      .institution-sub{color:rgba(255,255,255,0.6);font-size:10px;text-transform:uppercase;letter-spacing:2px;margin-top:2px}
      .cert-id{color:#B08D57;font-family:'Courier New',monospace;font-size:13px;font-weight:700;letter-spacing:1px}
      .body{padding:28px 56px 28px;position:relative;z-index:3}
      .divider{display:flex;align-items:center;justify-content:center;gap:12px;margin:0 auto 20px;width:fit-content}
      .divider-line{width:60px;height:1px;background:linear-gradient(to right,transparent,#B08D57)}
      .divider-diamond{width:8px;height:8px;background:#B08D57;transform:rotate(45deg)}
      .cert-title{text-align:center;font-family:'Playfair Display',serif;font-size:42px;font-weight:700;color:#1E3A5F;margin-bottom:8px;letter-spacing:0.5px}
      .certify-text{text-align:center;font-size:13px;color:#64748B;font-style:italic;margin-bottom:14px}
      .student-name{text-align:center;font-family:'Playfair Display',serif;font-size:38px;font-weight:900;color:#0F172A;margin-bottom:0}
      .name-underline{width:480px;height:2px;background:linear-gradient(to right,transparent,#B08D57 20%,#B08D57 80%,transparent);margin:8px auto 16px}
      .completed-text{text-align:center;font-size:13px;color:#64748B;margin-bottom:12px}
      .course-box{border:1.5px solid #1E3A5F;background:linear-gradient(135deg,rgba(30,58,95,0.04),rgba(176,141,87,0.06));border-radius:8px;padding:14px 32px;margin:0 auto 12px;max-width:680px;text-align:center}
      .course-name{font-size:18px;font-weight:700;color:#1E3A5F;font-family:'Playfair Display',serif}
      .duration-pill{display:inline-block;border:1px solid #E2E8F0;background:#F8FAFC;border-radius:20px;padding:4px 16px;font-size:11px;color:#475569;font-weight:600}
      .footer-grid{display:grid;grid-template-columns:1fr auto 1fr;gap:24px;align-items:end;padding-top:20px;border-top:1px solid #E2E8F0;margin-top:16px}
      .footer-left{text-align:left}
      .footer-center{display:flex;flex-direction:column;align-items:center;gap:6px}
      .footer-right{text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:6px}
      .label{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;color:#64748B;font-weight:700;margin-bottom:3px}
      .value{font-size:13px;font-weight:700;color:#0F172A}
      .verified{display:flex;align-items:center;gap:5px;color:#15803D;font-size:11px;font-weight:600;margin-top:4px}
      .big-seal{width:80px;height:80px;border-radius:50%;border:3px solid #B08D57;background:linear-gradient(135deg,#fffef7,#fef9ec);display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px rgba(176,141,87,0.3),inset 0 0 0 2px rgba(176,141,87,0.15)}
      .seal-label{font-size:8px;text-transform:uppercase;letter-spacing:2px;color:#64748B;font-weight:700}
      .sig-block{margin-top:20px;padding-top:16px;border-top:1px solid #E2E8F0;display:flex;justify-content:space-between;align-items:flex-end}
      .sig{text-align:center}
      .sig-line{width:200px;height:1px;background:#94A3B8;margin-bottom:6px}
      .sig-name{font-size:12px;font-weight:700;color:#0F172A}
      .sig-role{font-size:10px;color:#64748B}
      @media print{body{padding:0;background:white}.certificate{box-shadow:none}}
    </style></head><body><div class="certificate">
      <div class="inner-border"></div>
      <div class="watermark">CERTIFIED</div>
      <div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div>
      <div class="header">
        <div class="header-left">
          <div class="seal-mini">🏆</div>
          <div><div class="institution">${certificate.institution || 'LearnHub Institute of Technology'}</div><div class="institution-sub">Verified Digital Credential</div></div>
        </div>
        <div class="cert-id">${certificate.outwardNo}</div>
      </div>
      <div class="body">
        <div class="divider"><div class="divider-line"></div><div class="divider-diamond"></div><div class="divider-line" style="background:linear-gradient(to left,transparent,#B08D57)"></div></div>
        <div class="cert-title">Certificate of Completion</div>
        <div class="certify-text">This is to certify that</div>
        <div class="student-name">${certificate.studentName}</div>
        <div class="name-underline"></div>
        <div class="completed-text">has successfully fulfilled all academic requirements and completed the course</div>
        <div class="course-box"><div class="course-name">${certificate.courseName}</div></div>
        ${certificate.duration ? `<div style="text-align:center;margin-top:8px"><span class="duration-pill">Duration: ${certificate.duration}</span></div>` : ''}
        <div class="footer-grid">
          <div class="footer-left"><div class="label">Date of Issue</div><div class="value">${new Date(certificate.issueDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</div><div class="verified">✅ Verified Authentic</div></div>
          <div class="footer-center"><div class="big-seal">🏆</div><div class="seal-label">Official Seal</div></div>
          <div class="footer-right"><div class="label">Scan to Verify</div><div style="font-family:monospace;font-size:10px;color:#64748B">${certificate.outwardNo}</div></div>
        </div>
        <div class="sig-block">
          <div class="sig"><div class="sig-line"></div><div class="sig-name">${certificate.instructorName}</div><div class="sig-role">Course Instructor</div></div>
          <div class="sig"><div class="sig-line"></div><div class="sig-name">Director</div><div class="sig-role">LearnHub Certify</div></div>
        </div>
      </div>
    </div></body></html>`;
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${certificate.outwardNo}.html`;
    link.click();
    URL.revokeObjectURL(url);
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
                {certificate.institution || 'LearnHub Institute of Technology'}
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

            {/* Center: Embossed Seal */}
            <div className="flex flex-col items-center gap-1.5">
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
              <p className="text-[8px] font-bold text-[#64748B] uppercase tracking-[2px]">
                Official Seal
              </p>
            </div>

            {/* Right: QR Code */}
            <div className="flex flex-col items-end gap-1">
              <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-[1.5px]">
                Scan to Verify
              </p>
              <CertificateQRCode value={verificationUrl} size={72} />
              <p className="text-[9px] font-mono text-[#94A3B8]">
                {certificate.outwardNo}
              </p>
            </div>
          </div>

          {/* ── Signature Block ── */}
          <div className="mt-5 pt-4 border-t border-[#E2E8F0] flex items-end justify-between">
            <div className="text-center">
              <div className="w-44 h-px bg-[#94A3B8] mb-1.5" />
              <p className="text-xs font-bold text-[#0F172A]">{certificate.instructorName}</p>
              <p className="text-[10px] text-[#64748B]">Course Instructor</p>
            </div>
            <div className="text-center hidden sm:block">
              <p className="text-[9px] text-[#94A3B8] font-mono">LearnHub Certify · Registry System</p>
            </div>
            <div className="text-center">
              <div className="w-44 h-px bg-[#94A3B8] mb-1.5" />
              <p className="text-xs font-bold text-[#0F172A]">Director</p>
              <p className="text-[10px] text-[#64748B]">LearnHub Certify</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Action Buttons ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-center gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="px-5 py-2.5 rounded-lg bg-[#1E3A5F] hover:bg-[#162F4D] text-white font-semibold text-xs shadow-sm transition-colors flex items-center space-x-2 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save PDF</span>
        </button>

        <button
          onClick={handleDownloadHtml}
          className="px-5 py-2.5 rounded-lg bg-[#B08D57] hover:bg-[#967442] text-white font-semibold text-xs shadow-sm transition-colors flex items-center space-x-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download Certificate</span>
        </button>

        <button
          onClick={handleCopyLink}
          className="px-5 py-2.5 rounded-lg bg-white hover:bg-[#F8FAFC] text-[#0F172A] font-semibold text-xs border border-[#E2E8F0] transition-colors flex items-center space-x-2 cursor-pointer"
        >
          {copied ? <CheckCircle className="w-4 h-4 text-[#15803D]" /> : <Share2 className="w-4 h-4 text-[#475569]" />}
          <span>{copied ? 'Link Copied!' : 'Share Verify Link'}</span>
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
