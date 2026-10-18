'use client';

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useSyncExternalStore,
    ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

export interface ToastOptions {
    type?: ToastType;
    duration?: number;
}

type ToastFunction = {
    (message: string, typeOrOptions?: ToastType | ToastOptions, duration?: number): void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
};

interface ToastContextType {
    toasts: ToastItem[];
    showToast: ToastFunction;
    toast: ToastFunction;
    dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Module-level emitter for imperative `showToast` outside of React components
type GlobalToastHandler = (message: string, typeOrOptions?: ToastType | ToastOptions, duration?: number) => void;
let globalToastHandler: GlobalToastHandler | null = null;
const pendingQueue: Array<{
    message: string;
    typeOrOptions?: ToastType | ToastOptions;
    duration?: number;
}> = [];

/**
 * Imperative toast trigger callable anywhere, even outside React components.
 */
export const showToast = ((
    message: string,
    typeOrOptions?: ToastType | ToastOptions,
    duration?: number
) => {
    if (globalToastHandler) {
        globalToastHandler(message, typeOrOptions, duration);
    } else {
        pendingQueue.push({ message, typeOrOptions, duration });
    }
}) as ToastFunction;

showToast.success = (message: string, duration?: number) => showToast(message, 'success', duration);
showToast.error = (message: string, duration?: number) => showToast(message, 'error', duration);
showToast.info = (message: string, duration?: number) => showToast(message, 'info', duration);
showToast.warning = (message: string, duration?: number) => showToast(message, 'warning', duration);

// Helpers for reduced motion and SSR-safe mounting
function subscribeReducedMotion(callback: () => void) {
    if (typeof window === 'undefined') return () => {};
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    mq.addEventListener?.('change', callback);
    return () => mq.removeEventListener?.('change', callback);
}

function getReducedMotionSnapshot(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getReducedMotionServerSnapshot(): boolean {
    return false;
}

function subscribeNoop() {
    return () => {};
}

function getMountedSnapshot(): boolean {
    return true;
}

function getMountedServerSnapshot(): boolean {
    return false;
}

interface ToastCardProps {
    toast: ToastItem;
    onDismiss: (id: string) => void;
    prefersReducedMotion: boolean;
}

function ToastCard({ toast, onDismiss, prefersReducedMotion }: ToastCardProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        let active = true;
        const raf = requestAnimationFrame(() => {
            if (active) {
                setIsVisible(true);
            }
        });
        return () => {
            active = false;
            cancelAnimationFrame(raf);
        };
    }, []);

    useEffect(() => {
        const defaultDuration = toast.type === 'error' ? 6000 : 4000;
        const finalDuration = toast.duration ?? defaultDuration;

        const timer = setTimeout(() => {
            onDismiss(toast.id);
        }, finalDuration);

        return () => clearTimeout(timer);
    }, [toast.id, toast.type, toast.duration, onDismiss]);

    return (
        <div
            role="alert"
            aria-live="polite"
            className={`pointer-events-auto flex w-80 sm:w-96 items-start gap-3 rounded-xl border border-slate-200/90 bg-white p-4 shadow-lg transition-all duration-300 ease-out motion-reduce:transition-none motion-reduce:transform-none ${
                prefersReducedMotion || isVisible
                    ? 'translate-x-0 opacity-100'
                    : 'translate-x-full opacity-0'
            }`}
        >
            <div className="shrink-0 mt-0.5">
                {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                {toast.type === 'error' && <XCircle className="h-5 w-5 text-rose-600" />}
                {toast.type === 'info' && <Info className="h-5 w-5 text-blue-600" />}
                {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500" />}
            </div>

            <div className="flex-1 text-sm font-medium text-slate-800 leading-snug break-words">
                {toast.message}
            </div>

            <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss notification"
                className="shrink-0 -mr-1 -mt-1 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const isMounted = useSyncExternalStore(
        subscribeNoop,
        getMountedSnapshot,
        getMountedServerSnapshot
    );

    const prefersReducedMotion = useSyncExternalStore(
        subscribeReducedMotion,
        getReducedMotionSnapshot,
        getReducedMotionServerSnapshot
    );

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const triggerToast = useCallback(
        (message: string, typeOrOptions?: ToastType | ToastOptions, duration?: number) => {
            let toastType: ToastType = 'info';
            let toastDuration = duration;

            if (typeof typeOrOptions === 'string') {
                toastType = typeOrOptions;
            } else if (typeOrOptions && typeof typeOrOptions === 'object') {
                if (typeOrOptions.type) toastType = typeOrOptions.type;
                if (typeOrOptions.duration !== undefined) toastDuration = typeOrOptions.duration;
            }

            const uniqueId =
                typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                    ? crypto.randomUUID()
                    : `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

            const newToast: ToastItem = {
                id: uniqueId,
                message,
                type: toastType,
                duration: toastDuration,
            };

            setToasts((prev) => {
                const next = [...prev, newToast];
                // Stack up to 5 toasts (keep the newest 5)
                if (next.length > 5) {
                    return next.slice(next.length - 5);
                }
                return next;
            });
        },
        []
    );

    useEffect(() => {
        globalToastHandler = triggerToast;

        if (pendingQueue.length > 0) {
            const queueCopy = [...pendingQueue];
            pendingQueue.length = 0;
            queueMicrotask(() => {
                for (const item of queueCopy) {
                    triggerToast(item.message, item.typeOrOptions, item.duration);
                }
            });
        }

        return () => {
            globalToastHandler = null;
        };
    }, [triggerToast]);

    return (
        <ToastContext.Provider
            value={{
                toasts,
                showToast,
                toast: showToast,
                dismissToast,
            }}
        >
            {children}
            {isMounted && typeof document !== 'undefined'
                ? createPortal(
                      <div
                          className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-[calc(100vw-2rem)]"
                          aria-live="polite"
                          aria-atomic="false"
                      >
                          {toasts.map((toast) => (
                              <ToastCard
                                  key={toast.id}
                                  toast={toast}
                                  onDismiss={dismissToast}
                                  prefersReducedMotion={prefersReducedMotion}
                              />
                          ))}
                      </div>,
                      document.body
                  )
                : null}
        </ToastContext.Provider>
    );
}

export function useToast(): ToastContextType {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
