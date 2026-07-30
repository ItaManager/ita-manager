"use client";

import { useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, User, Briefcase, FileText } from "lucide-react";
import { obtenirEmploye, modifierEmploye } from "@/lib/actions/employes";
import { toastSucces, toastErreur } from "@/lib/utils/toast";
import type { TypeMainOeuvre } from "@prisma/client";

interface ModaleModificationEmployeProps {
  employeId: string;
  typeMainOeuvre: TypeMainOeuvre;
  ouvert: boolean;
  onOuvertChange: (ouvert: boolean) => void;
}

interface FormData {
  // Identité
  nom: string;
  prenom: string;
  sexe?: "MASCULIN" | "FEMININ";
  dateNaissance?: string;
  lieuNaissance?: string;
  situationMatrimoniale?: string;
  nombreEnfants?: number;

  // Contact
  telephone: string;
  telephoneSecondaire?: string;
  email?: string;
  adresse?: string;
  urgenceNom?: string;
  urgenceTel?: string;

  // Données sensibles (PERMANENT uniquement)
  numeroCnps?: string;
  numeroWave?: string;
  rib?: string;
}

export function ModaleModificationEmploye({
  employeId,
  typeMainOeuvre,
  ouvert,
  onOuvertChange,
}: ModaleModificationEmployeProps) {
  const [isPending, startTransition] = useTransition();
  const [chargement, setChargement] = useState(true);

  const form = useForm<FormData>();
  const { register, handleSubmit, reset, formState: { errors } } = form;

  // Charger les données de l'employé à l'ouverture
  useEffect(() => {
    if (ouvert) {
      setChargement(true);
      startTransition(async () => {
        try {
          const employe = await obtenirEmploye(employeId);
          if (employe) {
            reset({
              nom: employe.nom,
              prenom: employe.prenom,
              sexe: employe.sexe as "MASCULIN" | "FEMININ" | undefined,
              dateNaissance: employe.dateNaissance
                ? new Date(employe.dateNaissance).toISOString().split("T")[0]
                : undefined,
              lieuNaissance: employe.lieuNaissance ?? undefined,
              situationMatrimoniale: employe.situationMatrimoniale ?? undefined,
              nombreEnfants: employe.nombreEnfants ?? undefined,
              telephone: employe.telephone,
              telephoneSecondaire: employe.telephoneSecondaire ?? undefined,
              email: employe.email ?? undefined,
              adresse: employe.adresse ?? undefined,
              urgenceNom: employe.urgenceNom ?? undefined,
              urgenceTel: employe.urgenceTel ?? undefined,
              numeroCnps: employe.numeroCnps ?? undefined,
              numeroWave: employe.numeroWave ?? undefined,
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

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      try {
        await modifierEmploye(employeId, {
          ...data,
          dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : undefined,
          situationMatrimoniale: data.situationMatrimoniale as "CELIBATAIRE" | "MARIE" | "DIVORCE" | "VEUF" | undefined,
        });

        toastSucces("Modification enregistrée", "Le profil employé a été mis à jour.");
        onOuvertChange(false);

        // Recharger la page pour afficher les nouvelles données
        window.location.reload();
      } catch (error: any) {
        toastErreur("Échec de la modification", error.message);
      }
    });
  };

  const estPermanent = typeMainOeuvre === "PERMANENT";

  return (
    <Dialog open={ouvert} onOpenChange={onOuvertChange}>
      <DialogContent className="sm:!max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le profil employé</DialogTitle>
        </DialogHeader>

        {chargement ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Tabs defaultValue="identite" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="identite">
                  <User className="size-4 mr-2" />
                  Identité
                </TabsTrigger>
                <TabsTrigger value="contact">
                  <Briefcase className="size-4 mr-2" />
                  Contact
                </TabsTrigger>
                {estPermanent && (
                  <TabsTrigger value="admin">
                    <FileText className="size-4 mr-2" />
                    Administratif
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Onglet Identité */}
              <TabsContent value="identite" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nom">
                      Nom <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="nom"
                      {...register("nom", { required: true })}
                      className="rounded-md h-10"
                    />
                    {errors.nom && (
                      <p className="text-xs text-destructive mt-1">Ce champ est obligatoire</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="prenom">
                      Prénom <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="prenom"
                      {...register("prenom", { required: true })}
                      className="rounded-md h-10"
                    />
                    {errors.prenom && (
                      <p className="text-xs text-destructive mt-1">Ce champ est obligatoire</p>
                    )}
                  </div>

                  {estPermanent && (
                    <>
                      <div>
                        <Label htmlFor="sexe">Sexe</Label>
                        <Select {...register("sexe")}>
                          <SelectTrigger className="rounded-md h-10">
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MASCULIN">Masculin</SelectItem>
                            <SelectItem value="FEMININ">Féminin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="dateNaissance">Date de naissance</Label>
                        <Input
                          id="dateNaissance"
                          type="date"
                          {...register("dateNaissance")}
                          className="rounded-md h-10"
                        />
                      </div>

                      <div>
                        <Label htmlFor="lieuNaissance">Lieu de naissance</Label>
                        <Input
                          id="lieuNaissance"
                          {...register("lieuNaissance")}
                          className="rounded-md h-10"
                        />
                      </div>

                      <div>
                        <Label htmlFor="situationMatrimoniale">Situation matrimoniale</Label>
                        <Select {...register("situationMatrimoniale")}>
                          <SelectTrigger className="rounded-md h-10">
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CELIBATAIRE">Célibataire</SelectItem>
                            <SelectItem value="MARIE">Marié(e)</SelectItem>
                            <SelectItem value="DIVORCE">Divorcé(e)</SelectItem>
                            <SelectItem value="VEUF">Veuf/Veuve</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="nombreEnfants">Nombre d'enfants</Label>
                        <Input
                          id="nombreEnfants"
                          type="number"
                          min={0}
                          {...register("nombreEnfants", { valueAsNumber: true })}
                          className="rounded-md h-10"
                        />
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>

              {/* Onglet Contact */}
              <TabsContent value="contact" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="telephone">
                      Téléphone <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="telephone"
                      type="tel"
                      {...register("telephone", { required: true })}
                      className="rounded-md h-10"
                    />
                    {errors.telephone && (
                      <p className="text-xs text-destructive mt-1">Ce champ est obligatoire</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="telephoneSecondaire">Téléphone secondaire</Label>
                    <Input
                      id="telephoneSecondaire"
                      type="tel"
                      {...register("telephoneSecondaire")}
                      className="rounded-md h-10"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      className="rounded-md h-10"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="adresse">Adresse</Label>
                    <Input
                      id="adresse"
                      {...register("adresse")}
                      className="rounded-md h-10"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Donnée sensible — accès restreint
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="urgenceNom">Contact d'urgence (nom)</Label>
                    <Input
                      id="urgenceNom"
                      {...register("urgenceNom")}
                      className="rounded-md h-10"
                    />
                  </div>

                  <div>
                    <Label htmlFor="urgenceTel">Contact d'urgence (téléphone)</Label>
                    <Input
                      id="urgenceTel"
                      type="tel"
                      {...register("urgenceTel")}
                      className="rounded-md h-10"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Onglet Administratif (PERMANENT uniquement) */}
              {estPermanent && (
                <TabsContent value="admin" className="space-y-4 mt-4">
                  <div className="rounded-lg border border-warning-border bg-warning-soft p-4 mb-4">
                    <p className="text-sm text-warning font-medium">
                      Données sensibles — Accès limité aux rôles DRH, DFC, DG
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="numeroCnps">Numéro CNPS</Label>
                      <Input
                        id="numeroCnps"
                        {...register("numeroCnps")}
                        className="rounded-md h-10 font-mono"
                      />
                    </div>

                    <div>
                      <Label htmlFor="numeroWave">Numéro Wave</Label>
                      <Input
                        id="numeroWave"
                        {...register("numeroWave")}
                        className="rounded-md h-10 font-mono"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Distinct du téléphone de contact
                      </p>
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor="rib">RIB</Label>
                      <Input
                        id="rib"
                        {...register("rib")}
                        className="rounded-md h-10 font-mono"
                      />
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>

            {/* Pied de modale */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOuvertChange(false)}
                disabled={isPending}
              >
                Annuler
              </Button>

              <Button type="submit" disabled={isPending} className="gap-2">
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
