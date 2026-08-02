"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { XCircle } from "lucide-react";
import { refuserDemandeRessource } from "@/lib/actions/ressources";
import { useToast } from "@/hooks/use-toast";

const schemaFormulaire = z.object({
  motif: z
    .string()
    .min(10, "Le motif de refus doit faire au moins 10 caractères"),
});

type FormulaireRefus = z.infer<typeof schemaFormulaire>;

type BoutonRefuserProps = {
  demandeId: string;
  niveau: "N1" | "SERVICE";
};

export function BoutonRefuser({ demandeId, niveau }: BoutonRefuserProps) {
  const [ouvert, setOuvert] = useState(false);
  const [enCours, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormulaireRefus>({
    resolver: zodResolver(schemaFormulaire),
    defaultValues: {
      motif: "",
    },
  });

  function onSubmit(data: FormulaireRefus) {
    startTransition(async () => {
      try {
        await refuserDemandeRessource({
          demandeId,
          motif: data.motif,
          etape: niveau,
        });

        toast({
          title: "Demande refusée",
          description: "La demande a été refusée avec motif.",
        });

        setOuvert(false);
        form.reset();
        router.refresh();
      } catch (error) {
        toast({
          title: "Erreur",
          description:
            error instanceof Error
              ? error.message
              : "Impossible de refuser la demande",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <Dialog open={ouvert} onOpenChange={setOuvert}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          disabled={enCours}
          aria-label="Refuser la demande"
        >
          <XCircle className="mr-2 size-4" aria-hidden="true" />
          Refuser
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refuser la demande</DialogTitle>
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
                      placeholder="Expliquez les raisons du refus (minimum 10 caractères)..."
                      className="min-h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOuvert(false)}
                disabled={enCours}
              >
                Annuler
              </Button>
              <Button type="submit" variant="destructive" disabled={enCours}>
                {enCours ? "Refus..." : "Confirmer le refus"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
