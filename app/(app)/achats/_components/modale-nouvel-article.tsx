"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, ChevronsUpDown, Plus } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { creerArticle, listerUnites, creerUnite } from "@/lib/actions/achats";
import { toast } from "sonner";

interface ModaleNouvelArticleProps {
  ouvert: boolean;
  onClose: () => void;
  onArticleCree: (article: { id: string; designation: string; unite: { libelle: string } }) => void;
  designationInitiale?: string;
}

export function ModaleNouvelArticle({
  ouvert,
  onClose,
  onArticleCree,
  designationInitiale = "",
}: ModaleNouvelArticleProps) {
  const [isPending, startTransition] = useTransition();
  const [designation, setDesignation] = useState(designationInitiale);
  const [uniteId, setUniteId] = useState("");
  const [unites, setUnites] = useState<Array<{ id: string; libelle: string }>>([]);
  const [openUnite, setOpenUnite] = useState(false);
  const [rechercheUnite, setRechercheUnite] = useState("");

  // Charger les unités
  useEffect(() => {
    if (ouvert) {
      listerUnites().then(setUnites);
      setDesignation(designationInitiale);
      setUniteId("");
      setRechercheUnite("");
    }
  }, [ouvert, designationInitiale]);

  const handleCreerUnite = async () => {
    if (!rechercheUnite.trim()) {
      toast.error("Veuillez saisir une unité");
      return;
    }

    try {
      const nouvelleUnite = await creerUnite(rechercheUnite.trim());
      setUnites([...unites, nouvelleUnite]);
      setUniteId(nouvelleUnite.id);
      setOpenUnite(false);
      toast.success(`Unité "${nouvelleUnite.libelle}" créée`);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création de l'unité");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!designation.trim()) {
      toast.error("La désignation est requise");
      return;
    }

    if (!uniteId) {
      toast.error("L'unité est requise");
      return;
    }

    startTransition(async () => {
      try {
        const article = await creerArticle(designation, uniteId);
        toast.success("Article créé avec succès");
        onArticleCree(article);
        setDesignation("");
        setUniteId("");
        onClose();
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de la création de l'article");
      }
    });
  };

  // Filtrer les unités selon la recherche
  const unitesFiltrees = unites.filter((u) =>
    u.libelle.toLowerCase().includes(rechercheUnite.toLowerCase())
  );

  return (
    <Dialog open={ouvert} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader
          className="border-b border-border px-6 py-4"
          style={{ backgroundColor: "var(--primary-soft)" }}
        >
          <DialogTitle className="text-xl font-semibold text-[#1D186C]">
            Nouvel article
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          {/* Désignation */}
          <div className="space-y-2">
            <Label htmlFor="designation">
              Désignation <span className="text-destructive">*</span>
            </Label>
            <Input
              id="designation"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="Ciment CPJ 45 - 50kg"
              required
              className="h-11"
              autoFocus
            />
          </div>

          {/* Unité */}
          <div className="space-y-2">
            <Label htmlFor="unite">
              Unité <span className="text-destructive">*</span>
            </Label>
            <Popover open={openUnite} onOpenChange={setOpenUnite}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openUnite}
                  className="w-full h-11 justify-between"
                >
                  {uniteId ? (
                    <span className="text-foreground">
                      {unites.find((u) => u.id === uniteId)?.libelle}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      Sélectionner ou créer une unité...
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Rechercher ou créer une unité..."
                    value={rechercheUnite}
                    onValueChange={setRechercheUnite}
                  />
                  <CommandList>
                    <CommandEmpty>
                      <div className="py-6 text-center">
                        <p className="text-sm text-muted-foreground mb-3">
                          Aucune unité trouvée.
                        </p>
                        <Button
                          size="sm"
                          onClick={handleCreerUnite}
                          className="bg-[#13850b] hover:bg-[#0f6909] text-white"
                        >
                          <Plus className="size-4 mr-2" />
                          Créer &quot;{rechercheUnite}&quot;
                        </Button>
                      </div>
                    </CommandEmpty>
                    <CommandGroup>
                      {unitesFiltrees.map((unite) => (
                        <CommandItem
                          key={unite.id}
                          value={unite.libelle}
                          onSelect={() => {
                            setUniteId(unite.id);
                            setOpenUnite(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 size-4",
                              uniteId === unite.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {unite.libelle}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    {unitesFiltrees.length > 0 && rechercheUnite && (
                      <div className="border-t border-border p-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCreerUnite}
                          className="w-full justify-start text-[#13850b] hover:text-[#0f6909] hover:bg-[#13850b]/10"
                        >
                          <Plus className="size-4 mr-2" />
                          Créer &quot;{rechercheUnite}&quot;
                        </Button>
                      </div>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Exemples : kg, litre, m², unité, palette...
            </p>
          </div>
        </form>

        <DialogFooter className="gap-2 px-6 py-4 border-t border-border">
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
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-[#13850b] hover:bg-[#0f6909] text-white"
          >
            {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
            Créer l'article
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
