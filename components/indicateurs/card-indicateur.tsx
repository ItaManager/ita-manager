import { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CardIndicateurProps {
  // Texte et tooltip
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
      {/* Label + tooltip */}
      <div className="flex items-start justify-between mb-2">
        {helpText ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-xs text-gray-500 cursor-help">{label}</p>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-xs">{helpText}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <p className="text-xs text-gray-500">{label}</p>
        )}
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
