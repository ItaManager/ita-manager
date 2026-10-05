"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { creerDemande } from "@/lib/actions/achats";
import { listerArticles } from "@/lib/actions/achats";
import { toast } from "sonner";
import { ModaleNouvelArticle } from "./modale-nouvel-article";

interface ModaleNouvelleDemandeProps {
  ouvert: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  employes: Array<{ id: string; nom: string; prenom: string; matricule: string }>;
  projets: Array<{ id: string; nom: string }>;
  services: Array<{ id: string; libelle: string }>;
}

interface LigneArticle {
  id: string;
  articleId: string;
  designation: string;
  quantite: number;
  unite: string;
}

export function ModaleNouvelleDemande({
  ouvert,
  onClose,
  onSuccess,
  employes,
  projets,
  services,
}: ModaleNouvelleDemandeProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [articles, setArticles] = useState<Array<{ id: string; designation: string; unite: { libelle: string } }>>([]);

  // Étape du formulaire
  const [etape, setEtape] = useState<1 | 2>(1);

  // Champs de l'étape 1 : Informations générales
  const [beneficiaireId, setBeneficiaireId] = useState("");
  const [destinationType, setDestinationType] = useState<"projet" | "service">("projet");
  const [destinationId, setDestinationId] = useState("");
  const [description, setDescription] = useState("");
  const [dateBesoin, setDateBesoin] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [type, setType] = useState<"INITIALE" | "REGULARISATION">("INITIALE");

  // États des popovers
  const [openBeneficiaire, setOpenBeneficiaire] = useState(false);
  const [openDestination, setOpenDestination] = useState(false);
  const [openArticles, setOpenArticles] = useState<Record<string, boolean>>({});
  const [openNouvelArticle, setOpenNouvelArticle] = useState(false);
  const [ligneEnCoursCreation, setLigneEnCoursCreation] = useState<string | null>(null);

  // Champs de l'étape 2 : Lignes d'articles
  const [lignes, setLignes] = useState<LigneArticle[]>([
    { id: crypto.randomUUID(), articleId: "", designation: "", quantite: 1, unite: "" },
  ]);

  // Charger les articles au montage
  useEffect(() => {
    if (ouvert) {
      listerArticles().then(setArticles);
    }
  }, [ouvert]);

  const ajouterLigne = () => {
    setLignes([
      ...lignes,
      { id: crypto.randomUUID(), articleId: "", designation: "", quantite: 1, unite: "" },
    ]);
  };

  const supprimerLigne = (id: string) => {
    if (lignes.length > 1) {
      setLignes(lignes.filter((l) => l.id !== id));
    }
  };

  const modifierLigne = (id: string, champ: keyof LigneArticle, valeur: string | number) => {
    setLignes(
      lignes.map((l) => {
        if (l.id === id) {
          // Si on change l'article, mettre à jour designation et unite
          if (champ === "articleId") {
            const article = articles.find((a) => a.id === valeur);
            if (article) {
              return {
                ...l,
                articleId: valeur as string,
                designation: article.designation,
                unite: article.unite.libelle,
              };
            }
          }
          return { ...l, [champ]: valeur };
        }
        return l;
      })
    );
  };

  const handleSubmitEtape1 = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!beneficiaireId) {
      toast.error("Veuillez sélectionner un bénéficiaire");
      return;
    }
    if (!destinationId) {
      toast.error("Veuillez sélectionner une destination");
      return;
    }
    if (!description.trim()) {
      toast.error("La description est requise");
      return;
    }
    if (!dateBesoin) {
      toast.error("La date de besoin est requise");
      return;
    }

    // Passer à l'étape 2
    setEtape(2);
  };

  const handleSubmitEtape2 = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation des lignes
    const lignesValides = lignes.filter(
      (l) => l.articleId && l.designation && l.quantite > 0 && l.unite
    );

    if (lignesValides.length === 0) {
      toast.error("Ajoutez au moins une ligne d'article");
      return;
    }

    startTransition(async () => {
      const result = await creerDemande({
        beneficiaireId,
        destinationId,
        description,
        dateBesoin: new Date(dateBesoin),
        urgent,
        type,
        lignes: lignesValides.map((l) => ({
          articleId: l.articleId,
          designation: l.designation,
          quantite: l.quantite,
          unite: l.unite,
        })),
      });

      if (result) {
        toast.success("Demande d'achat créée en brouillon");
        // Réinitialiser
        reinitialiserFormulaire();
        if (onSuccess) {
          onSuccess(); // Ferme la modale et rafraîchit la liste
        } else {
          onClose();
          router.refresh();
        }
      } else {
        toast.error("Erreur lors de la création de la demande");
      }
    });
  };

  const reinitialiserFormulaire = () => {
    setEtape(1);
    setBeneficiaireId("");
    setDestinationType("projet");
    setDestinationId("");
    setDescription("");
    setDateBesoin("");
    setUrgent(false);
    setType("INITIALE");
    setLignes([{ id: crypto.randomUUID(), articleId: "", designation: "", quantite: 1, unite: "" }]);
  };

  return (
    <Dialog open={ouvert} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b border-border px-6 py-4" style={{ backgroundColor: 'var(--primary-soft)' }}>
          <DialogTitle className="text-xl font-semibold text-[#1D186C]">
            Nouvelle demande d'achat
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Étape {etape} sur 2 — {etape === 1 ? "Informations générales" : "Articles demandés"}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1">
          {/* ÉTAPE 1 : Informations générales */}
          {etape === 1 && (
            <form onSubmit={handleSubmitEtape1} className="space-y-5 px-6 py-4">
              {/* Bénéficiaire */}
              <div className="space-y-2">
                <Label>
                  Bénéficiaire <span className="text-destructive">*</span>
                </Label>
                <Popover open={openBeneficiaire} onOpenChange={setOpenBeneficiaire}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openBeneficiaire}
                      className="w-full justify-between h-11"
                    >
                      {beneficiaireId ? (
                        <span>
                          {(() => {
                            const emp = employes.find((e) => e.id === beneficiaireId);
                            return emp ? `${emp.matricule} — ${emp.prenom} ${emp.nom}` : "Sélectionner...";
                          })()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Sélectionner un employé...</span>
                      )}
                      <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[500px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Rechercher un employé..." />
                      <CommandList>
                        <CommandEmpty>Aucun employé trouvé.</CommandEmpty>
                        <CommandGroup>
                          {employes.map((emp) => (
                            <CommandItem
                              key={emp.id}
                              value={`${emp.matricule} ${emp.prenom} ${emp.nom}`}
                              onSelect={() => {
                                setBeneficiaireId(emp.id);
                                setOpenBeneficiaire(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 size-4",
                                  beneficiaireId === emp.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div>
                                <div className="font-medium">{emp.matricule}</div>
                                <div className="text-xs text-muted-foreground">
                                  {emp.prenom} {emp.nom}
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Employé qui recevra le matériel
                </p>
              </div>

              {/* Type de destination */}
              <div className="space-y-2">
                <Label>
                  Destination <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="destinationType"
                      value="projet"
                      checked={destinationType === "projet"}
                      onChange={() => {
                        setDestinationType("projet");
                        setDestinationId("");
                        setOpenDestination(false);
                      }}
                    />
                    <span>Chantier</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="destinationType"
                      value="service"
                      checked={destinationType === "service"}
                      onChange={() => {
                        setDestinationType("service");
                        setDestinationId("");
                        setOpenDestination(false);
                      }}
                    />
                    <span>Service</span>
                  </label>
                </div>
              </div>

              {/* Sélection destination */}
              <div className="space-y-2">
                <Label>
                  {destinationType === "projet" ? "Chantier" : "Service"} <span className="text-destructive">*</span>
                </Label>
                <Popover open={openDestination} onOpenChange={setOpenDestination}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openDestination}
                      className="w-full justify-between h-11"
                    >
                      {destinationId ? (
                        <span>
                          {destinationType === "projet"
                            ? projets.find((p) => p.id === destinationId)?.nom || "Sélectionner..."
                            : services.find((s) => s.id === destinationId)?.libelle || "Sélectionner..."}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          Sélectionner {destinationType === "projet" ? "un chantier" : "un service"}...
                        </span>
                      )}
                      <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[500px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder={`Rechercher ${destinationType === "projet" ? "un chantier" : "un service"}...`} />
                      <CommandList>
                        <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
                        <CommandGroup>
                          {destinationType === "projet"
                            ? projets.map((p) => (
                                <CommandItem
                                  key={p.id}
                                  value={p.nom}
                                  onSelect={() => {
                                    setDestinationId(p.id);
                                    setOpenDestination(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 size-4",
                                      destinationId === p.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {p.nom}
                                </CommandItem>
                              ))
                            : services.map((s) => (
                                <CommandItem
                                  key={s.id}
                                  value={s.libelle}
                                  onSelect={() => {
                                    setDestinationId(s.id);
                                    setOpenDestination(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 size-4",
                                      destinationId === s.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {s.libelle}
                                </CommandItem>
                              ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Motif de la demande <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Travaux de maçonnerie bloc 3..."
                  rows={3}
                  required
                />
              </div>

              {/* Date de besoin */}
              <div className="space-y-2">
                <Label htmlFor="dateBesoin">
                  Date de besoin <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dateBesoin"
                  type="date"
                  value={dateBesoin}
                  onChange={(e) => setDateBesoin(e.target.value)}
                  className="h-11"
                  required
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label>Type de demande</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="INITIALE"
                      checked={type === "INITIALE"}
                      onChange={() => setType("INITIALE")}
                    />
                    <span>Initiale</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value="REGULARISATION"
                      checked={type === "REGULARISATION"}
                      onChange={() => setType("REGULARISATION")}
                    />
                    <span>Régularisation</span>
                  </label>
                </div>
              </div>

              {/* Urgent */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="urgent"
                  checked={urgent}
                  onChange={(e) => setUrgent(e.target.checked)}
                  className="size-4"
                />
                <Label htmlFor="urgent" className="cursor-pointer">
                  Demande urgente
                </Label>
              </div>
            </form>
          )}

          {/* ÉTAPE 2 : Articles */}
          {etape === 2 && (
            <form onSubmit={handleSubmitEtape2} className="space-y-5 px-6 py-4">
              <div className="space-y-3">
                {lignes.map((ligne, index) => (
                  <div key={ligne.id} className="flex gap-3 items-start p-3 border rounded-lg">
                    <div className="flex-1 space-y-3">
                      {/* Article */}
                      <div>
                        <Label className="text-xs">Article *</Label>
                        <Popover
                          open={openArticles[ligne.id] || false}
                          onOpenChange={(open) => setOpenArticles({ ...openArticles, [ligne.id]: open })}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openArticles[ligne.id] || false}
                              className="w-full justify-between h-10 text-sm"
                            >
                              {ligne.articleId ? (
                                <span className="truncate">
                                  {articles.find((a) => a.id === ligne.articleId)?.designation || "Sélectionner..."}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">Sélectionner un article...</span>
                              )}
                              <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Rechercher un article..." />
                              <CommandList>
                                <CommandEmpty>
                                  <div className="py-6 text-center">
                                    <p className="text-sm text-muted-foreground mb-3">
                                      Aucun article trouvé.
                                    </p>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setLigneEnCoursCreation(ligne.id);
                                        setOpenArticles({ ...openArticles, [ligne.id]: false });
                                        setOpenNouvelArticle(true);
                                      }}
                                    >
                                      <Plus className="size-4 mr-2" />
                                      Créer un article
                                    </Button>
                                  </div>
                                </CommandEmpty>
                                <CommandGroup>
                                  {articles.map((art) => (
                                    <CommandItem
                                      key={art.id}
                                      value={`${art.designation} ${art.unite.libelle}`}
                                      onSelect={() => {
                                        modifierLigne(ligne.id, "articleId", art.id);
                                        setOpenArticles({ ...openArticles, [ligne.id]: false });
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 size-4",
                                          ligne.articleId === art.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <div>
                                        <div className="font-medium text-sm">{art.designation}</div>
                                        <div className="text-xs text-muted-foreground">{art.unite.libelle}</div>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                                <div className="border-t border-border p-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => {
                                      setLigneEnCoursCreation(ligne.id);
                                      setOpenArticles({ ...openArticles, [ligne.id]: false });
                                      setOpenNouvelArticle(true);
                                    }}
                                  >
                                    <Plus className="size-4 mr-2" />
                                    Créer un nouvel article
                                  </Button>
                                </div>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Quantité */}
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <Label className="text-xs">Quantité *</Label>
                          <Input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={ligne.quantite}
                            onChange={(e) => modifierLigne(ligne.id, "quantite", parseFloat(e.target.value))}
                            className="h-10"
                            required
                          />
                        </div>
                        <div className="w-24">
                          <Label className="text-xs">Unité</Label>
                          <Input
                            value={ligne.unite}
                            readOnly
                            className="h-10 bg-muted"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bouton supprimer */}
                    {lignes.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => supprimerLigne(ligne.id)}
                        className="text-destructive hover:text-destructive mt-5"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={ajouterLigne}
                  className="w-full"
                >
                  <Plus className="size-4 mr-2" />
                  Ajouter une ligne
                </Button>
              </div>
            </form>
          )}
        </div>

        <DialogFooter className="gap-2 px-6 py-4 border-t border-border">
          {etape === 1 ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={handleSubmitEtape1}
                className="bg-[#1D186C] hover:bg-[#1D186C]/90 text-white"
              >
                Suivant
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEtape(1)}
                disabled={isPending}
              >
                Retour
              </Button>
              <Button
                type="button"
                onClick={handleSubmitEtape2}
                disabled={isPending}
                className="bg-[#13850b] hover:bg-[#0f6909] text-white"
              >
                {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                Créer la demande
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>

      {/* Modale pour créer un article */}
      <ModaleNouvelArticle
        ouvert={openNouvelArticle}
        onClose={() => {
          setOpenNouvelArticle(false);
          setLigneEnCoursCreation(null);
        }}
        onArticleCree={(article) => {
          // Ajouter le nouvel article à la liste
          setArticles([...articles, article]);
          // Si on était en train de créer pour une ligne spécifique, l'assigner
          if (ligneEnCoursCreation) {
            modifierLigne(ligneEnCoursCreation, "articleId", article.id);
          }
        }}
      />
    </Dialog>
  );
}
