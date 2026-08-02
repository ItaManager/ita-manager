import { verifierAccesPage } from "@/lib/auth/page-access";
import { exigerPermission } from "@/lib/auth/guard";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent } from "@/components/ui/card";
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
import { FileText, Eye } from "lucide-react";
import { BoutonNouveauRapport } from "./_components/bouton-nouveau-rapport";
import { SyncIndicator } from "./_components/sync-indicator";
import Link from "next/link";

export const metadata = {
  title: "Relevés d'activité — ITA Manager",
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

const ITEMS_PER_PAGE = 25;

/**
 * Get status badge variant
 */
function getStatutBadge(statut: string) {
  switch (statut) {
    case "BROUILLON":
      return <Badge variant="outline">Brouillon</Badge>;
    case "SOUMIS":
      return <Badge variant="warning">Soumis</Badge>;
    case "VISE":
      return <Badge variant="success">Visé</Badge>;
    case "REJETE":
      return <Badge variant="destructive">Rejeté</Badge>;
    default:
      return <Badge variant="outline">{statut}</Badge>;
  }
}

/**
 * Activity reports list page
 * M6 — Rapports d'activité
 *
 * - Server-side pagination (25 items)
 * - Offline indicator
 * - Permission: releve:saisir
 */
export default async function RapportsPage({ searchParams }: PageProps) {
  await verifierAccesPage("/rapports");
  const session = await exigerPermission("releve:saisir");

  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const skip = (page - 1) * ITEMS_PER_PAGE;

  // Get user profile to find employeId
  const profil = await prisma.profil.findUnique({
    where: { id: session.userId },
    select: { employeId: true },
  });

  if (!profil?.employeId) {
    return (
      <div className="container mx-auto py-8 max-w-7xl">
        <Card className="border-warning bg-warning-soft/30">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              Votre compte n'est pas lié à un employé. Contactez l'administrateur.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get active projects for dropdown
  const projets = await prisma.projet.findMany({
    where: {
      statut: { in: ["OUVERT", "EN_COURS"] },
    },
    select: {
      id: true,
      code: true,
      nom: true,
    },
    orderBy: { code: "desc" },
    take: 50,
  });

  // Get activity reports (server-synced only)
  const [rapports, total] = await Promise.all([
    prisma.releveActivite.findMany({
      where: {
        chefChantierId: profil.employeId,
      },
      include: {
        projet: {
          select: {
            code: true,
            nom: true,
          },
        },
      },
      orderBy: [{ date: "desc" }, { creeLe: "desc" }],
      skip,
      take: ITEMS_PER_PAGE,
    }),
    prisma.releveActivite.count({
      where: {
        chefChantierId: profil.employeId,
      },
    }),
  ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <FileText className="size-6" aria-hidden="true" />
            Relevés d'activité
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pointages et travaux quotidiens sur chantier
          </p>
        </div>

        <BoutonNouveauRapport projets={projets} chefChantierId={profil.employeId} />
      </div>

      <div className="mb-4">
        <SyncIndicator variant="full" />
      </div>

      <Card>
        <CardContent className="p-0">
          {rapports.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="size-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Aucun relevé d'activité. Créez votre premier relevé en cliquant sur
                "Nouveau relevé".
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Chantier</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rapports.map((rapport) => (
                  <TableRow key={rapport.id}>
                    <TableCell>
                      {new Date(rapport.date).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{rapport.projet.code}</p>
                        <p className="text-sm text-muted-foreground">
                          {rapport.projet.nom}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatutBadge(rapport.statut)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" asChild>
                        <Link href={`/rapports/${rapport.id}`}>
                          <Eye className="size-4 mr-2" aria-hidden="true" />
                          Voir
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} sur {totalPages} ({total} relevé{total > 1 ? "s" : ""})
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              asChild={page > 1}
            >
              {page > 1 ? (
                <Link href={`/rapports?page=${page - 1}`}>Précédent</Link>
              ) : (
                "Précédent"
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              asChild={page < totalPages}
            >
              {page < totalPages ? (
                <Link href={`/rapports?page=${page + 1}`}>Suivant</Link>
              ) : (
                "Suivant"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
