import { prisma } from "@/lib/db/prisma";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { Suspense } from "react";
import { ModuleLayout } from "@/components/layouts/module-layout";
import { IndicateursMissions } from "./_components/indicateurs-missions";
import { ListeMissions } from "./_components/liste-missions";
import { ListeTaches } from "./_components/liste-taches";
import { TitreTaches } from "./_components/titre-taches";
import { BoutonNouvelleMission } from "./_components/bouton-nouvelle-mission";
import { ModaleDeposerRapport } from "./_components/modale-deposer-rapport";
import { peutCreerMission } from "@/lib/missions/utils";
import { AlertCircle } from "lucide-react";

export default async function MissionsPage() {
  const userId = await verifierAccesPage("/missions");

  // Récupérer l'employé lié à l'utilisateur
  const profil = await prisma.profil.findUnique({
    where: { id: userId },
    select: { employeId: true },
  });

  if (!profil?.employeId) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold mb-4">Missions</h1>
        <p className="text-muted-foreground">
          Aucun profil employé trouvé.
        </p>
      </div>
    );
  }

  // Vérifier le blocage nouvelle mission
  const peut = await peutCreerMission(profil.employeId);

  // Si bloqué, récupérer la mission bloquante
  const missionBloquante = !peut
    ? await prisma.mission.findFirst({
        where: {
          demandeurId: profil.employeId,
          dateRetour: { lt: new Date() },
          rapportDeposeLe: null,
          clotureeLe: null,
          refuseeLe: null,
          annuleeLe: null,
        },
        select: {
          id: true,
          reference: true,
          objet: true,
          dateRetour: true,
          fraisEstimes: true,
        },
      })
    : null;

  return (
    <ModuleLayout
      titre="Mes missions"
      description="Gérez vos demandes de mission et rapports"
      helpText="Demandez une mission pour un déplacement professionnel. Une fois validée par votre N+1 puis par la RH, vous recevrez une avance de frais. À votre retour, déposez le rapport avec les justificatifs. Tant qu'un rapport est en attente, vous ne pouvez pas demander de nouvelle mission."
      indicateurs={
        <Suspense fallback={<div>Chargement...</div>}>
          <IndicateursMissions />
        </Suspense>
      }
      taches={{
        titre: (
          <Suspense fallback={<h2 className="text-lg font-semibold text-[#18181a]">Vos tâches</h2>}>
            <TitreTaches />
          </Suspense>
        ),
        contenu: (
          <Suspense fallback={<div className="text-sm text-muted-foreground">Chargement...</div>}>
            <ListeTaches />
          </Suspense>
        ),
      }}
    >
      {/* Bouton nouvelle mission + bandeau blocage */}
      <div className="mb-6 flex items-center justify-between">
        <div />
        <BoutonNouvelleMission
          employeId={profil.employeId}
          bloque={!peut}
          raisonBlocage={
            missionBloquante
              ? `Mission ${missionBloquante.reference} : rapport attendu depuis le ${new Date(missionBloquante.dateRetour).toLocaleDateString("fr-FR")}`
              : undefined
          }
        />
      </div>

      {/* Bandeau de blocage */}
      {missionBloquante && (
        <div className="mb-6 rounded-md border border-orange-200 bg-orange-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="size-5 text-orange-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <h3 className="font-medium text-orange-900 mb-1">
                Rapport de mission en attente
              </h3>
              <p className="text-sm text-orange-800 mb-3">
                Vous ne pouvez pas créer de nouvelle mission tant que le rapport de la mission{" "}
                <span className="font-mono font-medium">{missionBloquante.reference}</span> ({missionBloquante.objet})
                n'est pas déposé. Retour prévu le{" "}
                {new Date(missionBloquante.dateRetour).toLocaleDateString("fr-FR")}.
                Avance versée : <span className="tabular-nums">{missionBloquante.fraisEstimes.toString()} F</span>.
              </p>
              <ModaleDeposerRapport
                missionId={missionBloquante.id}
                employeId={profil.employeId}
                reference={missionBloquante.reference}
              />
            </div>
          </div>
        </div>
      )}

      {/* Liste des missions */}
      <Suspense fallback={<div>Chargement...</div>}>
        <ListeMissions />
      </Suspense>
    </ModuleLayout>
  );
}
