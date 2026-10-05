"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Calendar, Package, User, Building2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Demande {
  id: string;
  ref: string;
  description: string;
  urgent: boolean;
  dateBesoin: string;
  creeLe: string;
  demandeur: {
    id: string;
    matricule: string;
    nom: string;
    prenom: string;
  };
  beneficiaire: {
    matricule: string;
    nom: string;
    prenom: string;
  };
  demandeurId: string;
  beneficiaireId: string;
  lignes: Array<{
    id: string;
    designation: string;
    quantite: number;
    prixUnitaire: number | null;
    tauxTva: number | null;
    article: { designation: string } | null;
    fournisseur: { nom: string } | null;
  }>;
  evenements: Array<{
    type: string;
    timestamp: string;
  }>;
}

interface ListeCommandesProps {
  demandes: Demande[];
}

export function ListeCommandes({ demandes }: ListeCommandesProps) {
  const [recherche, setRecherche] = useState("");

  // Filtrer les demandes selon la recherche
  const demandesFiltrees = demandes.filter((d) => {
    const terme = recherche.toLowerCase();
    return (
      d.ref.toLowerCase().includes(terme) ||
      `${d.demandeur.prenom} ${d.demandeur.nom}`.toLowerCase().includes(terme) ||
      d.lignes.some((l) => l.fournisseur?.nom.toLowerCase().includes(terme))
    );
  });

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <header className="bandeau sticky top-0 z-10 border-b px-6 py-4">
        <h1 className="text-2xl font-semibold text-[#1D186C]">Suivi de commande</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Émettre les bons de commande pour les demandes validées
        </p>
      </header>

      <main className="flex-1 px-6 py-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Barre de recherche et filtres */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par référence, demandeur, fournisseur..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="pl-9 rounded-md"
            />
          </div>
          <Badge variant="secondary" className="h-9 px-3 text-sm font-medium">
            {demandesFiltrees.length} demande{demandesFiltrees.length > 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Liste des commandes */}
        {demandesFiltrees.length === 0 ? (
          <div className="rounded-xl border border-[#0000001a] bg-white p-12 text-center">
            <Package className="size-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm font-medium text-foreground mb-1">
              {recherche
                ? "Aucune demande trouvée"
                : "Aucune demande en attente d'émission de BC"}
            </p>
            <p className="text-xs text-muted-foreground">
              {recherche
                ? "Essayez avec d'autres termes de recherche"
                : "Les demandes validées et instruites apparaîtront ici"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {demandesFiltrees.map((demande) => {
              // Calculer le montant TTC
              const montantTTC = demande.lignes.reduce((sum, ligne) => {
                const prixHT = ligne.prixUnitaire ?? 0;
                const qte = ligne.quantite;
                const tva = ligne.tauxTva ?? 0;
                return sum + prixHT * qte * (1 + tva / 100);
              }, 0);

              // Liste des fournisseurs uniques
              const fournisseurs = [
                ...new Set(
                  demande.lignes
                    .map((l) => l.fournisseur?.nom)
                    .filter((n): n is string => !!n)
                ),
              ];

              const estBeneficiaireDifferent =
                demande.beneficiaireId !== demande.demandeurId;

              return (
                <div
                  key={demande.id}
                  className="rounded-xl border border-[#0000001a] bg-white p-6 hover:shadow-md transition-shadow"
                >
                  {/* En-tête de la carte */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-[#1D186C]">
                          {demande.ref}
                        </h3>
                        {demande.urgent && (
                          <Badge
                            variant="destructive"
                            className="h-5 px-2 text-[10px] font-medium"
                          >
                            URGENT
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {demande.description}
                      </p>
                    </div>
                    <Button size="sm" className="rounded-full shrink-0">
                      <FileText className="size-4 mr-2" />
                      Émettre BC
                    </Button>
                  </div>

                  {/* Informations principales */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <User className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                          Demandeur
                        </div>
                        <div className="text-sm font-medium text-foreground">
                          {demande.demandeur.prenom} {demande.demandeur.nom}
                        </div>
                        {estBeneficiaireDifferent && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Pour {demande.beneficiaire.prenom}{" "}
                            {demande.beneficiaire.nom}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Building2 className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                          Fournisseurs
                        </div>
                        <div className="text-sm font-medium text-foreground truncate">
                          {fournisseurs.length > 0
                            ? fournisseurs.join(", ")
                            : "—"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Package className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                          Articles
                        </div>
                        <div className="text-sm font-medium text-foreground">
                          {demande.lignes.length} article
                          {demande.lignes.length > 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                          Date besoin
                        </div>
                        <div className="text-sm font-medium text-foreground tabular-nums">
                          {format(new Date(demande.dateBesoin), "dd/MM/yyyy", {
                            locale: fr,
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Montant en bas */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#0000001a]">
                    <div className="text-xs text-muted-foreground">
                      Dernière mise à jour :{" "}
                      {format(
                        new Date(
                          demande.evenements[0]?.timestamp || demande.creeLe
                        ),
                        "dd/MM/yyyy · HH:mm",
                        { locale: fr }
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground mb-0.5">
                        Montant TTC
                      </div>
                      <div className="text-lg font-semibold text-[#1D186C] tabular-nums">
                        {montantTTC.toLocaleString("fr-FR", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}{" "}
                        FCFA
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
