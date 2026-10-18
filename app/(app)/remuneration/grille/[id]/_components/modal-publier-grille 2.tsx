"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { publierGrille } from "@/lib/actions/remuneration";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ModalPublierGrilleProps {
  grilleId: string;
  version: number;
  employesHorsGrille: {
    total: number;
    employes: Array<{
      employeId: string;
      matricule: string;
      nom: string;
      prenom: string;
      niveau: string;
      salaireActuel: number;
      min: number;
      max: number;
      ecart: number;
    }>;
  } | null;
}

export function ModalPublierGrille({
  grilleId,
  version,
  employesHorsGrille,
}: ModalPublierGrilleProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dateEffet, setDateEffet] = useState(() => {
    // Date par défaut : premier jour du mois prochain
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return format(nextMonth, "yyyy-MM-dd");
  });

  const handlePublier = () => {
    if (!dateEffet) {
      setError("La date d'effet est obligatoire");
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        await publierGrille(grilleId, new Date(dateEffet), {
          employesHorsGrilleCompris: true,
          nombreEmployesHorsGrille: employesHorsGrille?.total ?? 0,
        });

        setIsOpen(false);
        router.push("/remuneration/grille");
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue"
        );
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-full bg-success hover:bg-success/90">
          <CheckCircle2 className="size-4" />
          Publier
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle>Publier la grille salariale V{version}</DialogTitle>
          <DialogDescription>
            Cette action est irréversible. La grille actuelle sera archivée et remplacée par cette nouvelle version.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date d'effet */}
          <div className="space-y-2">
            <Label htmlFor="date-effet">
              Date d'effet <span className="text-destructive">*</span>
            </Label>
            <Input
              id="date-effet"
              type="date"
              value={dateEffet}
              onChange={(e) => setDateEffet(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd")}
            />
            <p className="text-xs text-muted-foreground">
              Première période de paie concernée par cette grille
            </p>
          </div>

          {/* Alerte employés hors grille */}
          {employesHorsGrille && employesHorsGrille.total > 0 && (
            <div className="border border-warning bg-warning-soft/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-5 text-warning mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    <strong>{employesHorsGrille.total}</strong> employé
                    {employesHorsGrille.total > 1 ? "s" : ""} seront hors grille
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ces employés passeront automatiquement en dérogation salariale (statut EN_ATTENTE).
                    La Direction Financière devra valider ou refuser chaque dérogation.
                  </p>

                  {employesHorsGrille.employes.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-medium">
                        Employés concernés (max 5) :
                      </p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {employesHorsGrille.employes.slice(0, 5).map((emp) => (
                          <li key={emp.employeId}>
                            {emp.prenom} {emp.nom} ({emp.matricule}) — {emp.salaireActuel.toLocaleString("fr-FR")} FCFA
                            (fourchette : {emp.min.toLocaleString("fr-FR")} - {emp.max.toLocaleString("fr-FR")})
                          </li>
                        ))}
                        {employesHorsGrille.total > 5 && (
                          <li>
                            ... et {employesHorsGrille.total - 5} autre
                            {employesHorsGrille.total - 5 > 1 ? "s" : ""}
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Confirmation */}
          <div className="border border-info bg-info-soft/30 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Conséquences de la publication :</strong>
            </p>
            <ul className="mt-2 text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>La grille actuelle sera archivée automatiquement</li>
              <li>Cette version deviendra la nouvelle grille de référence</li>
              <li>Les salaires hors fourchette passeront en dérogation EN_ATTENTE</li>
              <li>La grille publiée ne pourra plus être modifiée</li>
            </ul>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            onClick={handlePublier}
            disabled={isPending}
            className="bg-success hover:bg-success/90"
          >
            {isPending ? "Publication..." : "Publier la grille"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
