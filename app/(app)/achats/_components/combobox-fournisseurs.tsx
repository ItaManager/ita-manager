"use client";

import { useState, useEffect } from "react";
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
import { listerFournisseurs, creerFournisseur } from "@/lib/actions/achats";
import { toast } from "sonner";

interface ComboboxFournisseursProps {
  value?: string;
  onChange: (value: string) => void;
}

export function ComboboxFournisseurs({
  value,
  onChange,
}: ComboboxFournisseursProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [fournisseurs, setFournisseurs] = useState<
    Array<{ id: string; nom: string }>
  >([]);
  const [chargement, setChargement] = useState(true);
  const [creation, setCreation] = useState(false);

  useEffect(() => {
    chargerFournisseurs();
  }, []);

  const chargerFournisseurs = async () => {
    try {
      const data = await listerFournisseurs();
      setFournisseurs(data);
    } catch (error: any) {
      toast.error("Erreur lors du chargement des fournisseurs");
    } finally {
      setChargement(false);
    }
  };

  const selectedFournisseur = fournisseurs.find((f) => f.id === value);

  // Normaliser pour recherche (ignorer accents et casse)
  const normalizeString = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  };

  // Filtrer les fournisseurs selon la recherche
  const filteredFournisseurs = fournisseurs.filter((fournisseur) =>
    normalizeString(fournisseur.nom).includes(normalizeString(searchValue)),
  );

  // Vérifier si la recherche correspond à un existant
  const exactMatch = fournisseurs.find(
    (f) => normalizeString(f.nom) === normalizeString(searchValue)
  );

  // Fonction pour créer un nouveau fournisseur
  const handleCreer = async () => {
    if (!searchValue.trim()) {
      toast.error("Veuillez saisir un nom de fournisseur");
      return;
    }

    setCreation(true);
    try {
      const nouveau = await creerFournisseur(searchValue.trim());
      setFournisseurs((prev) => [...prev, nouveau]);
      onChange(nouveau.id);
      setOpen(false);
      setSearchValue("");
      toast.success(`Fournisseur "${nouveau.nom}" créé`);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création");
    } finally {
      setCreation(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Sélectionner un fournisseur"
          className={cn(
            "w-full justify-between rounded-md",
            !value && "text-muted-foreground",
          )}
          disabled={chargement}
        >
          {chargement ? (
            "Chargement..."
          ) : selectedFournisseur ? (
            selectedFournisseur.nom
          ) : (
            "Sélectionner un fournisseur"
          )}
          <ChevronsUpDown
            className="ml-2 h-4 w-4 shrink-0 opacity-50"
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Rechercher un fournisseur..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            {filteredFournisseurs.length === 0 && searchValue && !exactMatch ? (
              <CommandEmpty>
                <div className="py-6 text-center text-sm space-y-3">
                  <p className="text-muted-foreground">
                    Aucun fournisseur trouvé.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreer}
                    disabled={creation}
                    className="rounded-md"
                  >
                    {creation ? "Création..." : `Créer "${searchValue}"`}
                  </Button>
                </div>
              </CommandEmpty>
            ) : (
              <CommandEmpty>
                <div className="py-6 text-center text-sm">
                  <p className="text-muted-foreground">
                    Aucun fournisseur trouvé.
                  </p>
                </div>
              </CommandEmpty>
            )}
            <CommandGroup>
              {filteredFournisseurs.map((fournisseur) => (
                <CommandItem
                  key={fournisseur.id}
                  value={fournisseur.id}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                    setSearchValue("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === fournisseur.id ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden="true"
                  />
                  {fournisseur.nom}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
