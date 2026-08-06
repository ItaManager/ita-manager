"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Plus, Loader2 } from "lucide-react";
import { ajouterPieceAO } from "@/lib/actions/appels-offres";

type Piece = {
  id: string;
  libelle: string;
  obligatoire: boolean;
  fichierUrl: string | null;
  deposeLe: Date | null;
};

type Props = {
  appelOffresId: string;
  pieces: Piece[];
  statut: string;
};

export function SectionPieces({ appelOffresId, pieces, statut }: Props) {
  const router = useRouter();
  const [enAjout, setEnAjout] = useState(false);
  const [enCours, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const [libelle, setLibelle] = useState("");
  const [obligatoire, setObligatoire] = useState(false);

  const dossierFige = ["SOUMIS", "GAGNE", "PERDU", "ABANDONNE"].includes(statut);

  const handleAjouter = () => {
    if (!libelle.trim()) {
      setErreur("Le libellé est obligatoire");
      return;
    }

    setErreur(null);

    startTransition(async () => {
      try {
        await ajouterPieceAO(appelOffresId, { libelle, obligatoire });
        setLibelle("");
        setObligatoire(false);
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
          <CardTitle className="text-sm">Pièces du dossier ({pieces.length})</CardTitle>
          {!dossierFige && !enAjout && (
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
              <Label htmlFor="libelle" className="text-sm font-medium">
                Libellé de la pièce
              </Label>
              <Input
                id="libelle"
                value={libelle}
                onChange={(e) => setLibelle(e.target.value)}
                placeholder="Ex: Plan d'exécution, Attestation fiscale..."
                className="mt-1.5"
                disabled={enCours}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="obligatoire"
                checked={obligatoire}
                onCheckedChange={(checked) => setObligatoire(!!checked)}
                disabled={enCours}
              />
              <Label
                htmlFor="obligatoire"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Pièce obligatoire
              </Label>
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
                  setLibelle("");
                  setObligatoire(false);
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

        {pieces.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune pièce enregistrée</p>
        ) : (
          <div className="space-y-2">
            {pieces.map((piece) => (
              <div
                key={piece.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <span className="text-sm">{piece.libelle}</span>
                  {piece.obligatoire && (
                    <Badge variant="outline" className="text-xs">
                      Obligatoire
                    </Badge>
                  )}
                </div>
                {piece.deposeLe ? (
                  <Badge variant="default" className="bg-success text-success-foreground">
                    Déposée
                  </Badge>
                ) : (
                  <Badge variant="secondary">À déposer</Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
