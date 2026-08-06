"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { ajouterConcurrent } from "@/lib/actions/appels-offres";

type Concurrent = {
  id: string;
  nom: string;
  montantSoumis: any;
  remarque: string | null;
};

type Props = {
  appelOffresId: string;
  concurrents: Concurrent[];
};

export function SectionConcurrents({ appelOffresId, concurrents }: Props) {
  const router = useRouter();
  const [enAjout, setEnAjout] = useState(false);
  const [enCours, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const [nom, setNom] = useState("");
  const [montantSoumis, setMontantSoumis] = useState("");
  const [remarque, setRemarque] = useState("");

  const handleAjouter = () => {
    if (!nom.trim()) {
      setErreur("Le nom du concurrent est obligatoire");
      return;
    }

    setErreur(null);

    startTransition(async () => {
      try {
        await ajouterConcurrent(appelOffresId, {
          nom,
          montantSoumis: montantSoumis ? parseFloat(montantSoumis) : undefined,
          remarque: remarque || undefined,
        });
        setNom("");
        setMontantSoumis("");
        setRemarque("");
        setEnAjout(false);
        router.refresh();
      } catch (error) {
        setErreur(error instanceof Error ? error.message : "Erreur");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Concurrents ({concurrents.length})</CardTitle>
          {!enAjout && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEnAjout(true)}
              className="rounded-full"
            >
              <Plus className="size-4" />
              Ajouter
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {enAjout && (
          <div className="mb-4 rounded-md bg-muted/50 p-4 space-y-3">
            <div>
              <Label htmlFor="nom" className="text-sm font-medium">
                Nom du concurrent
              </Label>
              <Input
                id="nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Nom de l'entreprise"
                className="mt-1.5"
                disabled={enCours}
              />
            </div>

            <div>
              <Label htmlFor="montantSoumis" className="text-sm font-medium">
                Montant soumis (FCFA)
              </Label>
              <Input
                id="montantSoumis"
                type="number"
                value={montantSoumis}
                onChange={(e) => setMontantSoumis(e.target.value)}
                placeholder="0"
                className="mt-1.5"
                disabled={enCours}
              />
            </div>

            <div>
              <Label htmlFor="remarque" className="text-sm font-medium">
                Remarque
              </Label>
              <Textarea
                id="remarque"
                value={remarque}
                onChange={(e) => setRemarque(e.target.value)}
                placeholder="Notes..."
                className="mt-1.5"
                rows={2}
                disabled={enCours}
              />
            </div>

            {erreur && (
              <p className="text-sm text-destructive">{erreur}</p>
            )}

            <div className="flex items-center gap-2">
              <Button
                onClick={handleAjouter}
                disabled={enCours}
                size="sm"
                className="rounded-full"
              >
                {enCours && <Loader2 className="size-4 animate-spin" />}
                Ajouter
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setEnAjout(false);
                  setNom("");
                  setMontantSoumis("");
                  setRemarque("");
                  setErreur(null);
                }}
                disabled={enCours}
                size="sm"
                className="rounded-full"
              >
                Annuler
              </Button>
            </div>
          </div>
        )}

        {concurrents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun concurrent enregistré</p>
        ) : (
          <div className="space-y-2">
            {concurrents.map((concurrent) => (
              <div
                key={concurrent.id}
                className="py-2 border-b last:border-0"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{concurrent.nom}</span>
                  {concurrent.montantSoumis && (
                    <span className="text-sm text-muted-foreground">
                      {Number(concurrent.montantSoumis).toLocaleString("fr-FR")} FCFA
                    </span>
                  )}
                </div>
                {concurrent.remarque && (
                  <p className="text-xs text-muted-foreground mt-1">{concurrent.remarque}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
