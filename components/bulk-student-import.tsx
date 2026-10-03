'use client';

import { useState } from 'react';
import { CheckCircle2, FileSpreadsheet, Upload, XCircle } from 'lucide-react';

type ImportResult = { row: number; name: string; email: string; status: 'created' | 'failed'; message: string };

export function BulkStudentImport() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [summary, setSummary] = useState<{ created: number; failed: number; results: ImportResult[] } | null>(null);

    const downloadTemplate = () => {
        const csvContent = [
            'name,email,initial_password,department',
            'Aarav Sharma,aarav@example.com,Welcome123,Computer Science',
            'Priya Mehta,priya@example.com,Welcome123,Electronics',
        ].join('\n');
        const url = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'student-import-template.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    const importStudents = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!file) return;
        setLoading(true);
        setError('');
        setSummary(null);
        const body = new FormData();
        body.append('file', file);
        try {
            const response = await fetch('/api/staff/bulk-students', { method: 'POST', body });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Import failed.');
            setSummary(result);
            setFile(null);
        } catch (importError) {
            setError(importError instanceof Error ? importError.message : 'Import failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="rounded-3xl border border-emerald-500/30 bg-slate-900 p-6 shadow-xl sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-emerald-300">
                        <FileSpreadsheet className="h-5 w-5" />
                        <h2 className="text-xl font-bold text-white">Bulk student registration</h2>
                    </div>
                    <p className="mt-2 max-w-2xl text-sm text-slate-400">
                        Upload a CSV or Excel file with{' '}
                        <strong className="text-slate-200">name</strong>,{' '}
                        <strong className="text-slate-200">email</strong>,{' '}
                        <strong className="text-slate-200">initial_password</strong>, and optionally{' '}
                        <strong className="text-slate-200">department</strong> columns.
                        Each student receives their login details by email.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {['name', 'email', 'initial_password', 'department (optional)'].map((col) => (
                            <span key={col} className="rounded-lg bg-slate-800 px-2 py-1 font-mono text-[11px] text-emerald-300 border border-slate-700">
                                {col}
                            </span>
                        ))}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={downloadTemplate}
                    className="shrink-0 rounded-xl border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800"
                >
                    Download template
                </button>
            </div>
            <form onSubmit={importStudents} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    required
                    onChange={(event) => setFile(event.target.files?.[0] || null)}
                    className="block w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500/15 file:px-3 file:py-2 file:text-xs file:font-bold file:text-emerald-300"
                />
                <button
                    type="submit"
                    disabled={!file || loading}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Upload className="h-4 w-4" />
                    {loading ? 'Importing...' : 'Import students'}
                </button>
            </form>
            {error && (
                <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                    {error}
                </p>
            )}
            {summary && (
                <div className="mt-6 space-y-3">
                    <div className="flex flex-wrap gap-3 text-sm">
                        <span className="rounded-lg bg-emerald-500/10 px-3 py-2 font-bold text-emerald-300">
                            {summary.created} created
                        </span>
                        <span className="rounded-lg bg-red-500/10 px-3 py-2 font-bold text-red-300">
                            {summary.failed} failed
                        </span>
                    </div>
                    <div className="max-h-60 space-y-2 overflow-y-auto">
                        {summary.results.map((result) => (
                            <div
                                key={`${result.row}-${result.email}`}
                                className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs"
                            >
                                <span className="mt-0.5">
                                    {result.status === 'created' ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-red-400" />
                                    )}
                                </span>
                                <span className="text-slate-300">
                                    Row {result.row}: {result.name || result.email || 'Unknown student'}{' '}
                                    <span className="text-slate-500">{result.message}</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}