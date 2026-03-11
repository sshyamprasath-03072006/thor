/**
 * SOSPage.tsx (Web Version)
 * --------------------------
 * Full SOS interface:
 *  - Large red SOS button (press-and-hold 2s to trigger)
 *  - 5-second countdown with cancel
 *  - Active SOS state: pulsing red, "HELP IS COMING"
 *  - Shows GPS, location, contacts being notified
 *  - Emergency info panel (local police, hospital, embassy)
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Phone, X, MapPin, Shield, AlertTriangle,
    Users, Building2, Siren, PhoneCall,
} from 'lucide-react';
import { sosEngine, SOSState } from '../services/SOSEngine';
import { emergencyContactsService, EmergencyContact, LOCAL_EMERGENCY_NUMBERS } from '../services/EmergencyContactsService';
import { useNavigate } from 'react-router';

export default function SOSPage() {
    const navigate = useNavigate();

    const [sosState, setSosState] = useState<SOSState>(sosEngine.getState());
    const [contacts, setContacts] = useState<EmergencyContact[]>([]);
    const [countdown, setCountdown] = useState(5);
    const [holdProgress, setHoldProgress] = useState(0);
    const holdTimerRef = useRef<number | null>(null);
    const holdStartRef = useRef<number>(0);
    const countdownRef = useRef<number | null>(null);

    // ── Load contacts & subscribe to SOS state ──────────────────────────────

    useEffect(() => {
        emergencyContactsService.getAllContacts().then(setContacts);

        const unsub = sosEngine.onStateChange((state) => {
            setSosState(state);
        });

        return () => { unsub(); };
    }, []);

    // ── Countdown timer ─────────────────────────────────────────────────────

    useEffect(() => {
        if (sosState === 'countdown') {
            setCountdown(5);
            countdownRef.current = window.setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(countdownRef.current!);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (countdownRef.current) clearInterval(countdownRef.current);
        }

        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, [sosState]);

    // ── Hold-to-trigger logic ───────────────────────────────────────────────

    const onHoldStart = useCallback(() => {
        if (sosState !== 'idle') return;

        holdStartRef.current = Date.now();
        const tick = () => {
            const elapsed = Date.now() - holdStartRef.current;
            const progress = Math.min(elapsed / 2000, 1); // 2 seconds to trigger
            setHoldProgress(progress);

            if (progress >= 1) {
                setHoldProgress(0);
                sosEngine.triggerSOS('button');
                return;
            }

            holdTimerRef.current = requestAnimationFrame(tick);
        };
        holdTimerRef.current = requestAnimationFrame(tick);
    }, [sosState]);

    const onHoldEnd = useCallback(() => {
        if (holdTimerRef.current) cancelAnimationFrame(holdTimerRef.current);
        setHoldProgress(0);
    }, []);

    // ── Cancel SOS ──────────────────────────────────────────────────────────

    const handleCancel = () => {
        sosEngine.cancelSOS();
    };

    // ── Location Info ───────────────────────────────────────────────────────
    const location = sosEngine.getLastLocation();

    // ── Render ──────────────────────────────────────────────────────────────

    return (
        <div className="min-h-[calc(100vh-180px)] flex flex-col items-center justify-between">

            {/* ── ACTIVE SOS STATE ──────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                {sosState === 'active' && (
                    <motion.div
                        key="active"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6"
                        style={{ background: 'rgba(127, 29, 29, 0.95)' }}
                    >
                        {/* Pulsing ring */}
                        <motion.div
                            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute w-64 h-64 rounded-full border-4 border-red-400"
                        />

                        <Siren className="w-20 h-20 text-white mb-6" />

                        <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
                            HELP IS COMING
                        </h1>
                        <p className="text-red-200 text-center max-w-xs mb-8">
                            Your emergency contacts and THOR Safety have been notified.
                        </p>

                        {/* Location info */}
                        {location && (
                            <div className="bg-black/40 rounded-2xl p-4 mb-6 w-full max-w-sm text-sm space-y-2">
                                <div className="flex items-center gap-2 text-white">
                                    <MapPin className="w-4 h-4 text-red-400 flex-shrink-0" />
                                    <span>{location.name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-red-200 font-mono text-xs">
                                    <span>Lat: {location.lat.toFixed(6)}</span>
                                    <span>Lng: {location.lng.toFixed(6)}</span>
                                </div>
                            </div>
                        )}

                        {/* Contacts being notified */}
                        {contacts.length > 0 && (
                            <div className="bg-black/30 rounded-2xl p-4 w-full max-w-sm mb-8">
                                <p className="text-xs text-red-300 font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Users className="w-3.5 h-3.5" /> Contacts Notified
                                </p>
                                {contacts.map((c) => (
                                    <div key={c.id} className="flex items-center justify-between py-1.5 text-sm text-white">
                                        <span>{c.name}</span>
                                        <a href={`tel:${c.phone}`} className="text-red-300 hover:text-white">
                                            <Phone className="w-4 h-4" />
                                        </a>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Cancel button */}
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCancel}
                            className="px-8 py-4 bg-white text-red-900 font-bold rounded-2xl text-lg shadow-2xl"
                        >
                            <X className="w-5 h-5 inline mr-2" />
                            I'm Safe — Cancel SOS
                        </motion.button>
                    </motion.div>
                )}

                {/* ── COUNTDOWN STATE ──────────────────────────────────────── */}
                {sosState === 'countdown' && (
                    <motion.div
                        key="countdown"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6"
                        style={{ background: 'rgba(127, 29, 29, 0.9)' }}
                    >
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="w-40 h-40 rounded-full bg-red-600 flex items-center justify-center mb-8 shadow-[0_0_80px_rgba(239,68,68,0.6)]"
                        >
                            <span className="text-7xl font-black text-white">{countdown}</span>
                        </motion.div>

                        <h2 className="text-2xl font-bold text-white mb-2">SOS Firing In...</h2>
                        <p className="text-red-200 mb-8 text-center">
                            SMS will be sent to all emergency contacts.
                        </p>

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCancel}
                            className="px-10 py-4 bg-white text-red-900 font-bold rounded-2xl text-lg shadow-2xl"
                        >
                            <X className="w-5 h-5 inline mr-2" />
                            CANCEL
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── IDLE STATE — Main SOS Button ────────────────────────────── */}
            {sosState === 'idle' && (
                <>
                    {/* Header */}
                    <div className="w-full text-center pt-4 mb-6">
                        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--thor-text)' }}>
                            Emergency SOS
                        </h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--thor-text-secondary)' }}>
                            Hold the button for 2 seconds to trigger SOS
                        </p>
                    </div>

                    {/* Big SOS Button */}
                    <div className="flex-1 flex items-center justify-center relative">
                        {/* Hold progress ring */}
                        <svg className="absolute w-56 h-56" viewBox="0 0 200 200">
                            <circle
                                cx="100" cy="100" r="90"
                                fill="none" stroke="rgba(239,68,68,0.15)" strokeWidth="8"
                            />
                            <circle
                                cx="100" cy="100" r="90"
                                fill="none" stroke="#ef4444" strokeWidth="8"
                                strokeDasharray={`${holdProgress * 565} 565`}
                                strokeLinecap="round"
                                transform="rotate(-90 100 100)"
                                style={{ transition: 'stroke-dasharray 0.05s linear' }}
                            />
                        </svg>

                        <motion.button
                            onPointerDown={onHoldStart}
                            onPointerUp={onHoldEnd}
                            onPointerLeave={onHoldEnd}
                            whileTap={{ scale: 0.95 }}
                            className="w-44 h-44 rounded-full bg-gradient-to-b from-red-500 to-red-700 flex flex-col items-center justify-center text-white shadow-[0_0_60px_rgba(239,68,68,0.4)] select-none active:shadow-[0_0_80px_rgba(239,68,68,0.8)] transition-shadow"
                        >
                            <AlertTriangle className="w-12 h-12 mb-1" />
                            <span className="text-3xl font-black tracking-wider">SOS</span>
                            <span className="text-[10px] opacity-70 mt-1 font-semibold">HOLD 2 SEC</span>
                        </motion.button>
                    </div>

                    {/* Emergency Info Panel */}
                    <div className="w-full space-y-3 pb-4">
                        <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                            style={{ color: 'var(--thor-text-secondary)' }}>
                            <Shield className="w-3.5 h-3.5" /> Emergency Numbers (India)
                        </h3>

                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { label: 'Police', number: LOCAL_EMERGENCY_NUMBERS.india.police, icon: Siren },
                                { label: 'Ambulance', number: LOCAL_EMERGENCY_NUMBERS.india.ambulance, icon: PhoneCall },
                                { label: 'Tourist Help', number: LOCAL_EMERGENCY_NUMBERS.india.tourist_helpline, icon: Building2 },
                                { label: 'Women Help', number: LOCAL_EMERGENCY_NUMBERS.india.women_helpline, icon: Phone },
                            ].map((item) => {
                                const Icon = item.icon;
                                return (
                                    <a
                                        key={item.label}
                                        href={`tel:${item.number}`}
                                        className="flex items-center gap-3 p-3 rounded-xl border transition-colors hover:bg-zinc-800"
                                        style={{ background: 'var(--thor-surface-2)', borderColor: 'var(--thor-border)' }}
                                    >
                                        <Icon className="w-4 h-4 text-red-400 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold truncate" style={{ color: 'var(--thor-text)' }}>{item.label}</p>
                                            <p className="text-xs font-mono" style={{ color: 'var(--thor-text-secondary)' }}>{item.number}</p>
                                        </div>
                                    </a>
                                );
                            })}
                        </div>

                        {/* My Contacts summary */}
                        <button
                            onClick={() => navigate('/sos-setup')}
                            className="w-full flex items-center justify-between p-3 rounded-xl border transition-colors hover:bg-zinc-800"
                            style={{ background: 'var(--thor-surface-2)', borderColor: 'var(--thor-border)' }}
                        >
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-yellow-500" />
                                <span className="text-sm font-semibold" style={{ color: 'var(--thor-text)' }}>
                                    My Emergency Contacts ({contacts.length})
                                </span>
                            </div>
                            <span className="text-xs" style={{ color: 'var(--thor-text-secondary)' }}>Edit →</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
