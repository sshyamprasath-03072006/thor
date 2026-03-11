/**
 * AlertService.ts (Web Version)
 * ------------------------------
 * Fires local push notifications using the Web Notifications API.
 * Replaces React Native Notifee with standard browser notifications.
 *
 * Features:
 *  1. sendRiskAlert()       — urgent notification with risk-level-based title.
 *  2. sendSafetyCheckAlert() — periodic "are you safe?" check-in.
 *  3. clearAllAlerts()       — dismiss all active notifications.
 */

import { RiskZone, RiskLevel } from '../data/riskZoneDB';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Notification tag so we can replace/clear previous alerts. */
const ALERT_TAG_PREFIX = 'thor-safety-alert-';
const SAFETY_CHECK_TAG = 'thor-safety-check';

/** Title mapping by risk level — escalating urgency. */
const TITLE_MAP: Record<RiskLevel, string> = {
    critical: '🔴 CRITICAL ZONE',
    high: '🟠 HIGH RISK AREA',
    medium: '🟡 CAUTION',
    low: 'ℹ️ Advisory',
};

/** Icon URL for notifications (fallback to app icon). */
const NOTIFICATION_ICON = '/favicon.ico';

// ─── Service Class ───────────────────────────────────────────────────────────

export class AlertService {
    private permissionGranted = false;

    // ── Request Permission ──────────────────────────────────────────────────

    /**
     * Request notification permission from the user.
     *
     * Must be called from a user-initiated event (click/tap) on most browsers.
     * We call this early in the app lifecycle (e.g. on login or first GPS enable).
     */
    async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            console.warn('[AlertService] Web Notifications not supported in this browser.');
            return false;
        }

        if (Notification.permission === 'granted') {
            this.permissionGranted = true;
            return true;
        }

        if (Notification.permission === 'denied') {
            console.warn('[AlertService] Notification permission was previously denied.');
            return false;
        }

        // Ask the user
        const result = await Notification.requestPermission();
        this.permissionGranted = result === 'granted';
        return this.permissionGranted;
    }

    // ── Send Risk Alert ─────────────────────────────────────────────────────

    /**
     * Fire a risk alert notification.
     *
     * @param zone  The risk zone that triggered the alert.
     * @param score The composite risk score (0.0–1.0).
     *
     * Notification anatomy:
     *  - Title: based on risk_level (e.g. "🔴 CRITICAL ZONE")
     *  - Body: zone.reason + score percentage
     *  - Tag: unique per zone so duplicate alerts replace each other
     *  - requireInteraction: true for critical/high (notification stays visible)
     *  - actions: available if Service Worker is registered (Get Safe Route, I'm OK, SOS)
     */
    sendRiskAlert(zone: RiskZone, score: number): void {
        const title = TITLE_MAP[zone.risk_level] || 'Safety Alert';
        const scorePercent = Math.round(score * 100);

        const body = `${zone.reason}\n\nRisk Score: ${scorePercent}% • ${zone.category.replace('_', ' ').toUpperCase()}`;

        // Basic Web Notification (no Service Worker required)
        if (this.permissionGranted || Notification.permission === 'granted') {
            try {
                const notification = new Notification(title, {
                    body,
                    icon: NOTIFICATION_ICON,
                    tag: `${ALERT_TAG_PREFIX}${zone.id}`,
                    requireInteraction: zone.risk_level === 'critical' || zone.risk_level === 'high',
                    silent: zone.risk_level === 'low', // No sound for low-risk
                });

                // Vibrate for critical alerts (only works on mobile browsers)
                if (zone.risk_level === 'critical' && navigator.vibrate) {
                    navigator.vibrate([0, 500, 200, 500]);
                } else if (zone.risk_level === 'high' && navigator.vibrate) {
                    navigator.vibrate([0, 300, 100, 300]);
                }

                // Auto-close low/medium alerts after 10 seconds
                if (zone.risk_level === 'low' || zone.risk_level === 'medium') {
                    setTimeout(() => notification.close(), 10_000);
                }

                // Click handler — navigate to safety map
                notification.onclick = () => {
                    window.focus();
                    window.location.hash = '#/map';
                    notification.close();
                };

                console.log(`[AlertService] Risk alert fired: ${title} (score: ${scorePercent}%)`);
            } catch (err) {
                console.error('[AlertService] Failed to create notification:', err);
                // Fallback: use in-app alert
                this.fallbackAlert(title, body);
            }
        } else {
            // Browser permission not granted — fall back to in-app alert
            this.fallbackAlert(title, body);
        }
    }

    // ── Safety Check Alert ──────────────────────────────────────────────────

    /**
     * Send a periodic "are you safe?" check-in notification.
     * Used when the tourist has been in a risk zone for an extended period.
     */
    sendSafetyCheckAlert(): void {
        const title = '🛡️ Safety Check';
        const body = 'You\'ve been in a risk area for a while. Are you safe?\n\nTap to confirm you\'re OK or request assistance.';

        if (this.permissionGranted || Notification.permission === 'granted') {
            try {
                const notification = new Notification(title, {
                    body,
                    icon: NOTIFICATION_ICON,
                    tag: SAFETY_CHECK_TAG,
                    requireInteraction: true,
                });

                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };
            } catch {
                this.fallbackAlert(title, body);
            }
        } else {
            this.fallbackAlert(title, body);
        }
    }

    // ── Clear All Alerts ────────────────────────────────────────────────────

    /**
     * Close all active notifications created by this service.
     *
     * Note: The basic Notification API doesn't provide a way to list
     * active notifications. We rely on the Service Worker's
     * getNotifications() if available, otherwise this is a no-op.
     */
    async clearAllAlerts(): Promise<void> {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            try {
                const registration = await navigator.serviceWorker.ready;
                const notifications = await registration.getNotifications();
                notifications.forEach((n) => n.close());
                console.log(`[AlertService] Cleared ${notifications.length} notifications.`);
            } catch {
                console.warn('[AlertService] Could not clear notifications via Service Worker.');
            }
        }
    }

    // ── Fallback for No Permission ──────────────────────────────────────────

    /**
     * When notification permission is denied or unavailable, dispatch
     * a custom DOM event so the app UI can show an in-app toast.
     */
    private fallbackAlert(title: string, body: string): void {
        console.warn(`[AlertService] Fallback alert: ${title} — ${body}`);

        // Dispatch a custom event the UI layer can listen for
        window.dispatchEvent(
            new CustomEvent('thor-safety-alert', {
                detail: { title, body, timestamp: Date.now() },
            }),
        );
    }
}

// Singleton
export const alertService = new AlertService();
