/**
 * SOSSetupPage.tsx (Web Version)
 * --------------------------------
 * Mandatory setup wizard before SOS features activate.
 *
 * Steps:
 *  1. Add emergency contacts (name, phone, relation)
 *  2. Test SOS (sends test message)
 *  3. Review what happens during SOS
 *
 * Cannot skip — marks setup complete in localStorage.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    UserPlus, Phone, Check, ChevronRight, ChevronLeft,
    Trash2, Star, Shield, AlertTriangle, MessageSquare,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import {
    emergencyContactsService,
    EmergencyContact,
} from '../services/EmergencyContactsService';


export default function SOSSetupPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [contacts, setContacts] = useState<EmergencyContact[]>([]);

    // Form state
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [relation, setRelation] = useState('');
    const [isPrimary, setIsPrimary] = useState(false);

    // Test state
    const [testSent, setTestSent] = useState(false);

    useEffect(() => {
        emergencyContactsService.getAllContacts().then(setContacts);
    }, []);

    // ── Add Contact ─────────────────────────────────────────────────────────

    const addContact = async () => {
        if (!name.trim() || !phone.trim()) return;

        const contact: EmergencyContact = {
            id: `ec-${Date.now()}`,
            name: name.trim(),
            phone: phone.trim(),
            relation: relation.trim() || 'Other',
            is_primary: isPrimary || contacts.length === 0, // first contact is auto-primary
        };

        await emergencyContactsService.addContact(contact);
        const updated = await emergencyContactsService.getAllContacts();
        setContacts(updated);

        // Reset form
        setName('');
        setPhone('');
        setRelation('');
        setIsPrimary(false);
    };

    const removeContact = async (id: string) => {
        await emergencyContactsService.removeContact(id);
        const updated = await emergencyContactsService.getAllContacts();
        setContacts(updated);
    };

    // ── Send Test ───────────────────────────────────────────────────────────

    const sendTest = () => {
        const testMessage = `✅ THOR Safety Test — This is a test SOS message. No emergency. Sent at ${new Date().toLocaleString()}.`;

        // Use Web Share API or open SMS link
        if (navigator.share) {
            navigator.share({ title: 'THOR Test SOS', text: testMessage }).catch(() => { });
        } else if (contacts[0]) {
            window.open(`sms:${encodeURIComponent(contacts[0].phone)}?body=${encodeURIComponent(testMessage)}`, '_blank');
        }

        setTestSent(true);
    };

    // ── Complete Setup ──────────────────────────────────────────────────────

    const completeSetup = () => {
        emergencyContactsService.markSetupComplete();
        navigate('/sos');
    };

    // ── Can Proceed ─────────────────────────────────────────────────────────

    const canProceedFromStep1 = contacts.length >= 1;


    return (
        <div className="min-h-[calc(100vh-180px)] flex flex-col">
            {/* Progress Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-black tracking-tight mb-1" style={{ color: 'var(--thor-text)' }}>
                    SOS Setup
                </h1>
                <p className="text-sm" style={{ color: 'var(--thor-text-secondary)' }}>
                    Step {step} of 3 — {step === 1 ? 'Emergency Contacts' : step === 2 ? 'Test SOS' : 'Review'}
                </p>

                {/* Progress bar */}
                <div className="flex gap-2 mt-4">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className="h-1.5 flex-1 rounded-full transition-colors duration-300"
                            style={{
                                background: s <= step ? '#ef4444' : 'var(--thor-border)',
                            }}
                        />
                    ))}
                </div>
            </div>

            {/* Step Content */}
            <div className="flex-1">
                <AnimatePresence mode="wait">
                    {/* ── STEP 1: Add Contacts ───────────────────────────── */}
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center gap-2 mb-2">
                                <UserPlus className="w-5 h-5 text-red-400" />
                                <h2 className="text-lg font-bold" style={{ color: 'var(--thor-text)' }}>
                                    Emergency Contacts
                                </h2>
                            </div>

                            <p className="text-sm" style={{ color: 'var(--thor-text-secondary)' }}>
                                Add at least one person who should be notified during an emergency.
                            </p>

                            {/* Contact Form */}
                            <div className="space-y-3 p-4 rounded-2xl border"
                                style={{ background: 'var(--thor-surface-2)', borderColor: 'var(--thor-border)' }}>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Full Name"
                                    className="w-full px-4 py-3 rounded-xl text-sm bg-black/30 border outline-none focus:border-red-500 transition-colors"
                                    style={{ color: 'var(--thor-text)', borderColor: 'var(--thor-border)' }}
                                />
                                <input
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Phone Number (+91...)"
                                    type="tel"
                                    className="w-full px-4 py-3 rounded-xl text-sm bg-black/30 border outline-none focus:border-red-500 transition-colors"
                                    style={{ color: 'var(--thor-text)', borderColor: 'var(--thor-border)' }}
                                />
                                <input
                                    value={relation}
                                    onChange={(e) => setRelation(e.target.value)}
                                    placeholder="Relation (e.g. Spouse, Friend, Parent)"
                                    className="w-full px-4 py-3 rounded-xl text-sm bg-black/30 border outline-none focus:border-red-500 transition-colors"
                                    style={{ color: 'var(--thor-text)', borderColor: 'var(--thor-border)' }}
                                />

                                <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--thor-text-secondary)' }}>
                                    <input
                                        type="checkbox"
                                        checked={isPrimary}
                                        onChange={(e) => setIsPrimary(e.target.checked)}
                                        className="accent-red-500"
                                    />
                                    <Star className="w-3.5 h-3.5 text-yellow-500" />
                                    Set as primary contact
                                </label>

                                <button
                                    onClick={addContact}
                                    disabled={!name.trim() || !phone.trim()}
                                    className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
                                    style={{
                                        background: name.trim() && phone.trim() ? '#ef4444' : 'var(--thor-surface-3)',
                                        color: name.trim() && phone.trim() ? '#fff' : 'var(--thor-text-secondary)',
                                    }}
                                >
                                    <UserPlus className="w-4 h-4 inline mr-2" /> Add Contact
                                </button>
                            </div>

                            {/* Contact List */}
                            {contacts.length > 0 && (
                                <div className="space-y-2">
                                    <h3 className="text-xs font-bold uppercase tracking-widest"
                                        style={{ color: 'var(--thor-text-secondary)' }}>
                                        Added ({contacts.length})
                                    </h3>
                                    {contacts.map((c) => (
                                        <div
                                            key={c.id}
                                            className="flex items-center justify-between p-3 rounded-xl border"
                                            style={{ background: 'var(--thor-surface-3)', borderColor: 'var(--thor-border)' }}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${c.is_primary ? 'bg-yellow-500/20 text-yellow-500' : 'bg-zinc-800 text-zinc-400'}`}>
                                                    {c.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--thor-text)' }}>
                                                        {c.name} {c.is_primary && <span className="text-yellow-500 text-[10px]">★ PRIMARY</span>}
                                                    </p>
                                                    <p className="text-xs truncate" style={{ color: 'var(--thor-text-secondary)' }}>
                                                        {c.phone} · {c.relation}
                                                    </p>
                                                </div>
                                            </div>
                                            <button onClick={() => removeContact(c.id)} className="text-zinc-500 hover:text-red-400 transition-colors p-1">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── STEP 2: Test SOS ────────────────────────────────── */}
                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-red-400" />
                                <h2 className="text-lg font-bold" style={{ color: 'var(--thor-text)' }}>Test SOS Message</h2>
                            </div>

                            <p className="text-sm" style={{ color: 'var(--thor-text-secondary)' }}>
                                Send a test message to verify your contacts can receive alerts.
                                This sends a clearly labeled <strong>test</strong> message — not a real SOS.
                            </p>

                            {/* Preview */}
                            <div className="p-4 rounded-2xl border font-mono text-xs leading-relaxed"
                                style={{ background: 'var(--thor-surface-2)', borderColor: 'var(--thor-border)', color: 'var(--thor-text-secondary)' }}>
                                ✅ THOR Safety Test — This is a test SOS message. No emergency.
                            </div>

                            <button
                                onClick={sendTest}
                                disabled={testSent}
                                className="w-full py-4 rounded-xl font-semibold text-sm transition-all"
                                style={{
                                    background: testSent ? 'var(--thor-surface-3)' : '#ef4444',
                                    color: testSent ? '#22c55e' : '#fff',
                                }}
                            >
                                {testSent ? (
                                    <><Check className="w-4 h-4 inline mr-2" /> Test Sent!</>
                                ) : (
                                    <><Phone className="w-4 h-4 inline mr-2" /> Send Test Message</>
                                )}
                            </button>

                            {!testSent && (
                                <p className="text-xs text-center" style={{ color: 'var(--thor-text-secondary)' }}>
                                    You can skip this step if you prefer.
                                </p>
                            )}
                        </motion.div>
                    )}

                    {/* ── STEP 3: Review ──────────────────────────────────── */}
                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-red-400" />
                                <h2 className="text-lg font-bold" style={{ color: 'var(--thor-text)' }}>What Happens During SOS</h2>
                            </div>

                            <div className="space-y-3">
                                {[
                                    {
                                        icon: AlertTriangle,
                                        title: 'Hold SOS Button for 2 seconds',
                                        desc: 'A 5-second countdown starts — you can cancel anytime.',
                                    },
                                    {
                                        icon: Phone,
                                        title: 'SMS sent to all contacts',
                                        desc: 'Your GPS coordinates and a Google Maps link are included.',
                                    },
                                    {
                                        icon: Shield,
                                        title: 'THOR backend notified',
                                        desc: 'Our support team will try to contact you and local authorities.',
                                    },
                                    {
                                        icon: MessageSquare,
                                        title: 'Auto-resend after 30 seconds',
                                        desc: 'If not cancelled, the SOS message is resent automatically.',
                                    },
                                ].map((item, i) => {
                                    const Icon = item.icon;
                                    return (
                                        <div
                                            key={i}
                                            className="flex items-start gap-3 p-4 rounded-xl border"
                                            style={{ background: 'var(--thor-surface-2)', borderColor: 'var(--thor-border)' }}
                                        >
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 flex-shrink-0">
                                                <Icon className="w-4 h-4 text-red-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold" style={{ color: 'var(--thor-text)' }}>{item.title}</p>
                                                <p className="text-xs mt-0.5" style={{ color: 'var(--thor-text-secondary)' }}>{item.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Panic trigger info */}
                            <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
                                <p className="text-sm font-semibold text-yellow-500 mb-1">⌨️ Keyboard Panic Trigger</p>
                                <p className="text-xs" style={{ color: 'var(--thor-text-secondary)' }}>
                                    Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-xs font-mono">P</kbd> or{' '}
                                    <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-xs font-mono">Escape</kbd>{' '}
                                    3 times within 2 seconds to silently trigger SOS from anywhere in the app.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-6 pb-4">
                {step > 1 && (
                    <button
                        onClick={() => setStep(step - 1)}
                        className="flex-1 py-3.5 rounded-xl font-semibold text-sm border transition-colors hover:bg-zinc-800"
                        style={{ borderColor: 'var(--thor-border)', color: 'var(--thor-text)' }}
                    >
                        <ChevronLeft className="w-4 h-4 inline mr-1" /> Back
                    </button>
                )}

                {step < 3 ? (
                    <button
                        onClick={() => setStep(step + 1)}
                        disabled={step === 1 && !canProceedFromStep1}
                        className="flex-1 py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
                        style={{
                            background: (step === 1 && canProceedFromStep1) || step === 2 ? '#ef4444' : 'var(--thor-surface-3)',
                            color: '#fff',
                        }}
                    >
                        Next <ChevronRight className="w-4 h-4 inline ml-1" />
                    </button>
                ) : (
                    <button
                        onClick={completeSetup}
                        className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-green-600 text-white transition-all hover:bg-green-500"
                    >
                        <Check className="w-4 h-4 inline mr-1" /> Complete Setup
                    </button>
                )}
            </div>
        </div>
    );
}
