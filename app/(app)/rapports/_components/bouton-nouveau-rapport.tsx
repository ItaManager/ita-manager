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
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Plus } from "lucide-react";
import { saveRapportOffline, generateClientId } from "@/lib/indexeddb/rapports-db";
import type { Projet } from "@prisma/client";

const schemaFormulaire = z.object({
  projetId: z.string().min(1, "Le projet est requis"),
  date: z.string().min(1, "La date est requise"),
});

type FormData = z.infer<typeof schemaFormulaire>;

interface BoutonNouveauRapportProps {
  projets: Array<Pick<Projet, "id" | "code" | "nom">>;
  chefChantierId: string;
}

/**
 * Button to create new activity report
 * M6 — Rapports d'activité
 *
 * Creates report in IndexedDB for offline capability
 */
export function BoutonNouveauRapport({
  projets,
  chefChantierId,
}: BoutonNouveauRapportProps) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  // Default to today
  const aujourdHui = new Date().toISOString().split("T")[0];

  const form = useForm<FormData>({
    resolver: zodResolver(schemaFormulaire),
    defaultValues: {
      projetId: "",
      date: aujourdHui,
    },
  });

  const onSubmit = (data: FormData) => {
    setErreur(null);

    startTransition(async () => {
      try {
        // Generate client-side UUID
        const clientId = generateClientId();

        // Create rapport in IndexedDB
        await saveRapportOffline({
          clientId,
          projetId: data.projetId,
          date: data.date,
          statut: "BROUILLON",
          chefChantierId,
          pointages: [],
          travauxRealises: [],
          utilisationsMateriel: [],
          consommations: [],
          incidents: [],
          syncEnAttente: false,
          derniereSyncLocale: new Date().toISOString(),
          creeLe: new Date().toISOString(),
          modifieLe: new Date().toISOString(),
        });

        // Navigate to detail page (use clientId in URL)
        router.push(`/rapports/${clientId}`);
        router.refresh();
      } catch (error) {
        console.error("[BoutonNouveauRapport] Error:", error);
        setErreur(
          error instanceof Error ? error.message : "Erreur lors de la création du relevé"
        );
      }
    });
  };

  return (
    <>
      <Button size="sm" className="gap-2" onClick={() => setOuvert(true)}>
        <Plus className="size-4" aria-hidden="true" />
        Nouveau relevé
      </Button>

      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau relevé d'activité</DialogTitle>
            <DialogDescription>
              Créer un relevé quotidien pour un chantier
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="projetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chantier</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un chantier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projets.map((projet) => (
                          <SelectItem key={projet.id} value={projet.id}>
                            {projet.code} — {projet.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <input
                        type="date"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {erreur && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" />
                  <AlertDescription>{erreur}</AlertDescription>
                </Alert>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOuvert(false)}
                  disabled={isPending}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Créer
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
