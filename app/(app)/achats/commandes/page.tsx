import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifierAccesPage } from "@/lib/auth/page-access";

export default async function PageCommandes() {
  await verifierAccesPage("/achats/commandes");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  // Charger les demandes avec dernier événement = INSTRUCTION, AVIS_COMITE ou autre
  // On cherche les demandes qui ont été instruites et validées
  const demandes = await prisma.demandeAchat.findMany({
    include: {
      demandeur: {
        select: {
          id: true,
          matricule: true,
          nom: true,
          prenom: true,
        },
      },
      beneficiaire: {
        select: {
          matricule: true,
          nom: true,
          prenom: true,
        },
      },
      lignes: {
        include: {
          article: { select: { designation: true } },
          fournisseur: { select: { nom: true } },
        },
      },
      evenements: {
        orderBy: { timestamp: "desc" },
        take: 1,
        select: { type: true, timestamp: true },
      },
    },
    orderBy: { creeLe: "desc" },
  });

  // Filtrer les demandes prêtes pour émission de BC
  // (Instruction complète, validations comité si nécessaire)
  const demandesACommander = demandes.filter((d) => {
    const dernierEvenement = d.evenements[0]?.type;
    return (
      dernierEvenement === "INSTRUCTION" ||
      dernierEvenement === "AVIS_COMITE" ||
      dernierEvenement === "TRANSMISSION_COMITE"
    );
  });

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bandeau sticky top-0 z-10 border-b px-6 py-4">
        <h1 className="text-2xl font-semibold">Émission des bons de commande</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Émettre les bons de commande pour les demandes validées
        </p>
      </header>

      <main className="flex-1 px-6 py-6">
        {demandesACommander.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-sm text-muted-foreground">
              Aucune demande en attente d'émission de BC.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Les demandes validées et instruites apparaîtront ici pour émission
              du bon de commande.
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
                      Fournisseurs
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Articles
                    </th>
                    <th className="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Montant TTC
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Date besoin
                    </th>
                    <th className="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {demandesACommander.map((demande) => {
                    // Calculer le montant TTC
                    const montantTTC = demande.lignes.reduce((sum, ligne) => {
                      const prixHT = Number(ligne.prixUnitaire ?? 0);
                      const qte = Number(ligne.quantite);
                      const tva = Number(ligne.tauxTva ?? 0);
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

                    return (
                      <tr
                        key={demande.id}
                        className="border-b last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-6 py-3 text-sm font-medium">
                          {demande.ref}
                          {demande.urgent && (
                            <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-destructive-soft text-destructive">
                              URGENT
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-sm">
                          {demande.demandeur.prenom} {demande.demandeur.nom}
                        </td>
                        <td className="px-6 py-3 text-sm">
                          {demande.beneficiaireId === demande.demandeurId
                            ? "—"
                            : `${demande.beneficiaire.prenom} ${demande.beneficiaire.nom}`}
                        </td>
                        <td className="px-6 py-3 text-sm">
                          {fournisseurs.length > 0
                            ? fournisseurs.join(", ")
                            : "—"}
                        </td>
                        <td className="px-6 py-3 text-sm text-muted-foreground">
                          {demande.lignes.length} article
                          {demande.lignes.length > 1 ? "s" : ""}
                        </td>
                        <td className="px-6 py-3 text-right text-sm font-medium">
                          {montantTTC.toLocaleString("fr-FR", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}{" "}
                          F
                        </td>
                        <td className="px-6 py-3 text-sm">
                          {format(new Date(demande.dateBesoin), "dd/MM/yyyy", {
                            locale: fr,
                          })}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <Button size="sm" variant="outline">
                            <FileText
                              className="mr-2 h-4 w-4"
                              aria-hidden="true"
                            />
                            Émettre BC
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
