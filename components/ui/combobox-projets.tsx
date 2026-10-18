/**
 * Combobox de sélection de projets
 *
 * Composant réutilisable pour sélectionner un projet dans les formulaires
 * Utilise l'API /api/projets/actifs pour récupérer les projets actifs
 *
 * Usage :
 * <ComboboxProjets
 *   value={field.value}
 *   onChange={field.onChange}
 *   placeholder="Sélectionner un projet..."
 * />
 */

'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

type Projet = {
  id: string;
  code: string;
  nom: string;
  statut: string;
};

type ComboboxProjetsProps = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function ComboboxProjets({
  value,
  onChange,
  placeholder = 'Sélectionner un projet...',
  disabled = false,
  className,
}: ComboboxProjetsProps) {
  const [open, setOpen] = useState(false);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function chargerProjets() {
      try {
        const response = await fetch('/api/projets/actifs');
        if (!response.ok) throw new Error('Erreur chargement projets');

        const data = await response.json();
        setProjets(data.projets || []);
      } catch (error) {
        console.error('Erreur lors du chargement des projets:', error);
        setProjets([]);
      } finally {
        setLoading(false);
      }
    }

    chargerProjets();
  }, []);

  const selectedProjet = projets.find((p) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || loading}
          className={cn(
            'w-full justify-between rounded-md',
            !value && 'text-muted-foreground',
            className
          )}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement...
            </span>
          ) : value && selectedProjet ? (
            <span>
              <span className="font-mono text-xs text-muted-foreground mr-2">
                {selectedProjet.code}
              </span>
              {selectedProjet.nom}
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher un projet..." />
          <CommandList>
            <CommandEmpty>Aucun projet trouvé.</CommandEmpty>
            <CommandGroup>
              {projets.map((projet) => (
                <CommandItem
                  key={projet.id}
                  value={`${projet.code} ${projet.nom}`}
                  onSelect={() => {
                    onChange(projet.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === projet.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground min-w-[60px]">
                      {projet.code}
                    </span>
                    <span className="text-sm">{projet.nom}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
