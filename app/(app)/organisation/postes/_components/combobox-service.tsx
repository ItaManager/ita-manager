"use client";

import * as React from "react";
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
import { creerService } from "@/lib/actions/organisation";
import type { Service } from "@prisma/client";

interface ComboboxServiceProps {
  services: Service[];
  directionId: string | null;
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  onServiceCreated?: (service: Service) => void;
}

export function ComboboxService({
  services,
  directionId,
  value,
  onChange,
  disabled,
  onServiceCreated,
}: ComboboxServiceProps) {
  const [ouvert, setOuvert] = React.useState(false);
  const [recherche, setRecherche] = React.useState("");
  const [creation, setCreation] = React.useState(false);

  const serviceSelectionne = services.find((s) => s.id === value);

  // Normaliser pour recherche sans accents
  const normaliser = (texte: string) =>
    texte
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  // Filtrer les services de la direction sélectionnée
  const servicesFiltres = services.filter(
    (s) => !directionId || s.directionId === directionId
  );

  // Créer un service en ligne (R-04)
  const creerServiceEnLigne = async () => {
    if (!directionId || !recherche.trim()) return;

    setCreation(true);
    try {
      const code = recherche
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "_")
        .replace(/[^A-Z_]/g, "");

      const { service } = await creerService({
        code: code || `SERVICE_${Date.now()}`,
        libelle: recherche.trim(),
        directionId,
        ordre: 0,
      });

      // Callback pour ajouter le service à la liste
      onServiceCreated?.(service);
      onChange(service.id);
      setOuvert(false);
      setRecherche("");
    } catch (error) {
      console.error("Erreur création service:", error);
    } finally {
      setCreation(false);
    }
  };

  return (
    <Popover open={ouvert} onOpenChange={setOuvert}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={ouvert}
          aria-label="Sélectionner un service"
          className="w-full justify-between"
          disabled={disabled || !directionId}
        >
          {serviceSelectionne ? (
            <span className="flex items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">
                {serviceSelectionne.code}
              </span>
              {serviceSelectionne.libelle}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {!directionId
                ? "Sélectionnez d'abord une direction"
                : "Sélectionner un service..."}
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
            if (value === "create") return 1;

            const service = servicesFiltres.find((s) => s.id === value);
            if (!service) return 0;

            const rechercheNormalisee = normaliser(search);
            const codeNormalise = normaliser(service.code);
            const libelleNormalise = normaliser(service.libelle);

            if (
              codeNormalise.includes(rechercheNormalisee) ||
              libelleNormalise.includes(rechercheNormalisee)
            ) {
              return 1;
            }

            return 0;
          }}
        >
          <CommandInput
            placeholder="Rechercher un service..."
            value={recherche}
            onValueChange={setRecherche}
          />
          <CommandList>
            <CommandEmpty>
              <div className="py-6 text-center text-sm">
                <p className="text-muted-foreground">Aucun service trouvé.</p>
                {recherche.trim() && directionId && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 gap-2"
                    onClick={creerServiceEnLigne}
                    disabled={creation}
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    Créer &quot;{recherche.trim()}&quot;
                  </Button>
                )}
              </div>
            </CommandEmpty>
            <CommandGroup>
              {servicesFiltres.map((service) => (
                <CommandItem
                  key={service.id}
                  value={service.id}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? null : currentValue);
                    setOuvert(false);
                    setRecherche("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value === service.id ? "opacity-100" : "opacity-0"
                    )}
                    aria-hidden="true"
                  />
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {service.code}
                    </span>
                    {service.libelle}
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
