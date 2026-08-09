import { obtenirTachesConges } from "@/lib/actions/conges";
import Link from "next/link";
import { AlertCircle, FileCheck, UserCheck } from "lucide-react";

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

  const getIconeType = (type: Tache["type"]) => {
    switch (type) {
      case "A_VALIDER_N1":
        return UserCheck;
      case "CONTROLE_RH":
        return FileCheck;
      case "DOSSIER_INCOMPLET":
        return AlertCircle;
    }
  };

  const getCouleurPriorite = (priorite: Tache["priorite"]) => {
    switch (priorite) {
      case "HAUTE":
        return "text-[#dc2626]";
      case "NORMALE":
        return "text-[#f59e0b]";
      case "BASSE":
        return "text-[#6b7280]";
    }
  };

  return (
    <div className="space-y-3">
      {taches.map((tache) => {
        const IconeTache = getIconeType(tache.type);
        const couleurPriorite = getCouleurPriorite(tache.priorite);

        return (
          <Link
            key={tache.id}
            href={tache.lien}
            className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
          >
            <div className={`mt-0.5 ${couleurPriorite}`}>
              <IconeTache className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{tache.titre}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{tache.description}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
