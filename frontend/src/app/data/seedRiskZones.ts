/**
 * seedRiskZones.ts
 * -----------------
 * Realistic placeholder risk zones for 5 Indian cities.
 * This seed data pre-populates the local IndexedDB so the safety
 * features work immediately — even before the first API sync.
 *
 * Data will be replaced / augmented by live API data when online.
 */

import { RiskZone, riskZoneDB } from './riskZoneDB';

// ─── Seed Data ───────────────────────────────────────────────────────────────

const seedZones: RiskZone[] = [
    // ══════════════════════════════════════════════════════════════════════
    //  CHENNAI (12 zones)
    // ══════════════════════════════════════════════════════════════════════
    {
        id: 'chn-001', city: 'chennai', lat: 13.0827, lng: 80.2707,
        radius_meters: 500, risk_level: 'medium', category: 'scam',
        reason: 'Auto-rickshaw overcharging hotspot near Central Station.',
        active_hours_start: null, active_hours_end: null, updated_at: Date.now(),
    },
    {
        id: 'chn-002', city: 'chennai', lat: 13.0604, lng: 80.2496,
        radius_meters: 400, risk_level: 'high', category: 'crime',
        reason: 'Reported chain-snatching incidents near T. Nagar market.',
        active_hours_start: 18, active_hours_end: 23, updated_at: Date.now(),
    },
    {
        id: 'chn-003', city: 'chennai', lat: 13.0108, lng: 80.2267,
        radius_meters: 600, risk_level: 'low', category: 'unsafe_night',
        reason: 'Poorly lit stretch along Adyar river walkway.',
        active_hours_start: 20, active_hours_end: 5, updated_at: Date.now(),
    },
    {
        id: 'chn-004', city: 'chennai', lat: 13.0569, lng: 80.2425,
        radius_meters: 300, risk_level: 'medium', category: 'scam',
        reason: 'Fake gem dealers operating near Pondy Bazaar.',
        active_hours_start: 10, active_hours_end: 20, updated_at: Date.now(),
    },
    {
        id: 'chn-005', city: 'chennai', lat: 13.0878, lng: 80.2785,
        radius_meters: 350, risk_level: 'high', category: 'crime',
        reason: 'Pickpocketing reported in crowded Parry\'s Corner area.',
        active_hours_start: 8, active_hours_end: 20, updated_at: Date.now(),
    },
    {
        id: 'chn-006', city: 'chennai', lat: 13.0498, lng: 80.2662,
        radius_meters: 800, risk_level: 'critical', category: 'protest',
        reason: 'Frequent political protests near Marina Beach — road closures possible.',
        active_hours_start: null, active_hours_end: null, updated_at: Date.now(),
    },
    {
        id: 'chn-007', city: 'chennai', lat: 13.0673, lng: 80.2376,
        radius_meters: 250, risk_level: 'low', category: 'scam',
        reason: 'Overpriced tourist guides near Kapaleeshwarar Temple.',
        active_hours_start: 8, active_hours_end: 18, updated_at: Date.now(),
    },
    {
        id: 'chn-008', city: 'chennai', lat: 13.1109, lng: 80.2929,
        radius_meters: 500, risk_level: 'medium', category: 'unsafe_night',
        reason: 'Isolated industrial area near Tondiarpet — avoid after dark.',
        active_hours_start: 21, active_hours_end: 5, updated_at: Date.now(),
    },
    {
        id: 'chn-009', city: 'chennai', lat: 13.0073, lng: 80.2569,
        radius_meters: 200, risk_level: 'medium', category: 'restricted',
        reason: 'Military facility perimeter — photography prohibited.',
        active_hours_start: null, active_hours_end: null, updated_at: Date.now(),
    },
    {
        id: 'chn-010', city: 'chennai', lat: 13.0359, lng: 80.2431,
        radius_meters: 300, risk_level: 'low', category: 'scam',
        reason: 'Currency exchange scams reported on Ranganathan Street.',
        active_hours_start: 10, active_hours_end: 21, updated_at: Date.now(),
    },

    // ══════════════════════════════════════════════════════════════════════
    //  MUMBAI (10 zones)
    // ══════════════════════════════════════════════════════════════════════
    {
        id: 'mum-001', city: 'mumbai', lat: 19.0760, lng: 72.8777,
        radius_meters: 600, risk_level: 'high', category: 'crime',
        reason: 'High pickpocketing risk in crowded CST station complex.',
        active_hours_start: 7, active_hours_end: 22, updated_at: Date.now(),
    },
    {
        id: 'mum-002', city: 'mumbai', lat: 19.0176, lng: 72.8561,
        radius_meters: 400, risk_level: 'medium', category: 'scam',
        reason: 'Taxi meter rigging near Colaba Causeway for tourists.',
        active_hours_start: null, active_hours_end: null, updated_at: Date.now(),
    },
    {
        id: 'mum-003', city: 'mumbai', lat: 19.0558, lng: 72.8410,
        radius_meters: 500, risk_level: 'critical', category: 'unsafe_night',
        reason: 'Kamathipura area — unsafe for tourists especially at night.',
        active_hours_start: 20, active_hours_end: 6, updated_at: Date.now(),
    },
    {
        id: 'mum-004', city: 'mumbai', lat: 19.0822, lng: 72.8830,
        radius_meters: 700, risk_level: 'medium', category: 'protest',
        reason: 'Protest hotspot near Azad Maidan — frequent demonstrations.',
        active_hours_start: null, active_hours_end: null, updated_at: Date.now(),
    },
    {
        id: 'mum-005', city: 'mumbai', lat: 19.0330, lng: 72.8430,
        radius_meters: 300, risk_level: 'high', category: 'scam',
        reason: 'Fake tour operators near Gateway of India.',
        active_hours_start: 9, active_hours_end: 19, updated_at: Date.now(),
    },
    {
        id: 'mum-006', city: 'mumbai', lat: 19.1136, lng: 72.8697,
        radius_meters: 450, risk_level: 'medium', category: 'crime',
        reason: 'Bag snatching incidents reported near Dadar station.',
        active_hours_start: 17, active_hours_end: 23, updated_at: Date.now(),
    },
    {
        id: 'mum-007', city: 'mumbai', lat: 19.0639, lng: 72.8362,
        radius_meters: 350, risk_level: 'low', category: 'restricted',
        reason: 'Naval dockyard perimeter — restricted access zone.',
        active_hours_start: null, active_hours_end: null, updated_at: Date.now(),
    },
    {
        id: 'mum-008', city: 'mumbai', lat: 19.1769, lng: 72.9503,
        radius_meters: 600, risk_level: 'high', category: 'unsafe_night',
        reason: 'Isolated marshland near Airoli — no streetlights after dark.',
        active_hours_start: 20, active_hours_end: 6, updated_at: Date.now(),
    },
    {
        id: 'mum-009', city: 'mumbai', lat: 19.0425, lng: 72.8208,
        radius_meters: 250, risk_level: 'low', category: 'scam',
        reason: 'Overpriced souvenir shops targeting tourists at Haji Ali.',
        active_hours_start: 10, active_hours_end: 18, updated_at: Date.now(),
    },
    {
        id: 'mum-010', city: 'mumbai', lat: 19.0918, lng: 72.8880,
        radius_meters: 400, risk_level: 'medium', category: 'crime',
        reason: 'Phone snatching incidents near Byculla bridge.',
        active_hours_start: 18, active_hours_end: 23, updated_at: Date.now(),
    },

    // ══════════════════════════════════════════════════════════════════════
    //  DELHI (10 zones)
    // ══════════════════════════════════════════════════════════════════════
    {
        id: 'del-001', city: 'delhi', lat: 28.6562, lng: 77.2410,
        radius_meters: 500, risk_level: 'critical', category: 'scam',
        reason: 'Aggressive touts and fake travel agents at New Delhi Railway Station.',
        active_hours_start: null, active_hours_end: null, updated_at: Date.now(),
    },
    {
        id: 'del-002', city: 'delhi', lat: 28.6506, lng: 77.2334,
        radius_meters: 600, risk_level: 'high', category: 'scam',
        reason: 'Fake "official" tourist offices in Paharganj — redirect tourists to overpriced hotels.',
        active_hours_start: 8, active_hours_end: 22, updated_at: Date.now(),
    },
    {
        id: 'del-003', city: 'delhi', lat: 28.6587, lng: 77.2229,
        radius_meters: 700, risk_level: 'high', category: 'crime',
        reason: 'Pickpocketing and bag theft in Connaught Place crowds.',
        active_hours_start: 10, active_hours_end: 22, updated_at: Date.now(),
    },
    {
        id: 'del-004', city: 'delhi', lat: 28.6517, lng: 77.3064,
        radius_meters: 800, risk_level: 'critical', category: 'unsafe_night',
        reason: 'Isolated roads near Yamuna bank — extremely unsafe after dark.',
        active_hours_start: 20, active_hours_end: 6, updated_at: Date.now(),
    },
    {
        id: 'del-005', city: 'delhi', lat: 28.6507, lng: 77.2502,
        radius_meters: 400, risk_level: 'medium', category: 'scam',
        reason: 'Rickshaw overcharging tourists near Red Fort entrance.',
        active_hours_start: 8, active_hours_end: 18, updated_at: Date.now(),
    },
    {
        id: 'del-006', city: 'delhi', lat: 28.6127, lng: 77.2295,
        radius_meters: 350, risk_level: 'medium', category: 'crime',
        reason: 'Mobile phone thefts near Sarojini Nagar market.',
        active_hours_start: 12, active_hours_end: 21, updated_at: Date.now(),
    },
    {
        id: 'del-007', city: 'delhi', lat: 28.5729, lng: 77.2090,
        radius_meters: 300, risk_level: 'low', category: 'scam',
        reason: 'Overpriced handicraft shops targeting tourists near Qutub Minar.',
        active_hours_start: 9, active_hours_end: 17, updated_at: Date.now(),
    },
    {
        id: 'del-008', city: 'delhi', lat: 28.7041, lng: 77.1025,
        radius_meters: 600, risk_level: 'high', category: 'protest',
        reason: 'Frequent political rallies and road blockades near Jantar Mantar.',
        active_hours_start: null, active_hours_end: null, updated_at: Date.now(),
    },
    {
        id: 'del-009', city: 'delhi', lat: 28.6369, lng: 77.2249,
        radius_meters: 200, risk_level: 'low', category: 'restricted',
        reason: 'High security zone near Parliament — movement restricted.',
        active_hours_start: null, active_hours_end: null, updated_at: Date.now(),
    },
    {
        id: 'del-010', city: 'delhi', lat: 28.6304, lng: 77.2177,
        radius_meters: 400, risk_level: 'medium', category: 'unsafe_night',
        reason: 'Dimly lit Lodhi Garden paths — avoid solo walks after sunset.',
        active_hours_start: 19, active_hours_end: 6, updated_at: Date.now(),
    },

    // ══════════════════════════════════════════════════════════════════════
    //  JAIPUR (8 zones)
    // ══════════════════════════════════════════════════════════════════════
    {
        id: 'jai-001', city: 'jaipur', lat: 26.9239, lng: 75.8267,
        radius_meters: 400, risk_level: 'high', category: 'scam',
        reason: 'Gem scam operators near Hawa Mahal — fake gemstone sales.',
        active_hours_start: 9, active_hours_end: 19, updated_at: Date.now(),
    },
    {
        id: 'jai-002', city: 'jaipur', lat: 26.9856, lng: 75.8513,
        radius_meters: 500, risk_level: 'medium', category: 'scam',
        reason: 'Tuk-tuk drivers diverting tourists to commission shops at Amber Fort.',
        active_hours_start: 8, active_hours_end: 18, updated_at: Date.now(),
    },
    {
        id: 'jai-003', city: 'jaipur', lat: 26.9124, lng: 75.7873,
        radius_meters: 350, risk_level: 'medium', category: 'crime',
        reason: 'Bag snatching incidents near MI Road junction.',
        active_hours_start: 17, active_hours_end: 23, updated_at: Date.now(),
    },
    {
        id: 'jai-004', city: 'jaipur', lat: 26.9226, lng: 75.7875,
        radius_meters: 600, risk_level: 'low', category: 'unsafe_night',
        reason: 'Nahargarh Fort road — poorly lit and winding, unsafe after dark.',
        active_hours_start: 20, active_hours_end: 6, updated_at: Date.now(),
    },
    {
        id: 'jai-005', city: 'jaipur', lat: 26.9504, lng: 75.8158,
        radius_meters: 300, risk_level: 'critical', category: 'crime',
        reason: 'Multiple mugging reports on the road to Galtaji Temple complex.',
        active_hours_start: 16, active_hours_end: 22, updated_at: Date.now(),
    },
    {
        id: 'jai-006', city: 'jaipur', lat: 26.9190, lng: 75.8073,
        radius_meters: 250, risk_level: 'low', category: 'scam',
        reason: 'Counterfeit textile sellers operating near Johari Bazaar.',
        active_hours_start: 10, active_hours_end: 20, updated_at: Date.now(),
    },
    {
        id: 'jai-007', city: 'jaipur', lat: 26.9355, lng: 75.8245,
        radius_meters: 400, risk_level: 'medium', category: 'protest',
        reason: 'Occasional gatherings at Jaipur Junction disrupting traffic.',
        active_hours_start: null, active_hours_end: null, updated_at: Date.now(),
    },
    {
        id: 'jai-008', city: 'jaipur', lat: 26.8834, lng: 75.7857,
        radius_meters: 550, risk_level: 'high', category: 'unsafe_night',
        reason: 'Deserted area near Jawahar Circle Garden after 10 PM.',
        active_hours_start: 22, active_hours_end: 5, updated_at: Date.now(),
    },

    // ══════════════════════════════════════════════════════════════════════
    //  GOA (10 zones)
    // ══════════════════════════════════════════════════════════════════════
    {
        id: 'goa-001', city: 'goa', lat: 15.5144, lng: 73.7710,
        radius_meters: 500, risk_level: 'high', category: 'crime',
        reason: 'Theft from beach shacks and unattended belongings at Calangute Beach.',
        active_hours_start: null, active_hours_end: null, updated_at: Date.now(),
    },
    {
        id: 'goa-002', city: 'goa', lat: 15.5494, lng: 73.7558,
        radius_meters: 400, risk_level: 'critical', category: 'unsafe_night',
        reason: 'Anjuna beach road — drug-related incidents reported after midnight.',
        active_hours_start: 23, active_hours_end: 5, updated_at: Date.now(),
    },
    {
        id: 'goa-003', city: 'goa', lat: 15.4978, lng: 73.8195,
        radius_meters: 300, risk_level: 'medium', category: 'scam',
        reason: 'Overpriced bike rental scams in Mapusa town.',
        active_hours_start: 8, active_hours_end: 20, updated_at: Date.now(),
    },
    {
        id: 'goa-004', city: 'goa', lat: 15.4866, lng: 73.8136,
        radius_meters: 350, risk_level: 'medium', category: 'crime',
        reason: 'Petty theft at Mapusa Friday Market — crowded and chaotic.',
        active_hours_start: 8, active_hours_end: 18, updated_at: Date.now(),
    },
    {
        id: 'goa-005', city: 'goa', lat: 15.5340, lng: 73.7597,
        radius_meters: 600, risk_level: 'high', category: 'unsafe_night',
        reason: 'Isolated coastal road between Baga and Anjuna — no lights.',
        active_hours_start: 20, active_hours_end: 6, updated_at: Date.now(),
    },
    {
        id: 'goa-006', city: 'goa', lat: 15.2993, lng: 74.1240,
        radius_meters: 700, risk_level: 'low', category: 'restricted',
        reason: 'Wildlife sanctuary buffer zone — entry restricted without permit.',
        active_hours_start: null, active_hours_end: null, updated_at: Date.now(),
    },
    {
        id: 'goa-007', city: 'goa', lat: 15.3952, lng: 73.8784,
        radius_meters: 250, risk_level: 'low', category: 'scam',
        reason: 'Inflated "heritage tour" prices near Old Goa churches.',
        active_hours_start: 9, active_hours_end: 17, updated_at: Date.now(),
    },
    {
        id: 'goa-008', city: 'goa', lat: 15.5637, lng: 73.7418,
        radius_meters: 450, risk_level: 'medium', category: 'crime',
        reason: 'Theft of valuables from parked vehicles at Vagator cliffs.',
        active_hours_start: null, active_hours_end: null, updated_at: Date.now(),
    },
    {
        id: 'goa-009', city: 'goa', lat: 15.2681, lng: 73.9672,
        radius_meters: 350, risk_level: 'high', category: 'unsafe_night',
        reason: 'Remote stretch near Palolem — solo travelers targeted.',
        active_hours_start: 21, active_hours_end: 6, updated_at: Date.now(),
    },
    {
        id: 'goa-010', city: 'goa', lat: 15.4500, lng: 73.8000,
        radius_meters: 500, risk_level: 'medium', category: 'protest',
        reason: 'Occasional fishermen protests blocking coastal road near Candolim.',
        active_hours_start: null, active_hours_end: null, updated_at: Date.now(),
    },
];

// ─── Seed Function ───────────────────────────────────────────────────────────

/**
 * Seeds the local IndexedDB with placeholder risk zones.
 *
 * Call this once on app first-launch (check a localStorage flag).
 * The data will be overwritten by live API data when the user connects.
 */
export async function seedRiskZones(): Promise<void> {
    const SEED_FLAG = 'thor_risk_zones_seeded';

    if (localStorage.getItem(SEED_FLAG)) {
        console.log('[seedRiskZones] Already seeded — skipping.');
        return;
    }

    console.log(`[seedRiskZones] Inserting ${seedZones.length} zones across 5 cities…`);
    await riskZoneDB.insertZones(seedZones);
    localStorage.setItem(SEED_FLAG, String(Date.now()));
    console.log('[seedRiskZones] Seeding complete.');
}

/** Re-seed (clears existing data first). Useful during development. */
export async function reseedRiskZones(): Promise<void> {
    await riskZoneDB.clearAll();
    localStorage.removeItem('thor_risk_zones_seeded');
    await seedRiskZones();
}

export { seedZones };
