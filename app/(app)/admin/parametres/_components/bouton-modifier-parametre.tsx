"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Loader2 } from "lucide-react";
import { modifierParametre } from "@/lib/actions/administration";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface BoutonModifierParametreProps {
  parametre: {
    id: string;
    cle: string;
    valeur: string;
    type: string;
    libelle: string;
    aide: string | null;
  };
}

export function BoutonModifierParametre({
  parametre,
}: BoutonModifierParametreProps) {
  const [open, setOpen] = useState(false);
  const [valeur, setValeur] = useState(parametre.valeur);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        await modifierParametre(parametre.id, valeur);
        toast.success("Paramètre modifié avec succès");
        setOpen(false);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Erreur lors de la modification"
        );
      }
    });
  };

  // Déterminer le type d'input selon le type du paramètre
  const isLongText = parametre.type === "JSON" || valeur.length > 100;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit2 className="size-4" aria-hidden="true" />
          Modifier
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Modifier le paramètre</DialogTitle>
            <DialogDescription>{parametre.libelle}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cle" className="text-xs text-muted-foreground">
                Clé
              </Label>
              <Input
                id="cle"
                value={parametre.cle}
                disabled
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valeur">
                Valeur{" "}
                <span className="text-xs text-muted-foreground">
                  ({parametre.type})
                </span>
              </Label>
              {isLongText ? (
                <Textarea
                  id="valeur"
                  value={valeur}
                  onChange={(e) => setValeur(e.target.value)}
                  className="font-mono text-sm"
                  rows={8}
                  required
                />
              ) : (
                <Input
                  id="valeur"
                  value={valeur}
                  onChange={(e) => setValeur(e.target.value)}
                  className="font-mono"
                  type={parametre.type === "NUMBER" ? "number" : "text"}
                  required
                />
              )}
            </div>

            {parametre.aide && (
              <p className="text-xs text-muted-foreground italic">
                {parametre.aide}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && (
                <Loader2
                  className="mr-2 size-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
