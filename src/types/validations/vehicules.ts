import { z } from "zod";

export const creerVehiculeSchema = z.object({
  immatriculation: z.string().min(1, "L'immatriculation est requise").max(30, "Trop long"),
  type: z.enum(["LEGER", "LOURD", "ENGIN"]),
  quotaMensuelLitres: z.number().min(0, "Quota invalide"),
  numeroInterne: z.string().max(255, "Trop long").optional(),
  marque: z.string().max(255, "Trop long").optional(),
  modele: z.string().max(255, "Trop long").optional(),
  annee: z.number().optional(),
  dateEntree: z.string().optional(),
  modeAcquisition: z.string().max(255, "Trop long").optional(),
});
export type CreerVehiculeInput = z.infer<typeof creerVehiculeSchema>;

export const enregistrerChangementEtatSchema = z.object({
  vehiculeId: z.string().min(1),
  etat: z.enum(["OK", "PANNE", "HORS_SERVICE"]),
  commentaire: z.string().max(1000, "Trop long").optional(),
});
export type EnregistrerChangementEtatInput = z.infer<typeof enregistrerChangementEtatSchema>;

export const enregistrerChangementAffectationSchema = z.object({
  vehiculeId: z.string().min(1),
  chauffeurActuelId: z.string().optional(),
  chantierActuel: z.string().max(255, "Trop long").optional(),
  commentaire: z.string().max(1000, "Trop long").optional(),
});
export type EnregistrerChangementAffectationInput = z.infer<typeof enregistrerChangementAffectationSchema>;

export const enregistrerVerificationInventaireSchema = z.object({
  vehiculeId: z.string().min(1),
  etatConstate: z.enum(["OK", "PANNE", "HORS_SERVICE"]),
});
export type EnregistrerVerificationInventaireInput = z.infer<typeof enregistrerVerificationInventaireSchema>;

export const enregistrerSortieDefinitiveSchema = z.object({
  vehiculeId: z.string().min(1),
  motifSortieDefinitive: z.string().min(1, "Le motif est requis").max(1000, "Motif trop long"),
  valeurResiduelle: z.number().min(0, "Valeur invalide").optional(),
});
export type EnregistrerSortieDefinitiveInput = z.infer<typeof enregistrerSortieDefinitiveSchema>;

export const ajouterPieceAdministrativeSchema = z.object({
  vehiculeId: z.string().min(1),
  typePieceId: z.string().min(1, "Le type de pièce est requis"),
  dateEmission: z.string().optional(),
  dateExpiration: z.string().optional(),
});
export type AjouterPieceAdministrativeInput = z.infer<typeof ajouterPieceAdministrativeSchema>;

export const creerDemandeTransportSchema = z.object({
  serviceChantier: z.string().min(1, "Le service/chantier est requis").max(255, "Trop long"),
  cia: z.string().min(1, "Le centre d'imputation analytique est requis").max(255, "Trop long"),
  nature: z.enum(["TRANSPORT_TRANSFERT", "MISE_A_DISPOSITION"]),
  description: z.string().min(1, "La description est requise").max(5000, "Description trop longue"),
  dateDebut: z.string().min(1, "La date de début est requise"),
  dateFin: z.string().min(1, "La date de fin est requise"),
});
export type CreerDemandeTransportInput = z.infer<typeof creerDemandeTransportSchema>;

export const viserLogistiqueEtAffecterSchema = z.object({
  demandeId: z.string().min(1),
  vehiculeId: z.string().min(1, "Le véhicule est requis"),
});
export type ViserLogistiqueEtAffecterInput = z.infer<typeof viserLogistiqueEtAffecterSchema>;

export const checklistReponseSchema = z.object({
  itemId: z.string().min(1),
  present: z.boolean(),
});

export const enregistrerDepartSchema = z.object({
  demandeId: z.string().min(1),
  conducteurDepartNom: z.string().min(1, "Le conducteur est requis").max(255, "Trop long"),
  compteurDepart: z.number().min(0, "Compteur invalide"),
  reponses: z.array(checklistReponseSchema),
});
export type EnregistrerDepartInput = z.infer<typeof enregistrerDepartSchema>;

export const enregistrerRetourSchema = z.object({
  demandeId: z.string().min(1),
  conducteurRetourNom: z.string().min(1, "Le conducteur est requis").max(255, "Trop long"),
  compteurRetour: z.number().min(0, "Compteur invalide"),
  referenceEngin: z.string().max(255, "Trop long").optional(),
  reponses: z.array(checklistReponseSchema),
});
export type EnregistrerRetourInput = z.infer<typeof enregistrerRetourSchema>;

export const refuserDemandeTransportSchema = z.object({
  demandeId: z.string().min(1),
  motif: z.string().min(1, "Le motif est requis").max(1000, "Motif trop long"),
});

export const reponsePointSchema = z.object({
  pointId: z.string().min(1),
  etat: z.enum(["BON", "MAUVAIS", "ABSENT"]),
  observation: z.string().max(1000, "Trop long").optional(),
});
export const reponseDocumentSchema = z.object({
  documentId: z.string().min(1),
  etat: z.enum(["BON", "MAUVAIS", "ABSENT"]),
  observation: z.string().max(1000, "Trop long").optional(),
});

export const creerInspectionVehiculeSchema = z.object({
  vehiculeId: z.string().min(1, "Le véhicule est requis"),
  demandeTransportId: z.string().optional(),
  date: z.string().min(1, "La date est requise"),
  heure: z.string().optional(),
  chantierSiteLieu: z.string().min(1, "Le chantier/site est requis").max(255, "Trop long"),
  kilometrage: z.number().min(0, "Kilométrage invalide"),
  destination: z.string().min(1, "La destination est requise").max(255, "Trop long"),
  conducteurNom: z.string().min(1, "Le conducteur est requis").max(255, "Trop long"),
  transporteurNom: z.string().max(255, "Trop long").optional(),
  niveauCarburant: z.number().min(0).max(100),
  chefChantierId: z.string().optional(),
  remorqueurNom: z.string().max(255, "Trop long").optional(),
  points: z.array(reponsePointSchema).min(1, "Au moins un point est requis"),
  documents: z.array(reponseDocumentSchema).min(1, "Au moins un document est requis"),
});
export type CreerInspectionVehiculeInput = z.infer<typeof creerInspectionVehiculeSchema>;

export const creerInspectionEnginSchema = z.object({
  vehiculeId: z.string().min(1, "L'engin est requis"),
  demandeTransportId: z.string().optional(),
  date: z.string().min(1, "La date est requise"),
  heure: z.string().optional(),
  chantierSite: z.string().min(1, "Le chantier/site est requis").max(255, "Trop long"),
  provenance: z.string().min(1, "La provenance est requise").max(255, "Trop long"),
  conducteurNom: z.string().max(255, "Trop long").optional(),
  transporteurNom: z.string().max(255, "Trop long").optional(),
  chefChantierOuGarageId: z.string().optional(),
  transporteurEnginNom: z.string().max(255, "Trop long").optional(),
  points: z.array(reponsePointSchema).min(1, "Au moins un point est requis"),
  documents: z.array(reponseDocumentSchema).min(1, "Au moins un document est requis"),
});
export type CreerInspectionEnginInput = z.infer<typeof creerInspectionEnginSchema>;

export const ligneBonSortieTransfertSchema = z.object({
  materielId: z.string().min(1, "L'article est requis"),
  quantite: z.number().positive("Quantité invalide"),
  etat: z.string().max(255, "Trop long").optional(),
  observation: z.string().max(1000, "Trop long").optional(),
});

export const creerBonSortieTransfertSchema = z.object({
  lieuSortie: z.string().min(1, "Le lieu de sortie est requis").max(255, "Trop long"),
  motif: z.string().min(1, "Le motif est requis").max(1000, "Motif trop long"),
  destination: z.string().min(1, "La destination est requise").max(255, "Trop long"),
  receptionnaireNom: z.string().min(1, "Le nom du réceptionnaire est requis").max(255, "Trop long"),
  receptionnaireContact: z
    .string()
    .min(1, "Le contact du réceptionnaire est requis")
    .max(255, "Trop long"),
  cia: z.string().max(255, "Trop long").optional(),
  demandeTransportId: z.string().optional(),
  lignes: z.array(ligneBonSortieTransfertSchema).min(1, "Au moins une ligne est requise"),
});
export type CreerBonSortieTransfertInput = z.infer<typeof creerBonSortieTransfertSchema>;
