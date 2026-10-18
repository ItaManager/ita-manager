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
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Package } from "lucide-react";
import { affecterMateriel } from "@/lib/actions/ressources";
import { useToast } from "@/hooks/use-toast";

type MaterielOption = {
  id: string;
  codeIta: string;
  designation: string;
  statut: string;
  partageable: boolean;
};

const schemaFormulaire = z.object({
  materielId: z.string().min(1, "Matériel requis"),
  commentaire: z.string().optional(),
});

type FormulaireAffectation = z.infer<typeof schemaFormulaire>;

type BoutonAffecterMaterielProps = {
  demandeId: string;
  projetId: string;
  dateDebut: Date;
  dateFin: Date;
  materielDisponible: MaterielOption[];
};

export function BoutonAffecterMateriel({
  demandeId,
  projetId,
  dateDebut,
  dateFin,
  materielDisponible,
}: BoutonAffecterMaterielProps) {
  const [ouvert, setOuvert] = useState(false);
  const [enCours, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<FormulaireAffectation>({
    resolver: zodResolver(schemaFormulaire),
    defaultValues: {
      materielId: "",
      commentaire: "",
    },
  });

  function onSubmit(data: FormulaireAffectation) {
    startTransition(async () => {
      try {
        await affecterMateriel({
          materielId: data.materielId,
          projetId,
          dateDebut,
          dateFin,
          commentaire: data.commentaire,
        });

        toast({
          title: "Matériel affecté",
          description: "Le matériel a été affecté au projet avec succès.",
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
              : "Impossible d'affecter le matériel",
          variant: "destructive",
        });
      }
    });
  }

  return (
    <Dialog open={ouvert} onOpenChange={setOuvert}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={materielDisponible.length === 0}
          aria-label="Affecter du matériel"
        >
          <Package className="mr-2 size-4" aria-hidden="true" />
          Affecter matériel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Affecter du matériel</DialogTitle>
        </DialogHeader>

        {materielDisponible.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Aucun matériel disponible sur cette période.
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="materielId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Matériel disponible</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger aria-label="Sélectionner un matériel">
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {materielDisponible.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            <div className="flex items-start gap-2">
                              <span className="font-mono text-xs text-muted-foreground">
                                {m.codeIta}
                              </span>
                              <div className="flex flex-col">
                                <span>{m.designation}</span>
                                <span className="text-xs text-muted-foreground">
                                  {m.statut === "DISPONIBLE"
                                    ? "Disponible"
                                    : m.statut}
                                  {m.partageable && " · Partageable"}
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Période : du{" "}
                      {new Date(dateDebut).toLocaleDateString("fr-FR")} au{" "}
                      {new Date(dateFin).toLocaleDateString("fr-FR")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commentaire"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commentaire (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notes sur l'affectation..."
                        className="min-h-20"
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
                <Button type="submit" disabled={enCours}>
                  {enCours ? "Affectation..." : "Affecter"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
