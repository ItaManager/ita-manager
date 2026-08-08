"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationEmployesProps {
  total: number;
  page: number;
  limit: number;
}

export function PaginationEmployes({ total, page, limit }: PaginationEmployesProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(total / limit);

  const changerPage = (nouvellePage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", nouvellePage.toString());
    router.push(`/employes?${params.toString()}`);
  };

  const changerLimit = (nouvelleLimit: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", nouvelleLimit);
    params.set("page", "1");
    router.push(`/employes?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between px-4 py-4 border-t border-border bg-muted/20">
      <div className="flex items-center gap-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">
            {(page - 1) * limit + 1}-{Math.min(page * limit, total)}
          </span> sur <span className="font-medium text-foreground">{total}</span> employé{total > 1 ? "s" : ""}
        </p>
        <Select value={limit.toString()} onValueChange={changerLimit}>
          <SelectTrigger className="h-8 w-[80px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>
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
            <span className="text-sm font-medium text-foreground">{totalPages}</span>
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
