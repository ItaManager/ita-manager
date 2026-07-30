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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { creerPoste, modifierPoste } from "@/lib/actions/organisation";
import { ComboboxDirection } from "../../services/_components/combobox-direction";
import { ComboboxService } from "./combobox-service";
import type {
  Direction,
  Service,
  Poste,
  NiveauHierarchique,
} from "@prisma/client";

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
  niveau: z.enum(["DIRECTION", "CADRE", "SUPPORT", "OPERATIONNEL"]),
  directionId: z.string().min(1, "La direction est requise"),
  serviceId: z.string().nullable(),
  reserveAdmin: z.boolean(),
  titulaireUnique: z.boolean(),
  ouvreDroitConges: z.boolean(),
});

type FormData = z.infer<typeof schemaFormulaire>;

interface ModalPosteProps {
  ouvert: boolean;
  onFermer: () => void;
  directions: Direction[];
  services: Service[];
  poste?: Poste & { direction: Direction; service: Service | null };
}

export function ModalPoste({
  ouvert,
  onFermer,
  directions,
  services: servicesInitiaux,
  poste,
}: ModalPosteProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);
  const [services, setServices] = useState(servicesInitiaux);

  const form = useForm<FormData>({
    resolver: zodResolver(schemaFormulaire),
    defaultValues: poste
      ? {
          code: poste.code,
          libelle: poste.libelle,
          niveau: poste.niveau,
          directionId: poste.directionId,
          serviceId: poste.serviceId,
          reserveAdmin: poste.reserveAdmin,
          titulaireUnique: poste.titulaireUnique,
          ouvreDroitConges: poste.ouvreDroitConges,
        }
      : {
          code: "",
          libelle: "",
          niveau: "OPERATIONNEL" as NiveauHierarchique,
          directionId: "",
          serviceId: null,
          reserveAdmin: false,
          titulaireUnique: false,
          ouvreDroitConges: true,
        },
  });

  const directionSelectionnee = form.watch("directionId");

  const onSubmit = async (data: FormData) => {
    setErreur(null);

    try {
      if (poste) {
        // Modification
        await modifierPoste(poste.id, data);
      } else {
        // Création
        const resultat = await creerPoste(data);

        // Si le poste existe déjà (R-04 : retourner l'existant)
        if (!resultat.cree) {
          setErreur(
            `Un poste avec le code "${data.code}" existe déjà. Le poste existant a été sélectionné.`
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
      <DialogContent className="sm:!max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {poste ? "Modifier le poste" : "Nouveau poste"}
          </DialogTitle>
          <DialogDescription>
            {poste
              ? "Modifiez les informations du poste."
              : "Créez un nouveau poste au sein d'une direction et d'un service."}
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

            <div className="grid grid-cols-2 gap-4">
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
                        disabled={!!poste}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Service */}
              <FormField
                control={form.control}
                name="serviceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service</FormLabel>
                    <FormControl>
                      <ComboboxService
                        services={services}
                        directionId={directionSelectionnee || null}
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!!poste}
                        onServiceCreated={(nouveauService) => {
                          setServices([...services, nouveauService]);
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Optionnel. Laissez vide pour un poste transverse.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                        placeholder="Ex: CHEF_CHANTIER"
                        className="font-mono"
                        maxLength={20}
                        disabled={!!poste}
                        onChange={(e) => {
                          field.onChange(e.target.value.toUpperCase());
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Identifiant unique en MAJUSCULES
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Niveau */}
              <FormField
                control={form.control}
                name="niveau"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Niveau hiérarchique</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger aria-label="Sélectionner le niveau">
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DIRECTION">Direction</SelectItem>
                        <SelectItem value="CADRE">Cadre</SelectItem>
                        <SelectItem value="SUPPORT">Support</SelectItem>
                        <SelectItem value="OPERATIONNEL">
                          Opérationnel
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                      placeholder="Ex: Chef de chantier"
                      maxLength={100}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Checkboxes */}
            <div className="space-y-3 rounded-lg border p-4">
              <FormField
                control={form.control}
                name="reserveAdmin"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Réservé aux administrateurs</FormLabel>
                      <FormDescription>
                        Seuls les administrateurs peuvent modifier ce poste
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="titulaireUnique"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Titulaire unique</FormLabel>
                      <FormDescription>
                        Un seul employé peut occuper ce poste à la fois
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ouvreDroitConges"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Ouvre droit aux congés</FormLabel>
                      <FormDescription>
                        L'employé bénéficie d'un compteur de congés annuels
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

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
                {poste ? "Enregistrer" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
