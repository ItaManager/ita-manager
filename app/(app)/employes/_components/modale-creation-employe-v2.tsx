"use client";

import { useState, useTransition } from "react";
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
import { creerEmploye } from "@/lib/actions/employes";
import {
  toastSucces,
  toastErreur,
  TOAST_MESSAGES,
} from "@/lib/utils/toast";
import { Loader2, ChevronLeft, ChevronRight, Save, Plus, Trash2, X } from "lucide-react";
import type { TypeMainOeuvre } from "@prisma/client";

interface ModaleCreationEmployeProps {
  ouvert: boolean;
  onFermer: () => void;
  postes: Array<{ id: string; libelle: string; code: string; serviceId?: string | null; directionId: string }>;
  nationalites: Array<{ id: string; libelle: string }>;
  directions: Array<{ id: string; libelle: string }>;
  services: Array<{ id: string; libelle: string; directionId: string }>;
}

interface Experience {
  entreprise: string;
  poste: string;
  dateDebut: string;
  dateFin?: string;
  description?: string;
}

interface Competence {
  libelle: string;
  niveau?: "DEBUTANT" | "INTERMEDIAIRE" | "AVANCE" | "EXPERT";
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
  // Étape 2
  experiences: Experience[];
  // Étape 3
  competences: Competence[];
  // Étape 4
  referenceInterne?: string;
  directionId: string;
  serviceId?: string;
  posteId: string;
  superieurId?: string;
  typeContrat: "CDI" | "CDD" | "INTERIM" | "STAGE";
  dateEmbauche: string;
  dateFin?: string;
  salaire: number;
  // Étape 5
  formations: Formation[];
}

const ETAPES = [
  { numero: 1, titre: "Informations personnelles" },
  { numero: 2, titre: "Expériences" },
  { numero: 3, titre: "Compétences" },
  { numero: 4, titre: "Contrat & affectation" },
  { numero: 5, titre: "Formations" },
  { numero: 6, titre: "Documents" },
  { numero: 7, titre: "Révision" },
];

export function ModaleCreationEmployeV2({
  ouvert,
  onFermer,
  postes,
  nationalites,
  directions,
  services,
}: ModaleCreationEmployeProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [etapeActuelle, setEtapeActuelle] = useState(1);

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
      competences: [],
      formations: [],
    },
  });

  const { fields: experiencesFields, append: appendExperience, remove: removeExperience } =
    useFieldArray({ control, name: "experiences" });

  const { fields: competencesFields, append: appendCompetence, remove: removeCompetence } =
    useFieldArray({ control, name: "competences" });

  const { fields: formationsFields, append: appendFormation, remove: removeFormation } =
    useFieldArray({ control, name: "formations" });

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
        const result = await creerEmploye({
          ...data,
          dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : undefined,
          dateEmbauche: new Date(data.dateEmbauche),
          dateFin: data.dateFin ? new Date(data.dateFin) : undefined,
          dateDebutAffectation: new Date(data.dateEmbauche),
        });

        toastSucces(TOAST_MESSAGES.CREATION_REUSSIE("Employé"), `Matricule : ${result.matricule}`);
        reset();
        onFermer();
        router.refresh();
      } catch (error: any) {
        toastErreur("Échec de la création", error.message);
      }
    });
  };

  const progressPourcentage = (etapeActuelle / ETAPES.length) * 100;

  return (
    <Dialog open={ouvert} onOpenChange={onFermer}>
      <DialogContent className="!max-w-6xl max-h-[90vh] overflow-y-auto p-0">
        {/* En-tête avec fond */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <DialogTitle className="text-xl text-white">Création d'un nouveau compte</DialogTitle>
              <p className="text-blue-100 text-sm mt-1">
                Étape {etapeActuelle} sur {ETAPES.length} — {ETAPES[etapeActuelle - 1].titre}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onFermer} className="text-white hover:bg-blue-800">
              <X className="size-5" />
            </Button>
          </div>

          {/* Barre de progression */}
          <div className="w-full bg-blue-800/30 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${progressPourcentage}%` }}
            />
          </div>
        </div>

        {/* Contenu du formulaire */}
        <div className="p-6">

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* ÉTAPE 1 : Informations personnelles */}
          {etapeActuelle === 1 && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Identité</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Nom */}
                <div>
                  <Label htmlFor="nom">
                    Nom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nom"
                    {...register("nom", { required: true })}
                    placeholder="Dosso"
                  />
                </div>

                {/* Prénom */}
                <div>
                  <Label htmlFor="prenom">
                    Prénom <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="prenom"
                    {...register("prenom", { required: true })}
                    placeholder="Christ"
                  />
                </div>

                {/* Email professionnel */}
                <div>
                  <Label htmlFor="email">Email professionnel <span className="text-red-500">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="prenom.nom@ita.ci"
                  />
                </div>

                {/* Nationalité */}
                <div>
                  <Label htmlFor="nationalite">
                    Nationalité <span className="text-red-500">*</span>
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
                        searchPlaceholder="Rechercher une nationalité..."
                      />
                    )}
                  />
                </div>

                {/* Sexe */}
                <div>
                  <Label htmlFor="sexe">
                    Sexe <span className="text-red-500">*</span>
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

                {/* Date de naissance */}
                <div>
                  <Label htmlFor="dateNaissance">
                    Date de naissance <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dateNaissance"
                    type="date"
                    {...register("dateNaissance")}
                  />
                </div>

                {/* Lieu de naissance */}
                <div>
                  <Label htmlFor="lieuNaissance">Lieu de naissance <span className="text-red-500">*</span></Label>
                  <Input
                    id="lieuNaissance"
                    {...register("lieuNaissance")}
                    placeholder="Abidjan, Côte d'Ivoire"
                  />
                </div>

                {/* Numéro CNPS */}
                <div>
                  <Label htmlFor="numeroCnps">Numéro CNPS</Label>
                  <Input
                    id="numeroCnps"
                    {...register("numeroCnps")}
                    placeholder="0000000000"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Si l'employé en possède déjà un</p>
                </div>

                {/* Situation matrimoniale */}
                <div>
                  <Label htmlFor="situationMatrimoniale">
                    Situation matrimoniale <span className="text-red-500">*</span>
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

                {/* Nombre d'enfants */}
                <div>
                  <Label htmlFor="nombreEnfants">Nombre d'enfants</Label>
                  <Input
                    id="nombreEnfants"
                    type="number"
                    min="0"
                    {...register("nombreEnfants", { valueAsNumber: true })}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Laissé pour le calcul des parts fiscales</p>
                </div>

                {/* Téléphone principal */}
                <div>
                  <Label htmlFor="telephone">
                    Téléphone principal <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="telephone"
                    {...register("telephone", { required: true })}
                    placeholder="+225 07 00 00 00 00"
                  />
                </div>

                {/* Téléphone secondaire */}
                <div>
                  <Label htmlFor="telephoneSecondaire">Téléphone secondaire</Label>
                  <Input
                    id="telephoneSecondaire"
                    {...register("telephoneSecondaire")}
                    placeholder="+225 05 00 00 00 00"
                  />
                </div>
              </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 2 : Expériences */}
          {etapeActuelle === 2 && (
            <div className="space-y-4">
              {experiencesFields.length === 0 ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center py-12">
                  <p className="text-sm font-medium text-gray-700 mb-2">Aucune expérience enregistrée</p>
                  <p className="text-xs text-gray-500 mb-6">
                    Ajoutez les postes occupés avant l'arrivée chez ITA.
                  </p>
                  <Button
                    type="button"
                    onClick={() =>
                      appendExperience({
                        entreprise: "",
                        poste: "",
                        dateDebut: "",
                      })
                    }
                  >
                    <Plus className="size-4 mr-2" />
                    Ajouter une expérience
                  </Button>
                </div>
              ) : (
                <>
                  {experiencesFields.map((field, index) => (
                    <div key={field.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Expérience #{index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeExperience(index)}
                        >
                          <Trash2 className="size-4 text-red-600" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Entreprise</Label>
                          <Input {...register(`experiences.${index}.entreprise`)} />
                        </div>
                        <div>
                          <Label>Poste occupé</Label>
                          <Input {...register(`experiences.${index}.poste`)} />
                        </div>
                        <div>
                          <Label>Date de début</Label>
                          <Input type="date" {...register(`experiences.${index}.dateDebut`)} />
                        </div>
                        <div>
                          <Label>Date de fin</Label>
                          <Input type="date" {...register(`experiences.${index}.dateFin`)} />
                        </div>
                        <div className="col-span-2">
                          <Label>Description</Label>
                          <Input {...register(`experiences.${index}.description`)} />
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      appendExperience({
                        entreprise: "",
                        poste: "",
                        dateDebut: "",
                      })
                    }
                  >
                    <Plus className="size-4 mr-2" />
                    Ajouter une autre expérience
                  </Button>
                </>
              )}
            </div>
          )}

          {/* ÉTAPE 3 : Compétences */}
          {etapeActuelle === 3 && (
            <div className="space-y-4">
              {competencesFields.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm font-medium mb-2">Aucune compétence enregistrée</p>
                  <p className="text-xs text-muted-foreground mb-6">
                    Ajoutez les compétences techniques de l'employé.
                  </p>
                  <Button
                    type="button"
                    onClick={() => appendCompetence({ libelle: "" })}
                  >
                    <Plus className="size-4 mr-2" />
                    Ajouter une compétence
                  </Button>
                </div>
              ) : (
                <>
                  {competencesFields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-3">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <Input
                          {...register(`competences.${index}.libelle`)}
                          placeholder="Libellé de la compétence"
                        />
                        <Controller
                          name={`competences.${index}.niveau`}
                          control={control}
                          render={({ field }) => (
                            <Combobox
                              options={[
                                { value: "DEBUTANT", label: "Débutant" },
                                { value: "INTERMEDIAIRE", label: "Intermédiaire" },
                                { value: "AVANCE", label: "Avancé" },
                                { value: "EXPERT", label: "Expert" },
                              ]}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Niveau"
                            />
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCompetence(index)}
                      >
                        <Trash2 className="size-4 text-red-600" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => appendCompetence({ libelle: "" })}
                  >
                    <Plus className="size-4 mr-2" />
                    Ajouter une autre compétence
                  </Button>
                </>
              )}
            </div>
          )}

          {/* ÉTAPE 4 : Contrat & Affectation */}
          {etapeActuelle === 4 && (
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
                  <span className="text-green-600">✓</span> Affectation
                </h3>

                <div className="space-y-4">
                  {/* 1. Direction */}
                  <div>
                    <Label>
                      1. Direction <span className="text-red-500">*</span>
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
                      2. Service <span className="text-red-500">*</span>
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
                      3. Poste <span className="text-red-500">*</span>
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
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                      <p className="font-medium text-blue-900">
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
                  Type de contrat <span className="text-red-500">*</span>
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
                    Date d'embauche <span className="text-red-500">*</span>
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
                    Salaire mensuel brut <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    {...register("salaire", { required: true, valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 5 : Formations */}
          {etapeActuelle === 5 && (
            <div className="space-y-4">
              {formationsFields.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm font-medium mb-2">Aucune formation enregistrée</p>
                  <p className="text-xs text-muted-foreground mb-6">
                    Ajoutez les diplômes et formations de l'employé.
                  </p>
                  <Button
                    type="button"
                    onClick={() =>
                      appendFormation({
                        etablissement: "",
                        diplome: "",
                        annee: "",
                      })
                    }
                  >
                    <Plus className="size-4 mr-2" />
                    Ajouter une formation
                  </Button>
                </div>
              ) : (
                <>
                  {formationsFields.map((field, index) => (
                    <div key={field.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Formation #{index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFormation(index)}
                        >
                          <Trash2 className="size-4 text-red-600" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Établissement</Label>
                          <Input {...register(`formations.${index}.etablissement`)} />
                        </div>
                        <div>
                          <Label>Diplôme obtenu</Label>
                          <Input {...register(`formations.${index}.diplome`)} />
                        </div>
                        <div>
                          <Label>Année</Label>
                          <Input {...register(`formations.${index}.annee`)} placeholder="2020" />
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      appendFormation({
                        etablissement: "",
                        diplome: "",
                        annee: "",
                      })
                    }
                  >
                    <Plus className="size-4 mr-2" />
                    Ajouter une autre formation
                  </Button>
                </>
              )}
            </div>
          )}

          {/* ÉTAPE 6 : Documents */}
          {etapeActuelle === 6 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Les documents seront uploadés après la création du profil dans l'onglet "Documents".
              </p>
            </div>
          )}

          {/* ÉTAPE 7 : Révision */}
          {etapeActuelle === 7 && (
            <div className="space-y-6">
              <h3 className="font-semibold text-lg">Révision des informations</h3>
              <div className="space-y-4 text-sm">
                <div className="border-b pb-2">
                  <p className="font-medium">Informations personnelles</p>
                  <p className="text-muted-foreground">
                    {watch("nom")} {watch("prenom")} • {watch("email")}
                  </p>
                </div>
                <div className="border-b pb-2">
                  <p className="font-medium">Expériences</p>
                  <p className="text-muted-foreground">{experiencesFields.length} enregistrée(s)</p>
                </div>
                <div className="border-b pb-2">
                  <p className="font-medium">Affectation</p>
                  <p className="text-muted-foreground">
                    {directions.find((d) => d.id === directionId)?.libelle}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={etapePrecedente}
              disabled={etapeActuelle === 1}
            >
              <ChevronLeft className="size-4 mr-2" />
              Précédent
            </Button>

            <div className="flex gap-2">
              <Button type="button" variant="ghost">
                <Save className="size-4 mr-2" />
                Enregistrer le brouillon
              </Button>

              {etapeActuelle < ETAPES.length ? (
                <Button type="button" onClick={etapeSuivante}>
                  Suivant
                  <ChevronRight className="size-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Créer le profil
                </Button>
              )}
            </div>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
