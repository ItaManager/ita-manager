"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus, Search, Lock } from "lucide-react";
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
  disabled?: boolean;
  icon?: React.ReactNode;
  description?: string;
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
  // Nouveau variant pour matcher la maquette
  variant?: "default" | "search";
  // Rendu personnalisé d'une option
  renderOption?: (option: ComboboxOption) => React.ReactNode;
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
  variant = "default",
  renderOption,
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

  const handleSelect = (selectedValue: string) => {
    const option = options.find((opt) => opt.value === selectedValue);
    if (option && !option.disabled) {
      onChange(selectedValue === value ? "" : selectedValue);
      setOpen(false);
      setSearchValue("");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {variant === "search" ? (
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "w-full flex items-center justify-between h-12 px-4 border border-border rounded-lg bg-background hover:border-primary transition-colors text-left",
              disabled && "opacity-50 cursor-not-allowed hover:border-border",
              className
            )}
          >
            {selectedOption ? (
              <span className="text-foreground">{selectedOption.label}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <Search className="size-5 text-muted-foreground" />
          </button>
        ) : (
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
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
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
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleCreate();
                    }}
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
                  disabled={option.disabled}
                  onSelect={() => handleSelect(option.value)}
                  className={cn(
                    option.disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {renderOption ? (
                    renderOption(option)
                  ) : (
                    <>
                      {option.icon}
                      <div className="flex items-center gap-2 flex-1">
                        {option.disabled && (
                          <Lock className="size-4 text-muted-foreground" />
                        )}
                        <div className="flex-1">
                          <div className={cn(option.disabled && "text-muted-foreground")}>
                            {option.label}
                          </div>
                          {option.description && (
                            <div className="text-sm text-muted-foreground ml-auto">
                              {option.description}
                            </div>
                          )}
                        </div>
                      </div>
                      {variant !== "search" && (
                        <Check
                          className={cn(
                            "ml-2 h-4 w-4",
                            value === option.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                      )}
                    </>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            {/* Bouton de création en bas de liste si résultats existent */}
            {allowCreate && searchValue.trim() && onCreateNew && filteredOptions.length > 0 && (
              <CommandGroup>
                <CommandItem
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleCreate();
                  }}
                  className="border-t"
                >
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
