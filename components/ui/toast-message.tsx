'use client';

import { X } from 'lucide-react';

interface ToastMessageProps {
    message: string;
    tone?: 'success' | 'error';
    onDismiss: () => void;
}

export function ToastMessage({ message, tone = 'success', onDismiss }: ToastMessageProps) {
    return (
        <div className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl ${tone === 'success' ? 'border-emerald-500/40 bg-emerald-950 text-emerald-100' : 'border-red-500/40 bg-red-950 text-red-100'}`} role="status">
            <span className="flex-1">{message}</span>
            <button type="button" onClick={onDismiss} aria-label="Dismiss notification" className="text-current/70 hover:text-current">
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
