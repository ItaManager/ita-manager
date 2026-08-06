"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Plus, Trash2, Loader2, Lock, Unlock } from "lucide-react";
import {
  creerEmploye,
  sauvegarderBrouillonEmploye,
  recupererBrouillonEmploye,
  supprimerBrouillonEmploye,
  obtenirTachesProjet,
  creerTacheInline,
} from "@/lib/actions/employes";
import {
  toastSucces,
  toastErreur,
  TOAST_MESSAGES,
} from "@/lib/utils/toast";
import type { TypeMainOeuvre } from "@prisma/client";

interface ModaleNouvelEmployeProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postes?: Array<{ id: string; libelle: string; code: string; serviceId?: string | null; directionId: string }>;
  nationalites?: Array<{ id: string; libelle: string }>;
  directions?: Array<{ id: string; libelle: string }>;
  services?: Array<{ id: string; libelle: string; directionId: string }>;
  employes?: Array<{ id: string; matricule: string; nom: string; prenom: string }>;
  projets?: Array<{ id: string; code: string; nom: string }>;
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
  // General
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
  numeroWave?: string;
  // Job
  experiences: Experience[];
  // Payroll - Affectation
  referenceInterne?: string;
  directionId: string;
  serviceId?: string;
  posteId?: string;
  superieurId?: string;
  projetId?: string;
  tacheId?: string;
  typeContrat: "CDI" | "CDD" | "INTERIM" | "STAGE";
  dateEmbauche: string;
  dateFin?: string;
  salaire?: number;
  // Setting
  competences: Competence[];
  formations: Formation[];
}

export function ModaleNouvelEmploye({
  open,
  onOpenChange,
  postes = [],
  nationalites = [],
  directions = [],
  services = [],
  employes = [],
  projets = [],
}: ModaleNouvelEmployeProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("general");
  const [brouillonCharge, setBrouillonCharge] = useState(false);
  const [derniereSauvegarde, setDerniereSauvegarde] = useState<Date | null>(null);
  const [matriculeLocked, setMatriculeLocked] = useState(true);
  const [taches, setTaches] = useState<Array<{ id: string; libelle: string }>>([]);

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

  const directionId = watch("directionId");
  const serviceId = watch("serviceId");
  const typeContrat = watch("typeContrat");
  const typeMainOeuvre = watch("typeMainOeuvre");
  const projetId = watch("projetId");

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

  const employeOptions: ComboboxOption[] = employes.map((e) => ({
    value: e.id,
    label: `${e.nom} ${e.prenom} (${e.matricule})`,
  }));

  const projetOptions: ComboboxOption[] = projets.map((p) => ({
    value: p.id,
    label: `${p.code} — ${p.nom}`,
  }));

  const tacheOptions: ComboboxOption[] = taches.map((t) => ({
    value: t.id,
    label: t.libelle,
  }));

  // Charger le brouillon à l'ouverture de la modale
  useEffect(() => {
    if (open && !brouillonCharge) {
      recupererBrouillonEmploye().then((donnees) => {
        if (donnees) {
          reset(donnees as any);
        }
        setBrouillonCharge(true);
      });
    }
    if (!open) {
      setBrouillonCharge(false);
    }
  }, [open, brouillonCharge, reset]);

  // Auto-save toutes les 2s après dernière modification
  useEffect(() => {
    if (!open) return;

    const donnees = watch();
    const timer = setTimeout(() => {
      sauvegarderBrouillonEmploye(donnees).then(() => {
        setDerniereSauvegarde(new Date());
      }).catch(console.error);
    }, 2000);

    return () => clearTimeout(timer);
  }, [watch, open]);

  // Rediriger vers un onglet valide si on change de type
  useEffect(() => {
    if (typeMainOeuvre === "JOURNALIER" && (activeTab === "job" || activeTab === "setting")) {
      setActiveTab("general");
    }
  }, [typeMainOeuvre, activeTab]);

  // Charger les tâches quand le projet change
  useEffect(() => {
    if (projetId) {
      obtenirTachesProjet(projetId).then((fetchedTaches) => {
        setTaches(fetchedTaches);
      }).catch(console.error);
    } else {
      setTaches([]);
      setValue("tacheId", "");
    }
  }, [projetId, setValue]);

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
        await supprimerBrouillonEmploye();
        reset();
        onOpenChange(false);
        router.refresh();
      } catch (error: any) {
        toastErreur("Échec de la création", error.message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-primary-soft">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-semibold text-primary">
              Nouvel employé
            </DialogTitle>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-primary hover:bg-primary/10"
            >
              Fermer
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start rounded-none bg-transparent px-6 h-auto gap-6 border-b-0">
              <TabsTrigger
                value="general"
                className="rounded-none border-t-3 border-transparent data-[state=active]:border-t-primary data-[state=active]:text-primary data-[state=active]:font-semibold pb-4 pt-4 px-1 text-base transition-all hover:text-primary/70"
              >
                Identité
              </TabsTrigger>
              {typeMainOeuvre === "PERMANENT" && (
                <TabsTrigger
                  value="job"
                  className="rounded-none border-t-3 border-transparent data-[state=active]:border-t-primary data-[state=active]:text-primary data-[state=active]:font-semibold pb-4 pt-4 px-1 text-base transition-all hover:text-primary/70"
                >
                  Expériences
                </TabsTrigger>
              )}
              <TabsTrigger
                value="payroll"
                className="rounded-none border-t-3 border-transparent data-[state=active]:border-t-primary data-[state=active]:text-primary data-[state=active]:font-semibold pb-4 pt-4 px-1 text-base transition-all hover:text-primary/70"
              >
                Contrat
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="rounded-none border-t-3 border-transparent data-[state=active]:border-t-primary data-[state=active]:text-primary data-[state=active]:font-semibold pb-4 pt-4 px-1 text-base transition-all hover:text-primary/70"
              >
                Documents
              </TabsTrigger>
              {typeMainOeuvre === "PERMANENT" && (
                <TabsTrigger
                  value="setting"
                  className="rounded-none border-t-3 border-transparent data-[state=active]:border-t-primary data-[state=active]:text-primary data-[state=active]:font-semibold pb-4 pt-4 px-1 text-base transition-all hover:text-primary/70"
                >
                  Compétences
                </TabsTrigger>
              )}
            </TabsList>

            {/* General Tab - Informations personnelles */}
            <TabsContent value="general" className="px-6 py-6 space-y-6">
              <h3 className="text-lg font-semibold">Informations personnelles</h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Nom */}
                <div className="space-y-2">
                  <Label htmlFor="nom">
                    Nom <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nom"
                    {...register("nom", { required: true })}
                    placeholder="Dosso"
                    className="h-12"
                  />
                </div>

                {/* Prénom */}
                <div className="space-y-2">
                  <Label htmlFor="prenom">
                    Prénom <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="prenom"
                    {...register("prenom", { required: true })}
                    placeholder="Christ"
                    className="h-12"
                  />
                </div>

                {/* Téléphone - obligatoire pour tous */}
                <div className="space-y-2">
                  <Label htmlFor="telephone">
                    Téléphone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="telephone"
                    type="tel"
                    {...register("telephone", { required: true })}
                    placeholder="+225 07 XX XX XX XX"
                    className="h-12"
                  />
                </div>

                {/* Numéro Wave - obligatoire pour journaliers, optionnel pour permanents */}
                <div className="space-y-2">
                  <Label htmlFor="numeroWave">
                    Numéro Wave {typeMainOeuvre === "JOURNALIER" && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id="numeroWave"
                    type="tel"
                    {...register("numeroWave", { required: typeMainOeuvre === "JOURNALIER" })}
                    placeholder="+225 XX XX XX XX XX"
                    className="h-12"
                  />
                </div>

                {/* Champs supplémentaires pour PERMANENTS uniquement */}
                {typeMainOeuvre === "PERMANENT" && (
                  <>
                    {/* Email */}
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        Email professionnel
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        {...register("email")}
                        placeholder="prenom.nom@ita.ci"
                        className="h-12"
                      />
                    </div>

                    {/* Nationalité */}
                    <div className="space-y-2">
                      <Label htmlFor="nationalite">
                        Nationalité
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
                        className="h-12"
                      />
                    )}
                  />
                </div>

                {/* Sexe */}
                <div className="space-y-2">
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
                        className="h-12"
                      />
                    )}
                  />
                </div>

                {/* Date de naissance */}
                <div className="space-y-2">
                  <Label htmlFor="dateNaissance">
                    Date de naissance <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dateNaissance"
                    type="date"
                    {...register("dateNaissance")}
                    className="h-12"
                  />
                </div>

                {/* Lieu de naissance */}
                <div className="space-y-2">
                  <Label htmlFor="lieuNaissance">
                    Lieu de naissance
                  </Label>
                  <Input
                    id="lieuNaissance"
                    {...register("lieuNaissance")}
                    placeholder="Abidjan, Côte d'Ivoire"
                    className="h-12"
                  />
                </div>

                {/* Numéro CNPS */}
                <div className="space-y-2">
                  <Label htmlFor="numeroCnps">Numéro CNPS</Label>
                  <Input
                    id="numeroCnps"
                    {...register("numeroCnps")}
                    placeholder="0000000000"
                    className="h-12"
                  />
                </div>

                {/* Situation matrimoniale */}
                <div className="space-y-2">
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
                        className="h-12"
                      />
                    )}
                  />
                </div>

                    {/* Nombre d'enfants */}
                    <div className="space-y-2">
                      <Label htmlFor="nombreEnfants">Nombre d'enfants</Label>
                      <Input
                        id="nombreEnfants"
                        type="number"
                        min="0"
                        {...register("nombreEnfants", { valueAsNumber: true })}
                        placeholder="0"
                        className="h-12"
                      />
                    </div>

                    {/* Téléphone secondaire */}
                    <div className="space-y-2">
                      <Label htmlFor="telephoneSecondaire">Téléphone secondaire</Label>
                      <Input
                        id="telephoneSecondaire"
                        {...register("telephoneSecondaire")}
                        placeholder="+225 05 00 00 00 00"
                        className="h-12"
                      />
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            {/* Job Tab - Expériences */}
            {typeMainOeuvre === "PERMANENT" && (
            <TabsContent value="job" className="px-6 py-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Expériences professionnelles</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Postes occupés avant l'arrivée chez ITA SARL
                </p>
              </div>

              {experiencesFields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Aucune expérience ajoutée</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
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
                <div className="space-y-4">
                  {experiencesFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="bg-card border border-border rounded-lg p-5 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-base text-primary">Poste {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeExperience(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Entreprise <span className="text-destructive">*</span></Label>
                          <Input
                            {...register(`experiences.${index}.entreprise`)}
                            placeholder="SOGEPARC, CIPREL..."
                            className="h-12"
                          />
                        </div>
                        <div>
                          <Label>Poste <span className="text-destructive">*</span></Label>
                          <Input
                            {...register(`experiences.${index}.poste`)}
                            placeholder="Chef de chantier, conducteur..."
                            className="h-12"
                          />
                        </div>
                        <div>
                          <Label>Du <span className="text-destructive">*</span></Label>
                          <Input
                            type="date"
                            {...register(`experiences.${index}.dateDebut`)}
                            className="h-12"
                          />
                        </div>
                        <div>
                          <Label>Au</Label>
                          <Input
                            type="date"
                            {...register(`experiences.${index}.dateFin`)}
                            className="h-12"
                          />
                        </div>
                        <div className="col-span-2">
                          <Label>Missions principales</Label>
                          <Input
                            {...register(`experiences.${index}.description`)}
                            placeholder="Principales responsabilités..."
                            className="h-12"
                          />
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
                    className="w-full h-12"
                  >
                    <Plus className="size-4 mr-2" />
                    Ajouter une autre expérience
                  </Button>
                </div>
              )}
            </TabsContent>
            )}

            {/* Payroll Tab - Contrat & Affectation */}
            <TabsContent value="payroll" className="px-6 py-6 space-y-6">
              <h3 className="text-lg font-semibold">Contrat & Affectation</h3>

              <div className="space-y-6">
                {/* Matricule et référence */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Matricule ITA</Label>
                    <div className="relative">
                      <Input
                        {...register("matricule")}
                        placeholder="ITA-2026-AUTO"
                        disabled={matriculeLocked}
                        className={`h-12 pr-10 ${matriculeLocked ? "bg-gray-50" : ""}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setMatriculeLocked(!matriculeLocked)}
                        className="absolute right-0 top-0 h-12 w-10 text-muted-foreground hover:text-primary"
                      >
                        {matriculeLocked ? (
                          <Lock className="size-4" />
                        ) : (
                          <Unlock className="size-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {matriculeLocked ? "Généré automatiquement" : "Saisie manuelle activée"}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="referenceInterne">Référence interne</Label>
                    <Input
                      id="referenceInterne"
                      {...register("referenceInterne")}
                      placeholder="Ex : DP-052, DG-001"
                      className="h-12"
                    />
                  </div>
                </div>

                {/* Affectation */}
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-semibold">Affectation</h4>

                  <div>
                    <Label>
                      Direction <span className="text-destructive">*</span>
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
                          placeholder="Sélectionner"
                          className="h-12"
                        />
                      )}
                    />
                  </div>

                  {/* Mission (Projet/Chantier) */}
                  <div>
                    <Label>
                      Mission (Projet/Chantier)
                    </Label>
                    <Controller
                      name="projetId"
                      control={control}
                      render={({ field }) => (
                        <Combobox
                          options={projetOptions}
                          value={field.value}
                          onChange={(value) => {
                            field.onChange(value);
                            setValue("tacheId", "");
                          }}
                          placeholder="Sélectionner un projet..."
                          searchPlaceholder="Rechercher un projet..."
                          emptyText="Aucun projet actif"
                          className="h-12"
                        />
                      )}
                    />
                  </div>

                  {/* Tâche (conditionnelle sur projet) */}
                  {projetId && (
                    <div>
                      <Label>Tâche</Label>
                      <Controller
                        name="tacheId"
                        control={control}
                        render={({ field }) => (
                          <Combobox
                            options={tacheOptions}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Sélectionner une tâche..."
                            searchPlaceholder="Rechercher une tâche..."
                            emptyText="Aucune tâche dans ce projet"
                            allowCreate
                            onCreateNew={async (libelle) => {
                              const nouvelleTache = await creerTacheInline(projetId, libelle);
                              setTaches([...taches, nouvelleTache]);
                              setValue("tacheId", nouvelleTache.id);
                            }}
                            createLabel="Créer la tâche"
                            className="h-12"
                          />
                        )}
                      />
                    </div>
                  )}

                  {/* Service et Poste pour PERMANENTS uniquement */}
                  {typeMainOeuvre === "PERMANENT" && (
                    <>
                      <div>
                        <Label>Service</Label>
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
                              placeholder="Sélectionner"
                              disabled={!directionId}
                              className="h-12"
                            />
                          )}
                        />
                      </div>

                      <div>
                        <Label>
                          Poste {typeMainOeuvre === "PERMANENT" && <span className="text-destructive">*</span>}
                        </Label>
                        <Controller
                          name="posteId"
                          control={control}
                          rules={{ required: typeMainOeuvre === "PERMANENT" }}
                          render={({ field }) => (
                            <Combobox
                              options={posteOptions}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Sélectionner"
                              disabled={!directionId}
                              className="h-12"
                            />
                          )}
                        />
                      </div>

                      <div>
                        <Label>Supérieur hiérarchique</Label>
                        <Controller
                          name="superieurId"
                          control={control}
                          render={({ field }) => (
                            <Combobox
                              options={employeOptions}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Sélectionner"
                              searchPlaceholder="Rechercher un employé..."
                              emptyText="Aucun employé trouvé"
                              className="h-12"
                            />
                          )}
                        />
                      </div>
                    </>
                  )}
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
                        className="h-12"
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
                    <Input
                      type="date"
                      {...register("dateEmbauche", { required: true })}
                      className="h-12"
                    />
                  </div>

                  {(typeContrat === "CDD" || typeContrat === "STAGE") && (
                    <div>
                      <Label>Date de fin</Label>
                      <Input type="date" {...register("dateFin")} className="h-12" />
                    </div>
                  )}

                  {typeMainOeuvre === "PERMANENT" && (
                    <div className="col-span-2">
                      <Label>
                        Salaire mensuel brut <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="number"
                        {...register("salaire", { required: typeMainOeuvre === "PERMANENT", valueAsNumber: true })}
                        placeholder="0"
                        className="h-12"
                      />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="px-6 py-6">
              <p className="text-sm text-muted-foreground">
                Les documents seront uploadés après la création du profil dans l'onglet "Documents".
              </p>
            </TabsContent>

            {/* Setting Tab - Compétences & Formations */}
            {typeMainOeuvre === "PERMANENT" && (
            <TabsContent value="setting" className="px-6 py-6 space-y-8">
              {/* Compétences */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Compétences</h3>

                {competencesFields.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Aucune compétence enregistrée</p>
                    <Button
                      type="button"
                      onClick={() => appendCompetence({ libelle: "" })}
                      variant="outline"
                    >
                      <Plus className="size-4 mr-2" />
                      Ajouter une compétence
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
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
                          <Trash2 className="size-4 text-destructive" />
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
                  </div>
                )}
              </div>

              {/* Formations */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold">Formations</h3>

                {formationsFields.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Aucune formation enregistrée</p>
                    <Button
                      type="button"
                      onClick={() =>
                        appendFormation({
                          etablissement: "",
                          diplome: "",
                          annee: "",
                        })
                      }
                      variant="outline"
                    >
                      <Plus className="size-4 mr-2" />
                      Ajouter une formation
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
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
                            <Trash2 className="size-4 text-destructive" />
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
                  </div>
                )}
              </div>
            </TabsContent>
            )}
          </Tabs>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t bg-muted/20">
            {/* Indicateur de sauvegarde */}
            <div className="text-xs text-muted-foreground">
              {derniereSauvegarde && (
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-success animate-pulse" />
                  Brouillon sauvegardé à {derniereSauvegarde.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-11 px-6"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="h-11 px-6 bg-primary hover:bg-primary-hover"
                disabled={isPending}
              >
                {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                Créer l'employé
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
