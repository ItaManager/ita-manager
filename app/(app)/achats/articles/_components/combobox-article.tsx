"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ModaleCreerArticle } from "./modale-creer-article";

interface ComboboxArticleProps {
  articles: Array<{
    id: string;
    designation: string;
    unite: { libelle: string };
  }>;
  value?: string;
  onChange: (value: string) => void;
  onArticleCreated: (article: {
    id: string;
    designation: string;
    unite: { libelle: string };
  }) => void;
}

export function ComboboxArticle({
  articles,
  value,
  onChange,
  onArticleCreated,
}: ComboboxArticleProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [modaleOpen, setModaleOpen] = useState(false);

  const selectedArticle = articles.find((a) => a.id === value);

  // Normaliser pour recherche (ignorer accents et casse)
  const normalizeString = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  };

  // Filtrer les articles selon la recherche
  const filteredArticles = articles.filter((article) =>
    normalizeString(article.designation).includes(normalizeString(searchValue)),
  );

  // C-04 : onMouseDown + preventDefault pour ne pas perdre le focus
  const handleOpenModale = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setModaleOpen(true);
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Sélectionner un article"
            className={cn(
              "w-full justify-between",
              !value && "text-muted-foreground",
            )}
          >
            {selectedArticle ? (
              <span className="flex items-center gap-2">
                <span className="font-normal">{selectedArticle.designation}</span>
                <span className="text-xs text-muted-foreground">
                  ({selectedArticle.unite.libelle})
                </span>
              </span>
            ) : (
              "Sélectionner un article"
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Rechercher un article..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>
                <div className="py-6 text-center text-sm">
                  <p className="text-muted-foreground">Aucun article trouvé.</p>
                  {searchValue.trim() && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onMouseDown={handleOpenModale}
                    >
                      <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                      Créer l'article "{searchValue.trim()}"
                    </Button>
                  )}
                </div>
              </CommandEmpty>
              <CommandGroup>
                {filteredArticles.map((article) => (
                  <CommandItem
                    key={article.id}
                    value={article.id}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                      setSearchValue("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === article.id ? "opacity-100" : "opacity-0",
                      )}
                      aria-hidden="true"
                    />
                    <span className="flex items-center gap-2">
                      <span>{article.designation}</span>
                      <span className="text-xs text-muted-foreground">
                        ({article.unite.libelle})
                      </span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
              {/* Bouton de création en bas de liste si résultats existent */}
              {searchValue.trim() && filteredArticles.length > 0 && (
                <CommandGroup>
                  <CommandItem
                    onMouseDown={handleOpenModale}
                    className="border-t"
                  >
                    <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                    Créer l'article "{searchValue.trim()}"
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Modale de création d'article (avec unité) */}
      <ModaleCreerArticle
        open={modaleOpen}
        onOpenChange={setModaleOpen}
        designationInitiale={searchValue.trim()}
        onArticleCreated={(article) => {
          onArticleCreated(article);
          setSearchValue("");
        }}
      />
    </>
  );
}
