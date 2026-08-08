"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface TabsEmployesProps {
  tab: "permanents" | "journaliers";
  counts: {
    permanents: number;
    journaliers: number;
  };
  onTabChange?: (tab: "permanents" | "journaliers") => void;
}

export function TabsEmployes({ tab: initialTab, counts, onTabChange }: TabsEmployesProps) {
  const [tab, setTab] = useState(initialTab);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Sync with URL changes
  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const changerTab = (nouveauTab: "permanents" | "journaliers") => {
    setTab(nouveauTab); // Changement immédiat côté client
    onTabChange?.(nouveauTab); // Notifier le parent si callback fourni

    // Update URL sans recharger la page
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", nouveauTab);
    params.set("page", "1");
    router.push(`/employes?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="border-b border-border">
      <div className="flex gap-6">
        <button
          onClick={() => changerTab("permanents")}
          className={`relative pb-3 px-1 text-sm font-medium transition-colors ${
            tab === "permanents"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Employés permanents
          <span className="ml-2 text-xs opacity-70">({counts.permanents})</span>
          {tab === "permanents" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>

        <button
          onClick={() => changerTab("journaliers")}
          className={`relative pb-3 px-1 text-sm font-medium transition-colors ${
            tab === "journaliers"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Journaliers
          <span className="ml-2 text-xs opacity-70">({counts.journaliers})</span>
          {tab === "journaliers" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>
    </div>
  );
}
