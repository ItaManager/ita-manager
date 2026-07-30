"use client";

import { useState, useTransition } from "react";
import { modifierParametre } from "@/lib/actions/administration";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, Check, Lock, AlertCircle } from "lucide-react";

type Parametre = {
  id: string;
  cle: string;
  valeur: string;
  type: string;
  libelle: string;
  aide: string | null;
};

type Props = {
  parametres: Parametre[];
};

export function FormulairesParametres({ parametres }: Props) {
  const [valeurs, setValeurs] = useState<Record<string, string>>(
    parametres.reduce((acc, p) => ({ ...acc, [p.id]: p.valeur }), {})
  );
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [succes, setSucces] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  // Paramètres verrouillés (M11 § 4)
  const clesVerrouillees = ["format.matricule", "codes.roles"];

  const handleChange = (id: string, nouvelleValeur: string) => {
    setValeurs((prev) => ({ ...prev, [id]: nouvelleValeur }));
    // Effacer succès et erreur au changement
    if (succes[id]) {
      setSucces((prev) => ({ ...prev, [id]: false }));
    }
    if (erreurs[id]) {
      setErreurs((prev) => ({ ...prev, [id]: "" }));
    }
  };

  const handleSave = (parametre: Parametre) => {
    const nouvelleValeur = valeurs[parametre.id];

    // Ne rien faire si la valeur n'a pas changé
    if (nouvelleValeur === parametre.valeur) {
      return;
    }

    setPendingId(parametre.id);
    startTransition(async () => {
      try {
        await modifierParametre(parametre.id, nouvelleValeur);
        setSucces((prev) => ({ ...prev, [parametre.id]: true }));
        setErreurs((prev) => ({ ...prev, [parametre.id]: "" }));

        // Masquer le succès après 3 secondes
        setTimeout(() => {
          setSucces((prev) => ({ ...prev, [parametre.id]: false }));
        }, 3000);
      } catch (error) {
        setErreurs((prev) => ({
          ...prev,
          [parametre.id]: error instanceof Error ? error.message : "Erreur lors de la modification",
        }));
        setSucces((prev) => ({ ...prev, [parametre.id]: false }));
      } finally {
        setPendingId(null);
      }
    });
  };

  return (
    <div className="space-y-5">
      {parametres.map((parametre) => {
        const estVerrouille = clesVerrouillees.includes(parametre.cle);
        const aChange = valeurs[parametre.id] !== parametre.valeur;
        const enCours = isPending && pendingId === parametre.id;

        return (
          <div key={parametre.id} className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <Label htmlFor={parametre.id} className="text-sm font-medium">
                  {parametre.libelle}
                  {estVerrouille && (
                    <Lock className="inline-block size-3.5 ml-1.5 text-muted-foreground" />
                  )}
                </Label>
                {parametre.aide && (
                  <p className="text-xs text-muted-foreground mt-1">{parametre.aide}</p>
                )}
              </div>

              {aChange && !estVerrouille && (
                <Button
                  size="sm"
                  onClick={() => handleSave(parametre)}
                  disabled={enCours}
                  className="shrink-0 rounded-full"
                >
                  {succes[parametre.id] ? (
                    <>
                      <Check className="size-4" />
                      Enregistré
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      Enregistrer
                    </>
                  )}
                </Button>
              )}
            </div>

            <Input
              id={parametre.id}
              type={parametre.type === "NUMBER" ? "number" : "text"}
              value={valeurs[parametre.id]}
              onChange={(e) => handleChange(parametre.id, e.target.value)}
              disabled={estVerrouille || enCours}
              className="rounded-md"
            />

            {erreurs[parametre.id] && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="size-4" />
                <AlertDescription>{erreurs[parametre.id]}</AlertDescription>
              </Alert>
            )}
          </div>
        );
      })}
    </div>
  );
}
