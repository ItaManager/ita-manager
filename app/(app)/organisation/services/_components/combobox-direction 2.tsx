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
import type { Direction } from "@prisma/client";

interface ComboboxDirectionProps {
  directions: Direction[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ComboboxDirection({
  directions,
  value,
  onChange,
  disabled,
}: ComboboxDirectionProps) {
  const [ouvert, setOuvert] = React.useState(false);

  const directionSelectionnee = directions.find((d) => d.id === value);

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
          aria-label="Sélectionner une direction"
          className="w-full justify-between"
          disabled={disabled}
        >
          {directionSelectionnee ? (
            <span className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {directionSelectionnee.code}
              </span>
              {directionSelectionnee.libelle}
            </span>
          ) : (
            <span className="text-muted-foreground">
              Sélectionner une direction...
            </span>
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
            const direction = directions.find((d) => d.id === value);
            if (!direction) return 0;

            const rechercheNormalisee = normaliser(search);
            const codeNormalise = normaliser(direction.code);
            const libelleNormalise = normaliser(direction.libelle);

            if (
              codeNormalise.includes(rechercheNormalisee) ||
              libelleNormalise.includes(rechercheNormalisee)
            ) {
              return 1;
            }

            return 0;
          }}
        >
          <CommandInput placeholder="Rechercher une direction..." />
          <CommandList>
            <CommandEmpty>Aucune direction trouvée.</CommandEmpty>
            <CommandGroup>
              {directions.map((direction) => (
                <CommandItem
                  key={direction.id}
                  value={direction.id}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOuvert(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value === direction.id ? "opacity-100" : "opacity-0"
                    )}
                    aria-hidden="true"
                  />
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {direction.code}
                    </span>
                    {direction.libelle}
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
