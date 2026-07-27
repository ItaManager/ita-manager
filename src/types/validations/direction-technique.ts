import { z } from "zod";

export const creerDemandeAppelOffresSchema = z.object({
  nom: z.string().min(1, "Le nom est requis").max(255, "Nom trop long"),
  client: z.string().min(1, "Le client est requis").max(255, "Client trop long"),
  montantEstime: z.number().positive("Montant invalide"),
  description: z.string().min(1, "La description est requise").max(5000, "Description trop longue"),
  delaiReponse: z.string().min(1, "Le délai de réponse est requis"),
});
export type CreerDemandeAppelOffresInput = z.infer<typeof creerDemandeAppelOffresSchema>;

export const refuserAppelOffresSchema = z.object({
  demandeId: z.string().min(1),
  motif: z.string().min(1, "Le motif est requis").max(1000, "Motif trop long"),
});

export const creerProjetSchema = z.object({
  nom: z.string().min(1, "Le nom est requis").max(255, "Nom trop long"),
  dateDebut: z.string().min(1, "La date de début est requise"),
  dateFin: z.string().optional(),
  description: z.string().min(1, "La description est requise").max(5000, "Description trop longue"),
  chefProjetId: z.string().min(1, "Le chef de projet est requis"),
});
export type CreerProjetInput = z.infer<typeof creerProjetSchema>;

export const ajouterPointValidationSchema = z.object({
  projetId: z.string().min(1),
  libelle: z.string().min(1, "Le libellé est requis").max(255, "Libellé trop long"),
  echeance: z.string().min(1, "L'échéance est requise"),
});
export type AjouterPointValidationInput = z.infer<typeof ajouterPointValidationSchema>;

export const ligneDemandeRHSchema = z.object({
  competence: z.string().min(1, "La compétence est requise").max(255, "Trop long"),
  periode: z.string().min(1, "La période est requise").max(255, "Trop long"),
  tauxJournalierPropose: z.number().positive("Taux invalide"),
});

export const creerDemandeRHProjetSchema = z.object({
  projetId: z.string().min(1, "Le projet est requis"),
  lignes: z.array(ligneDemandeRHSchema).min(1, "Au moins une ligne est requise"),
});
export type CreerDemandeRHProjetInput = z.infer<typeof creerDemandeRHProjetSchema>;

export const validerLigneDirectementSchema = z.object({
  ligneId: z.string().min(1),
  ouvrierId: z.string().min(1, "L'ouvrier est requis"),
});
export type ValiderLigneDirectementInput = z.infer<typeof validerLigneDirectementSchema>;

export const contreProposerLigneSchema = z.object({
  ligneId: z.string().min(1),
  ouvrierId: z.string().min(1, "L'ouvrier est requis"),
  competenceProposee: z.string().min(1, "La compétence est requise").max(255, "Trop long"),
  tauxJournalierPropose: z.number().positive("Taux invalide"),
});
export type ContreProposerLigneInput = z.infer<typeof contreProposerLigneSchema>;

export const refuserLigneSchema = z.object({
  ligneId: z.string().min(1),
  motif: z.string().min(1, "Le motif est requis").max(1000, "Motif trop long"),
});

export const creerDemandeMaterielSchema = z
  .object({
    projetId: z.string().optional(),
    chantierLibre: z.string().max(255, "Trop long").optional(),
    materielId: z.string().min(1, "Le matériel est requis"),
    delaiSouhaite: z.string().min(1, "Le délai souhaité est requis"),
  })
  .superRefine((donnees, ctx) => {
    if (!donnees.projetId && !donnees.chantierLibre) {
      ctx.addIssue({
        code: "custom",
        path: ["chantierLibre"],
        message: "Indiquez un projet ou un chantier",
      });
    }
  });
export type CreerDemandeMaterielInput = z.infer<typeof creerDemandeMaterielSchema>;

export const refuserDemandeMaterielSchema = z.object({
  demandeId: z.string().min(1),
  motif: z.string().min(1, "Le motif est requis").max(1000, "Motif trop long"),
});

export const creerArticleSchema = z.object({
  designation: z.string().min(1, "La désignation est requise").max(255, "Désignation trop longue"),
});
export type CreerArticleInput = z.infer<typeof creerArticleSchema>;
