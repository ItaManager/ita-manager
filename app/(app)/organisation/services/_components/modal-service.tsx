"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { creerService, modifierService } from "@/lib/actions/organisation";
import { ComboboxDirection } from "./combobox-direction";
import type { Direction, Service } from "@prisma/client";

const schemaFormulaire = z.object({
  code: z
    .string()
    .min(1, "Le code est requis")
    .max(20, "20 caractères maximum")
    .regex(/^[A-Z_]+$/, "Le code doit être en MAJUSCULES (A-Z, _)")
    .transform((val) => val.toUpperCase()),
  libelle: z
    .string()
    .min(1, "Le libellé est requis")
    .max(100, "100 caractères maximum"),
  directionId: z.string().min(1, "La direction est requise"),
  ordre: z.coerce.number().int().min(0).default(0),
});

type FormData = z.infer<typeof schemaFormulaire>;

interface ModalServiceProps {
  ouvert: boolean;
  onFermer: () => void;
  directions: Direction[];
  service?: Service & { direction: Direction };
}

export function ModalService({
  ouvert,
  onFermer,
  directions,
  service,
}: ModalServiceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schemaFormulaire),
    defaultValues: service
      ? {
          code: service.code,
          libelle: service.libelle,
          directionId: service.directionId,
          ordre: service.ordre,
        }
      : {
          code: "",
          libelle: "",
          directionId: "",
          ordre: 0,
        },
  });

  const onSubmit = async (data: FormData) => {
    setErreur(null);

    try {
      if (service) {
        // Modification
        await modifierService(service.id, data);
      } else {
        // Création
        const resultat = await creerService(data);

        // Si le service existe déjà (R-04 : retourner l'existant)
        if (!resultat.cree) {
          setErreur(
            `Un service avec le code "${data.code}" existe déjà. Le service existant a été sélectionné.`
          );
          // Attendre 2s avant de fermer pour laisser lire le message
          setTimeout(() => {
            onFermer();
            form.reset();
            startTransition(() => {
              router.refresh();
            });
          }, 2000);
          return;
        }
      }

      // Succès
      onFermer();
      form.reset();
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setErreur(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    }
  };

  const annuler = () => {
    form.reset();
    setErreur(null);
    onFermer();
  };

  return (
    <Dialog open={ouvert} onOpenChange={annuler}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {service ? "Modifier le service" : "Nouveau service"}
          </DialogTitle>
          <DialogDescription>
            {service
              ? "Modifiez les informations du service."
              : "Créez un nouveau service au sein d'une direction."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {erreur && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" aria-hidden="true" />
                <AlertDescription>{erreur}</AlertDescription>
              </Alert>
            )}

            {/* Direction */}
            <FormField
              control={form.control}
              name="directionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Direction</FormLabel>
                  <FormControl>
                    <ComboboxDirection
                      directions={directions}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={!!service} // Direction non modifiable après création
                    />
                  </FormControl>
                  <FormMessage />
                  {service && (
                    <FormDescription>
                      La direction ne peut pas être modifiée après création.
                    </FormDescription>
                  )}
                </FormItem>
              )}
            />

            {/* Code */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: ACHATS"
                      className="font-mono"
                      maxLength={20}
                      disabled={!!service} // Code non modifiable après création
                      onChange={(e) => {
                        // Forcer en majuscules
                        field.onChange(e.target.value.toUpperCase());
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Identifiant unique en MAJUSCULES (A-Z, _)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Libellé */}
            <FormField
              control={form.control}
              name="libelle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Libellé</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ex: Service Achats"
                      maxLength={100}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ordre */}
            <FormField
              control={form.control}
              name="ordre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ordre d'affichage</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={0}
                      placeholder="0"
                    />
                  </FormControl>
                  <FormDescription>
                    Position dans la liste (0 = début)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={annuler}
                disabled={form.formState.isSubmitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2
                    className="mr-2 size-4 animate-spin"
                    aria-hidden="true"
                  />
                )}
                {service ? "Enregistrer" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
