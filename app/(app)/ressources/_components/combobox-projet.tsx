"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
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

type ProjetOption = {
  id: string;
  code: string;
  nom: string;
};

interface ComboboxProjetProps {
  projets: ProjetOption[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ComboboxProjet({
  projets,
  value,
  onChange,
  disabled,
  placeholder = "Sélectionner un projet...",
}: ComboboxProjetProps) {
  const [ouvert, setOuvert] = React.useState(false);

  const projetSelectionne = projets.find((p) => p.id === value);

  // Normaliser pour recherche sans accents
  const normaliser = (texte: string) =>
    texte
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  return (
    <Popover open={ouvert} onOpenChange={setOuvert}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={ouvert}
          aria-label="Sélectionner un projet"
          className="w-full justify-between"
          disabled={disabled}
        >
          {projetSelectionne ? (
            <span className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {projetSelectionne.code}
              </span>
              {projetSelectionne.nom}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown
            className="ml-2 size-4 shrink-0 opacity-50"
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command
          filter={(value, search) => {
            const projet = projets.find((p) => p.id === value);
            if (!projet) return 0;

            const rechercheNormalisee = normaliser(search);
            const codeNormalise = normaliser(projet.code);
            const nomNormalise = normaliser(projet.nom);

            if (
              codeNormalise.includes(rechercheNormalisee) ||
              nomNormalise.includes(rechercheNormalisee)
            ) {
              return 1;
            }

            return 0;
          }}
        >
          <CommandInput placeholder="Rechercher un projet..." />
          <CommandList>
            <CommandEmpty>Aucun projet trouvé.</CommandEmpty>
            <CommandGroup>
              {/* Option "Aucun" pour désélectionner */}
              <CommandItem
                value="__none__"
                onSelect={() => {
                  onChange(undefined);
                  setOuvert(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 size-4",
                    !value ? "opacity-100" : "opacity-0"
                  )}
                  aria-hidden="true"
                />
                <span className="text-muted-foreground italic">
                  Aucun projet
                </span>
              </CommandItem>

              {projets.map((projet) => (
                <CommandItem
                  key={projet.id}
                  value={projet.id}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? undefined : currentValue);
                    setOuvert(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value === projet.id ? "opacity-100" : "opacity-0"
                    )}
                    aria-hidden="true"
                  />
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {projet.code}
                    </span>
                    {projet.nom}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
