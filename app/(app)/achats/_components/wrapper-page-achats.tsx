"use client";

import { ReactNode } from "react";

interface WrapperPageAchatsProps {
  children: ReactNode;
}

export function WrapperPageAchats({ children }: WrapperPageAchatsProps) {
  return (
    <div className="space-y-6 px-[60px] max-w-[1200px] mx-auto">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-[#1D186C]">Achats</h1>
        <p className="mt-1 text-sm text-[#18181a]">
          Gérez vos demandes d'achat et suivez leur circuit de validation
        </p>
      </div>

      {/* Contenu */}
      {children}
    </div>
  );
}
