"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { creerReleve } from "@/lib/actions/releves";

interface Projet {
  id: string;
  code: string;
  nom: string;
}

interface FormulaireNouveauReleveProps {
  projets: Projet[];
}

export function FormulaireNouveauReleve({ projets }: FormulaireNouveauReleveProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projetId, setProjetId] = useState<string>("");
  const [dateString, setDateString] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [openProjet, setOpenProjet] = useState(false);

  const projetSelectionne = projets.find((p) => p.id === projetId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!projetId) {
      setError("Veuillez sélectionner un chantier");
      return;
    }

    if (!dateString) {
      setError("Veuillez sélectionner une date");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const releve = await creerReleve({
        projetId,
        date: new Date(dateString),
      });

      // Rediriger vers la page de détail
      router.push(`/releves/${releve.id}`);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Informations du relevé</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sélecteur de chantier */}
          <div className="space-y-2">
            <Label htmlFor="projet">
              Chantier <span className="text-destructive">*</span>
            </Label>
            <Popover open={openProjet} onOpenChange={setOpenProjet}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openProjet}
                  className="w-full justify-between rounded-md"
                  disabled={loading}
                >
                  {projetSelectionne ? (
                    <span>
                      <span className="font-medium">{projetSelectionne.code}</span>
                      {" — "}
                      <span className="text-muted-foreground">{projetSelectionne.nom}</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Sélectionner un chantier...</span>
                  )}
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[500px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Rechercher un chantier..." />
                  <CommandList>
                    <CommandEmpty>Aucun chantier trouvé.</CommandEmpty>
                    <CommandGroup>
                      {projets.map((projet) => (
                        <CommandItem
                          key={projet.id}
                          value={`${projet.code} ${projet.nom}`}
                          onSelect={() => {
                            setProjetId(projet.id);
                            setOpenProjet(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 size-4",
                              projetId === projet.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div>
                            <div className="font-medium">{projet.code}</div>
                            <div className="text-xs text-muted-foreground">{projet.nom}</div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Chantier concerné par ce relevé d'activité
            </p>
          </div>

          {/* Sélecteur de date */}
          <div className="space-y-2">
            <Label htmlFor="date">
              Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={dateString}
              onChange={(e) => setDateString(e.target.value)}
              disabled={loading}
              className="rounded-md"
              required
            />
            <p className="text-xs text-muted-foreground">
              Date du relevé journalier
            </p>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !projetId || !dateString}
              className="gap-2 bg-[#13850b] hover:bg-[#0f6909]"
            >
              {loading ? "Création..." : "Créer le relevé"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
