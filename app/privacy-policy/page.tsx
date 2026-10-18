import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  Cookie,
  Server,
  UserCheck,
  Clock,
  Mail,
  FileText,
  CheckCircle2,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy | LearnHub Certify',
  description:
    'Learn how LearnHub Certify collects, uses, protects, and handles your personal data, credentials, and payment records.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'October 2026';

  const sections = [
    { id: 'introduction', label: '1. Introduction' },
    { id: 'data-collected', label: '2. Information We Collect' },
    { id: 'how-we-use', label: '3. How We Use Information' },
    { id: 'cookie-usage', label: '4. Cookie Usage & Tracking' },
    { id: 'third-party-services', label: '5. Third-Party Services' },
    { id: 'data-retention', label: '6. Data Retention Policy' },
    { id: 'user-rights', label: '7. Your Rights & Choices' },
    { id: 'security', label: '8. Security & Data Protection' },
    { id: 'contact', label: '9. Contact & Inquiries' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12 text-[#0F172A]">
      {/* Brand Header */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#F1F5F9] border border-[#E2E8F0] text-[#1E3A5F] text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-[#15803D]" />
          <span>Trust & Data Protection</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0F172A]">
          Privacy Policy
        </h1>

        <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
          LearnHub Certify is dedicated to protecting your privacy and maintaining the integrity of
          your academic, credential, and payment records.
        </p>

        <div className="pt-1 flex items-center justify-center space-x-3 text-xs text-[#64748B]">
          <span>Effective Date: <strong>{lastUpdated}</strong></span>
          <span>•</span>
          <span>Platform Version: <strong>2026.1</strong></span>
        </div>
      </div>

      {/* Main Grid: Sticky Quick Nav + Policy Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <nav
          aria-label="Table of contents"
          className="lg:col-span-4 bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm sticky top-24 space-y-4"
        >
          <div className="flex items-center space-x-2 pb-3 border-b border-[#E2E8F0]">
            <FileText className="w-4 h-4 text-[#1E3A5F]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#1E3A5F]">
              Table of Contents
            </h2>
          </div>

          <ul className="space-y-1.5 text-xs">
            {sections.map((sec) => (
              <li key={sec.id}>
                <a
                  href={`#${sec.id}`}
                  className="block py-1.5 px-2 rounded-lg text-slate-600 hover:text-[#1E3A5F] hover:bg-[#F8FAFC] transition-colors font-medium"
                >
                  {sec.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="pt-4 border-t border-[#E2E8F0] space-y-2">
            <p className="text-[11px] text-[#64748B]">Questions regarding your data?</p>
            <a
              href="mailto:support@learnhub.com"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#1E3A5F] hover:text-[#B08D57] transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>support@learnhub.com</span>
            </a>
          </div>
        </nav>

        {/* Content Column */}
        <div className="lg:col-span-8 space-y-8">
          {/* Section 1: Introduction */}
          <section id="introduction" className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-[#0F172A] flex items-center space-x-2.5">
              <span className="text-[#B08D57] text-base font-mono">01.</span>
              <span>Introduction & Platform Scope</span>
            </h2>
            <div className="text-xs sm:text-sm text-[#475569] leading-relaxed space-y-3">
              <p>
                Welcome to <strong>LearnHub Certify</strong> (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). This
                Privacy Policy outlines our policies and procedures concerning the collection, use, disclosure,
                and protection of personal information when you use our web platform, enroll in courses, submit
                assignments, complete certificate verifications, or interact with our digital credential services.
              </p>
              <p>
                By accessing or using LearnHub Certify, you consent to the collection and handling of your
                information as outlined in this policy. If you do not agree with any part of this policy, please
                refrain from using our services.
              </p>
            </div>
          </section>

          {/* Section 2: Data We Collect */}
          <section id="data-collected" className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold text-[#0F172A] flex items-center space-x-2.5">
                <span className="text-[#B08D57] text-base font-mono">02.</span>
                <span>Information We Collect</span>
              </h2>
              <span className="p-2 rounded-lg bg-[#F1F5F9] text-[#1E3A5F]">
                <FileText className="w-4 h-4" />
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              We collect information to provide, personalize, and verify your educational achievements. The data
              collected is categorized as follows:
            </p>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <h3 className="text-xs sm:text-sm font-bold text-[#0F172A] flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[#1E3A5F]" />
                  <span>Personal Identification Data</span>
                </h3>
                <p className="text-xs text-[#475569] leading-relaxed">
                  When you register as a student, instructor, or administrator, we collect your full legal name,
                  email address, account password (cryptographically hashed using industry-standard salts), profile
                  avatar, and assigned user role.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <h3 className="text-xs sm:text-sm font-bold text-[#0F172A] flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[#B08D57]" />
                  <span>Academic & Certification Data</span>
                </h3>
                <p className="text-xs text-[#475569] leading-relaxed">
                  We track your enrolled courses, assignment submissions, grades, progress percentages, completion
                  dates, unique outward numbers (e.g. <code className="text-[#1E3A5F] font-mono">CERT-2026-XXXXXX</code>),
                  and QR verification codes to authenticate certificates issued in your name.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <h3 className="text-xs sm:text-sm font-bold text-[#0F172A] flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[#15803D]" />
                  <span>Payment & Transaction Data</span>
                </h3>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Course tuition payments are processed securely through our authorized payment partner, <strong>Razorpay</strong>.
                  LearnHub Certify does <em>not</em> store your full credit/debit card numbers, CVVs, or net-banking credentials.
                  We record only transaction metadata (payment ID, order ID, amount in paise, currency, timestamp, and status).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <h3 className="text-xs sm:text-sm font-bold text-[#0F172A] flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span>Usage & Technical Analytics</span>
                </h3>
                <p className="text-xs text-[#475569] leading-relaxed">
                  When you interact with the platform, we collect browser type, IP address, device telemetry,
                  referral URL, pages visited, and error diagnostics to maintain system security and optimize page
                  performance.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: How We Use Information */}
          <section id="how-we-use" className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="text-xl font-bold text-[#0F172A] flex items-center space-x-2.5">
              <span className="text-[#B08D57] text-base font-mono">03.</span>
              <span>How We Use Your Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-1.5">
                <div className="flex items-center space-x-2 text-[#15803D] font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Credential Verification</span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Enabling employers, institutions, and verifying parties to validate certificate authenticity via public outward IDs.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-1.5">
                <div className="flex items-center space-x-2 text-[#15803D] font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Course Management</span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Facilitating lesson progression, homework grading by verified instructors, and automated milestone tracking.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-1.5">
                <div className="flex items-center space-x-2 text-[#15803D] font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Transactional Alerts</span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Sending critical service emails: enrollment receipts, certificate notifications, grade announcements, and password resets.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-1.5">
                <div className="flex items-center space-x-2 text-[#15803D] font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Fraud Prevention & Security</span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Detecting unauthorized access attempts, preventing counterfeit certificate generation, and enforcing rate limits.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Cookie Usage */}
          <section id="cookie-usage" className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold text-[#0F172A] flex items-center space-x-2.5">
                <span className="text-[#B08D57] text-base font-mono">04.</span>
                <span>Cookie Usage & Tracking Technologies</span>
              </h2>
              <span className="p-2 rounded-lg bg-[#F1F5F9] text-[#1E3A5F]">
                <Cookie className="w-4 h-4" />
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              Cookies are small text files placed on your device to ensure our application runs reliably and safely.
              We distinguish between two main categories of cookies:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E3A5F]">
                    Essential Cookies
                  </h3>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-[#15803D]">
                    Mandatory
                  </span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Required for user authentication, maintaining active login sessions across routes, CSRF token validation,
                  and access security. These cannot be switched off without disabling core platform features.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E3A5F]">
                    Analytics & Preference Cookies
                  </h3>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                    Consent-Based
                  </span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Used solely with your consent to gather aggregated statistics regarding page visits, load times,
                  and interface navigation patterns to help us refine the learning environment.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                You can configure your browser to block or alert you about cookies; however, blocking essential cookies
                will impair your ability to stay logged into your student or instructor account.
              </p>
            </div>
          </section>

          {/* Section 5: Third-Party Services */}
          <section id="third-party-services" className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold text-[#0F172A] flex items-center space-x-2.5">
                <span className="text-[#B08D57] text-base font-mono">05.</span>
                <span>Third-Party Services & Processors</span>
              </h2>
              <span className="p-2 rounded-lg bg-[#F1F5F9] text-[#1E3A5F]">
                <Server className="w-4 h-4" />
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              We work with trusted third-party cloud infrastructure providers who uphold rigorous security,
              confidentiality, and regulatory standards:
            </p>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-4 rounded-xl border border-[#E2E8F0] hover:border-slate-300 transition-colors space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0F172A] text-sm">Supabase Inc.</span>
                  <span className="text-[10px] font-semibold text-[#1E3A5F] bg-[#F1F5F9] px-2 py-0.5 rounded">
                    Database & Authentication Provider
                  </span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Provides encrypted PostgreSQL relational storage, role-based authorization, JWT token management,
                  and secure cloud asset storage for course syllabi, student assignments, and certificate assets.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#E2E8F0] hover:border-slate-300 transition-colors space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0F172A] text-sm">Razorpay Software Pvt. Ltd.</span>
                  <span className="text-[10px] font-semibold text-[#1E3A5F] bg-[#F1F5F9] px-2 py-0.5 rounded">
                    Payment Gateway
                  </span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Handles end-to-end PCI-DSS Level 1 compliant payment processing for course enrollments.
                  Razorpay processes your payment method directly through encrypted channels.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#E2E8F0] hover:border-slate-300 transition-colors space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0F172A] text-sm">Gmail SMTP / Nodemailer</span>
                  <span className="text-[10px] font-semibold text-[#1E3A5F] bg-[#F1F5F9] px-2 py-0.5 rounded">
                    Transactional Email Delivery
                  </span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">
                  Powers outgoing system emails, dispatching enrollment confirmations, certificate generation links,
                  and password recovery tokens to your verified email address.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Data Retention */}
          <section id="data-retention" className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold text-[#0F172A] flex items-center space-x-2.5">
                <span className="text-[#B08D57] text-base font-mono">06.</span>
                <span>Data Retention Policy</span>
              </h2>
              <span className="p-2 rounded-lg bg-[#F1F5F9] text-[#1E3A5F]">
                <Clock className="w-4 h-4" />
              </span>
            </div>

            <div className="text-xs sm:text-sm text-[#475569] leading-relaxed space-y-3">
              <p>
                We retain your personal data for as long as necessary to fulfill the educational and institutional
                verification purposes outlined in this policy:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li>
                  <strong>Certificates & Academic Credentials:</strong> Issued certificates and outward verification records
                  are preserved permanently to guarantee lifelong verifiable proof of course completion for students and institutions.
                </li>
                <li>
                  <strong>Active Account Records:</strong> Profile details, enrolled courses, and assignment histories are retained
                  for the lifetime of your account.
                </li>
                <li>
                  <strong>Financial & Transaction Records:</strong> Ledger data relating to course fee payments is retained for 7 years
                  in compliance with statutory tax and accounting obligations.
                </li>
                <li>
                  <strong>Server & Telemetry Logs:</strong> Technical activity logs, rate limit counters, and temporary session data
                  are routinely purged every 90 days.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 7: User Rights */}
          <section id="user-rights" className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold text-[#0F172A] flex items-center space-x-2.5">
                <span className="text-[#B08D57] text-base font-mono">07.</span>
                <span>Your Rights & Choices</span>
              </h2>
              <span className="p-2 rounded-lg bg-[#F1F5F9] text-[#1E3A5F]">
                <UserCheck className="w-4 h-4" />
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              Under applicable data protection laws, you retain important statutory rights regarding your personal information:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <strong className="text-[#0F172A] block font-bold">1. Right of Access</strong>
                <p className="text-[#475569]">
                  Request an export copy of all personal records and credentials tied to your account.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <strong className="text-[#0F172A] block font-bold">2. Right to Rectification</strong>
                <p className="text-[#475569]">
                  Update or correct inaccurate biographical information in your profile settings or through support.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <strong className="text-[#0F172A] block font-bold">3. Right to Erasure</strong>
                <p className="text-[#475569]">
                  Request account deletion, subject to legal and institutional certification integrity requirements.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <strong className="text-[#0F172A] block font-bold">4. Right to Withdraw Consent</strong>
                <p className="text-[#475569]">
                  Revoke optional analytics consent or opt out of non-essential correspondence at any time.
                </p>
              </div>
            </div>

            <p className="text-xs text-[#64748B]">
              To exercise any of these rights, please submit a written request to{' '}
              <a href="mailto:support@learnhub.com" className="text-[#1E3A5F] font-semibold underline">
                support@learnhub.com
              </a>
              . We respond to verified requests within thirty (30) days.
            </p>
          </section>

          {/* Section 8: Security */}
          <section id="security" className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold text-[#0F172A] flex items-center space-x-2.5">
                <span className="text-[#B08D57] text-base font-mono">08.</span>
                <span>Security & Data Protection</span>
              </h2>
              <span className="p-2 rounded-lg bg-[#F1F5F9] text-[#1E3A5F]">
                <Lock className="w-4 h-4" />
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
              We employ robust administrative, technical, and physical safeguards designed to prevent unauthorized
              access, loss, or manipulation of records:
            </p>

            <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#475569]">
              <li>All web traffic is transmitted over HTTPS with TLS 1.3 encryption.</li>
              <li>Role-based access control (RBAC) separates administrative, instructor, and student permissions.</li>
              <li>Outward certificate hashes are verifiable to prevent tampering or falsification of achievements.</li>
              <li>Database volumes are backed up redundantly with encryption at rest.</li>
            </ul>
          </section>

          {/* Section 9: Contact */}
          <section id="contact" className="bg-[#1E3A5F] text-white rounded-2xl p-6 sm:p-8 shadow-md space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-white/10 text-[#B08D57]">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white">09. Contact Us</h2>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              If you have any questions, comments, or concerns about this Privacy Policy or our data protection
              practices, please contact our privacy compliance team:
            </p>

            <div className="pt-2 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Email Contact</p>
                <a
                  href="mailto:support@learnhub.com"
                  className="text-white hover:text-[#B08D57] font-semibold text-sm transition-colors"
                >
                  support@learnhub.com
                </a>
              </div>
              <div>
                <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">Entity</p>
                <p className="text-white font-semibold text-sm">LearnHub Certify Credential Portal</p>
              </div>
            </div>

            <div className="pt-3">
              <Link
                href="/courses"
                className="inline-flex items-center space-x-2 text-xs font-semibold text-[#B08D57] hover:text-white transition-colors"
              >
                <span>Return to Course Catalog</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
