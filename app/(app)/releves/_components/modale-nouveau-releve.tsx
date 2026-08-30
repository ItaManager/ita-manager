"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { creerReleve } from "@/lib/actions/releves";
import { toast } from "sonner";

interface Projet {
  id: string;
  code: string;
  nom: string;
}

interface ModaleNouveauReleveProps {
  ouvert: boolean;
  onClose: () => void;
  projets: Projet[];
}

export function ModaleNouveauReleve({
  ouvert,
  onClose,
  projets,
}: ModaleNouveauReleveProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [projetId, setProjetId] = useState<string>("");
  const [dateString, setDateString] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [openProjet, setOpenProjet] = useState(false);

  const projetSelectionne = projets.find((p) => p.id === projetId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projetId) {
      toast.error("Veuillez sélectionner un chantier");
      return;
    }

    if (!dateString) {
      toast.error("Veuillez sélectionner une date");
      return;
    }

    startTransition(async () => {
      try {
        const releve = await creerReleve({
          projetId,
          date: new Date(dateString),
        });

        toast.success("Relevé créé avec succès");

        // Réinitialiser le formulaire
        setProjetId("");
        setDateString(new Date().toISOString().split("T")[0]);

        // Fermer la modale
        onClose();

        // Rediriger vers la page de détail
        router.push(`/releves/${releve.id}`);
      } catch (err: any) {
        toast.error(err.message || "Une erreur est survenue");
      }
    });
  };

  return (
    <Dialog open={ouvert} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader
          className="border-b border-border px-6 py-4"
          style={{ backgroundColor: "var(--primary-soft)" }}
        >
          <DialogTitle className="text-xl font-semibold text-[#1D186C]">
            Nouveau relevé d'activité
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Créer un relevé journalier de chantier
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-4">
          {/* Sélecteur de chantier */}
          <div className="space-y-2">
            <Label htmlFor="projet" className="text-sm font-medium">
              Chantier <span className="text-destructive">*</span>
            </Label>
            <Popover open={openProjet} onOpenChange={setOpenProjet}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openProjet}
                  className="w-full justify-between h-11"
                  disabled={isPending}
                >
                  {projetSelectionne ? (
                    <span>
                      <span className="font-medium">{projetSelectionne.code}</span>
                      {" — "}
                      <span className="text-muted-foreground">
                        {projetSelectionne.nom}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Sélectionner un chantier...
                    </span>
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
                            <div className="text-xs text-muted-foreground">
                              {projet.nom}
                            </div>
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
            <Label htmlFor="date" className="text-sm font-medium">
              Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={dateString}
              onChange={(e) => setDateString(e.target.value)}
              disabled={isPending}
              className="h-11"
              required
            />
            <p className="text-xs text-muted-foreground">
              Date du relevé journalier
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isPending || !projetId || !dateString}
              className="gap-2 bg-[#13850b] hover:bg-[#0f6909]"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer le relevé"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
