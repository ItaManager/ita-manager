"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProjetsProps {
  total: number;
  page: number;
  totalPages: number;
}

export function PaginationProjets({
  total,
  page,
  totalPages,
}: PaginationProjetsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const limit = parseInt(searchParams.get("limit") || "20");

  const changerPage = (nouvellePage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", nouvellePage.toString());
    router.push(`/projets?${params.toString()}`);
  };

  const changerLimit = (nouvelleLimit: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", nouvelleLimit);
    params.set("page", "1"); // Reset à la page 1
    router.push(`/projets?${params.toString()}`);
  };

  if (total === 0) return null;

  return (
    <div className="flex items-center justify-between px-4 py-4">
      {/* Info et sélecteur de limite */}
      <div className="flex items-center gap-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {(page - 1) * limit + 1}-{Math.min(page * limit, total)}
          </span>{" "}
          sur{" "}
          <span className="font-medium text-foreground">{total}</span>{" "}
          projets
        </p>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Afficher :</span>
          <Select value={limit.toString()} onValueChange={changerLimit}>
            <SelectTrigger className="h-8 w-[80px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Navigation simplifiée */}
      {totalPages > 1 && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => changerPage(page - 1)}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-[#13850b] hover:text-[#0f6909] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="size-4" />
            Précédent
          </button>

          <div className="flex items-center gap-1 px-3 py-1 bg-muted/30 rounded-md">
            <span className="text-sm text-muted-foreground">Page</span>
            <span className="text-sm font-bold text-[#13850b]">{page}</span>
            <span className="text-sm text-muted-foreground">sur</span>
            <span className="text-sm font-medium text-foreground">
              {totalPages}
            </span>
          </div>

          <button
            onClick={() => changerPage(page + 1)}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-[#13850b] hover:text-[#0f6909] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Suivant
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
