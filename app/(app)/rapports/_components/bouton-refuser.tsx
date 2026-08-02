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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, XCircle, Loader2 } from "lucide-react";

const schemaFormulaire = z.object({
  motif: z
    .string()
    .min(10, "Le motif doit contenir au moins 10 caractères")
    .max(500, "500 caractères maximum"),
});

type FormData = z.infer<typeof schemaFormulaire>;

interface BoutonRefuserProps {
  rapportId: string;
  disabled?: boolean;
}

/**
 * Reject activity report with reason (conducteur de travaux only)
 * M6 — Rapports d'activité
 *
 * Permission: releve:viser
 */
export function BoutonRefuser({ rapportId, disabled }: BoutonRefuserProps) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [erreur, setErreur] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schemaFormulaire),
    defaultValues: {
      motif: "",
    },
  });

  const onSubmit = (data: FormData) => {
    setErreur(null);

    startTransition(async () => {
      try {
        // TODO: Call Server Action to reject report
        // await refuserRapport(rapportId, data.motif);

        setOuvert(false);
        form.reset();
        router.refresh();
      } catch (error) {
        console.error("[BoutonRefuser] Error:", error);
        setErreur(
          error instanceof Error ? error.message : "Erreur lors du refus"
        );
      }
    });
  };

  return (
    <>
      <Button
        size="sm"
        variant="destructive"
        className="gap-2"
        onClick={() => setOuvert(true)}
        disabled={disabled || isPending}
      >
        <XCircle className="size-4" aria-hidden="true" />
        Refuser
      </Button>

      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser le relevé</DialogTitle>
            <DialogDescription>
              Le relevé sera renvoyé au chef de chantier pour correction. Indiquez le
              motif du refus.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="motif"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motif du refus</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Expliquez pourquoi ce relevé est refusé..."
                        className="min-h-[100px]"
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
                  onClick={() => {
                    setOuvert(false);
                    form.reset();
                  }}
                  disabled={isPending}
                >
                  Annuler
                </Button>
                <Button type="submit" variant="destructive" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Refuser
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
