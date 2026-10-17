"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModaleAjoutLigne } from "./modale-ajout-ligne";
import { supprimerLigneBordereau } from "@/lib/actions/bordereau-prix";
import { toast } from "sonner";

interface Ligne {
  id: string;
  lotNumero: string;
  numero: string;
  designation: string;
  unite: string;
  quantite: number;
  prixUnitaire: number;
  ordre: number;
}

interface TableauBordereauSimpleProps {
  lignes: Ligne[];
}

export function TableauBordereauSimple({ lignes }: TableauBordereauSimpleProps) {
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [ligneAModifier, setLigneAModifier] = useState<Ligne | null>(null);

  // Regrouper par lot
  const lotsGroupes = lignes.reduce((acc, ligne) => {
    if (!acc[ligne.lotNumero]) {
      acc[ligne.lotNumero] = [];
    }
    acc[ligne.lotNumero].push(ligne);
    return acc;
  }, {} as Record<string, Ligne[]>);

  const lots = Object.keys(lotsGroupes).sort();

  const handleModifier = (ligne: Ligne) => {
    setLigneAModifier(ligne);
    setModaleOuverte(true);
  };

  const handleSupprimer = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette ligne ?")) return;

    try {
      await supprimerLigneBordereau(id) as unknown;
      toast.success("Ligne supprimée");
      window.location.reload();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleFermerModale = () => {
    setModaleOuverte(false);
    setLigneAModifier(null);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Bouton d'ajout */}
        <div className="flex justify-end">
          <Button
            onClick={() => {
              setLigneAModifier(null);
              setModaleOuverte(true);
            }}
            className="rounded-full bg-[#1d186c] hover:bg-[#1d186c]/90 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une ligne
          </Button>
        </div>

        {/* Tableau par lot */}
        {lignes.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-sm font-medium text-foreground mb-1">
              Aucune ligne de bordereau
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Ajoutez des lignes au bordereau de prix
            </p>
            <Button
              onClick={() => {
                setLigneAModifier(null);
                setModaleOuverte(true);
              }}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ajouter la première ligne
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {lots.map((lotNumero) => (
              <div key={lotNumero} className="space-y-3">
                {/* En-tête du lot */}
                <div className="rounded-lg bg-yellow-100 px-4 py-2 border-l-4 border-yellow-400">
                  <h3 className="font-semibold text-base">
                    Lot N° {lotNumero}
                  </h3>
                </div>

                {/* Tableau des lignes */}
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left text-xs font-semibold w-20">
                          N°
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold">
                          Désignation
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold w-20">
                          U
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold w-32">
                          Quantité
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold w-32">
                          Prix unitaire
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold w-24">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lotsGroupes[lotNumero].map((ligne) => (
                        <tr
                          key={ligne.id}
                          className="border-b last:border-0 hover:bg-muted/30"
                        >
                          <td className="px-4 py-3 text-sm whitespace-nowrap">
                            {ligne.numero}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {ligne.designation}
                          </td>
                          <td className="px-4 py-3 text-sm text-center whitespace-nowrap">
                            {ligne.unite}
                          </td>
                          <td className="px-4 py-3 text-sm text-right tabular-nums whitespace-nowrap">
                            {ligne.quantite.toLocaleString("fr-FR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-4 py-3 text-sm text-right tabular-nums font-medium whitespace-nowrap">
                            {ligne.prixUnitaire.toLocaleString("fr-FR", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleModifier(ligne)}
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleSupprimer(ligne.id)}
                                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modale d'ajout/modification */}
      <ModaleAjoutLigne
        open={modaleOuverte}
        onOpenChange={handleFermerModale}
        ligneAModifier={ligneAModifier}
      />
    </>
  );
}
