/**
 * Page de gestion des demandes de ressources (M8)
 *
 * Trois onglets :
 * - Mes demandes : créées par l'utilisateur connecté
 * - À valider N+1 : demandes des subordonnés directs
 * - À arbitrer : demandes validées N+1 (RH pour HUMAINE, Logistique pour MATERIELLE)
 *
 * Permissions :
 * - ressource:demander : Mes demandes
 * - ressource:arbitrer : À arbitrer (service)
 */

import { Suspense } from "react";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { verifierPermission } from "@/lib/auth/guard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Plus, FileText, User2, Users } from "lucide-react";
import Link from "next/link";
import { obtenirSuperieurHierarchique } from "@/lib/chaines";

export const metadata = {
  title: "Demandes de ressources — ITA Manager",
};

type DemandeListItem = {
  id: string;
  nature: string;
  projet: { code: string; nom: string };
  dateDebut: Date;
  dateFin: Date;
  statut: string;
  demandeurNom: string;
  lignesCount: number;
  creeLe: Date;
};

export default async function PageDemandesRessources() {
  await verifierAccesPage("/ressources/demandes");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Vérifier permission arbitrer
  const peutArbitrer = await verifierPermission(user.id, "ressource:arbitrer");

  // Récupérer le profil et employé
  const profil = await prisma.profil.findUnique({
    where: { id: user.id },
    include: { employe: true },
  });

  // Mes demandes
  const mesDemandes = await prisma.demandeRessource.findMany({
    where: { demandeurId: user.id },
    include: {
      projet: { select: { code: true, nom: true } },
      _count: { select: { lignes: true } },
    },
    orderBy: { creeLe: "desc" },
    take: 25,
  });

  const mesDemandesTypees: DemandeListItem[] = mesDemandes.map((d) => ({
    id: d.id,
    nature: d.nature,
    projet: d.projet,
    dateDebut: d.dateDebut,
    dateFin: d.dateFin,
    statut: d.statut,
    demandeurNom: d.demandeurNom,
    lignesCount: d._count.lignes,
    creeLe: d.creeLe,
  }));

  // Demandes à valider N+1 (mes subordonnés directs)
  let demandesAValiderN1: DemandeListItem[] = [];
  if (profil?.employe) {
    // Trouver tous les employés dont je suis le supérieur hiérarchique
    const tousEmployes = await prisma.employe.findMany({
      select: { id: true },
    });

    const mesSubordonnesIds: string[] = [];
    for (const emp of tousEmployes) {
      const superieurId = await obtenirSuperieurHierarchique(emp.id);
      if (superieurId === profil.employe.id) {
        // Trouver le profil de cet employé
        const employeProfil = await prisma.profil.findUnique({
          where: { employeId: emp.id },
          select: { id: true },
        });
        if (employeProfil) {
          mesSubordonnesIds.push(employeProfil.id);
        }
      }
    }

    if (mesSubordonnesIds.length > 0) {
      const demandes = await prisma.demandeRessource.findMany({
        where: {
          demandeurId: { in: mesSubordonnesIds },
          statut: "SOUMISE",
        },
        include: {
          projet: { select: { code: true, nom: true } },
          _count: { select: { lignes: true } },
        },
        orderBy: { creeLe: "asc" },
        take: 25,
      });

      demandesAValiderN1 = demandes.map((d) => ({
        id: d.id,
        nature: d.nature,
        projet: d.projet,
        dateDebut: d.dateDebut,
        dateFin: d.dateFin,
        statut: d.statut,
        demandeurNom: d.demandeurNom,
        lignesCount: d._count.lignes,
        creeLe: d.creeLe,
      }));
    }
  }

  // Demandes à arbitrer (service compétent)
  let demandesAArbitrer: DemandeListItem[] = [];
  if (peutArbitrer) {
    const demandes = await prisma.demandeRessource.findMany({
      where: { statut: "VALIDEE_N1" },
      include: {
        projet: { select: { code: true, nom: true } },
        _count: { select: { lignes: true } },
      },
      orderBy: { creeLe: "asc" },
      take: 25,
    });

    demandesAArbitrer = demandes.map((d) => ({
      id: d.id,
      nature: d.nature,
      projet: d.projet,
      dateDebut: d.dateDebut,
      dateFin: d.dateFin,
      statut: d.statut,
      demandeurNom: d.demandeurNom,
      lignesCount: d._count.lignes,
      creeLe: d.creeLe,
    }));
  }

  return (
    <div className="p-8">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary">
            Demandes de ressources
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Demander des ressources humaines ou matérielles pour vos projets.
          </p>
        </div>
        <Button asChild>
          <Link href="/ressources/demandes/nouvelle">
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle demande
          </Link>
        </Button>
      </header>

      <Tabs defaultValue="mes-demandes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="mes-demandes" className="gap-2">
            <User2 className="h-4 w-4" />
            Mes demandes
            {mesDemandesTypees.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {mesDemandesTypees.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="a-valider-n1" className="gap-2">
            <Users className="h-4 w-4" />
            À valider N+1
            {demandesAValiderN1.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {demandesAValiderN1.length}
              </Badge>
            )}
          </TabsTrigger>
          {peutArbitrer && (
            <TabsTrigger value="a-arbitrer" className="gap-2">
              <FileText className="h-4 w-4" />
              À arbitrer (service)
              {demandesAArbitrer.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {demandesAArbitrer.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="mes-demandes">
          <Suspense fallback={<div>Chargement...</div>}>
            {mesDemandesTypees.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucune demande de ressource
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Créez une demande pour affecter des ressources à vos projets
                </p>
              </Card>
            ) : (
              <TableDemandes demandes={mesDemandesTypees} />
            )}
          </Suspense>
        </TabsContent>

        <TabsContent value="a-valider-n1">
          <Suspense fallback={<div>Chargement...</div>}>
            {demandesAValiderN1.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucune demande à valider
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Les demandes de vos subordonnés directs apparaîtront ici
                </p>
              </Card>
            ) : (
              <TableDemandes demandes={demandesAValiderN1} />
            )}
          </Suspense>
        </TabsContent>

        {peutArbitrer && (
          <TabsContent value="a-arbitrer">
            <Suspense fallback={<div>Chargement...</div>}>
              {demandesAArbitrer.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    Aucune demande à arbitrer
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Les demandes validées par les N+1 apparaîtront ici
                  </p>
                </Card>
              ) : (
                <TableDemandes demandes={demandesAArbitrer} />
              )}
            </Suspense>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

function TableDemandes({ demandes }: { demandes: DemandeListItem[] }) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Nature</TableHead>
            <TableHead>Projet</TableHead>
            <TableHead>Période</TableHead>
            <TableHead>Demandeur</TableHead>
            <TableHead>Lignes</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {demandes.map((demande) => (
            <TableRow key={demande.id}>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(demande.creeLe)}
              </TableCell>
              <TableCell>
                <Badge variant={getNatureVariant(demande.nature)}>
                  {formatNature(demande.nature)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="font-medium">{demande.projet.code}</div>
                <div className="text-xs text-muted-foreground">
                  {demande.projet.nom}
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {formatPeriode(demande.dateDebut, demande.dateFin)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {demande.demandeurNom}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {demande.lignesCount}
              </TableCell>
              <TableCell>
                <Badge variant={getStatutVariant(demande.statut)}>
                  {formatStatut(demande.statut)}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/ressources/demandes/${demande.id}`}>
                    Détails
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatPeriode(debut: Date, fin: Date): string {
  const d = new Date(debut).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });
  const f = new Date(fin).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });
  return `${d} → ${f}`;
}

function formatNature(nature: string): string {
  return nature === "HUMAINE" ? "Humaine" : "Matérielle";
}

function getNatureVariant(
  nature: string
): "default" | "secondary" | "outline" {
  return nature === "HUMAINE" ? "default" : "secondary";
}

function formatStatut(statut: string): string {
  const statuts: Record<string, string> = {
    BROUILLON: "Brouillon",
    SOUMISE: "Soumise",
    VALIDEE_N1: "Validée N+1",
    VALIDEE_SERVICE: "Validée service",
    AFFECTEE: "Affectée",
    REFUSEE: "Refusée",
    ANNULEE: "Annulée",
  };
  return statuts[statut] || statut;
}

function getStatutVariant(
  statut: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (statut) {
    case "BROUILLON":
      return "outline";
    case "SOUMISE":
      return "secondary";
    case "VALIDEE_N1":
    case "VALIDEE_SERVICE":
      return "default";
    case "AFFECTEE":
      return "default";
    case "REFUSEE":
    case "ANNULEE":
      return "destructive";
    default:
      return "secondary";
  }
}
