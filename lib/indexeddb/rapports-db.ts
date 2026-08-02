/**
 * IndexedDB wrapper for offline activity reports storage
 * M6 — Rapports d'activité
 *
 * Offline-first: workers create reports offline on construction sites
 * Sync to server when connectivity is restored
 */

export interface RapportOffline {
  clientId: string; // UUID generated client-side
  projetId: string;
  date: string; // YYYY-MM-DD
  statut: "BROUILLON" | "SOUMIS" | "VISE" | "REJETE";
  chefChantierId: string;

  // Sections
  pointages: Array<{
    employeId: string;
    etat: string;
    heuresTheoretiques: number;
    heuresReelles: number;
    heuresSup: number;
    observation?: string;
  }>;

  travauxRealises: Array<{
    tacheId: string;
    description: string;
    quantite: number;
    unite: string;
  }>;

  utilisationsMateriel: Array<{
    materielId: string;
    heuresUtilisation: number;
  }>;

  consommations: Array<{
    materiauId: string;
    quantite: number;
    unite: string;
  }>;

  incidents: Array<{
    nature: string;
    description: string;
    contientBlessure: boolean;
  }>;

  // Sync metadata
  syncEnAttente: boolean;
  derniereSyncLocale: string; // ISO timestamp
  creeLe: string; // ISO timestamp
  modifieLe: string; // ISO timestamp
}

const DB_NAME = "ita-manager-offline";
const DB_VERSION = 1;
const STORE_RAPPORTS = "rapports";

/**
 * Initialize IndexedDB with rapports store
 */
export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("IndexedDB only available in browser"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create rapports store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_RAPPORTS)) {
        const store = db.createObjectStore(STORE_RAPPORTS, { keyPath: "clientId" });
        store.createIndex("projetId", "projetId", { unique: false });
        store.createIndex("date", "date", { unique: false });
        store.createIndex("syncEnAttente", "syncEnAttente", { unique: false });
      }
    };
  });
}

/**
 * Save rapport to IndexedDB (offline storage)
 */
export async function saveRapportOffline(rapport: RapportOffline): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_RAPPORTS], "readwrite");
    const store = transaction.objectStore(STORE_RAPPORTS);

    const request = store.put({
      ...rapport,
      modifieLe: new Date().toISOString(),
    });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all offline reports
 */
export async function getRapportsOffline(): Promise<RapportOffline[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_RAPPORTS], "readonly");
    const store = transaction.objectStore(STORE_RAPPORTS);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get single offline rapport by clientId
 */
export async function getRapportOffline(clientId: string): Promise<RapportOffline | null> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_RAPPORTS], "readonly");
    const store = transaction.objectStore(STORE_RAPPORTS);
    const request = store.get(clientId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all reports pending sync (syncEnAttente = true)
 */
export async function getRapportsPendingSync(): Promise<RapportOffline[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_RAPPORTS], "readonly");
    const store = transaction.objectStore(STORE_RAPPORTS);
    const index = store.index("syncEnAttente");
    const request = index.getAll(true);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Mark rapport for sync (set syncEnAttente = true)
 */
export async function markForSync(clientId: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_RAPPORTS], "readwrite");
    const store = transaction.objectStore(STORE_RAPPORTS);

    const getRequest = store.get(clientId);

    getRequest.onsuccess = () => {
      const rapport = getRequest.result;
      if (!rapport) {
        reject(new Error(`Rapport ${clientId} not found`));
        return;
      }

      const putRequest = store.put({
        ...rapport,
        syncEnAttente: true,
        modifieLe: new Date().toISOString(),
      });

      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Delete rapport from IndexedDB (after successful sync)
 */
export async function deleteRapportOffline(clientId: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_RAPPORTS], "readwrite");
    const store = transaction.objectStore(STORE_RAPPORTS);
    const request = store.delete(clientId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Clear all offline rapports (use with caution)
 */
export async function clearAllRapportsOffline(): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_RAPPORTS], "readwrite");
    const store = transaction.objectStore(STORE_RAPPORTS);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generate client-side UUID (RFC4122 v4)
 */
export function generateClientId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
