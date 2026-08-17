import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { AlertCircle, FolderOpen, ListChecks } from "lucide-react";
import Link from "next/link";

export async function ListeTaches() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <p className="text-sm text-muted-foreground">
        Connectez-vous pour voir vos tâches
      </p>
    );
  }

  // Projets à compléter (brouillons)
  const projetsBrouillons = await prisma.projet.findMany({
    where: { statut: "BROUILLON" },
    select: {
      id: true,
      code: true,
      nom: true,
    },
    take: 3,
    orderBy: { creeLe: "desc" },
  });

  // Projets en cours avec tâches
  const projetsEnCours = await prisma.projet.findMany({
    where: {
      statut: "EN_COURS",
    },
    select: {
      id: true,
      code: true,
      nom: true,
      taches: {
        where: {
          OR: [
            { avancementConstate: { lt: 100 } },
            { avancementConstate: null },
          ],
        },
        select: { id: true },
      },
    },
    take: 3,
    orderBy: { dateDebut: "desc" },
  });

  const taches = [
    ...projetsBrouillons.map((p) => ({
      id: p.id,
      type: "brouillon" as const,
      titre: `Compléter ${p.code}`,
      description: p.nom,
      lien: `/projets/${p.id}`,
      icon: FolderOpen,
      couleur: "text-amber-600",
    })),
    ...projetsEnCours.map((p) => ({
      id: p.id,
      type: "taches" as const,
      titre: `${p.taches.length} tâche${p.taches.length > 1 ? "s" : ""} en cours`,
      description: `${p.code} — ${p.nom}`,
      lien: `/projets/${p.id}`,
      icon: ListChecks,
      couleur: "text-blue-600",
    })),
  ];

  if (taches.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune tâche en attente
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {taches.map((tache) => {
        const Icon = tache.icon;
        return (
          <Link
            key={`${tache.type}-${tache.id}`}
            href={tache.lien}
            className="block p-3 rounded-md border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start gap-3">
              <Icon className={`size-5 mt-0.5 ${tache.couleur}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {tache.titre}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {tache.description}
                </p>
              </div>
            </div>
          </Link>
        );
      })}

      {taches.length >= 6 && (
        <Link
          href="/projets"
          className="block text-center text-sm text-primary hover:underline pt-2"
        >
          Voir tous les projets →
        </Link>
      )}
    </div>
  );
}
