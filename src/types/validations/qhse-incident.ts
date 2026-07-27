import { z } from "zod";
import { chantierRefineur } from "@/types/validations/qhse";

export const reponsePointHSESchema = z.object({
  pointId: z.string().min(1),
  reponse: z.enum(["OUI", "NON"]),
  observation: z.string().max(1000, "Trop long").optional(),
});

export const creerInspectionHSESchema = z
  .object({
    projetId: z.string().optional(),
    chantierLibre: z.string().max(255, "Trop long").optional(),
    projetOuvrageLibre: z.string().max(255, "Trop long").optional(),
    lieu: z.string().max(255, "Trop long").optional(),
    date: z.string().min(1, "La date est requise"),
    heure: z.string().optional(),
    reponsesPoints: z.array(reponsePointHSESchema).min(1, "Les 26 points doivent être renseignés"),
    commentaires: z.string().max(2000, "Trop long").optional(),
    relaisQHSEId: z.string().optional(),
    chefChantierId: z.string().optional(),
  })
  .superRefine(chantierRefineur);
export type CreerInspectionHSEInput = z.infer<typeof creerInspectionHSESchema>;

export const seanceSensibilisationSchema = z.object({
  date: z.string().min(1, "La date est requise"),
  theme: z.string().min(1, "Le thème est requis").max(255, "Trop long"),
  animateur: z.string().min(1, "L'animateur est requis").max(255, "Trop long"),
  commentaire: z.string().max(1000, "Trop long").optional(),
});

export const creerProgrammeSensibilisationSchema = z
  .object({
    projetId: z.string().optional(),
    chantierLibre: z.string().max(255, "Trop long").optional(),
    periodeDu: z.string().min(1, "La période de début est requise"),
    periodeAu: z.string().min(1, "La période de fin est requise"),
    seances: z.array(seanceSensibilisationSchema).min(1, "Au moins une séance est requise"),
  })
  .superRefine(chantierRefineur);
export type CreerProgrammeSensibilisationInput = z.infer<typeof creerProgrammeSensibilisationSchema>;

export const ajouterSeanceSensibilisationSchema = seanceSensibilisationSchema;
export type AjouterSeanceSensibilisationInput = z.infer<typeof ajouterSeanceSensibilisationSchema>;

export const participantPVSchema = z.object({
  numero: z.number().int().positive(),
  nom: z.string().min(1, "Le nom est requis").max(255, "Trop long"),
  poste: z.string().max(255, "Trop long").optional(),
  aSigne: z.boolean(),
});

export const creerPVSensibilisationSchema = z.object({
  animateur: z.string().min(1, "L'animateur est requis").max(255, "Trop long"),
  date: z.string().min(1, "La date est requise"),
  heure: z.string().optional(),
  lieu: z.string().max(255, "Trop long").optional(),
  chantierType: z.enum(["CHANTIER", "BUREAUX", "GARAGE", "AUTRE"]),
  lieuAutrePrecision: z.string().max(255, "Trop long").optional(),
  sujetsAbordes: z.array(z.string().max(255, "Trop long")),
  sujetsAbordesAutrePrecision: z.string().max(255, "Trop long").optional(),
  pointsSpecifiquesAbordes: z.string().max(2000, "Trop long").optional(),
  participants: z.array(participantPVSchema),
  resumeSensibilisation: z.string().max(5000, "Trop long").optional(),
  observation: z.string().max(2000, "Trop long").optional(),
});
export type CreerPVSensibilisationInput = z.infer<typeof creerPVSensibilisationSchema>;

export const personneImpliqueeSchema = z.object({
  role: z.enum(["VICTIME", "TEMOIN"]),
  nom: z.string().min(1, "Le nom est requis").max(255, "Trop long"),
  fonction: z.string().max(255, "Trop long").optional(),
  typePersonne: z.enum(["PERMANENT", "OCCASIONNEL", "COLLATERAL"]).optional(),
});

export const actionImmediateSchema = z.object({
  action: z.string().min(1, "L'action est requise").max(1000, "Trop long"),
  responsable: z.string().min(1, "Le responsable est requis").max(255, "Trop long"),
  clotureLe: z.string().optional(),
});

export const correctionRapportIncidentSchema = z.object({
  correction: z.string().min(1, "La correction est requise").max(1000, "Trop long"),
  responsable: z.string().min(1, "Le responsable est requis").max(255, "Trop long"),
  echeance: z.string().optional(),
  ressourcesNecessaires: z.string().max(1000, "Trop long").optional(),
  clotureLe: z.string().optional(),
});

export const creerRapportIncidentSchema = z
  .object({
    dateEvenement: z.string().min(1, "La date de l'événement est requise"),
    projetId: z.string().optional(),
    chantierLibre: z.string().max(255, "Trop long").optional(),
    lieu: z.string().max(255, "Trop long").optional(),
    directionServiceLibre: z.string().max(255, "Trop long").optional(),
    typeNotification: z.enum(["ACCIDENT", "INCIDENT", "PRESQU_ACCIDENT"]),

    activite: z.array(z.string().max(255, "Trop long")),
    activiteAutrePrecision: z.string().max(255, "Trop long").optional(),
    descriptionDommages: z.array(z.string().max(255, "Trop long")),
    descriptionDommagesAutrePrecision: z.string().max(255, "Trop long").optional(),

    personnesImpliquees: z.array(personneImpliqueeSchema),

    resumeEvenement: z.string().min(1, "Le résumé de l'événement est requis").max(5000, "Trop long"),

    actionsImmediates: z.array(actionImmediateSchema),

    schemaCorporelPartiesAtteintes: z.array(z.string().max(255, "Trop long")),
    typeBlessure: z.array(z.string().max(255, "Trop long")),
    descriptionBlessure: z.string().max(2000, "Trop long").optional(),

    dommagesEnvironnementaux: z.array(z.string().max(255, "Trop long")),
    dommagesEnvironnementauxAutrePrecision: z.string().max(255, "Trop long").optional(),
    descriptionDommagesEnvironnementaux: z.string().max(2000, "Trop long").optional(),

    rapportPolice: z.boolean(),
    datePolice: z.string().optional(),
    postePolice: z.string().max(255, "Trop long").optional(),
    rapportAssurance: z.boolean(),
    dateAssurance: z.string().optional(),
    referenceAssurance: z.string().max(255, "Trop long").optional(),
    rapportExpertise: z.boolean(),
    dateExpertise: z.string().optional(),
    referenceExpertise: z.string().max(255, "Trop long").optional(),

    dommagesBiensEquipementsDetails: z.string().max(5000, "Trop long").optional(),
    fraisMedicauxCoutDommages: z.number().nonnegative().optional(),

    equipeInvestigation: z.array(z.string().max(255, "Trop long")),

    causesMatiere: z.array(z.string().max(255, "Trop long")),
    causesMethode: z.array(z.string().max(255, "Trop long")),
    causesMainOeuvre: z.array(z.string().max(255, "Trop long")),
    causesMachine: z.array(z.string().max(255, "Trop long")),
    causesMilieu: z.array(z.string().max(255, "Trop long")),
    causesDivers: z.array(z.string().max(255, "Trop long")),

    analyseCausesMatiere: z.string().max(2000, "Trop long").optional(),
    analyseCausesMethode: z.string().max(2000, "Trop long").optional(),
    analyseCausesMainOeuvre: z.string().max(2000, "Trop long").optional(),
    analyseCausesMachine: z.string().max(2000, "Trop long").optional(),
    analyseCausesMilieu: z.string().max(2000, "Trop long").optional(),

    corrections: z.array(correctionRapportIncidentSchema),

    nonConformiteIdentifiee: z.boolean(),
    nonConformiteDescription: z.string().max(2000, "Trop long").optional(),
  })
  .superRefine(chantierRefineur);
export type CreerRapportIncidentInput = z.infer<typeof creerRapportIncidentSchema>;
