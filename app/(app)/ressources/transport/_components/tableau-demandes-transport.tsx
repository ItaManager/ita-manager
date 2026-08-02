"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  DemandeTransport,
  TypeDemandeTransport,
  StatutDemandeTransport,
  LieuStockage,
  Materiel,
  Profil,
} from "@prisma/client";
import { ArrowRight } from "lucide-react";

type ChauffeurInfo = {
  id: string;
  nom: string;
  prenom: string;
};

type DemandeAvecRelations = DemandeTransport & {
  demandeur: Pick<Profil, "id" | "email">;
  materiel: Pick<Materiel, "id" | "codeIta" | "designation"> | null;
  lieuDepart: Pick<LieuStockage, "id" | "libelle">;
  lieuArrivee: Pick<LieuStockage, "id" | "libelle">;
  chauffeur: ChauffeurInfo | null;
};

type TableauDemandesTransportProps = {
  demandes: DemandeAvecRelations[];
  hasNextPage: boolean;
  pageActuelle: number;
};

const TYPE_LABELS: Record<
  TypeDemandeTransport,
  { label: string; variant: "default" | "secondary" | "outline" }
> = {
  MATERIEL: { label: "Matériel", variant: "default" },
  PERSONNEL: { label: "Personnel", variant: "secondary" },
  MIXTE: { label: "Mixte", variant: "outline" },
};

const STATUT_LABELS: Record<
  StatutDemandeTransport,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  EN_ATTENTE: { label: "En attente", variant: "secondary" },
  APPROUVEE: { label: "Approuvée", variant: "default" },
  AFFECTEE: { label: "Affectée", variant: "default" },
  EN_COURS: { label: "En cours", variant: "outline" },
  TERMINEE: { label: "Terminée", variant: "secondary" },
  ANNULEE: { label: "Annulée", variant: "destructive" },
};

export function TableauDemandesTransport({
  demandes,
  hasNextPage,
  pageActuelle,
}: TableauDemandesTransportProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    router.push(`/ressources/transport?${params.toString()}`);
  };

  const hasPrevPage = pageActuelle > 1;

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Référence</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Matériel</TableHead>
              <TableHead>Trajet</TableHead>
              <TableHead>Date début</TableHead>
              <TableHead>Chauffeur</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {demandes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="text-muted-foreground">
                    Aucune demande de transport trouvée
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Créez votre première demande pour commencer
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              demandes.map((demande) => {
                const typeConfig = TYPE_LABELS[demande.type];
                const statutConfig = STATUT_LABELS[demande.statut];
                return (
                  <TableRow
                    key={demande.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/ressources/transport/${demande.id}`)}
                  >
                    <TableCell className="font-mono">{demande.reference}</TableCell>
                    <TableCell>
                      <Badge variant={typeConfig.variant}>{typeConfig.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {demande.materiel ? (
                        <div>
                          <div className="font-medium">{demande.materiel.codeIta}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {demande.materiel.designation}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{demande.lieuDepart.libelle}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{demande.lieuArrivee.libelle}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(demande.dateDebut).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      {demande.chauffeur ? (
                        <span className="text-sm">
                          {demande.chauffeur.prenom} {demande.chauffeur.nom}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Non affecté</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statutConfig.variant}>{statutConfig.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {(hasPrevPage || hasNextPage) && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!hasPrevPage}
            onClick={() => handlePageChange(pageActuelle - 1)}
          >
            Précédent
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {pageActuelle}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNextPage}
            onClick={() => handlePageChange(pageActuelle + 1)}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
