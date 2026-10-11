'use client';

import React, { useState, useEffect } from 'react';
import { HardDrive, AlertTriangle, RefreshCw, CheckCircle2, Trash2 } from 'lucide-react';

type StorageMetrics = {
    totalAllocatedBytes: number;
    totalUsedBytes: number;
    freeBytes: number;
    usedPercentage: number;
    breakdown: {
        submissionsBytes: number;
        submissionsCount: number;
        curriculumBytes: number;
        assignmentMaterialsBytes: number;
        notesBytes: number;
    };
};

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
}

export function StorageMonitorBar({ onCleanComplete }: { onCleanComplete?: () => void }) {
    const [metrics, setMetrics] = useState<StorageMetrics | null>(null);
    const [loading, setLoading] = useState(false);

    const loadMetrics = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/instructor/storage-metrics');
            if (res.ok) {
                const data = await res.json();
                setMetrics(data);
            }
        } catch (e) {
            console.error('Failed to load storage metrics:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMetrics();
    }, []);

    if (!metrics) {
        return (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-400 flex items-center justify-between">
                <span className="flex items-center gap-2"><HardDrive className="h-4 w-4 text-slate-400" /> Storage Monitoring (1 GB Limit)</span>
                <span className="text-slate-500">Checking usage...</span>
            </div>
        );
    }

    const isNearLimit = metrics.usedPercentage >= 80;
    const isCritical = metrics.usedPercentage >= 95;

    return (
        <div className={`rounded-2xl border p-5 shadow-lg transition-all ${
            isCritical
                ? 'border-red-500/40 bg-red-950/20'
                : isNearLimit
                ? 'border-amber-500/40 bg-amber-950/20'
                : 'border-slate-800 bg-slate-900/90'
        }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${
                        isCritical ? 'bg-red-500/20 text-red-400' : isNearLimit ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'
                    }`}>
                        <HardDrive className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-white">File Storage Quota: 1 GB Limited</h3>
                            {isNearLimit && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    <AlertTriangle className="h-3 w-3" /> Storage High
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Submissions are retained while students are active and can be deleted after certificate issue to reclaim space.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <div className="text-xs font-semibold text-slate-300">
                            Occupied: <span className="font-bold text-white">{formatBytes(metrics.totalUsedBytes)}</span>
                            <span className="text-slate-500"> / 1.0 GB</span>
                        </div>
                        <div className="text-[11px] text-emerald-400 font-medium">
                            Free Space: <strong>{formatBytes(metrics.freeBytes)}</strong> ({Math.max(0, 100 - metrics.usedPercentage).toFixed(1)}% remaining)
                        </div>
                    </div>
                    <button
                        onClick={loadMetrics}
                        disabled={loading}
                        title="Refresh storage metrics"
                        className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
                <div className="h-2.5 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div
                        className={`h-full transition-all duration-500 ${
                            isCritical ? 'bg-red-500' : isNearLimit ? 'bg-amber-400' : 'bg-gradient-to-r from-emerald-500 to-indigo-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(2, metrics.usedPercentage))}%` }}
                    />
                </div>
            </div>

            {/* Mini Breakdown */}
            <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                <span>Student Submissions: <strong className="text-slate-200">{formatBytes(metrics.breakdown.submissionsBytes)}</strong> ({metrics.breakdown.submissionsCount} files)</span>
                <span>Curriculums: <strong className="text-slate-200">{formatBytes(metrics.breakdown.curriculumBytes)}</strong></span>
                <span>Assignment Materials: <strong className="text-slate-200">{formatBytes(metrics.breakdown.assignmentMaterialsBytes)}</strong></span>
                <span>Course Notes: <strong className="text-slate-200">{formatBytes(metrics.breakdown.notesBytes)}</strong></span>
            </div>
        </div>
    );
}
