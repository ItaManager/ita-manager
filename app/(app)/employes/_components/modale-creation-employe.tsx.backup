"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { creerEmploye } from "@/lib/actions/employes";
import {
  toastSucces,
  toastErreur,
  toastAvertissement,
  TOAST_MESSAGES,
} from "@/lib/utils/toast";
import { Loader2, ChevronLeft, ChevronRight, Save, AlertCircle } from "lucide-react";
import type { TypeMainOeuvre } from "@prisma/client";

interface ModaleCreationEmployeProps {
  ouvert: boolean;
  onFermer: () => void;
  postes: Array<{ id: string; libelle: string; code: string }>;
  nationalites: Array<{ id: string; libelle: string }>;
}

interface FormData {
  typeMainOeuvre: TypeMainOeuvre;
  // Étape 1 : Informations personnelles
  nom: string;
  prenom: string;
  sexe?: "MASCULIN" | "FEMININ";
  dateNaissance?: string;
  lieuNaissance?: string;
  nationaliteId?: string;
  situationMatrimoniale?: "CELIBATAIRE" | "MARIE" | "DIVORCE" | "VEUF";
  nombreEnfants?: number;
  numeroCnps?: string;
  // Contact
  telephone: string;
  telephoneSecondaire?: string;
  email?: string;
  adresse?: string;
  urgenceNom?: string;
  urgenceTel?: string;
  // Paiement
  numeroWave?: string;
  modePaiement?: "VIREMENT" | "WAVE";
  rib?: string;
  // Étape 4 : Affectation
  posteId: string;
  dateDebutAffectation: string;
  // Contrat
  typeContrat: "CDI" | "CDD" | "INTERIM" | "STAGE";
  dateEmbauche: string;
  dateFin?: string;
  salaire: number;
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

export function ModaleCreationEmploye({
  ouvert,
  onFermer,
  postes,
  nationalites,
}: ModaleCreationEmployeProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [etapeActuelle, setEtapeActuelle] = useState(1);
  const [typeMainOeuvre, setTypeMainOeuvre] = useState<TypeMainOeuvre>("PERMANENT");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      typeMainOeuvre: "PERMANENT",
      typeContrat: "CDI",
    },
  });

  const typeContrat = watch("typeContrat");
  const estPermanent = typeMainOeuvre === "PERMANENT";

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
    try {
      startTransition(async () => {
        const result = await creerEmploye({
          ...data,
          dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : undefined,
          dateDebutAffectation: new Date(data.dateDebutAffectation),
          dateEmbauche: new Date(data.dateEmbauche),
          dateFin: data.dateFin ? new Date(data.dateFin) : undefined,
          nombreEnfants: data.nombreEnfants ? Number(data.nombreEnfants) : undefined,
          salaire: Number(data.salaire),
        });

        if (result.success) {
          toastSucces(
            TOAST_MESSAGES.CREATION_REUSSIE("Employé"),
            `Matricule : ${result.matricule}`
          );
          reset();
          setEtapeActuelle(1);
          onFermer();
          router.refresh();
        }
      });
    } catch (error: any) {
      toastErreur(
        error.message || "Erreur lors de la création de l'employé",
        "Vérifiez les informations saisies"
      );
    }
  };

  const progressPourcentage = (etapeActuelle / ETAPES.length) * 100;

  return (
    <Dialog open={ouvert} onOpenChange={onFermer}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Création d'un nouveau compte</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Étape {etapeActuelle} sur {ETAPES.length} — {ETAPES[etapeActuelle - 1].titre}
          </p>
        </DialogHeader>

        {/* Barre de progression */}
        <div className="w-full bg-muted rounded-full h-2 mb-6">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPourcentage}%` }}
          />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* ÉTAPE 1 : Informations personnelles */}
          {etapeActuelle === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    {...register("nom", { required: "Le nom est obligatoire" })}
                    placeholder="DOSSO"
                  />
                  {errors.nom && (
                    <p className="text-xs text-red-600">{errors.nom.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom *</Label>
                  <Input
                    id="prenom"
                    {...register("prenom", { required: "Le prénom est obligatoire" })}
                    placeholder="Christ"
                  />
                  {errors.prenom && (
                    <p className="text-xs text-red-600">{errors.prenom.message}</p>
                  )}
                </div>
              </div>

              {estPermanent && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email professionnel *</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register("email")}
                        placeholder="prenom.nom@ita.ci"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nationaliteId">Nationalité *</Label>
                      <Select onValueChange={(value) => setValue("nationaliteId", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Ivoirienne" />
                        </SelectTrigger>
                        <SelectContent>
                          {nationalites.map((nat) => (
                            <SelectItem key={nat.id} value={nat.id}>
                              {nat.libelle}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sexe">Sexe</Label>
                      <Select onValueChange={(value: any) => setValue("sexe", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MASCULIN">Masculin</SelectItem>
                          <SelectItem value="FEMININ">Féminin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateNaissance">Date de naissance *</Label>
                      <Input id="dateNaissance" type="date" {...register("dateNaissance")} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lieuNaissance">Lieu de naissance *</Label>
                      <Input
                        id="lieuNaissance"
                        {...register("lieuNaissance")}
                        placeholder="Abidjan, Côte d'Ivoire"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="numeroCnps">Numéro CNPS</Label>
                      <Input
                        id="numeroCnps"
                        {...register("numeroCnps")}
                        placeholder="0000000000"
                      />
                      <p className="text-xs text-muted-foreground">
                        Si l'employé en possède déjà un
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="situationMatrimoniale">Situation matrimoniale *</Label>
                      <Select
                        onValueChange={(value: any) =>
                          setValue("situationMatrimoniale", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CELIBATAIRE">Célibataire</SelectItem>
                          <SelectItem value="MARIE">Marié(e)</SelectItem>
                          <SelectItem value="DIVORCE">Divorcé(e)</SelectItem>
                          <SelectItem value="VEUF">Veuf(ve)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nombreEnfants">Nombre d'enfants *</Label>
                      <Input
                        id="nombreEnfants"
                        type="number"
                        {...register("nombreEnfants")}
                        placeholder="0"
                      />
                      <p className="text-xs text-muted-foreground">
                        Utilisé pour le calcul des parts fiscales
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telephone">Téléphone principal *</Label>
                      <Input
                        id="telephone"
                        {...register("telephone", {
                          required: "Le téléphone est obligatoire",
                        })}
                        placeholder="+225 07 00 00 00 00"
                      />
                      {errors.telephone && (
                        <p className="text-xs text-red-600">{errors.telephone.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="telephoneSecondaire">Téléphone secondaire</Label>
                      <Input
                        id="telephoneSecondaire"
                        {...register("telephoneSecondaire")}
                        placeholder="+225 05 00 00 00 00"
                      />
                    </div>
                  </div>
                </>
              )}

              {!estPermanent && (
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone de contact *</Label>
                  <Input
                    id="telephone"
                    {...register("telephone", {
                      required: "Le téléphone est obligatoire",
                    })}
                    placeholder="066666666666"
                  />
                  <p className="text-xs text-muted-foreground">
                    Pour le joindre. Distinct du numéro de paiement.
                  </p>
                  {errors.telephone && (
                    <p className="text-xs text-red-600">{errors.telephone.message}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ÉTAPE 2 : Expériences */}
          {etapeActuelle === 2 && (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Aucune expérience enregistrée
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                Ajoutez les postes occupés avant l'arrivée chez ITA.
              </p>
              <Button type="button" variant="outline" size="sm">
                + Ajouter une expérience
              </Button>
            </div>
          )}

          {/* ÉTAPE 3 : Compétences */}
          {etapeActuelle === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Compétences</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner des compétences..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="communication">Communication</SelectItem>
                    <SelectItem value="leadership">Leadership</SelectItem>
                    <SelectItem value="technique">Compétences techniques</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Tapez pour rechercher. Si la compétence n'existe pas, créez-la depuis la
                  liste.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-800">
                <p>
                  Essayez « coudure » : la compétence n'existe pas encore, l'option de
                  création apparaît en bas de liste. Elle rejoint immédiatement le référentiel
                  visible dans Talents › Compétences.
                </p>
              </div>
            </div>
          )}

          {/* ÉTAPE 4 : Contrat & Affectation */}
          {etapeActuelle === 4 && (
            <div className="space-y-6">
              {/* Matricule ITA */}
              <div className="space-y-2">
                <Label>Matricule ITA</Label>
                <Input disabled placeholder="ITA-2026-0799" className="font-mono" />
                <p className="text-xs text-muted-foreground">
                  Généré automatiquement selon le format ITA-AAAA-NNNN.
                </p>
              </div>

              {/* Affectation */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="text-green-600">✓</span> Affectation
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="direction">1. Direction *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Direction Financière et Comptable" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dfc">Direction Financière et Comptable</SelectItem>
                      <SelectItem value="dt">Direction Technique</SelectItem>
                      <SelectItem value="dg">Direction Générale</SelectItem>
                      <SelectItem value="dar">
                        Direction Administrative et RH
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service">2. Service *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Comptabilité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compta">Comptabilité</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="posteId">3. Poste *</Label>
                  <Select
                    onValueChange={(value) => setValue("posteId", value)}
                    {...register("posteId", { required: "Le poste est obligatoire" })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir" />
                    </SelectTrigger>
                    <SelectContent>
                      {postes.map((poste) => (
                        <SelectItem key={poste.id} value={poste.id}>
                          {poste.libelle} ({poste.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.posteId && (
                    <p className="text-xs text-red-600">{errors.posteId.message}</p>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-2 text-xs text-blue-800">
                  Direction Financière et Comptable › Comptabilité
                </div>

                <div className="space-y-2">
                  <Label htmlFor="superieur">Supérieur hiérarchique</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Rechercher un supérieur..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="typeContrat">Type de contrat *</Label>
                  <Select
                    defaultValue="CDI"
                    onValueChange={(value: any) => setValue("typeContrat", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CDI">CDI</SelectItem>
                      <SelectItem value="CDD">CDD</SelectItem>
                      <SelectItem value="INTERIM">Intérim</SelectItem>
                      <SelectItem value="STAGE">Stage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* ÉTAPE 5 : Formations */}
          {etapeActuelle === 5 && (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Aucune formation enregistrée
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                Diplômes, habilitations et certifications obtenues.
              </p>
              <Button type="button" variant="outline" size="sm">
                + Ajouter une formation
              </Button>
            </div>
          )}

          {/* ÉTAPE 6 : Documents */}
          {etapeActuelle === 6 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Pièces attendues</h3>

              {estPermanent ? (
                <>
                  <DocumentUploadZone label="Certificat de naissance *" format="PDF, DOC, PNG ou JPG" />
                  <DocumentUploadZone label="CNI / Passeport *" format="PDF, DOC, PNG ou JPG" />
                  <DocumentUploadZone label="CV actualisé" format="PDF, DOC, PNG ou JPG" />
                  <DocumentUploadZone label="Diplômes" format="PDF, DOC, PNG ou JPG" />
                  <DocumentUploadZone label="Certificat médical" format="PDF, DOC, PNG ou JPG" />
                  <DocumentUploadZone label="Permis de conduire" format="PDF, DOC, PNG ou JPG" />
                  <DocumentUploadZone label="Contrat signé" format="PDF, DOC, PNG ou JPG" />

                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Autres documents</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Tous pièces hors base : attestation de travail, visa médical d'embauche,
                      habilitation spécifique, autorisation parentale, carte professionnelle,
                      Numéros de document, suis disposés etc.
                    </p>
                    <div className="space-y-2">
                      <Label>Intitulé du document</Label>
                      <div className="flex gap-2">
                        <Input placeholder="Ex : Attestation de non-condamnation" />
                        <Button type="button" variant="outline" size="sm">
                          + Ajouter
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Aucun document supplémentaire
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <DocumentUploadZone
                    label="Pièce d'identité *"
                    format="JPG, PNG, PDF - 10 Mo max"
                    help="Photo ou scan de la pièce"
                  />

                  <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex gap-2 text-sm">
                    <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-900">
                        Un journalier n'a aucun compteur de congés
                      </p>
                      <p className="text-xs text-amber-800 mt-1">
                        Un jour non pointé est un jour non payé — décision A-13.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ÉTAPE 7 : Révision (Aperçu) */}
          {etapeActuelle === 7 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center py-8">
                Vérifiez les informations avant de créer le profil.
              </p>
              {/* TODO: Afficher récapitulatif des données */}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={etapePrecedente}
              disabled={etapeActuelle === 1 || isPending}
            >
              <ChevronLeft className="size-4 mr-2" />
              Précédent
            </Button>

            <div className="flex gap-2">
              <Button type="button" variant="ghost" disabled={isPending}>
                <Save className="size-4 mr-2" />
                Enregistrer le brouillon
              </Button>

              {etapeActuelle < ETAPES.length ? (
                <Button
                  type="button"
                  onClick={etapeSuivante}
                  disabled={isPending}
                  className="bg-[#3730a3] hover:bg-[#312e81]"
                >
                  Suivant
                  <ChevronRight className="size-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Créer le profil
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DocumentUploadZone({ label, format, help }: { label: string; format: string; help?: string }) {
  return (
    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
          <svg
            className="w-6 h-6 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <div>
          <p className="font-medium text-sm">{label}</p>
          {help && <p className="text-xs text-muted-foreground">{help}</p>}
          <p className="text-xs text-muted-foreground mt-1">{format}</p>
        </div>
      </div>
    </div>
  );
}
