import { obtenirTachesConges } from "@/lib/actions/conges";
import Link from "next/link";

interface Tache {
  id: string;
  type: "A_VALIDER_N1" | "CONTROLE_RH" | "DOSSIER_INCOMPLET";
  titre: string;
  description: string;
  lien: string;
  priorite: "HAUTE" | "NORMALE" | "BASSE";
}

export async function ListeTaches() {
  const resultTaches = await obtenirTachesConges();
  const taches = resultTaches.success ? resultTaches.data : [];

  if (taches.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Aucune tâche en attente
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {taches.map((tache) => {
        return (
          <Link
            key={tache.id}
            href={tache.lien}
            className="flex items-start gap-3 p-4 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{tache.titre}</p>
              <p className="text-xs text-muted-foreground">{tache.description}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
