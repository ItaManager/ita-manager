"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, AlertTriangle, X, Info } from "lucide-react";
import {
  creerMateriel,
  genererCodeMateriel,
  verifierCodeExistant,
  verifierFormatCode,
} from "@/lib/actions/logistique";
import type { TypeMateriel, StatutMateriel } from "@prisma/client";

type Famille = {
  id: string;
  code: string;
  libelle: string;
  type: TypeMateriel;
};

type Lieu = {
  id: string;
  libelle: string;
};

export function FormNouveauMateriel({
  familles,
  lieux,
}: {
  familles: Famille[];
  lieux: Lieu[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [codeWarning, setCodeWarning] = useState<string | null>(null);
  const [formatWarning, setFormatWarning] = useState<string | null>(null);
  const [codeGenere, setCodeGenere] = useState<string>("");
  const [familleSelectionnee, setFamilleSelectionnee] = useState<string>("");

  const { register, handleSubmit, setValue, watch, reset } = useForm();

  const codeIta = watch("codeIta");
  const dateAcquisition = watch("dateAcquisition");

  // Générer code automatiquement quand la famille change
  useEffect(() => {
    if (familleSelectionnee) {
      genererNouveauCode();
    }
  }, [familleSelectionnee, dateAcquisition]);

  async function genererNouveauCode() {
    if (!familleSelectionnee) return;

    try {
      const resultat = await genererCodeMateriel({
        familleId: familleSelectionnee,
        dateAcquisition: dateAcquisition ? new Date(dateAcquisition) : undefined,
      });

      setCodeGenere(resultat.code);
      setValue("codeIta", resultat.code);

      if (resultat.warning) {
        setCodeWarning(resultat.warning);
      } else {
        setCodeWarning(null);
      }
    } catch (error) {
      console.error("Erreur génération code:", error);
    }
  }

  // Vérifier si le code existe ET s'il respecte le format
  useEffect(() => {
    if (codeIta && codeIta !== codeGenere && familleSelectionnee) {
      verifierCode();
      verifierFormat();
    }
  }, [codeIta, familleSelectionnee]);

  async function verifierCode() {
    if (!codeIta) return;

    try {
      const resultat = await verifierCodeExistant(codeIta);
      if (resultat.existe) {
        setErreur(`Code déjà utilisé par : ${resultat.materiel?.designation}`);
      } else {
        setErreur(null);
      }
    } catch (error) {
      console.error("Erreur vérification code:", error);
    }
  }

  async function verifierFormat() {
    if (!codeIta || !familleSelectionnee) return;

    try {
      const resultat = await verifierFormatCode({
        codeIta,
        familleId: familleSelectionnee,
      });
      if (!resultat.conforme && resultat.message) {
        setFormatWarning(resultat.message);
      } else {
        setFormatWarning(null);
      }
    } catch (error) {
      console.error("Erreur vérification format:", error);
    }
  }

  // Régénérer si le champ est vidé
  function handleCodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setValue("codeIta", value);

    if (!value && familleSelectionnee) {
      genererNouveauCode();
    }
  }

  async function onSubmit(data: any) {
    if (erreur) return;

    setLoading(true);
    try {
      const famille = familles.find((f) => f.id === familleSelectionnee);
      if (!famille) throw new Error("Famille introuvable");

      await creerMateriel({
        codeIta: data.codeIta,
        designation: data.designation,
        familleId: familleSelectionnee,
        type: famille.type,
        statut: data.statut || "DISPONIBLE",
        partageable: data.partageable || false,
        lieuBaseId: data.lieuBaseId || undefined,
        numeroParcAncien: data.numeroParcAncien || undefined,
        numeroSerie: data.numeroSerie || undefined,
        marque: data.marque || undefined,
        modele: data.modele || undefined,
        dateAcquisition: data.dateAcquisition
          ? new Date(data.dateAcquisition)
          : undefined,
        coutAcquisition: data.coutAcquisition
          ? parseFloat(data.coutAcquisition)
          : undefined,
      });

      setOpen(false);
      reset();
      setFamilleSelectionnee("");
      setCodeGenere("");
      router.refresh();
    } catch (error: any) {
      setErreur(error.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4 mr-2" />
          Nouveau matériel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un matériel</DialogTitle>
          <DialogDescription>
            Le code sera généré automatiquement selon la famille sélectionnée
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Famille */}
          <div>
            <Label htmlFor="famille" className="required">
              Famille
            </Label>
            <Select
              value={familleSelectionnee}
              onValueChange={setFamilleSelectionnee}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une famille" />
              </SelectTrigger>
              <SelectContent>
                {familles.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.libelle} ({f.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Code ITA */}
          {familleSelectionnee && (
            <div>
              <Label htmlFor="codeIta" className="required">
                Code ITA
              </Label>
              <Input
                id="codeIta"
                {...register("codeIta", { required: true })}
                onChange={handleCodeChange}
                className={erreur ? "border-destructive" : ""}
                placeholder="Généré automatiquement"
              />
              {codeWarning && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Info className="size-3" />
                  {codeWarning}
                </p>
              )}
              {formatWarning && (
                <p className="text-xs text-warning mt-1 flex items-center gap-1">
                  <Info className="size-3" />
                  {formatWarning}
                </p>
              )}
              {erreur && (
                <Alert variant="destructive" className="mt-2">
                  <AlertTriangle className="size-4" />
                  <AlertDescription>{erreur}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Désignation */}
          <div>
            <Label htmlFor="designation" className="required">
              Désignation
            </Label>
            <Input
              id="designation"
              {...register("designation", { required: true })}
              placeholder="Ex: Pelle hydraulique Caterpillar"
            />
          </div>

          {/* Date d'acquisition */}
          <div>
            <Label htmlFor="dateAcquisition">Date d'acquisition</Label>
            <Input
              id="dateAcquisition"
              type="date"
              {...register("dateAcquisition")}
            />
          </div>

          {/* Coût d'acquisition */}
          <div>
            <Label htmlFor="coutAcquisition">Coût d'acquisition (F CFA)</Label>
            <Input
              id="coutAcquisition"
              type="number"
              step="1"
              {...register("coutAcquisition")}
              placeholder="0"
            />
          </div>

          {/* Lieu de base */}
          <div>
            <Label htmlFor="lieuBaseId">Lieu de base</Label>
            <Select onValueChange={(value) => setValue("lieuBaseId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez un lieu" />
              </SelectTrigger>
              <SelectContent>
                {lieux.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.libelle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Numéro de série */}
          <div>
            <Label htmlFor="numeroSerie">Numéro de série</Label>
            <Input
              id="numeroSerie"
              {...register("numeroSerie")}
              placeholder="Ex: CAT123456789"
            />
          </div>

          {/* Marque et Modèle */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="marque">Marque</Label>
              <Input
                id="marque"
                {...register("marque")}
                placeholder="Ex: Caterpillar"
              />
            </div>
            <div>
              <Label htmlFor="modele">Modèle</Label>
              <Input
                id="modele"
                {...register("modele")}
                placeholder="Ex: 320D"
              />
            </div>
          </div>

          {/* Ancien N° Parc (reprise) */}
          <div>
            <Label htmlFor="numeroParcAncien">Ancien N° Parc (reprise)</Label>
            <Input
              id="numeroParcAncien"
              {...register("numeroParcAncien")}
              placeholder="Ex: A10CI1"
            />
          </div>

          {/* Partageable */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="partageable"
              {...register("partageable")}
              className="rounded border-input"
            />
            <Label htmlFor="partageable" className="font-normal">
              Partageable (peut être affecté à plusieurs chantiers)
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading || !!erreur}>
              {loading ? "Création..." : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
