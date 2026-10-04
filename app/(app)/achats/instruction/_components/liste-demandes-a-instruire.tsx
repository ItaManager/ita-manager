import { prisma } from "@/lib/db/prisma";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { FileEdit } from "lucide-react";

export async function ListeDemandesAInstruire() {
  // Charger les demandes avec dernier événement = VALIDATION_N1
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

  // Filtrer uniquement celles avec dernier événement = VALIDATION_N1
  const demandesAInstruire = demandes.filter(
    (d) => d.evenements[0]?.type === "VALIDATION_N1"
  );

  return (
    <div className="rounded-xl border border-[#0000001a] bg-white">
      <div className="border-b border-[#0000001a] px-6 py-4">
        <h2 className="text-lg font-semibold text-[#18181a]">
          Demandes à instruire ({demandesAInstruire.length})
        </h2>
      </div>

      {demandesAInstruire.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Aucune demande en attente d'instruction.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Les demandes validées par les N+1 apparaîtront ici pour
            instruction par le Service Achats.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f9fafb]">
              <tr className="border-b border-[#0000001a]">
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
                  Validé N+1 le
                </th>
                <th className="px-6 py-3 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {demandesAInstruire.map((demande) => (
                <tr
                  key={demande.id}
                  className="border-b border-[#0000001a] last:border-0 hover:bg-[#f9fafb] transition-colors"
                >
                  <td className="px-6 py-3 text-sm font-medium tabular-nums">
                    {demande.ref}
                    {demande.urgent && (
                      <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-[#FEF2F2] text-[#DC2626]">
                        URGENT
                      </span>
                    )}
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
                  <td className="px-6 py-3 text-sm text-muted-foreground tabular-nums">
                    {demande.lignes.length} article
                    {demande.lignes.length > 1 ? "s" : ""}
                  </td>
                  <td className="px-6 py-3 text-sm tabular-nums">
                    {format(new Date(demande.dateBesoin), "dd/MM/yyyy", {
                      locale: fr,
                    })}
                  </td>
                  <td className="px-6 py-3 text-sm tabular-nums">
                    {demande.evenements[0]
                      ? format(
                          new Date(demande.evenements[0].timestamp),
                          "dd/MM/yyyy",
                          { locale: fr }
                        )
                      : "—"}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <Button size="sm" variant="outline" className="text-[#1D186C] border-[#1D186C] hover:bg-[#EBEAF2]">
                      <FileEdit
                        className="mr-2 h-4 w-4"
                        aria-hidden="true"
                      />
                      Instruire
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
