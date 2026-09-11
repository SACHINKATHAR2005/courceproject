'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CertificateCard } from '@/components/certificate-card';
import { RegistrationCardComponent } from '@/components/registration-card-component';
import { supabase } from '@/lib/supabase/client';
import type { Certificate, RegistrationCard } from '@/lib/types';
import {
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  Printer,
  Calendar,
  UserCheck,
  BookOpen,
  Building2
} from 'lucide-react';
import Link from 'next/link';

export default function VerificationDetailPage() {
  const params = useParams();
  const outwardNoParam = params.outwardNo as string;
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<Certificate>();
  const [regCard, setRegCard] = useState<RegistrationCard>();

  useEffect(() => {
    setMounted(true);
    const loadRecord = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const decoded = decodeURIComponent(outwardNoParam || '').trim().toUpperCase();
      const { data: certificate } = await supabase
        .from('certificate_verification')
        .select('*')
        .eq('outward_no', decoded)
        .maybeSingle();
      if (certificate) {
        setCert({
          id: certificate.outward_no,
          outwardNo: certificate.outward_no,
          studentId: '',
          courseId: '',
          studentName: certificate.student_name,
          courseName: certificate.course_name,
          instructorName: 'Issuing institution',
          institution: certificate.institution,
          issueDate: certificate.issue_date,
          status: certificate.status,
          createdAt: certificate.issue_date,
        });
      } else {
        const { data: registration } = await supabase
          .from('registration_verification')
          .select('*')
          .eq('registration_no', decoded)
          .maybeSingle();
        if (registration) {
          setRegCard({
            id: registration.registration_no,
            registrationNo: registration.registration_no,
            studentId: '',
            studentName: registration.student_name,
            email: '',
            institution: registration.institution,
            department: registration.department,
            issueDate: registration.issue_date,
            status: registration.status,
            createdAt: registration.issue_date,
          });
        }
      }
      setLoading(false);
    };
    loadRecord();
  }, []);

  if (!mounted) return null;

  const decodedOutwardNo = decodeURIComponent(outwardNoParam || '').trim();
  if (loading) return <div className="mx-auto max-w-2xl px-4 py-24 text-center text-sm text-slate-500">Looking up official record...</div>;

  // Determine Record Type & Revocation Status
  const isFound = Boolean(cert || regCard);
  const recordStatus = cert ? (cert.status || 'VALID') : (regCard ? regCard.status : 'NOT FOUND');
  const isRevoked = recordStatus === 'REVOKED';
  const isValid = isFound && !isRevoked;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-[#0F172A]">

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/verify"
          className="inline-flex items-center space-x-2 text-xs font-semibold text-[#475569] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Verification Portal</span>
        </Link>
      </div>

      {/* CASE 1: RECORD NOT FOUND */}
      {!isFound && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center space-y-4 max-w-xl mx-auto">
          <div className="w-14 h-14 bg-red-100 text-red-700 rounded-xl flex items-center justify-center mx-auto border border-red-200">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-red-950">Credential Not Found</h2>
            <p className="text-xs text-red-800">
              No certificate or student registration matches ID <strong className="font-mono">{decodedOutwardNo}</strong>.
            </p>
          </div>
          <p className="text-xs text-[#64748B] max-w-md mx-auto">
            Please check the credential ID or QR code printed on the official document and try again.
          </p>
          <Link
            href="/verify"
            className="inline-block px-5 py-2 rounded-lg bg-white border border-[#E2E8F0] text-[#0F172A] text-xs font-semibold hover:bg-[#F8FAFC]"
          >
            Try Another Search
          </Link>
        </div>
      )}

      {/* CASE 2: RECORD IS REVOKED */}
      {isFound && isRevoked && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center space-y-4 max-w-xl mx-auto">
          <div className="w-14 h-14 bg-red-100 text-red-700 rounded-xl flex items-center justify-center mx-auto border border-red-200">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 border border-red-200 text-xs font-bold uppercase tracking-wider">
            Credential Revoked
          </span>
          <h2 className="text-xl font-bold text-red-950">This Record Has Been Revoked</h2>
          <p className="text-xs text-red-800">
            Outward No. <strong className="font-mono">{decodedOutwardNo}</strong> was officially revoked by the issuing institution.
          </p>
          <div className="p-4 bg-white rounded-xl border border-red-200 max-w-md mx-auto text-left text-xs space-y-1">
            <p className="text-[#64748B]">Student: <strong className="text-[#0F172A]">{cert?.studentName || regCard?.studentName}</strong></p>
            <p className="text-[#64748B]">Record Type: <strong className="text-[#0F172A]">{cert ? 'Course Certificate' : 'Registration Card'}</strong></p>
            <p className="text-[#64748B]">Status: <strong className="text-red-700 font-bold uppercase">REVOKED</strong></p>
          </div>
        </div>
      )}

      {/* CASE 3: RECORD IS VALID */}
      {isFound && isValid && (
        <div className="space-y-8">

          {/* Authentic Badge Banner */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#15803D] border border-emerald-200 flex items-center justify-center font-bold">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#15803D] border border-emerald-200 text-[11px] font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified Official Record</span>
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-[#0F172A] mt-1">
                  Outward No: <span className="font-mono text-[#1E3A5F]">{decodedOutwardNo}</span>
                </h1>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-lg bg-white hover:bg-[#F8FAFC] text-[#0F172A] font-semibold text-xs border border-[#E2E8F0] transition-colors flex items-center space-x-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#1E3A5F]" />
              <span>Print Official Record</span>
            </button>
          </div>

          {/* Database Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-1">
              <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider flex items-center space-x-1">
                <UserCheck className="w-3.5 h-3.5 text-[#15803D]" />
                <span>Student</span>
              </span>
              <p className="text-sm font-bold text-[#0F172A]">{cert?.studentName || regCard?.studentName}</p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-1">
              <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider flex items-center space-x-1">
                <BookOpen className="w-3.5 h-3.5 text-[#B08D57]" />
                <span>Program / Record</span>
              </span>
              <p className="text-sm font-bold text-[#0F172A]">{cert?.courseName || regCard?.department || 'Student Registration'}</p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-1">
              <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider flex items-center space-x-1">
                <Building2 className="w-3.5 h-3.5 text-[#1E3A5F]" />
                <span>Institution</span>
              </span>
              <p className="text-sm font-bold text-[#0F172A]">{cert?.institution || regCard?.institution || 'LearnHub Institute'}</p>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-1">
              <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Issue Date</span>
              </span>
              <p className="text-sm font-bold text-[#0F172A]">
                {new Date(cert?.issueDate || regCard?.issueDate || Date.now()).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Visual Presentation */}
          <div className="pt-2">
            {cert && <CertificateCard certificate={cert} triggerConfettiOnLoad={false} />}
            {regCard && <RegistrationCardComponent registrationCard={regCard} />}
          </div>

        </div>
      )}

    </div>
  );
}
