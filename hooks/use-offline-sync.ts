"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getRapportsPendingSync,
  deleteRapportOffline,
  type RapportOffline,
} from "@/lib/indexeddb/rapports-db";

interface UseSyncOptions {
  enabled?: boolean;
  pollInterval?: number; // milliseconds
  onSyncSuccess?: (clientId: string) => void;
  onSyncError?: (clientId: string, error: Error) => void;
}

/**
 * Hook for background synchronization of offline activity reports
 * M6 — Rapports d'activité
 *
 * - Monitors IndexedDB for pending reports
 * - Syncs when online
 * - Polls periodically for new reports to sync
 */
export function useOfflineSync(options: UseSyncOptions = {}) {
  const {
    enabled = true,
    pollInterval = 30000, // 30 seconds
    onSyncSuccess,
    onSyncError,
  } = options;

  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  // Update online status
  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    updateOnlineStatus();

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    try {
      const pending = await getRapportsPendingSync();
      setPendingCount(pending.length);
    } catch (error) {
      console.error("[useOfflineSync] Failed to get pending count:", error);
    }
  }, []);

  // Sync a single rapport
  const syncRapport = useCallback(
    async (rapport: RapportOffline) => {
      try {
        // Call server action to sync rapport
        // TODO: Replace with actual Server Action when created
        const response = await fetch("/api/rapports/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rapport),
        });

        if (!response.ok) {
          throw new Error(`Sync failed: ${response.statusText}`);
        }

        // Delete from IndexedDB after successful sync
        await deleteRapportOffline(rapport.clientId);
        onSyncSuccess?.(rapport.clientId);

        return true;
      } catch (error) {
        console.error(`[useOfflineSync] Failed to sync ${rapport.clientId}:`, error);
        onSyncError?.(rapport.clientId, error as Error);
        return false;
      }
    },
    [onSyncSuccess, onSyncError]
  );

  // Sync all pending reports
  const syncAll = useCallback(async () => {
    if (!isOnline || isSyncing || !enabled) return;

    setIsSyncing(true);

    try {
      const pending = await getRapportsPendingSync();

      if (pending.length === 0) {
        setIsSyncing(false);
        return;
      }

      console.log(`[useOfflineSync] Syncing ${pending.length} reports...`);

      // Sync reports one by one (avoid overwhelming server)
      let successCount = 0;
      for (const rapport of pending) {
        const success = await syncRapport(rapport);
        if (success) successCount++;
      }

      console.log(`[useOfflineSync] Synced ${successCount}/${pending.length} reports`);

      setLastSyncAt(new Date());
      await updatePendingCount();
    } catch (error) {
      console.error("[useOfflineSync] Sync batch failed:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, enabled, syncRapport, updatePendingCount]);

  // Poll for pending reports and sync
  useEffect(() => {
    if (!enabled) return;

    // Initial count update
    updatePendingCount();

    // Sync when coming online
    if (isOnline) {
      syncAll();
    }

    // Poll for pending reports
    const interval = setInterval(() => {
      updatePendingCount();
      if (isOnline) {
        syncAll();
      }
    }, pollInterval);

    return () => clearInterval(interval);
  }, [enabled, isOnline, pollInterval, updatePendingCount, syncAll]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncAt,
    syncAll,
    updatePendingCount,
  };
}
