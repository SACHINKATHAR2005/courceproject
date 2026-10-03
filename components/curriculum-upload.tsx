'use client';

import { useEffect, useState } from 'react';
import { FileUp, Loader2, CheckCircle2 } from 'lucide-react';

export function CurriculumUpload({ courseId }: { courseId: string }) {
    const [file, setFile] = useState<File | null>(null);
    const [attachedFileName, setAttachedFileName] = useState('');
    const [checking, setChecking] = useState(true);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [inputKey, setInputKey] = useState(0);

    useEffect(() => {
        let active = true;
        fetch(`/api/courses/${courseId}/curriculum`)
            .then(async (response) => {
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Could not check curriculum.');
                if (active) setAttachedFileName(result.material?.file_name || '');
            })
            .catch((checkError) => {
                if (active) setError(checkError instanceof Error ? checkError.message : 'Could not check curriculum.');
            })
            .finally(() => {
                if (active) setChecking(false);
            });
        return () => { active = false; };
    }, [courseId]);

    const uploadCurriculum = async () => {
        if (!file) return;
        setLoading(true);
        setMessage('');
        setError('');
        const body = new FormData();
        body.append('file', file);
        try {
            const response = await fetch(`/api/courses/${courseId}/curriculum`, { method: 'POST', body });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Curriculum upload failed.');
            setAttachedFileName(result.material.file_name);
            setMessage(`${result.material.file_name} is attached to this course.`);
            setFile(null);
            setInputKey((key) => key + 1);
        } catch (uploadError) {
            setError(uploadError instanceof Error ? uploadError.message : 'Curriculum upload failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-4 rounded-xl border border-indigo-500/20 bg-slate-950/60 p-3">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200"><FileUp className="h-4 w-4 text-indigo-300" />Course curriculum</div>
                {!checking && (attachedFileName ? <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-300">Attached</span> : <span className="rounded-full border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] font-bold text-slate-400">Not attached</span>)}
            </div>
            {checking ? <p className="mt-2 text-[11px] text-slate-500">Checking course attachment...</p> : attachedFileName ? <p className="mt-2 truncate text-[11px] text-emerald-300" title={attachedFileName}><CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />{attachedFileName}</p> : <p className="mt-2 text-[11px] text-slate-500">No curriculum file is attached to this course yet.</p>}
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input key={inputKey} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip" onChange={(event) => setFile(event.target.files?.[0] || null)} className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 p-2 text-[11px] text-slate-300 file:mr-2 file:rounded-md file:border-0 file:bg-indigo-500/20 file:px-2 file:py-1 file:text-[11px] file:font-bold file:text-indigo-200" />
                <button type="button" onClick={uploadCurriculum} disabled={!file || loading} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />}
                    {loading ? 'Uploading...' : attachedFileName ? 'Replace file' : 'Upload file'}
                </button>
            </div>
            {message && <p className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" />{message}</p>}
            {error && <p className="mt-2 text-[11px] text-red-300">{error}</p>}
            <p className="mt-2 text-[10px] text-slate-500">Private file, maximum 20 MB. Only enrolled students can download it.</p>
        </div>
    );
}
