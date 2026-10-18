"use client";

import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface CardIndicateurProps {
  // Texte et aide
  label: string;
  helpText?: string;

  // Valeur principale
  value: string | number;
  valueColor?: string;

  // Graphique à droite (optionnel)
  chart?: ReactNode;
}

export function CardIndicateur({
  label,
  helpText,
  value,
  valueColor = "#18181a",
  chart,
}: CardIndicateurProps) {
  return (
    <div className="bg-white rounded-xl p-4 border border-[#0000001a]">
      {/* Label */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs text-gray-500">{label}</p>
          {helpText && (
            <p className="text-xs text-muted-foreground mt-0.5">{helpText}</p>
          )}
        </div>
        <ChevronRight className="size-3 text-gray-400" />
      </div>

      {/* Valeur + graphique */}
      <div className="flex items-end justify-between">
        <p className="text-xl font-bold" style={{ color: valueColor }}>
          {value}
        </p>
        {chart && <div className="flex items-end">{chart}</div>}
      </div>
    </div>
  );
}
