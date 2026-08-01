import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifierAccesPage } from "@/lib/auth/page-access";

export default async function PageReceptions() {
  await verifierAccesPage("/achats/receptions");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  // Charger les demandes avec dernier événement = EMISSION_BC
  // et qui ont des lignes non entièrement reçues
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

  // Filtrer les demandes avec BC émis et réception partielle ou nulle
  const demandesAReceptionner = demandes.filter((d) => {
    const dernierEvenement = d.evenements[0]?.type;
    if (dernierEvenement !== "EMISSION_BC" && dernierEvenement !== "TRANSMISSION_LOG") {
      return false;
    }

    // Vérifier s'il reste des quantités à recevoir
    const aDesLignesNonRecues = d.lignes.some(
      (ligne) =>
        !ligne.quantiteRecue ||
        Number(ligne.quantiteRecue) < Number(ligne.quantite)
    );

    return aDesLignesNonRecues;
  });

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bandeau sticky top-0 z-10 border-b px-6 py-4">
        <h1 className="text-2xl font-semibold">Réceptions de marchandises</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enregistrer les réceptions de marchandises commandées (Service
          Logistique)
        </p>
      </header>

      <main className="flex-1 px-6 py-6">
        {demandesAReceptionner.length === 0 ? (
          <div className="rounded-lg border bg-card p-12 text-center">
            <p className="text-sm text-muted-foreground">
              Aucune réception en attente d'enregistrement.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Les bons de commande émis avec marchandises non reçues
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
                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Articles
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      BC émis le
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      État réception
                    </th>
                    <th className="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {demandesAReceptionner.map((demande) => {
                    // Liste des fournisseurs uniques
                    const fournisseurs = [
                      ...new Set(
                        demande.lignes
                          .map((l) => l.fournisseur?.nom)
                          .filter((n): n is string => !!n)
                      ),
                    ];

                    // Calculer l'état de réception
                    const totalLignes = demande.lignes.length;
                    const lignesRecues = demande.lignes.filter(
                      (l) =>
                        l.quantiteRecue &&
                        Number(l.quantiteRecue) >= Number(l.quantite)
                    ).length;

                    const etatReception =
                      lignesRecues === 0
                        ? "Non reçue"
                        : lignesRecues === totalLignes
                        ? "Complète"
                        : `Partielle (${lignesRecues}/${totalLignes})`;

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
                        <td className="px-6 py-3 text-sm text-muted-foreground">
                          {demande.lignes.length} article
                          {demande.lignes.length > 1 ? "s" : ""}
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
                        <td className="px-6 py-3 text-sm">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              etatReception === "Non reçue"
                                ? "statut-neutre"
                                : etatReception === "Complète"
                                ? "statut-succes"
                                : "statut-attente"
                            }`}
                          >
                            {etatReception}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <Button size="sm" variant="outline">
                            <PackageCheck
                              className="mr-2 h-4 w-4"
                              aria-hidden="true"
                            />
                            Enregistrer réception
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
