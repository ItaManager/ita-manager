"use client";

import { useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, AlertCircle, Plus, Trash2, Send } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  modifierConfigurationAlerte,
  envoyerEmailTestAlerte,
  type TypeAlerte,
} from "@/lib/actions/alertes";
import { toast } from "sonner";

const schema = z.object({
  actif: z.boolean(),
  destinataires: z.array(z.object({ email: z.string().email("Email invalide") })).min(1, "Au moins un destinataire requis"),
  seuil: z.number().optional(),
  frequence: z.enum(["QUOTIDIEN", "HEBDOMADAIRE", "MENSUEL"]),
});

type FormData = z.infer<typeof schema>;

interface ConfigurationAlerte {
  type: TypeAlerte;
  libelle: string;
  description: string;
  actif: boolean;
  destinataires: string[];
  seuil?: number;
  frequence: "QUOTIDIEN" | "HEBDOMADAIRE" | "MENSUEL";
}

interface ModalConfigAlerteProps {
  ouvert: boolean;
  onFermer: () => void;
  alerte: ConfigurationAlerte;
  onSuccess: () => void;
}

export function ModalConfigAlerte({
  ouvert,
  onFermer,
  alerte,
  onSuccess,
}: ModalConfigAlerteProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      actif: alerte.actif,
      destinataires: alerte.destinataires.map((email) => ({ email })),
      seuil: alerte.seuil,
      frequence: alerte.frequence,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "destinataires",
  });

  const actif = watch("actif");

  const onSubmit = (data: FormData) => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await modifierConfigurationAlerte({
          type: alerte.type,
          actif: data.actif,
          destinataires: data.destinataires.map((d) => d.email),
          seuil: data.seuil,
          frequence: data.frequence,
        });

        if (result.success) {
          toast.success("Configuration modifiée avec succès");
          onFermer();
          onSuccess();
        } else {
          setError(result.error || "Erreur lors de la modification");
        }
      } catch (err) {
        setError("Une erreur est survenue");
      }
    });
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      toast.error("Veuillez saisir une adresse email");
      return;
    }

    setSendingTest(true);
    try {
      const result = await envoyerEmailTestAlerte({
        type: alerte.type,
        destinataire: testEmail,
      });

      if (result.success) {
        toast.success(result.message || "Email de test envoyé");
        setTestEmail("");
      } else {
        toast.error(result.error || "Erreur lors de l'envoi");
      }
    } catch (error) {
      toast.error("Erreur lors de l'envoi du test");
    } finally {
      setSendingTest(false);
    }
  };

  const handleFermer = () => {
    if (!isPending) {
      setError(null);
      onFermer();
    }
  };

  return (
    <Dialog open={ouvert} onOpenChange={handleFermer}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
            {alerte.libelle}
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">{alerte.description}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Activation */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="actif" className="font-medium">Activer cette alerte</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Les emails seront envoyés automatiquement selon la fréquence configurée
              </p>
            </div>
            <Switch
              id="actif"
              checked={actif}
              onCheckedChange={(checked) => setValue("actif", checked)}
              disabled={isPending}
            />
          </div>

          {/* Fréquence */}
          <div>
            <Label htmlFor="frequence" className="required">Fréquence d'envoi</Label>
            <Select
              value={watch("frequence")}
              onValueChange={(value: any) => setValue("frequence", value)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="QUOTIDIEN">Quotidien</SelectItem>
                <SelectItem value="HEBDOMADAIRE">Hebdomadaire</SelectItem>
                <SelectItem value="MENSUEL">Mensuel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Seuil (si applicable) */}
          {alerte.seuil !== undefined && (
            <div>
              <Label htmlFor="seuil">Seuil d'alerte (jours)</Label>
              <Input
                id="seuil"
                type="number"
                min="1"
                {...register("seuil", { valueAsNumber: true })}
                disabled={isPending}
              />
              {errors.seuil && (
                <p className="text-sm text-destructive mt-1">{errors.seuil.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Nombre de jours avant l'événement pour déclencher l'alerte
              </p>
            </div>
          )}

          {/* Destinataires */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="required">Destinataires</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ email: "" })}
                disabled={isPending}
              >
                <Plus className="size-3 mr-1" />
                Ajouter
              </Button>
            </div>

            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <div className="flex-1">
                    <Input
                      {...register(`destinataires.${index}.email`)}
                      placeholder="email@example.com"
                      disabled={isPending}
                    />
                    {errors.destinataires?.[index]?.email && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.destinataires[index]?.email?.message}
                      </p>
                    )}
                  </div>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      disabled={isPending}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Test email */}
          <div className="border-t pt-6">
            <Label htmlFor="testEmail">Envoyer un email de test</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="testEmail"
                type="email"
                placeholder="email@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                disabled={sendingTest}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSendTest}
                disabled={sendingTest || !testEmail}
              >
                <Send className="size-3 mr-1" />
                {sendingTest ? "Envoi..." : "Tester"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Envoyez un email de test pour vérifier le bon fonctionnement
            </p>
          </div>

          {/* Actions */}
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
              {isPending ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
