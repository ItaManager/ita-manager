"use client";

import { ReactNode } from "react";

interface ModuleLayoutProps {
  // En-tête
  titre: string;
  description: string;
  helpText?: string;

  // Indicateurs (4 cartes en haut)
  indicateurs?: ReactNode;

  // Tâches (section accordion)
  taches?: {
    titre: ReactNode;
    contenu: ReactNode;
  };

  // Contenu principal (tableau, cartes, etc.)
  children: ReactNode;
}

export function ModuleLayout({
  titre,
  description,
  helpText,
  indicateurs,
  taches,
  children,
}: ModuleLayoutProps) {
  return (
    <div className="space-y-6 px-[60px] max-w-[1200px] mx-auto">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-[#1D186C]">{titre}</h1>
        <p className="mt-1 text-sm text-[#18181a]">{description}</p>
        {helpText && (
          <p className="mt-1 text-xs text-muted-foreground">{helpText}</p>
        )}
      </div>

      {/* Indicateurs */}
      {indicateurs}

      {/* Vos tâches */}
      {taches && (
        <div className="bg-white rounded-xl border border-[#0000001a]">
          <div className="px-6 py-4 border-b border-[#0000001a]">
            {taches.titre}
          </div>
          <div className="px-6 py-6">
            {taches.contenu}
          </div>
        </div>
      )}

      {/* Contenu principal */}
      {children}
    </div>
  );
}
