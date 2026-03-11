/**
 * EmergencyContactsService.ts (Web Version)
 * -------------------------------------------
 * IndexedDB-backed emergency contacts manager.
 * Replaces React Native SQLite with browser IndexedDB.
 *
 * Table equivalent: emergency_contacts
 *   id, name, phone, relation, is_primary
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EmergencyContact {
    id: string;
    name: string;
    phone: string;
    relation: string;
    is_primary: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DB_NAME = 'thor_emergency_contacts';
const DB_VERSION = 1;
const STORE_NAME = 'contacts';

/** Platform-level SOS number (THOR's 24/7 helpline). */
export const APP_SOS_NUMBER = '+918005551234';

/** Local emergency numbers by country. */
export const LOCAL_EMERGENCY_NUMBERS = {
    india: {
        police: '100',
        ambulance: '108',
        fire: '101',
        women_helpline: '1091',
        tourist_helpline: '1363',
    },
};

// ─── Service Class ───────────────────────────────────────────────────────────

export class EmergencyContactsService {
    private db: IDBDatabase | null = null;

    // ── Init ────────────────────────────────────────────────────────────────

    private init(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.db) return resolve();

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('is_primary', 'is_primary', { unique: false });
                }
            };

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve();
            };

            request.onerror = () => reject(request.error);
        });
    }

    // ── Add Contact ─────────────────────────────────────────────────────────

    async addContact(contact: EmergencyContact): Promise<void> {
        await this.init();

        // If this contact is primary, demote all others first
        if (contact.is_primary) {
            await this.demoteAllPrimary();
        }

        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.put(contact);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    // ── Remove Contact ──────────────────────────────────────────────────────

    async removeContact(id: string): Promise<void> {
        await this.init();

        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            store.delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    // ── Get All Contacts ────────────────────────────────────────────────────

    async getAllContacts(): Promise<EmergencyContact[]> {
        await this.init();

        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result as EmergencyContact[]);
            request.onerror = () => reject(request.error);
        });
    }

    // ── Get Primary Contact ─────────────────────────────────────────────────

    async getPrimaryContact(): Promise<EmergencyContact | null> {
        await this.init();

        return new Promise((resolve, reject) => {
            const tx = this.db!.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const index = store.index('is_primary');
            const request = index.getAll();
            // Filter in memory since `true` is not a valid IDBValidKey on all browsers

            request.onsuccess = () => {
                const results = (request.result as EmergencyContact[]).filter(c => c.is_primary);
                resolve(results.length > 0 ? results[0] : null);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // ── Get Tour Organizer ──────────────────────────────────────────────────

    /**
     * Retrieve the tour organizer contact set via QR scan.
     * Stored in localStorage for quick access.
     */
    getTourOrganizer(): EmergencyContact | null {
        const raw = localStorage.getItem('thor_tour_organizer');
        return raw ? JSON.parse(raw) : null;
    }

    setTourOrganizer(contact: EmergencyContact): void {
        localStorage.setItem('thor_tour_organizer', JSON.stringify(contact));
    }

    // ── Has Completed Setup ─────────────────────────────────────────────────

    hasCompletedSetup(): boolean {
        return localStorage.getItem('thor_sos_setup_complete') === 'true';
    }

    markSetupComplete(): void {
        localStorage.setItem('thor_sos_setup_complete', 'true');
    }

    // ── Private Helpers ─────────────────────────────────────────────────────

    private async demoteAllPrimary(): Promise<void> {
        const all = await this.getAllContacts();
        const tx = this.db!.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        for (const c of all) {
            if (c.is_primary) {
                store.put({ ...c, is_primary: false });
            }
        }

        return new Promise((resolve) => {
            tx.oncomplete = () => resolve();
        });
    }
}

// Singleton
export const emergencyContactsService = new EmergencyContactsService();
