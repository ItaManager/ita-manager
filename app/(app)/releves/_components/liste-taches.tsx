import { obtenirTachesReleves } from "@/lib/actions/releves";
import { ChevronRight, Info } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export async function ListeTaches() {
  const taches = await obtenirTachesReleves();

  if (taches.length === 0) {
    return (
      <div className="text-center py-8">
        <Info className="size-12 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-sm text-muted-foreground">
          Aucune tâche en attente pour le moment.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Tous les relevés sont à jour.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {taches.map((tache) => (
        <Link
          key={tache.id}
          href={tache.lien || "/releves"}
          className="flex items-start gap-3 py-3 border-b border-[#0000000d] hover:bg-[#f9fafb] transition-colors group"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-medium text-[#18181a]">
                {tache.titre}
              </p>
              {tache.count && tache.count > 0 && (
                <Badge variant="secondary" className="shrink-0">
                  {tache.count}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {tache.description}
            </p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0 mt-0.5" />
        </Link>
      ))}
    </div>
  );
}
