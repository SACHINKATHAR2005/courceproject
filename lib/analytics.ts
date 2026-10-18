/**
 * Lightweight event tracking utility with no external SDK dependencies.
 */

import { logEvent } from './logger';

export async function trackPageView(path: string): Promise<void> {
    try {
        const payload: Record<string, unknown> = {
            path,
            timestamp: new Date().toISOString(),
        };

        if (typeof window !== 'undefined') {
            payload.referrer = typeof document !== 'undefined' ? document.referrer || null : null;
            payload.title = typeof document !== 'undefined' ? document.title || null : null;
            payload.url = window.location.href;
            payload.screen_width = window.innerWidth;
            payload.screen_height = window.innerHeight;
        }

        await logEvent('page_view', payload);
    } catch {
        // Guard with try/catch (never throw)
    }
}

export async function trackEvent(
    name: string,
    properties?: Record<string, unknown>
): Promise<void> {
    try {
        await logEvent(name, {
            ...(properties || {}),
            timestamp: new Date().toISOString(),
        });
    } catch {
        // Guard with try/catch (never throw)
    }
}

export async function trackConsentGiven(accepted: boolean): Promise<void> {
    try {
        await logEvent('cookie_consent', {
            accepted,
            timestamp: new Date().toISOString(),
        });
    } catch {
        // Guard with try/catch (never throw)
    }
}
