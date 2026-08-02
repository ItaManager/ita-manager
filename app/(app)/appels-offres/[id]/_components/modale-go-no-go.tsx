"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { deciderGoNoGo } from "@/lib/actions/appels-offres";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

type Props = {
  appelOffresId: string;
  ouvert: boolean;
  onOuvertChange: (ouvert: boolean) => void;
};

export function ModaleGoNoGo({ appelOffresId, ouvert, onOuvertChange }: Props) {
  const router = useRouter();
  const [enCours, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [motif, setMotif] = useState("");

  const handleDecision = (decision: "GO" | "NO_GO") => {
    setErreur(null);

    startTransition(async () => {
      try {
        await deciderGoNoGo(appelOffresId, decision, motif || undefined);
        onOuvertChange(false);
        router.refresh();
      } catch (error) {
        setErreur(error instanceof Error ? error.message : "Erreur lors de la décision");
      }
    });
  };

  const handleClose = () => {
    if (!enCours) {
      onOuvertChange(false);
      setMotif("");
      setErreur(null);
    }
  };

  return (
    <Dialog open={ouvert} onOpenChange={handleClose}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] flex flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <VisuallyHidden>
          <DialogTitle>Décision Go/No-go</DialogTitle>
        </VisuallyHidden>

        <header className="shrink-0 bg-primary-soft px-7 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-primary">Décision Go/No-go</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Décider de la participation à cet appel d'offres
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleClose}
              disabled={enCours}
              className="h-8 rounded-full bg-background shadow-sm hover:bg-background/80"
            >
              <X className="size-3.5" />
              Fermer
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6">
          <div>
            <Label htmlFor="motif" className="text-sm font-medium">
              Motif (optionnel)
            </Label>
            <Textarea
              id="motif"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Justification de la décision..."
              className="mt-1.5"
              rows={4}
              disabled={enCours}
            />
          </div>

          {erreur && (
            <div className="mt-4 rounded-md bg-destructive-soft p-3">
              <p className="text-sm text-destructive">{erreur}</p>
            </div>
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-3 border-t px-7 py-4">
          <Button
            variant="outline"
            onClick={() => handleDecision("NO_GO")}
            disabled={enCours}
            className="rounded-full border-destructive text-destructive hover:bg-destructive-soft"
          >
            {enCours ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <XCircle className="size-4" />
            )}
            No-go (Abandonner)
          </Button>

          <Button
            onClick={() => handleDecision("GO")}
            disabled={enCours}
            className="rounded-full bg-success text-success-foreground hover:bg-success/90"
          >
            {enCours ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            Go (Participer)
          </Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
