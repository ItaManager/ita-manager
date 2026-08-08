"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { obtenirEmploye, modifierEmploye } from "@/lib/actions/employes";
import {
  toastSucces,
  toastErreur,
  TOAST_MESSAGES,
} from "@/lib/utils/toast";
import { Loader2, X } from "lucide-react";

interface ModaleModificationEmployeProps {
  ouvert: boolean;
  onFermer: () => void;
  employeId: string;
  nationalites: Array<{ id: string; libelle: string }>;
}

interface FormData {
  nom: string;
  prenom: string;
  email?: string;
  nationaliteId?: string;
  sexe?: "MASCULIN" | "FEMININ";
  dateNaissance?: string;
  lieuNaissance?: string;
  numeroCnps?: string;
  situationMatrimoniale?: "CELIBATAIRE" | "MARIE" | "DIVORCE" | "VEUF";
  nombreEnfants?: number;
  telephone: string;
  telephoneSecondaire?: string;
  adresse?: string;
  urgenceNom?: string;
  urgenceTel?: string;
  numeroWave?: string;
  modePaiement?: "WAVE" | "VIREMENT";
  rib?: string;
}

export function ModaleModificationEmploye({
  ouvert,
  onFermer,
  employeId,
  nationalites,
}: ModaleModificationEmployeProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [chargement, setChargement] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  // Charger les données de l'employé
  useEffect(() => {
    if (ouvert && employeId) {
      setChargement(true);
      startTransition(async () => {
        try {
          const employe = await obtenirEmploye(employeId);
          if (employe) {
            reset({
              nom: employe.nom,
              prenom: employe.prenom,
              email: employe.email ?? undefined,
              nationaliteId: employe.nationalite?.id ?? undefined,
              sexe: employe.sexe as "MASCULIN" | "FEMININ" | undefined,
              dateNaissance: employe.dateNaissance
                ? new Date(employe.dateNaissance).toISOString().split("T")[0]
                : undefined,
              lieuNaissance: employe.lieuNaissance ?? undefined,
              numeroCnps: employe.numeroCnps ?? undefined,
              situationMatrimoniale: employe.situationMatrimoniale as any,
              nombreEnfants: employe.nombreEnfants ?? undefined,
              telephone: employe.telephone,
              telephoneSecondaire: employe.telephoneSecondaire ?? undefined,
              adresse: employe.adresse ?? undefined,
              urgenceNom: employe.urgenceNom ?? undefined,
              urgenceTel: employe.urgenceTel ?? undefined,
              numeroWave: employe.numeroWave ?? undefined,
              modePaiement: (employe.modePaiement as "VIREMENT" | "WAVE" | null) ?? undefined,
              rib: employe.rib ?? undefined,
            });
          }
        } catch (error: any) {
          toastErreur("Erreur de chargement", error.message);
        } finally {
          setChargement(false);
        }
      });
    }
  }, [ouvert, employeId, reset]);

  const nationaliteOptions: ComboboxOption[] = nationalites.map((n) => ({
    value: n.id,
    label: n.libelle,
  }));

  const onSubmit = async (data: FormData) => {
    startTransition(async () => {
      try {
        await modifierEmploye(employeId, {
          nom: data.nom,
          prenom: data.prenom,
          email: data.email,
          sexe: data.sexe,
          dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : undefined,
          lieuNaissance: data.lieuNaissance,
          numeroCnps: data.numeroCnps,
          situationMatrimoniale: data.situationMatrimoniale,
          nombreEnfants: data.nombreEnfants,
          telephone: data.telephone,
          telephoneSecondaire: data.telephoneSecondaire,
          adresse: data.adresse,
          urgenceNom: data.urgenceNom,
          urgenceTel: data.urgenceTel,
          numeroWave: data.numeroWave,
          rib: data.rib,
        });

        toastSucces(TOAST_MESSAGES.MODIFICATION_REUSSIE("employé"));
        onFermer();
        router.refresh();
      } catch (error: any) {
        toastErreur("Échec de la modification", error.message);
      }
    });
  };

  return (
    <Dialog open={ouvert} onOpenChange={onFermer}>
      <DialogContent className="!max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Modifier les informations de l'employé</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onFermer}>
              <X className="size-5" />
            </Button>
          </div>
        </DialogHeader>

        {chargement ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Section Identité */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Identité</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nom">
                    Nom <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nom"
                    {...register("nom", { required: true })}
                    placeholder="Kouassi"
                  />
                </div>

                <div>
                  <Label htmlFor="prenom">
                    Prénom <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="prenom"
                    {...register("prenom", { required: true })}
                    placeholder="Aya"
                  />
                </div>

                <div>
                  <Label htmlFor="sexe">Sexe</Label>
                  <Controller
                    name="sexe"
                    control={control}
                    render={({ field }) => (
                      <Combobox
                        options={[
                          { value: "MASCULIN", label: "Masculin" },
                          { value: "FEMININ", label: "Féminin" },
                        ]}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Sélectionner"
                      />
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="nationalite">Nationalité</Label>
                  <Controller
                    name="nationaliteId"
                    control={control}
                    render={({ field }) => (
                      <Combobox
                        options={nationaliteOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Sélectionner"
                        searchPlaceholder="Rechercher..."
                      />
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="dateNaissance">Date de naissance</Label>
                  <Input
                    id="dateNaissance"
                    type="date"
                    {...register("dateNaissance")}
                  />
                </div>

                <div>
                  <Label htmlFor="lieuNaissance">Lieu de naissance</Label>
                  <Input
                    id="lieuNaissance"
                    {...register("lieuNaissance")}
                    placeholder="Abidjan, Côte d'Ivoire"
                  />
                </div>
              </div>
            </div>

            {/* Section Situation familiale */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Situation familiale</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="situationMatrimoniale">Situation matrimoniale</Label>
                  <Controller
                    name="situationMatrimoniale"
                    control={control}
                    render={({ field }) => (
                      <Combobox
                        options={[
                          { value: "CELIBATAIRE", label: "Célibataire" },
                          { value: "MARIE", label: "Marié(e)" },
                          { value: "DIVORCE", label: "Divorcé(e)" },
                          { value: "VEUF", label: "Veuf/Veuve" },
                        ]}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Sélectionner"
                      />
                    )}
                  />
                </div>

                <div>
                  <Label htmlFor="nombreEnfants">Nombre d'enfants à charge</Label>
                  <Input
                    id="nombreEnfants"
                    type="number"
                    min="0"
                    {...register("nombreEnfants", { valueAsNumber: true })}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Pour le calcul de l'impôt</p>
                </div>
              </div>
            </div>

            {/* Section Coordonnées */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Coordonnées</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telephone">
                    Téléphone principal <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="telephone"
                    {...register("telephone", { required: true })}
                    placeholder="+225 07 00 00 00 00"
                  />
                </div>

                <div>
                  <Label htmlFor="telephoneSecondaire">Téléphone secondaire</Label>
                  <Input
                    id="telephoneSecondaire"
                    {...register("telephoneSecondaire")}
                    placeholder="+225 05 00 00 00 00"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email professionnel</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="prenom.nom@ita.ci"
                  />
                </div>

                <div>
                  <Label htmlFor="adresse">Adresse de résidence</Label>
                  <Input
                    id="adresse"
                    {...register("adresse")}
                    placeholder="Cocody, Angré 7e tranche"
                  />
                </div>
              </div>
            </div>

            {/* Section Contact d'urgence */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Contact d'urgence</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="urgenceNom">Nom du contact</Label>
                  <Input
                    id="urgenceNom"
                    {...register("urgenceNom")}
                    placeholder="Nom et prénom"
                  />
                </div>

                <div>
                  <Label htmlFor="urgenceTel">Téléphone du contact</Label>
                  <Input
                    id="urgenceTel"
                    {...register("urgenceTel")}
                    placeholder="+225 07 00 00 00 00"
                  />
                </div>
              </div>
            </div>

            {/* Section Sécurité sociale */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Sécurité sociale</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numeroCnps">Numéro CNPS</Label>
                  <Input
                    id="numeroCnps"
                    {...register("numeroCnps")}
                    placeholder="1234567890"
                    maxLength={10}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Si l'employé en possède déjà un</p>
                </div>
              </div>
            </div>

            {/* Section Paiement */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Modalités de paiement</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="modePaiement">Mode de paiement</Label>
                  <Controller
                    name="modePaiement"
                    control={control}
                    render={({ field }) => (
                      <Combobox
                        options={[
                          { value: "VIREMENT", label: "Virement bancaire" },
                          { value: "WAVE", label: "Wave" },
                        ]}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Sélectionner"
                      />
                    )}
                  />
                </div>

                {watch("modePaiement") === "VIREMENT" && (
                  <div className="col-span-2">
                    <Label htmlFor="rib">RIB (Relevé d'Identité Bancaire)</Label>
                    <Input
                      id="rib"
                      {...register("rib")}
                      placeholder="CI00 0000 0000 0000 0000 0000 00"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Format IBAN ivoirien</p>
                  </div>
                )}

                {watch("modePaiement") === "WAVE" && (
                  <div className="col-span-2">
                    <Label htmlFor="numeroWave">Numéro Wave</Label>
                    <Input
                      id="numeroWave"
                      {...register("numeroWave")}
                      placeholder="+225 07 00 00 00 00"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Numéro de téléphone associé au compte Wave</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onFermer}>
                Annuler
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                Enregistrer les modifications
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
