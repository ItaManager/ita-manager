"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Building, ChevronLeft, Search } from "lucide-react";
import { listerEmployes } from "@/lib/actions/employes";
import { toast } from "sonner";

const schemaEquipeITA = z.object({
  nom: z.string().min(1, "Nom de l'équipe requis"),
  chefEquipeId: z.string().min(1, "Chef d'équipe requis"),
  agentIds: z.array(z.string()).min(1, "Au moins un agent requis"),
});

type FormEquipeITA = z.infer<typeof schemaEquipeITA>;

type EmployeItem = {
  id: string;
  nom: string;
  prenom: string;
  posteLibelle: string | null;
  typeContrat: string | null;
};

interface ModalComposerEquipeProps {
  projetId: string;
  projetCode: string;
  projetNom: string;
  children: React.ReactNode;
}

export function ModalComposerEquipe({
  projetId,
  projetCode,
  projetNom,
  children,
}: ModalComposerEquipeProps) {
  const [ouvert, setOuvert] = useState(false);
  const [etape, setEtape] = useState<"choix" | "formulaire">("choix");
  const [typeSelectionne, setTypeSelectionne] = useState<"ITA" | "SOUS_TRAITANCE" | null>(null);
  const [employes, setEmployes] = useState<EmployeItem[]>([]);
  const [loadingEmployes, setLoadingEmployes] = useState(false);
  const [rechercheAgent, setRechercheAgent] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FormEquipeITA>({
    resolver: zodResolver(schemaEquipeITA),
    defaultValues: {
      nom: "",
      chefEquipeId: "",
      agentIds: [],
    },
  });

  const chefEquipeId = watch("chefEquipeId");
  const agentIds = watch("agentIds");

  // Charger les employés quand on passe au formulaire ITA
  useEffect(() => {
    if (etape === "formulaire" && typeSelectionne === "ITA" && employes.length === 0) {
      setLoadingEmployes(true);
      listerEmployes({})
        .then((data) => {
          const employesFormates: EmployeItem[] = data.items.map((emp: any) => ({
            id: emp.id,
            nom: emp.nom,
            prenom: emp.prenom,
            posteLibelle: emp.affectations?.[0]?.poste?.libelle || null,
            typeContrat: emp.contrats?.[0]?.type || null,
          }));
          setEmployes(employesFormates);
        })
        .catch(() => {
          toast.error("Erreur lors du chargement des employés");
        })
        .finally(() => {
          setLoadingEmployes(false);
        });
    }
  }, [etape, typeSelectionne, employes.length]);

  const handleContinuer = () => {
    if (!typeSelectionne) return;
    setEtape("formulaire");
  };

  const handleChangerNature = () => {
    setEtape("choix");
    setTypeSelectionne(null);
    reset();
  };

  const onSubmit = async (data: FormEquipeITA) => {
    setLoading(true);
    try {
      // TODO: Implémenter la création de l'équipe
      console.log("Créer équipe ITA:", data);
      toast.success("Équipe créée avec succès");
      setOuvert(false);
      setEtape("choix");
      setTypeSelectionne(null);
      reset();
    } catch (error) {
      toast.error("Erreur lors de la création de l'équipe");
    } finally {
      setLoading(false);
    }
  };

  const toggleAgent = (agentId: string) => {
    const newAgentIds = agentIds.includes(agentId)
      ? agentIds.filter((id) => id !== agentId)
      : [...agentIds, agentId];
    setValue("agentIds", newAgentIds);
  };

  // Options pour le combobox chef d'équipe - Tous les employés ITA
  const chefOptions: ComboboxOption[] = employes.map((emp) => ({
    value: emp.id,
    label: `${emp.prenom} ${emp.nom}`,
    description: emp.posteLibelle || undefined,
  }));

  // Filtrer les agents (ouvriers et manœuvres)
  const agentsFiltres = employes.filter((emp) => {
    const estOuvrierOuManoeuvre =
      emp.posteLibelle?.toLowerCase().includes("ouvrier") ||
      emp.posteLibelle?.toLowerCase().includes("manœuvre") ||
      emp.posteLibelle?.toLowerCase().includes("manoeuvre");

    const matchRecherche = rechercheAgent
      ? `${emp.prenom} ${emp.nom}`.toLowerCase().includes(rechercheAgent.toLowerCase())
      : true;

    return estOuvrierOuManoeuvre && matchRecherche;
  });

  return (
    <Dialog
      open={ouvert}
      onOpenChange={(open) => {
        setOuvert(open);
        if (!open) {
          setEtape("choix");
          setTypeSelectionne(null);
          reset();
        }
      }}
    >
      <div onClick={() => setOuvert(true)}>{children}</div>

      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-3xl p-0">
        <DialogHeader className="bg-primary-soft p-6 rounded-t-lg">
          <DialogTitle className="text-xl font-semibold text-primary">
            Composer une équipe
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {projetCode} · {projetNom}
          </p>
        </DialogHeader>

        {/* Étape 1 : Choix du type */}
        {etape === "choix" && (
          <div className="p-6 space-y-6">
            <p className="text-sm text-muted-foreground">
              Cette première réponse détermine le formulaire entier — ce qu'on saisit, et ce qui se passe à la paie.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {/* Équipe ITA */}
              <button
                onClick={() => setTypeSelectionne("ITA")}
                className={`relative p-6 rounded-lg border-2 transition-all text-left ${
                  typeSelectionne === "ITA"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 bg-background"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                      <Users className="size-6 text-primary" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-3">
                    <h3 className="text-lg font-semibold">Équipe ITA</h3>
                    <p className="text-sm text-muted-foreground">
                      Nos agents, nominativement.
                    </p>

                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-success mt-0.5">✓</span>
                        <span>Un chef d'équipe et ses ouvriers</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-success mt-0.5">✓</span>
                        <span>Pointés chaque jour au relevé d'activité</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-success mt-0.5">✓</span>
                        <span>Les journaliers sont payés à la journée</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-success mt-0.5">✓</span>
                        <span>Coût imputé à la main-d'œuvre</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {typeSelectionne === "ITA" && (
                  <div className="absolute top-3 right-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  </div>
                )}
              </button>

              {/* Sous-traitance */}
              <button
                onClick={() => setTypeSelectionne("SOUS_TRAITANCE")}
                className={`relative p-6 rounded-lg border-2 transition-all text-left ${
                  typeSelectionne === "SOUS_TRAITANCE"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 bg-background"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100">
                      <Building className="size-6 text-purple-600" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-3">
                    <h3 className="text-lg font-semibold">Sous-traitance</h3>
                    <p className="text-sm text-muted-foreground">
                      Un prestataire fournit ses propres agents.
                    </p>

                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-success mt-0.5">✓</span>
                        <span>ITA ne suit AUCUN agent nominativement</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-success mt-0.5">✓</span>
                        <span>Aucun pointage — c'est un fournisseur</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-success mt-0.5">✓</span>
                        <span>Payé sur contrat, pas à la journée</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-success mt-0.5">✓</span>
                        <span>Coût imputé à la sous-traitance</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {typeSelectionne === "SOUS_TRAITANCE" && (
                  <div className="absolute top-3 right-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  </div>
                )}
              </button>
            </div>

            {/* Actions */}
            <div className="flex justify-between border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOuvert(false);
                  setTypeSelectionne(null);
                }}
                className="h-10 px-4 text-base rounded-full border-2 hover:border-primary transition-all"
              >
                Annuler
              </Button>

              <Button
                onClick={handleContinuer}
                disabled={!typeSelectionne}
                className="h-10 px-4 text-base rounded-full bg-success hover:bg-success-hover text-success-foreground transition-all disabled:opacity-50"
              >
                {typeSelectionne ? "Créer l'équipe" : "Champs à compléter"}
              </Button>
            </div>
          </div>
        )}

        {/* Étape 2 : Formulaire Équipe ITA */}
        {etape === "formulaire" && typeSelectionne === "ITA" && (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Lien retour */}
            <button
              type="button"
              onClick={handleChangerNature}
              className="flex items-center gap-2 text-sm text-primary hover:underline"
            >
              <ChevronLeft className="size-4" />
              Changer de nature
            </button>

            {/* Nom de l'équipe */}
            <div className="space-y-2">
              <Label htmlFor="nom">
                Nom de l'équipe <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nom"
                placeholder="Équipe terrassement"
                {...register("nom")}
                className="h-12"
              />
              {errors.nom && (
                <p className="text-sm text-destructive">{errors.nom.message}</p>
              )}
            </div>

            {/* Chef d'équipe */}
            <div className="space-y-2">
              <Label htmlFor="chefEquipeId">
                Chef d'équipe <span className="text-destructive">*</span>
              </Label>
              <Combobox
                variant="search"
                options={chefOptions}
                value={chefEquipeId}
                onChange={(value) => setValue("chefEquipeId", value)}
                placeholder="Rechercher"
                searchPlaceholder="Rechercher un chef d'équipe"
                emptyText="Aucun chef d'équipe trouvé"
              />
              <p className="text-sm text-muted-foreground">
                Il encadre l'équipe et saisit les relevés d'activité.
              </p>
              {errors.chefEquipeId && (
                <p className="text-sm text-destructive">{errors.chefEquipeId.message}</p>
              )}
            </div>

            {/* Agents */}
            <div className="space-y-2">
              <Label htmlFor="agents">
                Agents <span className="text-destructive">*</span>
              </Label>

              {/* Champ de recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Rechercher un ouvrier ou un manœuvre"
                  value={rechercheAgent}
                  onChange={(e) => setRechercheAgent(e.target.value)}
                  className="pl-9 h-12"
                />
              </div>

              {/* Liste des agents avec checkboxes */}
              <div className="border rounded-lg max-h-80 overflow-y-auto">
                {loadingEmployes ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Chargement...
                  </div>
                ) : agentsFiltres.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Aucun agent trouvé
                  </div>
                ) : (
                  <div className="divide-y">
                    {agentsFiltres.map((agent) => {
                      const estJournalier = agent.typeContrat !== "CDI" && agent.typeContrat !== "CDD";
                      const estPermanent = agent.typeContrat === "CDI";

                      return (
                        <label
                          key={agent.id}
                          className="flex items-center gap-3 p-3 hover:bg-muted/30 cursor-pointer"
                        >
                          <Checkbox
                            checked={agentIds.includes(agent.id)}
                            onCheckedChange={() => toggleAgent(agent.id)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {agent.prenom} {agent.nom}
                              </span>
                              {agent.posteLibelle && (
                                <span className="text-sm text-muted-foreground">
                                  {agent.posteLibelle}
                                </span>
                              )}
                            </div>
                          </div>
                          <div>
                            {estPermanent && (
                              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 border border-green-300">
                                permanent
                              </span>
                            )}
                            {estJournalier && (
                              <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-300">
                                journalier
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {errors.agentIds && (
                <p className="text-sm text-destructive">{errors.agentIds.message}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOuvert(false);
                  setEtape("choix");
                  setTypeSelectionne(null);
                  reset();
                }}
                disabled={loading}
                className="h-10 px-4 text-base rounded-full border-2 hover:border-primary transition-all"
              >
                Annuler
              </Button>

              <Button
                type="submit"
                disabled={loading || loadingEmployes || agentIds.length === 0}
                className="h-10 px-4 text-base rounded-full bg-success hover:bg-success-hover text-success-foreground transition-all disabled:opacity-50"
              >
                {agentIds.length === 0 ? "Champs à compléter" : "Créer l'équipe"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
