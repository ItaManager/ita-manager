import { FolderKanban, PlayCircle, PauseCircle, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/db/prisma";

export async function IndicateursProjets() {
  // Compter les projets par statut
  const [total, enCours, ouverts, clotures] = await Promise.all([
    prisma.projet.count(),
    prisma.projet.count({ where: { statut: "EN_COURS" } }),
    prisma.projet.count({ where: { statut: "OUVERT" } }),
    prisma.projet.count({ where: { statut: "CLOTURE" } }),
  ]);

  const indicateurs = [
    {
      label: "Total projets",
      valeur: total,
      icon: FolderKanban,
      description: "Tous statuts confondus",
    },
    {
      label: "En cours",
      valeur: enCours,
      icon: PlayCircle,
      description: "Chantiers actifs",
      couleur: "text-blue-600",
    },
    {
      label: "Ouverts",
      valeur: ouverts,
      icon: PauseCircle,
      description: "Prêts à démarrer",
      couleur: "text-amber-600",
    },
    {
      label: "Clôturés",
      valeur: clotures,
      icon: CheckCircle2,
      description: "Terminés",
      couleur: "text-green-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {indicateurs.map((indicateur) => {
        const Icon = indicateur.icon;
        return (
          <div
            key={indicateur.label}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {indicateur.label}
                </p>
                <p className={`text-2xl font-semibold mt-1 tabular-nums ${indicateur.couleur || "text-foreground"}`}>
                  {indicateur.valeur}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {indicateur.description}
                </p>
              </div>
              <Icon className={`size-8 ${indicateur.couleur || "text-gray-400"}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
