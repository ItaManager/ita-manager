import { prisma } from "@/lib/db/prisma";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { BoutonNouvelleMission } from "./_components/bouton-nouvelle-mission";

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

  // Récupérer les missions de l'employé
  const missions = await prisma.mission.findMany({
    where: {
      demandeurId: profil.employeId,
    },
    orderBy: {
      dateDepart: "desc",
    },
    include: {
      demandeur: {
        select: {
          prenom: true,
          nom: true,
        },
      },
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Mes missions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez vos demandes de mission et rapports
          </p>
        </div>
        <BoutonNouvelleMission employeId={profil.employeId} />
      </div>

      {missions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground mb-4">
            Vous n'avez aucune mission enregistrée
          </p>
          <BoutonNouvelleMission employeId={profil.employeId} />
        </div>
      ) : (
        <div className="rounded-lg border">
          <div className="p-4 border-b font-medium bg-muted/50">
            <div className="grid grid-cols-5 gap-4">
              <div>Référence</div>
              <div>Objet</div>
              <div>Destination</div>
              <div>Dates</div>
              <div className="text-right">Montant</div>
            </div>
          </div>
          <div className="divide-y">
            {missions.map((mission) => (
              <div key={mission.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="grid grid-cols-5 gap-4">
                  <div className="font-medium">{mission.reference}</div>
                  <div>{mission.objet}</div>
                  <div>{mission.destination}</div>
                  <div className="text-sm">
                    {new Date(mission.dateDepart).toLocaleDateString("fr-FR")} →{" "}
                    {new Date(mission.dateRetour).toLocaleDateString("fr-FR")}
                  </div>
                  <div className="text-right tabular-nums">
                    {mission.fraisEstimes.toString()} F
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
