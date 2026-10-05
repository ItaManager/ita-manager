"use client";

import { ReactNode } from "react";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WrapperPageAchatsProps {
  children: ReactNode;
}

export function WrapperPageAchats({ children }: WrapperPageAchatsProps) {
  return (
    <TooltipProvider>
      <div className="space-y-6 px-[60px] max-w-[1200px] mx-auto">
        {/* En-tête */}
        <div>
          <h1 className="text-3xl font-bold text-[#1D186C]">Achats</h1>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-sm text-[#18181a]">
              Gérez vos demandes d'achat et suivez leur circuit de validation
            </p>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-[#1D186C] hover:text-[#171356] transition-colors">
                  <HelpCircle className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p className="text-xs">
                  Le circuit d'achat commence par la création d'une demande. Après
                  soumission, elle passe par votre N+1, puis le Service Achats pour
                  instruction (consultation fournisseurs, prix), et enfin l'émission du
                  bon de commande.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Contenu */}
        {children}
      </div>
    </TooltipProvider>
  );
}
