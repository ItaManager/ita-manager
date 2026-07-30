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

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  // Création inline (R-04)
  allowCreate?: boolean;
  onCreateNew?: (inputValue: string) => void | Promise<void>;
  createLabel?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  emptyText = "Aucun résultat.",
  className,
  disabled = false,
  allowCreate = false,
  onCreateNew,
  createLabel = "Créer",
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  const selectedOption = options.find((option) => option.value === value);

  // Normaliser pour recherche (ignorer accents et casse)
  const normalizeString = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  };

  // Filtrer les options selon la recherche
  const filteredOptions = options.filter((option) =>
    normalizeString(option.label).includes(normalizeString(searchValue))
  );

  const handleCreate = async () => {
    if (!onCreateNew || !searchValue.trim()) return;

    await onCreateNew(searchValue.trim());
    setSearchValue("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>
              <div className="py-6 text-center text-sm">
                <p className="text-muted-foreground">{emptyText}</p>
                {allowCreate && searchValue.trim() && onCreateNew && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={handleCreate}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {createLabel} "{searchValue.trim()}"
                  </Button>
                )}
              </div>
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                    setSearchValue("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {/* Bouton de création en bas de liste si résultats existent */}
            {allowCreate && searchValue.trim() && onCreateNew && filteredOptions.length > 0 && (
              <CommandGroup>
                <CommandItem onSelect={handleCreate} className="border-t">
                  <Plus className="mr-2 h-4 w-4" />
                  {createLabel} "{searchValue.trim()}"
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
