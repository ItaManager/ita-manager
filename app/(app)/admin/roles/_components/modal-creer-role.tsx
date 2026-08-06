"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, AlertCircle } from "lucide-react";
import { creerRole } from "@/lib/actions/roles";
import { toast } from "sonner";

const schema = z.object({
  code: z.string()
    .min(2, "Minimum 2 caractères")
    .max(20, "Maximum 20 caractères")
    .regex(/^[A-Z_]+$/, "Le code doit être en MAJUSCULES et peut contenir _ (ex: RESP_ALERTES)"),
  libelle: z.string().min(3, "Minimum 3 caractères").max(100, "Maximum 100 caractères"),
  description: z.string().max(500, "Maximum 500 caractères").optional(),
});

type FormData = z.infer<typeof schema>;

interface ModalCreerRoleProps {
  ouvert: boolean;
  onFermer: () => void;
  onSuccess: () => void;
}

export function ModalCreerRole({ ouvert, onFermer, onSuccess }: ModalCreerRoleProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await creerRole(data);
        if (result.success) {
          toast.success("Rôle créé avec succès");
          reset();
          onFermer();
          onSuccess();
        } else {
          setError(result.error || "Erreur lors de la création");
        }
      } catch (err) {
        setError("Une erreur est survenue");
      }
    });
  };

  const handleFermer = () => {
    if (!isPending) {
      reset();
      setError(null);
      onFermer();
    }
  };

  return (
    <Dialog open={ouvert} onOpenChange={handleFermer}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="relative -mt-6 -mx-6 px-6 pt-6 pb-4 rounded-t-xl" style={{ backgroundColor: '#ebeaf2' }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleFermer}
            className="absolute -right-2 -top-2 h-8 w-8"
            disabled={isPending}
          >
            <X className="size-4" />
          </Button>
          <DialogTitle className="text-xl font-semibold" style={{ color: '#1d186c' }}>
            Créer un nouveau rôle
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="code" className="required">Code du rôle</Label>
              <Input
                id="code"
                {...register("code")}
                placeholder="RESP_ALERTES"
                className="font-mono uppercase"
                disabled={isPending}
              />
              {errors.code && (
                <p className="text-sm text-destructive mt-1">{errors.code.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Identifiant technique en MAJUSCULES (ex: RESP_ALERTES, CHEF_GARAGE)
              </p>
            </div>

            <div>
              <Label htmlFor="libelle" className="required">Libellé</Label>
              <Input
                id="libelle"
                {...register("libelle")}
                placeholder="Responsable Alertes Logistique"
                disabled={isPending}
              />
              {errors.libelle && (
                <p className="text-sm text-destructive mt-1">{errors.libelle.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Nom affiché dans l'interface (ex: Responsable Alertes Logistique)
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Gère les alertes de renouvellement des pièces administratives du matériel"
                rows={3}
                disabled={isPending}
              />
              {errors.description && (
                <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Description optionnelle du rôle et de ses responsabilités
              </p>
            </div>
          </div>

          <Alert>
            <AlertCircle className="size-4" />
            <AlertDescription>
              Une fois le rôle créé, vous pourrez lui assigner des permissions spécifiques
              depuis la liste des rôles.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleFermer}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Création..." : "Créer le rôle"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
