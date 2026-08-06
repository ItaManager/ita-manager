"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { creerProjet } from "@/lib/actions/projets";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { CyclePaie } from "@prisma/client";

const schemaProjet = z.object({
  code: z
    .string()
    .min(1, "Code requis")
    .regex(/^CH-\d{4}-\d{3}$/, "Format: CH-AAAA-NNN (ex: CH-2026-001)"),
  nom: z.string().min(1, "Nom requis"),
  description: z.string().optional(),
  maitreOuvrage: z.string().optional(),
  montantMarche: z.string().optional(),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
  cyclePaie: z.enum(["HEBDOMADAIRE", "QUINZAINE", "MENSUEL"]).optional(),
});

type FormValues = z.infer<typeof schemaProjet>;

export function BoutonNouveauProjet() {
  const [ouvert, setOuvert] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(schemaProjet),
    defaultValues: {
      code: "",
      nom: "",
      description: "",
      maitreOuvrage: "",
      montantMarche: "",
      dateDebut: "",
      dateFin: "",
      cyclePaie: undefined,
    },
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      const projet = await creerProjet({
        code: values.code,
        nom: values.nom,
        description: values.description || undefined,
        maitreOuvrage: values.maitreOuvrage || undefined,
        montantMarche: values.montantMarche
          ? parseFloat(values.montantMarche)
          : undefined,
        dateDebut: values.dateDebut ? new Date(values.dateDebut) : undefined,
        dateFin: values.dateFin ? new Date(values.dateFin) : undefined,
        cyclePaie: values.cyclePaie as CyclePaie | undefined,
      });

      form.reset();
      setOuvert(false);
      router.push(`/projets/${projet.id}`);
    } catch (error: any) {
      alert(error.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={ouvert} onOpenChange={setOuvert}>
      <DialogTrigger asChild>
        <Button className="gap-2 h-10 px-5 text-base rounded-full bg-primary hover:bg-primary-hover text-primary-foreground transition-all cursor-pointer shadow-sm hover:shadow-md">
          <Plus className="size-5" />
          Nouveau projet
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl p-0">
        <DialogHeader className="bg-primary-soft p-6 rounded-t-lg">
          <DialogTitle className="text-xl font-semibold text-primary">Nouveau projet</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-6">
          {/* Code et nom */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">
                Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                placeholder="CH-2026-001"
                {...form.register("code")}
              />
              {form.formState.errors.code && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.code.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom">
                Nom du projet <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nom"
                placeholder="Réhabilitation route..."
                {...form.register("nom")}
              />
              {form.formState.errors.nom && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.nom.message}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Description du projet..."
              rows={3}
              {...form.register("description")}
            />
          </div>

          {/* Maître d'ouvrage et montant */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maitreOuvrage">Maître d'ouvrage</Label>
              <Input
                id="maitreOuvrage"
                placeholder="AGEROUTE, Ministère..."
                {...form.register("maitreOuvrage")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="montantMarche">Montant du marché (FCFA)</Label>
              <Input
                id="montantMarche"
                type="number"
                placeholder="50000000"
                {...form.register("montantMarche")}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateDebut">Date de début</Label>
              <Input id="dateDebut" type="date" {...form.register("dateDebut")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFin">Date de fin prévisionnelle</Label>
              <Input id="dateFin" type="date" {...form.register("dateFin")} />
            </div>
          </div>

          {/* Cycle de paie */}
          <div className="space-y-2">
            <Label htmlFor="cyclePaie">Cycle de paie</Label>
            <Select
              value={form.watch("cyclePaie")}
              onValueChange={(value) =>
                form.setValue("cyclePaie", value as any)
              }
            >
              <SelectTrigger id="cyclePaie">
                <SelectValue placeholder="Sélectionner un cycle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HEBDOMADAIRE">Hebdomadaire</SelectItem>
                <SelectItem value="QUINZAINE">Quinzaine</SelectItem>
                <SelectItem value="MENSUEL">Mensuel</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Figé après la première période de paie
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-between border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOuvert(false)}
              disabled={loading}
              className="gap-2 h-10 px-4 text-base rounded-full border-2 hover:bg-muted hover:border-primary transition-all"
            >
              Annuler
            </Button>

            <Button type="submit" disabled={loading} className="gap-2 h-10 px-4 text-base rounded-full bg-primary hover:bg-primary-hover text-primary-foreground transition-all">
              {loading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Plus className="size-5" />
              )}
              Créer le projet
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
