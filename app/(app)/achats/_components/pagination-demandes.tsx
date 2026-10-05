"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface PaginationDemandesProps {
  total: number;
  page: number;
  limit: number;
}

export function PaginationDemandes({ total, page, limit }: PaginationDemandesProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(total / limit);
  const debut = (page - 1) * limit + 1;
  const fin = Math.min(page * limit, total);

  const changerPage = (nouvellePage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", nouvellePage.toString());
    router.push(`/achats?${params.toString()}`);
  };

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20">
      <div className="text-sm text-muted-foreground">
        Affichage de <span className="font-medium text-foreground">{debut}</span> à{" "}
        <span className="font-medium text-foreground">{fin}</span> sur{" "}
        <span className="font-medium text-foreground">{total}</span> demande
        {total > 1 ? "s" : ""}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => changerPage(page - 1)}
          disabled={page === 1}
          className="h-8"
        >
          <ChevronLeft className="size-4 mr-1" />
          Précédent
        </Button>

        <div className="text-sm text-muted-foreground">
          Page <span className="font-medium text-foreground">{page}</span> sur{" "}
          <span className="font-medium text-foreground">{totalPages}</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => changerPage(page + 1)}
          disabled={page >= totalPages}
          className="h-8"
        >
          Suivant
          <ChevronRight className="size-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
