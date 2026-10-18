'use client';

import React, { useState, useRef } from 'react';
import { useStore } from '@/lib/store/useStore';
import { Award, Check, Upload, Trash2, ShieldCheck, PenTool, Sparkles, Building, Image as ImageIcon } from 'lucide-react';

export const CertificateBrandingSettings: React.FC = () => {
  const { certificateSettings, updateCertificateSettings, currentUser } = useStore();

  const [institutionName, setInstitutionName] = useState(
    certificateSettings.institutionName || 'LearnHub Institute of Technology'
  );
  const [directorName, setDirectorName] = useState(
    certificateSettings.directorName || 'Director'
  );
  const [directorTitle, setDirectorTitle] = useState(
    certificateSettings.directorTitle || 'LearnHub Certify'
  );

  const [instructorSig, setInstructorSig] = useState<string>(
    certificateSettings.instructorSignatureUrl || ''
  );
  const [directorSig, setDirectorSig] = useState<string>(
    certificateSettings.directorSignatureUrl || ''
  );
  const [stampUrl, setStampUrl] = useState<string>(
    certificateSettings.stampUrl || ''
  );

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const instructorFileRef = useRef<HTMLInputElement>(null);
  const directorFileRef = useRef<HTMLInputElement>(null);
  const stampFileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG or JPG recommended with transparent background)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setter(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      await updateCertificateSettings({
        institutionName: institutionName.trim() || 'LearnHub Institute of Technology',
        directorName: directorName.trim() || 'Director',
        directorTitle: directorTitle.trim() || 'LearnHub Certify',
        instructorSignatureUrl: instructorSig,
        directorSignatureUrl: directorSig,
        stampUrl: stampUrl,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <PenTool className="w-5 h-5" />
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Certificate E-Signatures & Institutional Stamp
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-2 max-w-2xl leading-relaxed">
            Upload the official digital e-signatures for the Course Instructor and Director, along with the institutional seal/stamp. All uploaded assets will automatically reflect across all issued certificates, downloads (PNG & PDF), and public verification records.
          </p>
        </div>

        {saveSuccess && (
          <div className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center space-x-2 animate-pulse">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Settings Applied to All Certificates!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upload Controls & Inputs */}
        <div className="lg:col-span-7 space-y-6">

          {/* 1. Institution & Director Names */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Building className="w-4 h-4 text-indigo-400" />
              <span>Institutional Identity</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Institution Name
                </label>
                <input
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="e.g. LearnHub Institute of Technology"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Director Name
                  </label>
                  <input
                    type="text"
                    value={directorName}
                    onChange={(e) => setDirectorName(e.target.value)}
                    placeholder="e.g. Dr. A. K. Verma"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Director Sub-Title
                  </label>
                  <input
                    type="text"
                    value={directorTitle}
                    onChange={(e) => setDirectorTitle(e.target.value)}
                    placeholder="e.g. Director, LearnHub Certify"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Course Instructor Signature Upload */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <PenTool className="w-4 h-4 text-emerald-400" />
                  <span>Course Instructor E-Signature</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Sign on plain white paper, take a photo or scan (PNG transparent recommended).
                </p>
              </div>
              {instructorSig && (
                <button
                  type="button"
                  onClick={() => setInstructorSig('')}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="h-24 w-48 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center p-2 overflow-hidden relative">
                {instructorSig ? (
                  <img
                    src={instructorSig}
                    alt="Instructor Signature Preview"
                    className="max-h-full max-w-full object-contain filter invert"
                  />
                ) : (
                  <span className="text-[11px] text-slate-500 italic">No signature uploaded</span>
                )}
              </div>

              <div>
                <input
                  ref={instructorFileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, setInstructorSig)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => instructorFileRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{instructorSig ? 'Change Signature' : 'Upload Signature'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Director E-Signature Upload */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <PenTool className="w-4 h-4 text-indigo-400" />
                  <span>Director E-Signature</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Official director authority signature for verified credential validation.
                </p>
              </div>
              {directorSig && (
                <button
                  type="button"
                  onClick={() => setDirectorSig('')}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="h-24 w-48 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center p-2 overflow-hidden relative">
                {directorSig ? (
                  <img
                    src={directorSig}
                    alt="Director Signature Preview"
                    className="max-h-full max-w-full object-contain filter invert"
                  />
                ) : (
                  <span className="text-[11px] text-slate-500 italic">No signature uploaded</span>
                )}
              </div>

              <div>
                <input
                  ref={directorFileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, setDirectorSig)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => directorFileRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{directorSig ? 'Change Signature' : 'Upload Signature'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4. Official Seal / Stamp Upload */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Official Institutional Stamp / Seal</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Circular institutional stamp/seal. If empty, the default embossed gold seal is used.
                </p>
              </div>
              {stampUrl && (
                <button
                  type="button"
                  onClick={() => setStampUrl('')}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Reset to Default Seal</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="h-24 w-24 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center p-2 overflow-hidden relative">
                {stampUrl ? (
                  <img
                    src={stampUrl}
                    alt="Institutional Stamp Preview"
                    className="max-h-full max-w-full object-contain filter drop-shadow"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full border-2 border-amber-500/40 bg-amber-500/10 flex items-center justify-center text-amber-400">
                    <Award className="w-8 h-8" />
                  </div>
                )}
              </div>

              <div>
                <input
                  ref={stampFileRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, setStampUrl)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => stampFileRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center space-x-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{stampUrl ? 'Change Stamp Image' : 'Upload Custom Stamp'}</span>
                </button>
                <p className="text-[10px] text-slate-500 mt-1">PNG with transparent background is best</p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-60"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Saving to Certificates...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Save & Apply To All Certificates</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Certificate Footer Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 sticky top-24">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                Live Certificate Preview
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Real-time Rendering</span>
            </div>

            {/* Mock Certificate Paper */}
            <div
              className="rounded-xl border-4 border-[#B08D57] p-5 shadow-2xl space-y-4"
              style={{
                background: '#fffef7',
                fontFamily: 'Georgia, serif',
              }}
            >
              <div className="text-center pb-2 border-b border-[#E2E8F0]">
                <p className="text-xs font-bold text-[#1E3A5F]">
                  {institutionName || 'LearnHub Institute of Technology'}
                </p>
                <p className="text-[8px] uppercase tracking-widest text-[#64748B]">
                  Certificate of Completion
                </p>
              </div>

              {/* Sample student name */}
              <div className="text-center py-2">
                <p className="text-[9px] italic text-[#64748B]">Conferred to</p>
                <p className="text-base font-bold text-[#0F172A] mt-0.5">Sample Student</p>
              </div>

              {/* Seal & QR Row */}
              <div className="grid grid-cols-2 gap-2 items-center py-2 border-t border-[#E2E8F0]">
                {/* Stamp */}
                <div className="text-center">
                  <p className="text-[7px] uppercase font-bold text-[#64748B] tracking-wider mb-1">
                    Official Seal
                  </p>
                  <div className="w-14 h-14 mx-auto flex items-center justify-center">
                    {stampUrl ? (
                      <img
                        src={stampUrl}
                        alt="Stamp"
                        className="max-h-full max-w-full object-contain filter drop-shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full border-2 border-[#B08D57] bg-amber-50 flex items-center justify-center text-[#B08D57]">
                        <Award className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Code Placeholder */}
                <div className="text-center">
                  <p className="text-[7px] uppercase font-bold text-[#64748B] tracking-wider mb-1">
                    Verification QR
                  </p>
                  <div className="w-12 h-12 mx-auto bg-white border border-slate-200 rounded p-1 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-[#15803D]" />
                  </div>
                </div>
              </div>

              {/* Signatures Row */}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#E2E8F0]">
                {/* Instructor */}
                <div className="text-center">
                  <div className="h-8 flex items-end justify-center mb-1">
                    {instructorSig ? (
                      <img
                        src={instructorSig}
                        alt="Instructor Sig"
                        className="max-h-8 max-w-[90px] object-contain"
                      />
                    ) : (
                      <span className="font-serif italic text-[11px] text-[#1E3A5F]/70">
                        {currentUser?.fullName || 'Instructor'}
                      </span>
                    )}
                  </div>
                  <div className="w-full h-px bg-[#94A3B8] mb-1" />
                  <p className="text-[9px] font-bold text-[#0F172A]">
                    {currentUser?.fullName || 'Instructor'}
                  </p>
                  <p className="text-[7px] text-[#64748B]">Course Instructor</p>
                </div>

                {/* Director */}
                <div className="text-center">
                  <div className="h-8 flex items-end justify-center mb-1">
                    {directorSig ? (
                      <img
                        src={directorSig}
                        alt="Director Sig"
                        className="max-h-8 max-w-[90px] object-contain"
                      />
                    ) : (
                      <span className="font-serif italic text-[11px] text-[#1E3A5F]/70">
                        {directorName || 'Director'}
                      </span>
                    )}
                  </div>
                  <div className="w-full h-px bg-[#94A3B8] mb-1" />
                  <p className="text-[9px] font-bold text-[#0F172A]">
                    {directorName || 'Director'}
                  </p>
                  <p className="text-[7px] text-[#64748B]">
                    {directorTitle || 'LearnHub Certify'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
              💡 <strong>Instant Sync:</strong> Once saved, every student viewing, printing, or downloading (PNG/PDF) a certificate will immediately see these exact signatures and stamp.
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
