"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
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
import { creerEmploye, obtenirEmploye, modifierEmploye } from "@/lib/actions/employes";
import {
  toastSucces,
  toastErreur,
  TOAST_MESSAGES,
} from "@/lib/utils/toast";
import { Loader2, ChevronLeft, ChevronRight, X, Eye, EyeOff } from "lucide-react";
import type { TypeMainOeuvre } from "@prisma/client";

interface ModaleCreationEmployeProps {
  ouvert: boolean;
  onFermer: () => void;
  postes: Array<{ id: string; libelle: string; code: string; serviceId?: string | null; directionId: string }>;
  nationalites: Array<{ id: string; libelle: string }>;
  directions: Array<{ id: string; libelle: string }>;
  services: Array<{ id: string; libelle: string; directionId: string }>;
  employeId?: string; // ID de l'employé à modifier (optionnel)
}

interface Experience {
  entreprise: string;
  poste: string;
  dateDebut: string;
  dateFin?: string;
  description?: string;
}

interface Formation {
  etablissement: string;
  diplome: string;
  annee: string;
}

interface FormData {
  typeMainOeuvre: TypeMainOeuvre;
  // Étape 1
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
  // Étape 2
  experiences: Experience[];
  // Étape 3
  referenceInterne?: string;
  directionId: string;
  serviceId?: string;
  posteId: string;
  superieurId?: string;
  typeContrat: "CDI" | "CDD" | "INTERIM" | "STAGE";
  dateEmbauche: string;
  dateFin?: string;
  salaire: number;
  // Étape 4
  formations: Formation[];
}

const ETAPES = [
  { numero: 1, titre: "Infos personnelles" },
  { numero: 2, titre: "Affectation" },
];

export function ModaleCreationEmployeV2({
  ouvert,
  onFermer,
  postes,
  nationalites,
  directions,
  services,
  employeId,
}: ModaleCreationEmployeProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [etapeActuelle, setEtapeActuelle] = useState(1);
  const [salaireVisible, setSalaireVisible] = useState(false);
  const [chargement, setChargement] = useState(false);

  const modeModification = !!employeId;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      typeMainOeuvre: "PERMANENT",
      typeContrat: "CDI",
      experiences: [],
      formations: [],
    },
  });

  const { fields: experiencesFields, append: appendExperience, remove: removeExperience } =
    useFieldArray({ control, name: "experiences" });

  const { fields: formationsFields, append: appendFormation, remove: removeFormation } =
    useFieldArray({ control, name: "formations" });

  // Charger les données de l'employé en mode modification
  useEffect(() => {
    if (ouvert && employeId) {
      setChargement(true);
      startTransition(async () => {
        try {
          const employe = await obtenirEmploye(employeId);
          if (employe) {
            reset({
              typeMainOeuvre: employe.typeMainOeuvre,
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
              modePaiement: employe.modePaiement,
              rib: employe.rib ?? undefined,
            } as any);
          }
        } catch (error: any) {
          toastErreur("Erreur de chargement", error.message);
        } finally {
          setChargement(false);
        }
      });
    }
  }, [ouvert, employeId, reset]);

  // Watch values
  const directionId = watch("directionId");
  const serviceId = watch("serviceId");
  const typeContrat = watch("typeContrat");

  // Options pour combobox
  const nationaliteOptions: ComboboxOption[] = nationalites.map((n) => ({
    value: n.id,
    label: n.libelle,
  }));

  const directionOptions: ComboboxOption[] = directions.map((d) => ({
    value: d.id,
    label: d.libelle,
  }));

  const serviceOptions: ComboboxOption[] = services
    .filter((s) => !directionId || s.directionId === directionId)
    .map((s) => ({
      value: s.id,
      label: s.libelle,
    }));

  const posteOptions: ComboboxOption[] = postes
    .filter((p) => {
      if (serviceId) return p.serviceId === serviceId;
      if (directionId) return p.directionId === directionId && !p.serviceId;
      return false;
    })
    .map((p) => ({
      value: p.id,
      label: p.libelle,
    }));

  // Navigation
  const etapeSuivante = () => {
    if (etapeActuelle < ETAPES.length) {
      setEtapeActuelle(etapeActuelle + 1);
    }
  };

  const etapePrecedente = () => {
    if (etapeActuelle > 1) {
      setEtapeActuelle(etapeActuelle - 1);
    }
  };

  const onSubmit = async (data: FormData) => {
    startTransition(async () => {
      try {
        if (modeModification && employeId) {
          // Mode modification
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
        } else {
          // Mode création
          const result = await creerEmploye({
            ...data,
            dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : undefined,
            dateEmbauche: new Date(data.dateEmbauche),
            dateFin: data.dateFin ? new Date(data.dateFin) : undefined,
            dateDebutAffectation: new Date(data.dateEmbauche),
          });

          toastSucces(TOAST_MESSAGES.CREATION_REUSSIE("Employé"), `Matricule : ${result.matricule}`);
        }

        reset();
        onFermer();
        router.refresh();
      } catch (error: any) {
        toastErreur(modeModification ? "Échec de la modification" : "Échec de la création", error.message);
      }
    });
  };

  const progressPourcentage = (etapeActuelle / ETAPES.length) * 100;

  return (
    <Dialog open={ouvert} onOpenChange={onFermer}>
      <DialogContent className="!max-w-6xl max-h-[90vh] overflow-y-auto p-0">
        {/* En-tête avec fond */}
        <div className="sticky top-0 z-10 border-b border-border px-6 py-4" style={{ backgroundColor: 'var(--primary-soft)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <DialogTitle className="text-lg font-semibold text-primary">
                {modeModification ? "Modification de l'employé" : "Création d'un nouveau compte"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Étape {etapeActuelle} sur {ETAPES.length} — {ETAPES[etapeActuelle - 1].titre}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onFermer} className="hover:bg-muted">
              <X className="size-5" />
            </Button>
          </div>

          {/* Barre de progression */}
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${progressPourcentage}%` }}
            />
          </div>
        </div>

        {/* Contenu du formulaire */}
        <div className="p-6">

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* ÉTAPE 1 : Infos personnelles */}
          {etapeActuelle === 1 && (
            <div className="space-y-6">
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
                    <Label htmlFor="sexe">
                      Sexe <span className="text-destructive">*</span>
                    </Label>
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
                    <Label htmlFor="nationalite">
                      Nationalité <span className="text-destructive">*</span>
                    </Label>
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
                    <Label htmlFor="dateNaissance">
                      Date de naissance <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="dateNaissance"
                      type="date"
                      {...register("dateNaissance")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="lieuNaissance">Lieu de naissance <span className="text-destructive">*</span></Label>
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
                    <Label htmlFor="situationMatrimoniale">
                      Situation matrimoniale
                    </Label>
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
                    <p className="text-xs text-muted-foreground mt-1">Sera utilisé pour la création du compte</p>
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
            </div>
          )}

          {/* ÉTAPE 2 : Affectation */}
          {etapeActuelle === 2 && (
            <div className="space-y-6">
              {/* Matricule ITA (auto-généré) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Matricule ITA</Label>
                  <Input
                    value="ITA-2026-0179"
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Généré automatiquement selon le format ITA-AAAA-NNNN
                  </p>
                </div>

                <div>
                  <Label htmlFor="referenceInterne">Référence interne</Label>
                  <Input
                    id="referenceInterne"
                    {...register("referenceInterne")}
                    placeholder="Ex : DP-052, DG-001, 2019TAYIX"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Code interne déjà utilisé par l'entreprise avant la mise en service de l'application. Saisie
                    non nécessaire dans la liste du personnel
                  </p>
                </div>
              </div>

              {/* Section Affectation */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <span className="text-success">✓</span> Affectation
                </h3>

                <div className="space-y-4">
                  {/* 1. Direction */}
                  <div>
                    <Label>
                      1. Direction <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      name="directionId"
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Combobox
                          options={directionOptions}
                          value={field.value}
                          onChange={(value) => {
                            field.onChange(value);
                            setValue("serviceId", "");
                            setValue("posteId", "");
                          }}
                          placeholder="Direction Financière et Comptable"
                        />
                      )}
                    />
                  </div>

                  {/* 2. Service */}
                  <div>
                    <Label>
                      2. Service <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      name="serviceId"
                      control={control}
                      render={({ field }) => (
                        <Combobox
                          options={serviceOptions}
                          value={field.value}
                          onChange={(value) => {
                            field.onChange(value);
                            setValue("posteId", "");
                          }}
                          placeholder="Comptabilité"
                          disabled={!directionId}
                        />
                      )}
                    />
                  </div>

                  {/* 3. Poste */}
                  <div>
                    <Label>
                      3. Poste <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      name="posteId"
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Combobox
                          options={posteOptions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Choisir"
                          disabled={!directionId}
                        />
                      )}
                    />
                  </div>

                  {directionId && (
                    <div className="bg-primary-soft border border-primary/20 rounded p-3 text-sm">
                      <p className="font-medium text-primary">
                        Direction Financière et Comptable › Comptabilité
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Supérieur hiérarchique */}
              <div>
                <Label>Supérieur hiérarchique</Label>
                <Controller
                  name="superieurId"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={[
                        { value: "1", label: "Aucun/rechercher un nom" },
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Aucun/rechercher un nom"
                    />
                  )}
                />
              </div>

              {/* Type de contrat */}
              <div>
                <Label>
                  Type de contrat <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="typeContrat"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Combobox
                      options={[
                        { value: "CDI", label: "CDI" },
                        { value: "CDD", label: "CDD" },
                        { value: "INTERIM", label: "Intérim" },
                        { value: "STAGE", label: "Stage" },
                      ]}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Sélectionner"
                    />
                  )}
                />
              </div>

              {/* Dates et salaire */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>
                    Date d'embauche <span className="text-destructive">*</span>
                  </Label>
                  <Input type="date" {...register("dateEmbauche", { required: true })} />
                </div>

                {(typeContrat === "CDD" || typeContrat === "STAGE") && (
                  <div>
                    <Label>Date de fin</Label>
                    <Input type="date" {...register("dateFin")} />
                  </div>
                )}

                <div className="col-span-2">
                  <Label>
                    Salaire mensuel brut <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      type={salaireVisible ? "number" : "password"}
                      {...register("salaire", { required: true, valueAsNumber: true })}
                      placeholder={salaireVisible ? "0" : "••••••••"}
                      className="pr-12"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setSalaireVisible(!salaireVisible)}
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    >
                      {salaireVisible ? (
                        <EyeOff className="size-4 text-muted-foreground" />
                      ) : (
                        <Eye className="size-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={etapePrecedente}
              disabled={etapeActuelle === 1}
            >
              <ChevronLeft className="size-4 mr-2" />
              Précédent
            </Button>

            {etapeActuelle < ETAPES.length ? (
              <Button type="button" onClick={etapeSuivante} className="bg-[#13850b] hover:bg-[#0f6909] text-white">
                Suivant
                <ChevronRight className="size-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={isPending} className="bg-[#13850b] hover:bg-[#0f6909] text-white">
                {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                Créer le profil
              </Button>
            )}
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
