"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  baseUrl: string;
  searchParams?: Record<string, string | undefined>;
}

export function Pagination({
  page,
  totalPages,
  baseUrl,
  searchParams = {},
}: PaginationProps) {
  const creerUrl = (nouvellePage: number) => {
    const params = new URLSearchParams();

    // Copier les paramètres existants (sauf page)
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    // Ajouter la nouvelle page
    if (nouvellePage > 1) {
      params.set("page", nouvellePage.toString());
    }

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  };

  const afficherPages = () => {
    const pages: (number | "...")[] = [];

    // Toujours afficher la première page
    pages.push(1);

    // Pages autour de la page actuelle
    const debut = Math.max(2, page - 1);
    const fin = Math.min(totalPages - 1, page + 1);

    if (debut > 2) {
      pages.push("...");
    }

    for (let i = debut; i <= fin; i++) {
      pages.push(i);
    }

    if (fin < totalPages - 1) {
      pages.push("...");
    }

    // Toujours afficher la dernière page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Page {page} sur {totalPages}
      </p>

      <div className="flex items-center gap-2">
        {/* Bouton Précédent */}
        <Button
          variant="outline"
          size="sm"
          asChild={page > 1}
          disabled={page === 1}
          aria-label="Page précédente"
        >
          {page > 1 ? (
            <Link href={creerUrl(page - 1)}>
              <ChevronLeft className="size-4" aria-hidden="true" />
              Précédent
            </Link>
          ) : (
            <span className="flex items-center gap-2">
              <ChevronLeft className="size-4" aria-hidden="true" />
              Précédent
            </span>
          )}
        </Button>

        {/* Numéros de pages */}
        <div className="hidden items-center gap-1 sm:flex">
          {afficherPages().map((p, index) =>
            p === "..." ? (
              <span
                key={`ellipsis-${index}`}
                className="px-2 text-sm text-muted-foreground"
                aria-hidden="true"
              >
                ...
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="sm"
                asChild={p !== page}
                disabled={p === page}
                className="min-w-[40px]"
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
              >
                {p === page ? <span>{p}</span> : <Link href={creerUrl(p)}>{p}</Link>}
              </Button>
            )
          )}
        </div>

        {/* Bouton Suivant */}
        <Button
          variant="outline"
          size="sm"
          asChild={page < totalPages}
          disabled={page === totalPages}
          aria-label="Page suivante"
        >
          {page < totalPages ? (
            <Link href={creerUrl(page + 1)}>
              Suivant
              <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          ) : (
            <span className="flex items-center gap-2">
              Suivant
              <ChevronRight className="size-4" aria-hidden="true" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
