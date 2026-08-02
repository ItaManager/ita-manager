"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Cloud, CloudOff, Loader2, RefreshCw } from "lucide-react";
import { useOfflineSync } from "@/hooks/use-offline-sync";

interface SyncIndicatorProps {
  variant?: "minimal" | "full";
}

/**
 * Sync status indicator for offline reports
 * M6 — Rapports d'activité
 *
 * Shows:
 * - Online/offline status
 * - Number of pending reports
 * - Last sync time
 * - Manual sync button
 */
export function SyncIndicator({ variant = "full" }: SyncIndicatorProps) {
  const { isOnline, isSyncing, pendingCount, lastSyncAt, syncAll } = useOfflineSync();

  if (variant === "minimal") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant={isOnline ? "success" : "warning"}
              className="gap-1.5"
              aria-label={isOnline ? "En ligne" : "Hors ligne"}
            >
              {isOnline ? (
                <Cloud className="size-3" aria-hidden="true" />
              ) : (
                <CloudOff className="size-3" aria-hidden="true" />
              )}
              {!isOnline && pendingCount > 0 && (
                <span className="text-xs">{pendingCount}</span>
              )}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">{isOnline ? "En ligne" : "Hors ligne"}</p>
              {pendingCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {pendingCount} relevé{pendingCount > 1 ? "s" : ""} en attente
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2 flex-1">
        {isOnline ? (
          <Cloud className="size-4 text-success" aria-hidden="true" />
        ) : (
          <CloudOff className="size-4 text-warning" aria-hidden="true" />
        )}

        <div className="space-y-0.5">
          <p className="text-sm font-medium">
            {isOnline ? "Connecté" : "Mode hors ligne"}
          </p>

          {pendingCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {pendingCount} relevé{pendingCount > 1 ? "s" : ""} en attente de
              synchronisation
            </p>
          )}

          {lastSyncAt && isOnline && (
            <p className="text-xs text-muted-foreground">
              Dernière synchro :{" "}
              {lastSyncAt.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      </div>

      {isOnline && pendingCount > 0 && (
        <Button
          size="sm"
          variant="outline"
          onClick={syncAll}
          disabled={isSyncing}
          className="gap-2"
        >
          {isSyncing ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Synchro...
            </>
          ) : (
            <>
              <RefreshCw className="size-4" aria-hidden="true" />
              Synchroniser
            </>
          )}
        </Button>
      )}
    </div>
  );
}
