"use client";

import { useState, useTransition } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { formaterDateCivile, joursEntre } from "@/lib/dates";
import {
  renouvelerPieceAdministrative,
  type PieceDetaillee,
} from "@/lib/actions/logistique";
import { toast } from "sonner";

interface ModalRenouvelerPieceProps {
  piece: PieceDetaillee;
  open: boolean;
  onClose: () => void;
}

export function ModalRenouvelerPiece({ piece, open, onClose }: ModalRenouvelerPieceProps) {
  const [isPending, startTransition] = useTransition();

  // Calculer les dates proposées
  const dateEditionProposee = new Date();
  const dateExpirationProposee = new Date(dateEditionProposee);
  if (piece.type.periodiciteMois) {
    dateExpirationProposee.setMonth(dateExpirationProposee.getMonth() + piece.type.periodiciteMois);
  } else {
    dateExpirationProposee.setFullYear(dateExpirationProposee.getFullYear() + 1);
  }

  // Proposer un nouveau numéro (incrémenter le numéro si possible)
  function proposerNouveauNumero(): string {
    if (!piece.numero) return "";
    const match = piece.numero.match(/^(.+?)(\d+)$/);
    if (match) {
      const prefix = match[1];
      const numero = parseInt(match[2], 10);
      return `${prefix}${(numero + 1).toString().padStart(match[2].length, '0')}`;
    }
    return piece.numero;
  }

  const [formData, setFormData] = useState({
    numero: proposerNouveauNumero(),
    emetteur: piece.emetteur || "",
    dateEdition: dateEditionProposee.toISOString().split("T")[0],
    dateExpiration: dateExpirationProposee.toISOString().split("T")[0],
    montant: piece.montant?.toString() || "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    startTransition(async () => {
      try {
        await renouvelerPieceAdministrative(piece.id, {
          numero: formData.numero,
          emetteur: formData.emetteur,
          dateEdition: new Date(formData.dateEdition),
          dateExpiration: new Date(formData.dateExpiration),
          montant: formData.montant ? parseFloat(formData.montant) : undefined,
        });

        toast.success("Pièce renouvelée avec succès");
        onClose();
      } catch (error) {
        toast.error("Erreur lors du renouvellement");
        console.error(error);
      }
    });
  }

  // Calculer la validité après renouvellement
  const joursValiditeApres = joursEntre(new Date(), new Date(formData.dateExpiration));

  return (
    <Dialog open={open} onOpenChange={(newOpen) => !newOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Renouveler la pièce</DialogTitle>
          <DialogDescription>
            {piece.type.libelle} · {piece.materiel.codeIta} — {piece.materiel.designation}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pièce remplacée */}
          <Card className="bg-muted border-muted-foreground/20">
            <CardContent className="pt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Pièce remplacée
              </p>
              <div className="flex items-baseline justify-between mb-1">
                <p className="text-lg font-semibold font-mono">{piece.numero}</p>
                <p className="text-sm text-muted-foreground">
                  {formaterDateCivile(piece.dateEdition)} → {formaterDateCivile(piece.dateExpiration)}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Elle restera consultable dans la chaîne de renouvellement. Rien n'est écrasé.
              </p>
            </CardContent>
          </Card>

          {/* Formulaire */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero">
                Numéro <span className="text-destructive">*</span>
              </Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => setFormData((prev) => ({ ...prev, numero: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="emetteur">
                Émetteur <span className="text-destructive">*</span>
              </Label>
              <Input
                id="emetteur"
                value={formData.emetteur}
                onChange={(e) => setFormData((prev) => ({ ...prev, emetteur: e.target.value }))}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Repris de la pièce précédente.
              </p>
            </div>

            <div>
              <Label htmlFor="dateEdition">
                Date d'édition <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dateEdition"
                type="date"
                value={formData.dateEdition}
                onChange={(e) => setFormData((prev) => ({ ...prev, dateEdition: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="dateExpiration">
                Date d'expiration <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dateExpiration"
                type="date"
                value={formData.dateExpiration}
                onChange={(e) => setFormData((prev) => ({ ...prev, dateExpiration: e.target.value }))}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Proposée : {piece.type.periodiciteMois ? `${piece.type.periodiciteMois} mois` : "12 mois"} après l'édition. Modifiable.
              </p>
            </div>

            <div className="col-span-2">
              <Label htmlFor="montant">Montant</Label>
              <Input
                id="montant"
                type="number"
                value={formData.montant}
                onChange={(e) => setFormData((prev) => ({ ...prev, montant: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Donnée sensible. Toute modification est journalisée.
              </p>
            </div>
          </div>

          {/* Scan de la pièce (placeholder) */}
          <div>
            <Label>Scan de la pièce</Label>
            <div className="mt-2 border-2 border-dashed rounded-lg p-8 text-center bg-muted/30">
              <FileText className="size-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Déposer le document</p>
              <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG • 10 Mo max</p>
            </div>
          </div>

          {/* Bannière après renouvellement */}
          <div className="bg-success-soft border border-success/20 rounded-lg px-6 py-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-success/60 mb-1">
              Après renouvellement
            </p>
            <p className="text-lg font-semibold text-success">
              valide encore {joursValiditeApres} j
            </p>
          </div>

          {/* Boutons */}
          <div className="flex items-center justify-between pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <div className="text-xs text-muted-foreground mr-auto ml-4">
              Champs obligatoires à renseigner
            </div>
            <Button type="submit" disabled={isPending} className="bg-success hover:bg-success">
              {isPending ? "Enregistrement..." : "Renouveler"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
