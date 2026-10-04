import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { FormulaireDemande } from "./formulaire-demande";

interface ListeDemandesProps {
  recherche?: string;
  filtre?: "toutes" | "brouillon" | "en-attente" | "validees";
  page: number;
  limit: number;
}

export async function ListeDemandes({
  recherche,
  filtre = "toutes",
  page,
  limit,
}: ListeDemandesProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <p className="text-sm text-muted-foreground">
          Vous devez être connecté pour voir vos demandes.
        </p>
      </div>
    );
  }

  // Charger les données nécessaires pour le formulaire
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
    <div className="space-y-6">
      {/* Nouvelle demande */}
      <div className="rounded-xl border border-[#0000001a] bg-white">
        <div className="border-b border-[#0000001a] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#18181a]">Nouvelle demande</h2>
        </div>
        <div className="p-6">
          <FormulaireDemande
            articles={articles}
            employes={employes}
            projets={projets}
          />
        </div>
      </div>

      {/* Liste des demandes */}
      <div className="rounded-xl border border-[#0000001a] bg-white">
        <div className="border-b border-[#0000001a] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#18181a]">
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
            <table className="w-full">
              <thead className="bg-[#f9fafb]">
                <tr className="border-b border-[#0000001a]">
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
                    className="border-b border-[#0000001a] last:border-0 hover:bg-[#f9fafb] transition-colors"
                  >
                    <td className="px-6 py-3 text-sm font-medium tabular-nums">
                      {demande.ref}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {demande.beneficiaire.prenom} {demande.beneficiaire.nom}
                    </td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">
                      {demande.lignes.length} article{demande.lignes.length > 1 ? "s" : ""}
                    </td>
                    <td className="px-6 py-3 text-sm tabular-nums">
                      {format(new Date(demande.creeLe), "dd/MM/yyyy", { locale: fr })}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        demande.statut === "BROUILLON"
                          ? "bg-[#f3f4f6] text-[#6b7280]"
                          : demande.statut === "SOUMISSION"
                          ? "bg-[#fef3c7] text-[#92400e]"
                          : "bg-[#d1fae5] text-[#065f46]"
                      }`}>
                        {demande.statut === "BROUILLON" ? "Brouillon" :
                         demande.statut === "SOUMISSION" ? "En attente N+1" :
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
    </div>
  );
}
