import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifierAccesPage } from "@/lib/auth/page-access";

export default async function PageFacturation() {
  await verifierAccesPage("/achats/facturation");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  // Charger les demandes avec dernier événement = RECEPTION ou VALIDATION_CONFORMITE
  // et qui n'ont pas encore de facture
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

  // Filtrer les demandes avec réception enregistrée et sans facture
  const demandesAFacturer = demandes.filter((d) => {
    const dernierEvenement = d.evenements[0]?.type;
    return (
      (dernierEvenement === "RECEPTION" ||
        dernierEvenement === "VALIDATION_CONFORMITE") &&
      !d.refFacture
    );
  });

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bandeau sticky top-0 z-10 border-b px-6 py-4">
        <h1 className="text-2xl font-semibold">Facturation et rapprochement</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Saisir et rapprocher les factures fournisseurs (Direction Financière
          et Comptable)
        </p>
      </header>

      <main className="flex-1 px-6 py-6">
        {demandesAFacturer.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-sm text-muted-foreground">
              Aucune facture en attente de saisie.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Les marchandises réceptionnées sans facture enregistrée
              apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border bg-card">
            <div className="overflow-x-auto">
              <table className="tabulaire w-full">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Référence DA
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Bon de commande
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Bénéficiaire
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Fournisseur
                    </th>
                    <th className="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Montant HT
                    </th>
                    <th className="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      TVA
                    </th>
                    <th className="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Montant TTC
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Réceptionné le
                    </th>
                    <th className="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {demandesAFacturer.map((demande) => {
                    // Calculer les montants
                    let montantHT = 0;
                    let montantTVA = 0;
                    let montantTTC = 0;

                    demande.lignes.forEach((ligne) => {
                      const prixHT = Number(ligne.prixUnitaire ?? 0);
                      const qteRecue = Number(ligne.quantiteRecue ?? 0);
                      const tva = Number(ligne.tauxTva ?? 0);

                      const ligneHT = prixHT * qteRecue;
                      const ligneTVA = ligneHT * (tva / 100);
                      const ligneTTC = ligneHT + ligneTVA;

                      montantHT += ligneHT;
                      montantTVA += ligneTVA;
                      montantTTC += ligneTTC;
                    });

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
                        </td>
                        <td className="px-6 py-3 text-sm font-medium">
                          {demande.refBC ?? "—"}
                        </td>
                        <td className="px-6 py-3 text-sm">
                          {demande.beneficiaireId === demande.demandeurId
                            ? `${demande.beneficiaire.prenom} ${demande.beneficiaire.nom}`
                            : `${demande.beneficiaire.prenom} ${demande.beneficiaire.nom}`}
                        </td>
                        <td className="px-6 py-3 text-sm">
                          {fournisseurs.length > 0
                            ? fournisseurs.join(", ")
                            : "—"}
                        </td>
                        <td className="px-6 py-3 text-right text-sm">
                          {montantHT.toLocaleString("fr-FR", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}{" "}
                          F
                        </td>
                        <td className="px-6 py-3 text-right text-sm text-muted-foreground">
                          {montantTVA.toLocaleString("fr-FR", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}{" "}
                          F
                        </td>
                        <td className="px-6 py-3 text-right text-sm font-medium">
                          {montantTTC.toLocaleString("fr-FR", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}{" "}
                          F
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
                          <Button size="sm" variant="outline">
                            <Receipt
                              className="mr-2 h-4 w-4"
                              aria-hidden="true"
                            />
                            Saisir facture
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
