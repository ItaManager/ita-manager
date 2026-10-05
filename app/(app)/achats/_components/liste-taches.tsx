import { compterDemandesAValider } from "@/lib/actions/compteurs-achats";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export async function ListeTaches() {
  const aValider = await compterDemandesAValider();

  if (aValider === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune tâche en attente. Les demandes de vos subordonnés apparaîtront ici.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Link
        href="/achats/a-valider"
        className="flex items-center justify-between rounded-lg border border-[#0000001a] bg-white px-4 py-3 transition-colors hover:bg-[#f9fafb]"
      >
        <div>
          <p className="text-sm font-medium text-[#18181a]">
            Valider les demandes d'achat
          </p>
          <p className="text-xs text-muted-foreground">
            {aValider} demande{aValider > 1 ? "s" : ""} de vos subordonnés en attente
          </p>
        </div>
        <ChevronRight className="size-4 text-muted-foreground" />
      </Link>
    </div>
  );
}
