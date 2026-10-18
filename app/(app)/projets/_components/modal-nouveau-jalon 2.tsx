"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { creerJalon } from "@/lib/actions/projets";
import { Loader2, Plus, Flag } from "lucide-react";
import { useRouter } from "next/navigation";
import { TypeValidateur } from "@prisma/client";
import { toast } from "sonner";

const schemaJalon = z.object({
  libelle: z.string().min(1, "Libellé requis"),
  description: z.string().optional(),
  datePrevisionnelle: z.string().min(1, "Date prévisionnelle requise"),
  typeValidateur: z.enum(["INTERNE", "MAITRE_OEUVRE", "MAITRE_OUVRAGE"]),
  validateurExterne: z.string().optional(),
});

type FormValues = z.infer<typeof schemaJalon>;

interface ModalNouveauJalonProps {
  projetId: string;
}

export function ModalNouveauJalon({ projetId }: ModalNouveauJalonProps) {
  const [ouvert, setOuvert] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(schemaJalon),
    defaultValues: {
      typeValidateur: "INTERNE",
    },
  });

  const typeValidateur = watch("typeValidateur");

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      await creerJalon({
        projetId,
        libelle: data.libelle,
        description: data.description,
        datePrevisionnelle: new Date(data.datePrevisionnelle),
        typeValidateur: data.typeValidateur,
        validateurExterne: data.validateurExterne,
      });

      toast.success("Jalon créé avec succès");
      setOuvert(false);
      reset();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la création du jalon"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={ouvert} onOpenChange={setOuvert}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4 mr-2" aria-hidden="true" />
          Nouveau jalon
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="size-5" aria-hidden="true" />
            Créer un jalon
          </DialogTitle>
          <DialogDescription>
            Les jalons permettent de suivre les événements clés du projet.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Libellé */}
          <div className="space-y-2">
            <Label htmlFor="libelle">
              Libellé <span className="text-destructive">*</span>
            </Label>
            <Input
              id="libelle"
              placeholder="Ex: Réception provisoire"
              {...register("libelle")}
            />
            {errors.libelle && (
              <p className="text-sm text-destructive">{errors.libelle.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Détails sur ce jalon..."
              rows={3}
              {...register("description")}
            />
          </div>

          {/* Date prévisionnelle */}
          <div className="space-y-2">
            <Label htmlFor="datePrevisionnelle">
              Date prévisionnelle <span className="text-destructive">*</span>
            </Label>
            <Input
              id="datePrevisionnelle"
              type="date"
              {...register("datePrevisionnelle")}
            />
            {errors.datePrevisionnelle && (
              <p className="text-sm text-destructive">
                {errors.datePrevisionnelle.message}
              </p>
            )}
          </div>

          {/* Type de validateur */}
          <div className="space-y-2">
            <Label htmlFor="typeValidateur">
              Type de validateur <span className="text-destructive">*</span>
            </Label>
            <Select
              value={typeValidateur}
              onValueChange={(value) =>
                setValue("typeValidateur", value as TypeValidateur)
              }
            >
              <SelectTrigger id="typeValidateur">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INTERNE">Interne (DT/DG)</SelectItem>
                <SelectItem value="MAITRE_OEUVRE">Maître d'œuvre</SelectItem>
                <SelectItem value="MAITRE_OUVRAGE">Maître d'ouvrage</SelectItem>
              </SelectContent>
            </Select>
            {errors.typeValidateur && (
              <p className="text-sm text-destructive">
                {errors.typeValidateur.message}
              </p>
            )}
          </div>

          {/* Validateur externe (si non INTERNE) */}
          {typeValidateur !== "INTERNE" && (
            <div className="space-y-2">
              <Label htmlFor="validateurExterne">Nom du validateur</Label>
              <Input
                id="validateurExterne"
                placeholder="Nom de la personne ou de l'organisme"
                {...register("validateurExterne")}
              />
              <p className="text-xs text-muted-foreground">
                Précisez le nom de la personne ou de l'organisme qui validera ce
                jalon
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOuvert(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
              Créer le jalon
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
