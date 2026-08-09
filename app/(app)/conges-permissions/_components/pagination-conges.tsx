"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationCongesProps {
  total: number;
  page: number;
  limit: number;
}

export function PaginationConges({ total, page, limit }: PaginationCongesProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pages = Math.ceil(total / limit);

  if (pages <= 1) {
    return null;
  }

  const changerPage = (nouvellePage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", nouvellePage.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-border">
      <p className="text-sm text-muted-foreground">
        Page {page} sur {pages} • {total} résultat{total > 1 ? "s" : ""}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => changerPage(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="size-4" />
        </Button>

        {/* Numéros de page */}
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, pages) }, (_, i) => {
            let numeroPage: number;

            if (pages <= 5) {
              numeroPage = i + 1;
            } else if (page <= 3) {
              numeroPage = i + 1;
            } else if (page >= pages - 2) {
              numeroPage = pages - 4 + i;
            } else {
              numeroPage = page - 2 + i;
            }

            return (
              <Button
                key={numeroPage}
                variant={numeroPage === page ? "default" : "ghost"}
                size="sm"
                onClick={() => changerPage(numeroPage)}
                className="w-9"
              >
                {numeroPage}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => changerPage(page + 1)}
          disabled={page >= pages}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
