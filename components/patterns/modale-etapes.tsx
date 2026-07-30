"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, Save, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

/* ====================================================================
 * PATRON 4 bis — Modale à étapes
 *
 * Employée pour la CRÉATION d'un objet à plus de quinze champs :
 * employé permanent, projet, appel d'offres, contrat de prestation.
 *
 * Décision E-02 amendée : la modale à onglets reste la forme de la
 * MODIFICATION — on y entre pour changer une chose et on doit l'atteindre
 * directement. La création suit un cheminement linéaire : on ne sait pas
 * encore ce qu'on remplit, l'ordre guide.
 *
 * Au-delà de six étapes, passer à une page dédiée.
 *
 * CE QUI EST VERROUILLÉ — ne pas réinventer d'un écran à l'autre
 *
 *   Largeur         max-w-4xl, ou max-w-2xl si moins de six champs par étape
 *   Hauteur         max-h-[90vh], le contenu défile, en-tête et pied fixes
 *   En-tête         bg-primary-soft, titre text-lg font-semibold, sous-titre
 *                   text-sm text-muted-foreground
 *   Progression     segments h-1.5 rounded-full, success plein / success-soft vide
 *   Contenu         px-7 py-6, grille md:grid-cols-2, gap-5
 *   Champs          rounded-md, h-10, border-input — JAMAIS rounded-lg ni rounded-xl
 *   Libellés        text-sm font-medium, astérisque destructive si requis
 *   Aide            text-xs text-muted-foreground sous le champ
 *   Erreur          text-xs text-destructive, REMPLACE l'aide, ne s'y ajoute pas
 *   Pied            border-t, px-7 py-4, Précédent à gauche, Suivant à droite
 *   Boutons         rounded-full, h-9 px-4, text-sm font-medium
 * ================================================================== */

export type Etape = {
  id: string;
  /** Affiché dans le sous-titre : « Étape 2 sur 6 — Affectation » */
  libelle: string;
  /** Champs requis de cette étape. Sert au contrôle avant de passer à la suivante. */
  champsRequis?: string[];
  contenu: React.ReactNode;
};

type Props = {
  ouvert: boolean;
  onOuvertChange: (v: boolean) => void;

  titre: string;
  etapes: Etape[];
  etapeCourante: number;
  onEtapeChange: (i: number) => void;

  /** Empêche le passage à l'étape suivante et affiche le message. */
  blocage?: string | null;

  onValider: () => void | Promise<void>;
  libelleValidation?: string;
  enCours?: boolean;

  /** État du brouillon automatique — décision E-03. */
  brouillon?: "aucun" | "enregistrement" | "enregistre";

  taille?: "md" | "lg";
};

export function ModaleEtapes({
  ouvert,
  onOuvertChange,
  titre,
  etapes,
  etapeCourante,
  onEtapeChange,
  blocage,
  onValider,
  libelleValidation = "Créer",
  enCours,
  brouillon = "aucun",
  taille = "lg",
}: Props) {
  const etape = etapes[etapeCourante];
  const premiere = etapeCourante === 0;
  const derniere = etapeCourante === etapes.length - 1;

  return (
    <Dialog open={ouvert} onOpenChange={onOuvertChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0",
          taille === "lg" ? "sm:max-w-4xl" : "sm:max-w-2xl",
        )}
      >
        <VisuallyHidden>
          <DialogTitle>{titre}</DialogTitle>
        </VisuallyHidden>

        {/* ---------- En-tête ---------- */}
        <header className="shrink-0 bg-primary-soft px-7 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-primary">{titre}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Étape {etapeCourante + 1} sur {etapes.length} — {etape.libelle}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <IndicateurBrouillon etat={brouillon} />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onOuvertChange(false)}
                className="h-8 rounded-full bg-background shadow-sm hover:bg-background/80"
              >
                <X className="size-3.5" />
                Fermer
              </Button>
            </div>
          </div>

          {/* Progression — un segment par étape */}
          <ol className="mt-5 flex gap-1.5" aria-label="Progression">
            {etapes.map((e, i) => (
              <li
                key={e.id}
                className="h-1.5 flex-1 rounded-full transition-colors"
                style={{
                  background:
                    i <= etapeCourante
                      ? "var(--success)"
                      : "var(--success-soft)",
                }}
                aria-current={i === etapeCourante ? "step" : undefined}
              >
                <span className="sr-only">
                  {e.libelle}
                  {i < etapeCourante ? " — terminée" : i === etapeCourante ? " — en cours" : ""}
                </span>
              </li>
            ))}
          </ol>
        </header>

        {/* ---------- Contenu ---------- */}
        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-6">
          {etape.contenu}
        </div>

        {/* ---------- Pied ---------- */}
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t px-7 py-4">
          <Button
            variant="ghost"
            onClick={() => onEtapeChange(etapeCourante - 1)}
            disabled={premiere || enCours}
            className="rounded-full"
          >
            <ArrowLeft className="size-4" />
            Précédent
          </Button>

          <div className="flex items-center gap-3">
            {blocage && (
              <span className="text-xs text-muted-foreground">{blocage}</span>
            )}

            {derniere ? (
              <Button
                onClick={onValider}
                disabled={!!blocage || enCours}
                className="rounded-full bg-success text-success-foreground hover:bg-success/90"
              >
                {enCours ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                {libelleValidation}
              </Button>
            ) : (
              <Button
                onClick={() => onEtapeChange(etapeCourante + 1)}
                disabled={!!blocage || enCours}
                className="rounded-full"
              >
                Suivant
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

/* ====================================================================
 * Indicateur de brouillon — décision E-03
 * ================================================================== */

function IndicateurBrouillon({ etat }: { etat: Props["brouillon"] }) {
  if (etat === "aucun") return null;

  if (etat === "enregistrement") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
        <Loader2 className="size-3 animate-spin" />
        Enregistrement…
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1.5 text-xs shadow-sm"
      style={{ color: "var(--success)" }}
      title="Brouillon enregistré automatiquement. Fermer cette fenêtre ne perd rien."
    >
      <Save className="size-3" />
      Brouillon enregistré
    </span>
  );
}

/* ====================================================================
 * SECTION — regroupe des champs à l'intérieur d'une étape
 *
 * À employer quand une étape porte deux blocs distincts : identité et
 * contact d'urgence, salaire et dérogation.
 * ================================================================== */

export function SectionEtape({
  titre,
  aide,
  ton = "neutre",
  children,
}: {
  titre: string;
  aide?: string;
  ton?: "neutre" | "attention" | "succes";
  children: React.ReactNode;
}) {
  const styles = {
    neutre: "border-border bg-transparent",
    attention: "border-warning-border bg-warning-soft",
    succes: "border-success-soft bg-success-soft/30",
  }[ton];

  return (
    <section className={cn("rounded-lg border p-5", styles)}>
      <h3
        className="text-sm font-semibold"
        style={{ color: ton === "attention" ? "var(--warning)" : "var(--primary)" }}
      >
        {titre}
      </h3>
      {aide && (
        <p
          className="mt-1 text-xs"
          style={{ color: ton === "attention" ? "var(--warning)" : undefined }}
        >
          {aide}
        </p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/* ====================================================================
 * GRILLE — mise en page des champs dans une étape
 *
 * Deux colonnes par défaut, trois pour des champs courts — dates,
 * nombres, codes. Jamais quatre : les libellés deviennent illisibles.
 * ================================================================== */

export function GrilleChamps({
  colonnes = 2,
  children,
}: {
  colonnes?: 1 | 2 | 3;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid gap-5",
        colonnes === 1 && "grid-cols-1",
        colonnes === 2 && "md:grid-cols-2",
        colonnes === 3 && "md:grid-cols-3",
      )}
    >
      {children}
    </div>
  );
}

/* ====================================================================
 * EXEMPLE — création d'un employé permanent
 *
 *   const [ouvert, setOuvert] = useState(false);
 *   const [etape, setEtape] = useState(0);
 *   const [brouillon, setBrouillon] = useState<"aucun"|"enregistrement"|"enregistre">("aucun");
 *   const form = useForm<SchemaEmploye>({ resolver: zodResolver(schemaEmployePartiel) });
 *
 *   // Brouillon automatique, 2 s après la frappe — E-03
 *   const valeurs = form.watch();
 *   useEffect(() => {
 *     setBrouillon("enregistrement");
 *     const t = setTimeout(async () => {
 *       await enregistrerBrouillon("employe", valeurs);
 *       setBrouillon("enregistre");
 *     }, 2000);
 *     return () => clearTimeout(t);
 *   }, [valeurs]);
 *
 *   const etapes: Etape[] = [
 *     { id: "identite",    libelle: "Informations personnelles", champsRequis: ["nom","prenom","naissance"], contenu: <EtapeIdentite form={form} /> },
 *     { id: "affectation", libelle: "Affectation",               champsRequis: ["directionId","posteId"],    contenu: <EtapeAffectation form={form} /> },
 *     { id: "contrat",     libelle: "Contrat",                   champsRequis: ["typeContrat","embauche"],   contenu: <EtapeContrat form={form} /> },
 *     { id: "remuneration",libelle: "Rémunération",              champsRequis: ["salaire"],                  contenu: <EtapeRemuneration form={form} /> },
 *     { id: "documents",   libelle: "Pièces justificatives",                                                 contenu: <EtapeDocuments form={form} /> },
 *     { id: "recapitulatif", libelle: "Récapitulatif",                                                       contenu: <EtapeRecapitulatif form={form} /> },
 *   ];
 *
 *   // Blocage : contrôle des champs requis de l'étape courante
 *   const manquants = (etapes[etape].champsRequis ?? []).filter((c) => !form.getValues(c));
 *   const blocage = manquants.length
 *     ? `${manquants.length} champ(s) obligatoire(s) à renseigner`
 *     : null;
 *
 *   <ModaleEtapes
 *     ouvert={ouvert}
 *     onOuvertChange={setOuvert}
 *     titre="Nouvel employé permanent"
 *     etapes={etapes}
 *     etapeCourante={etape}
 *     onEtapeChange={setEtape}
 *     blocage={blocage}
 *     brouillon={brouillon}
 *     onValider={form.handleSubmit(creerEmploye)}
 *     libelleValidation="Créer le profil"
 *   />
 *
 * ====================================================================
 * TROIS ERREURS À NE PAS COMMETTRE
 *
 * 1. Laisser passer à l'étape suivante avec des champs requis vides.
 *    L'utilisateur découvre l'erreur à la dernière étape et doit remonter.
 *
 * 2. Perdre les valeurs en revenant en arrière. L'état vit dans le
 *    formulaire parent, jamais dans les composants d'étape.
 *
 * 3. Oublier l'étape de récapitulatif. Sur six étapes, personne ne se
 *    souvient de ce qu'il a saisi trois écrans plus tôt.
 * ================================================================== */
