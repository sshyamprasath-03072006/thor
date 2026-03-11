/**
 * PanicTriggerService.ts (Web Version)
 * ---------------------------------------
 * Detects a panic keyboard shortcut to trigger SOS.
 *
 * Web adaptation:
 *  - Volume button pattern (React Native) is not available in browsers.
 *  - Instead, we detect a rapid-fire key pattern:
 *    Press the 'p' key 3 times within 2 seconds.
 *  - Works when the page is focused (not when screen is off — browser limitation).
 *
 * Also supports:
 *  - Escape key 3 times in 2 seconds (alternative panic pattern).
 *  - Can be extended with Bluetooth button support via Web Bluetooth API.
 */

import { sosEngine } from './SOSEngine';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Number of key presses required to trigger SOS. */
const REQUIRED_PRESSES = 3;

/** Time window for the key pattern (ms). */
const TIME_WINDOW_MS = 2000;

/** Keys that count as panic triggers. */
const PANIC_KEYS = ['p', 'P', 'Escape'];

// ─── Service Class ───────────────────────────────────────────────────────────

export class PanicTriggerService {
    private pressTimestamps: number[] = [];
    private isListening = false;
    private keyHandler: ((e: KeyboardEvent) => void) | null = null;

    // ── Start Listening ─────────────────────────────────────────────────────

    /**
     * Begin listening for the panic key pattern.
     *
     * The pattern is: press a PANIC_KEY 3 times within 2 seconds.
     * On detection, triggers SOSEngine.triggerSOS('voice').
     */
    start(): void {
        if (this.isListening) return;

        this.keyHandler = (e: KeyboardEvent) => {
            if (!PANIC_KEYS.includes(e.key)) return;

            const now = Date.now();
            this.pressTimestamps.push(now);

            // Remove old timestamps outside the time window
            this.pressTimestamps = this.pressTimestamps.filter(
                (ts) => now - ts <= TIME_WINDOW_MS,
            );

            if (this.pressTimestamps.length >= REQUIRED_PRESSES) {
                this.pressTimestamps = []; // Reset
                this.onPanicDetected();
            }
        };

        document.addEventListener('keydown', this.keyHandler);
        this.isListening = true;

        console.log('[PanicTrigger] Listening for panic pattern (press P or Escape 3× in 2s).');
    }

    // ── Stop Listening ──────────────────────────────────────────────────────

    stop(): void {
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
            this.keyHandler = null;
        }
        this.isListening = false;
        this.pressTimestamps = [];

        console.log('[PanicTrigger] Stopped listening.');
    }

    // ── Panic Detected ──────────────────────────────────────────────────────

    private async onPanicDetected(): Promise<void> {
        console.log('[PanicTrigger] 🚨 Panic pattern detected!');

        // Fire a notification so the user can cancel
        if (Notification.permission === 'granted') {
            try {
                const notification = new Notification('🚨 SOS Triggered', {
                    body: 'Panic pattern detected — SOS will fire in 5 seconds. Tap to cancel.',
                    icon: '/favicon.ico',
                    tag: 'thor-panic-sos',
                    requireInteraction: true,
                });

                notification.onclick = () => {
                    sosEngine.cancelSOS();
                    notification.close();
                };
            } catch { /* fallback below */ }
        }

        // Vibrate on mobile browsers
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }

        // Dispatch custom event for UI layer
        window.dispatchEvent(
            new CustomEvent('thor-panic-triggered', {
                detail: { timestamp: Date.now() },
            }),
        );

        // Trigger SOS with 'voice' reason (panic trigger = voice equivalent)
        await sosEngine.triggerSOS('voice');
    }
}

// Singleton
export const panicTriggerService = new PanicTriggerService();
