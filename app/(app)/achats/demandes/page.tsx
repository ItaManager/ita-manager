import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { FormulaireDemande } from "./_components/formulaire-demande";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { verifierAccesPage } from "@/lib/auth/page-access";

export default async function PageMesDemandes() {
  await verifierAccesPage("/achats/demandes");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  // Charger les données nécessaires
  const [articles, employes, projets, demandes] = await Promise.all([
    prisma.article.findMany({
      where: { actif: true },
      include: { unite: { select: { libelle: true } } },
      orderBy: { designation: "asc" },
    }),
    prisma.employe.findMany({
      where: { archiveLe: null },
      select: { id: true, matricule: true, nom: true, prenom: true },
      orderBy: { matricule: "asc" },
    }),
    prisma.projet.findMany({
      where: { statut: { not: "CLOTURE" } },
      select: { id: true, code: true, nom: true },
      orderBy: { code: "asc" },
    }).then(projets => projets.map(p => ({ id: p.id, code: p.code, libelle: p.nom }))),
    prisma.demandeAchat.findMany({
      where: { demandeurId: user.id },
      include: {
        beneficiaire: { select: { matricule: true, nom: true, prenom: true } },
        lignes: {
          include: {
            article: { select: { designation: true } },
          },
        },
      },
      orderBy: { creeLe: "desc" },
    }),
  ]);

  // Calculer le statut de chaque demande
  const demandesAvecStatut = await Promise.all(
    demandes.map(async (demande) => {
      const dernierEvenement = await prisma.evenementAchat.findFirst({
        where: { demandeId: demande.id },
        orderBy: { timestamp: "desc" },
      });

      return {
        ...demande,
        statut: dernierEvenement?.type || "BROUILLON",
      };
    })
  );

  return (
    <div className="flex min-h-screen flex-col">
      {/* En-tête */}
      <header className="bandeau sticky top-0 z-10 border-b px-6 py-4">
        <h1 className="text-2xl font-semibold">Mes demandes d'achat</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Créer et suivre vos demandes d'achat
        </p>
      </header>

      {/* Contenu */}
      <main className="flex-1 px-6 py-6 space-y-6">
        {/* Nouvelle demande */}
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Nouvelle demande</h2>
          </div>
          <FormulaireDemande
            articles={articles}
            employes={employes}
            projets={projets}
          />
        </div>

        {/* Liste des demandes */}
        <div className="rounded-lg border bg-card">
          <div className="bandeau border-b px-6 py-3">
            <h2 className="text-lg font-semibold">
              Mes demandes ({demandesAvecStatut.length})
            </h2>
          </div>

          {demandesAvecStatut.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Aucune demande enregistrée.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Utilisez le formulaire ci-dessus pour créer votre première demande.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="tabulaire w-full">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Ref
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Bénéficiaire
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Articles
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Date création
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Statut
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {demandesAvecStatut.map((demande) => (
                    <tr
                      key={demande.id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-6 py-3 text-sm font-medium">
                        {demande.ref}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        {demande.beneficiaire.prenom} {demande.beneficiaire.nom}
                      </td>
                      <td className="px-6 py-3 text-sm text-muted-foreground">
                        {demande.lignes.length} article{demande.lignes.length > 1 ? "s" : ""}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        {format(new Date(demande.creeLe), "dd/MM/yyyy", { locale: fr })}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span className={`statut ${
                          demande.statut === "BROUILLON"
                            ? "statut-neutre"
                            : demande.statut === "SOUMISSION_N1"
                            ? "statut-attente"
                            : "statut-succes"
                        }`}>
                          {demande.statut === "BROUILLON" ? "Brouillon" :
                           demande.statut === "SOUMISSION_N1" ? "En attente N+1" :
                           demande.statut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
