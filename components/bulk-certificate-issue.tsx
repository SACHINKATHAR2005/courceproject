'use client';

import { useState } from 'react';
import { Award, CheckCircle2 } from 'lucide-react';
import type { Course } from '@/lib/types';

export function BulkCertificateIssue({ courses, onComplete }: { courses: Course[]; onComplete: () => void }) {
    const [courseId, setCourseId] = useState(courses[0]?.id || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const issueCertificates = async () => {
        if (!courseId) return;
        setLoading(true);
        setMessage('');
        setError('');
        try {
            const response = await fetch('/api/instructor/certificates/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Bulk certificate issuing failed.');
            setMessage(`${result.issued} certificate${result.issued === 1 ? '' : 's'} issued. ${result.skipped} student${result.skipped === 1 ? '' : 's'} skipped.`);
            onComplete();
        } catch (issueError) {
            setError(issueError instanceof Error ? issueError.message : 'Bulk certificate issuing failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="rounded-3xl border border-amber-500/30 bg-slate-900 p-6 shadow-xl sm:p-8">
            <div className="flex items-center gap-2 text-amber-300"><Award className="h-5 w-5" /><h2 className="text-xl font-bold text-white">Issue course certificates</h2></div>
            <p className="mt-2 text-sm text-slate-400">Issue HTML certificates to every enrolled student who has completed every assignment. Each certificate receives a unique outward number and verification QR code.</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <select value={courseId} onChange={(event) => setCourseId(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-200">
                    <option value="">Select a completed course</option>
                    {courses.map((course) => <option key={course.id} value={course.id}>{course.title} ({course.status})</option>)}
                </select>
                <button type="button" onClick={issueCertificates} disabled={!courseId || loading} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"><Award className="h-4 w-4" />{loading ? 'Issuing...' : 'Issue certificates'}</button>
            </div>
            {message && <p className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300"><CheckCircle2 className="h-4 w-4" />{message}</p>}
            {error && <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
        </section>
    );
}
