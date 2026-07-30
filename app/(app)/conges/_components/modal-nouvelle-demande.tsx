"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  listerTypesAbsence,
  creerAbsence,
  soumettreAbsence,
  type TypeAbsence,
} from "@/lib/actions/conges";
import { Loader2, Save, Send } from "lucide-react";

const schemaAbsence = z.object({
  typeAbsenceId: z.string().min(1, "Type d'absence requis"),
  dateDebut: z.string().min(1, "Date de début requise"),
  dateFin: z.string().min(1, "Date de fin requise"),
  motif: z.string().optional(),
});

type FormValues = z.infer<typeof schemaAbsence>;

type Props = {
  ouvert: boolean;
  onOuvertChange: (ouvert: boolean) => void;
  onSuccess: () => void;
};

export function ModalNouvelleDemande({
  ouvert,
  onOuvertChange,
  onSuccess,
}: Props) {
  const [types, setTypes] = useState<TypeAbsence[]>([]);
  const [loading, setLoading] = useState(false);
  const [onglet, setOnglet] = useState("periode");

  const form = useForm<FormValues>({
    resolver: zodResolver(schemaAbsence),
    defaultValues: {
      typeAbsenceId: "",
      dateDebut: "",
      dateFin: "",
      motif: "",
    },
  });

  useEffect(() => {
    if (ouvert) {
      chargerTypes();
    }
  }, [ouvert]);

  async function chargerTypes() {
    try {
      const data = await listerTypesAbsence();
      setTypes(data);
    } catch (error) {
      console.error("Erreur chargement types:", error);
    }
  }

  async function onSubmit(values: FormValues, soumettre: boolean) {
    setLoading(true);
    try {
      const absence = await creerAbsence({
        typeAbsenceId: values.typeAbsenceId,
        dateDebut: new Date(values.dateDebut),
        dateFin: new Date(values.dateFin),
        motif: values.motif,
      });

      if (soumettre) {
        await soumettreAbsence(absence.id);
      }

      form.reset();
      onOuvertChange(false);
      onSuccess();
    } catch (error: any) {
      alert(error.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  }

  const typeSelectionne = types.find(
    (t) => t.id === form.watch("typeAbsenceId")
  );

  return (
    <Dialog open={ouvert} onOpenChange={onOuvertChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouvelle demande d'absence</DialogTitle>
        </DialogHeader>

        <Tabs value={onglet} onValueChange={setOnglet} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="periode">Nature et période</TabsTrigger>
            <TabsTrigger
              value="justificatif"
              disabled={!form.watch("typeAbsenceId")}
            >
              Justificatif
            </TabsTrigger>
          </TabsList>

          <TabsContent value="periode" className="space-y-4 py-4">
            {/* Type d'absence */}
            <div className="space-y-2">
              <Label htmlFor="type">
                Type d'absence <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.watch("typeAbsenceId")}
                onValueChange={(value) =>
                  form.setValue("typeAbsenceId", value)
                }
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.typeAbsenceId && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.typeAbsenceId.message}
                </p>
              )}
            </div>

            {/* Dates */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dateDebut">
                  Date de début <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dateDebut"
                  type="date"
                  {...form.register("dateDebut")}
                />
                {form.formState.errors.dateDebut && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.dateDebut.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateFin">
                  Date de fin <span className="text-destructive">*</span>
                </Label>
                <Input id="dateFin" type="date" {...form.register("dateFin")} />
                {form.formState.errors.dateFin && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.dateFin.message}
                  </p>
                )}
              </div>
            </div>

            {/* Info type */}
            {typeSelectionne && (
              <div className="rounded-md border bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  {typeSelectionne.decompte
                    ? "✓ Décompté du solde"
                    : "○ Non décompté du solde"}
                  {typeSelectionne.pieceRequise &&
                    " · Pièce justificative requise"}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="justificatif" className="space-y-4 py-4">
            {/* Motif */}
            <div className="space-y-2">
              <Label htmlFor="motif">Motif (facultatif)</Label>
              <Textarea
                id="motif"
                placeholder="Précisez le motif de votre demande..."
                rows={4}
                {...form.register("motif")}
              />
              <p className="text-xs text-muted-foreground">
                Un motif détaillé facilite la validation par votre supérieur
              </p>
            </div>

            {/* Pièce justificative — Phase 7 */}
            {typeSelectionne?.pieceRequise && (
              <div className="rounded-md border border-warning-border bg-warning-soft p-4">
                <p className="text-sm font-medium text-warning">
                  Pièce justificative requise
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Upload disponible en Phase 7. Vous pourrez ajouter la pièce
                  après création.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex justify-between border-t pt-4">
          <Button
            variant="ghost"
            onClick={() => onOuvertChange(false)}
            disabled={loading}
            className="rounded-full"
          >
            Annuler
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={form.handleSubmit((v) => onSubmit(v, false))}
              disabled={loading}
              className="rounded-full"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Enregistrer brouillon
            </Button>

            <Button
              onClick={form.handleSubmit((v) => onSubmit(v, true))}
              disabled={loading}
              className="rounded-full"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Soumettre
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
