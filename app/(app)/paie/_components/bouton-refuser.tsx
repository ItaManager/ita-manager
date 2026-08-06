"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { refuserPeriode } from "@/lib/actions/paie";
import { Loader2, XCircle } from "lucide-react";

type Props = {
  periodeId: string;
};

export function BoutonRefuser({ periodeId }: Props) {
  const [ouvert, setOuvert] = useState(false);
  const [loading, setLoading] = useState(false);
  const [motif, setMotif] = useState("");
  const router = useRouter();

  async function handleRefuser() {
    if (!motif.trim() || motif.trim().length < 10) {
      alert("Le motif doit faire au moins 10 caractères");
      return;
    }

    setLoading(true);
    try {
      await refuserPeriode({ periodeId, motif: motif.trim() });
      setOuvert(false);
      setMotif("");
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Erreur lors du refus");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={ouvert} onOpenChange={setOuvert}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="rounded-full">
          <XCircle className="size-4" />
          Refuser
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Refuser la période</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-md border border-destructive bg-destructive/10 p-4">
            <p className="text-sm font-medium text-destructive">
              Refus de la période de paie
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Le refus renvoie la période à l'étape précédente. L'auteur de l'ouverture
              devra apporter les corrections nécessaires avant une nouvelle soumission.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motif">
              Motif du refus <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="motif"
              placeholder="Expliquez les raisons du refus (minimum 10 caractères)..."
              rows={5}
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Le motif sera visible dans l'historique de la période et permettra
              de comprendre les corrections à apporter.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between border-t pt-4">
          <Button
            variant="ghost"
            onClick={() => {
              setOuvert(false);
              setMotif("");
            }}
            disabled={loading}
            className="rounded-full"
          >
            Annuler
          </Button>

          <Button
            onClick={handleRefuser}
            disabled={loading}
            variant="destructive"
            className="rounded-full"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <XCircle className="size-4" />
            )}
            Confirmer le refus
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
