"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function PaginationMateriel({
  page,
  totalPages,
  total,
}: {
  page: number;
  totalPages: number;
  total: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function naviguerVers(nouvellePage: number) {
    const params = new URLSearchParams(searchParams.toString());

    if (nouvellePage > 1) {
      params.set("page", nouvellePage.toString());
    } else {
      params.delete("page");
    }

    router.push(`/ressources?${params.toString()}`);
  }

  const debut = (page - 1) * 25 + 1;
  const fin = Math.min(page * 25, total);

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        {total === 0 ? (
          <span>Aucun résultat</span>
        ) : (
          <span>
            {debut}–{fin} sur {total.toLocaleString("fr-FR")} matériel
            {total > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => naviguerVers(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="size-4 mr-1" />
            Précédent
          </Button>

          <div className="text-sm text-muted-foreground">
            Page {page} sur {totalPages}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => naviguerVers(page + 1)}
            disabled={page >= totalPages}
          >
            Suivant
            <ChevronRight className="size-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
