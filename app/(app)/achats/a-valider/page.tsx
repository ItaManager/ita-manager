import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifierAccesPage } from "@/lib/auth/page-access";

export default async function PageAValider() {
  await verifierAccesPage("/achats/a-valider");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  // Récupérer l'employé actuel via le profil
  const profil = await prisma.profil.findUnique({
    where: { id: user.id },
    include: { employe: true },
  });

  if (!profil?.employe) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="bandeau sticky top-0 z-10 border-b px-6 py-4">
          <h1 className="text-2xl font-semibold">Demandes à valider</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Valider les demandes d'achat de vos subordonnés
          </p>
        </header>
        <main className="flex-1 px-6 py-6">
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-sm text-muted-foreground">
              Vous n'avez pas de profil employé associé.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Charger les subordonnés directs via Affectation
  const affectationsSubordonnes = await prisma.affectation.findMany({
    where: {
      superieurId: profil.employe.id,
      dateFin: null, // Affectation active
    },
    select: { employeId: true },
  });

  const subordonneIds = affectationsSubordonnes.map((a) => a.employeId);

  // Charger les demandes avec dernier événement = SOUMISSION
  // et demandeur dans la liste des subordonnés
  const demandes = await prisma.demandeAchat.findMany({
    where: {
      demandeurId: { in: subordonneIds },
    },
    include: {
      demandeur: {
        select: {
          id: true,
          matricule: true,
          nom: true,
          prenom: true
        }
      },
      beneficiaire: {
        select: {
          matricule: true,
          nom: true,
          prenom: true
        }
      },
      lignes: {
        include: {
          article: { select: { designation: true } }
        }
      },
      evenements: {
        orderBy: { timestamp: "desc" },
        take: 1,
        select: { type: true, timestamp: true },
      },
    },
    orderBy: { creeLe: "desc" },
  });

  // Filtrer uniquement celles avec dernier événement = SOUMISSION
  const demandesAValider = demandes.filter(
    (d) => d.evenements[0]?.type === "SOUMISSION"
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bandeau sticky top-0 z-10 border-b px-6 py-4">
        <h1 className="text-2xl font-semibold">Demandes à valider</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Valider les demandes d'achat de vos subordonnés
        </p>
      </header>

      <main className="flex-1 px-6 py-6">
        {demandesAValider.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-sm text-muted-foreground">
              Aucune demande en attente de validation.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Les demandes soumises par vos subordonnés apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border bg-card">
            <div className="overflow-x-auto">
              <table className="tabulaire w-full">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Référence
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Demandeur
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Bénéficiaire
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Articles
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Date besoin
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Soumis le
                    </th>
                    <th className="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {demandesAValider.map((demande) => (
                    <tr
                      key={demande.id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-6 py-3 text-sm font-medium">
                        {demande.ref}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        {demande.demandeur.prenom} {demande.demandeur.nom}
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({demande.demandeur.matricule})
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        {demande.beneficiaireId === demande.demandeurId
                          ? "—"
                          : `${demande.beneficiaire.prenom} ${demande.beneficiaire.nom}`}
                      </td>
                      <td className="px-6 py-3 text-sm text-muted-foreground max-w-xs truncate">
                        {demande.description}
                      </td>
                      <td className="px-6 py-3 text-sm text-muted-foreground">
                        {demande.lignes.length} article
                        {demande.lignes.length > 1 ? "s" : ""}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        {format(new Date(demande.dateBesoin), "dd/MM/yyyy", {
                          locale: fr,
                        })}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        {demande.evenements[0]
                          ? format(
                              new Date(demande.evenements[0].timestamp),
                              "dd/MM/yyyy",
                              { locale: fr }
                            )
                          : "—"}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline">
                            <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                            Valider
                          </Button>
                          <Button size="sm" variant="outline">
                            <X className="mr-2 h-4 w-4" aria-hidden="true" />
                            Refuser
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
