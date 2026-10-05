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
import { Loader2, Plus, Trash2 } from "lucide-react";
import { creerDemande } from "@/lib/actions/achats";
import { listerArticles } from "@/lib/actions/achats";
import { toast } from "sonner";

interface ModaleNouvelleDemandeProps {
  ouvert: boolean;
  onClose: () => void;
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
        onClose();
        router.refresh();
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
                <Label htmlFor="beneficiaire">
                  Bénéficiaire <span className="text-destructive">*</span>
                </Label>
                <select
                  id="beneficiaire"
                  value={beneficiaireId}
                  onChange={(e) => setBeneficiaireId(e.target.value)}
                  className="w-full h-11 px-3 rounded-md border border-input bg-background"
                  required
                >
                  <option value="">Sélectionner un employé</option>
                  {employes.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.matricule} — {emp.prenom} {emp.nom}
                    </option>
                  ))}
                </select>
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
                      }}
                    />
                    <span>Service</span>
                  </label>
                </div>
              </div>

              {/* Sélection destination */}
              <div className="space-y-2">
                <Label htmlFor="destination">
                  {destinationType === "projet" ? "Chantier" : "Service"} <span className="text-destructive">*</span>
                </Label>
                <select
                  id="destination"
                  value={destinationId}
                  onChange={(e) => setDestinationId(e.target.value)}
                  className="w-full h-11 px-3 rounded-md border border-input bg-background"
                  required
                >
                  <option value="">Sélectionner...</option>
                  {destinationType === "projet"
                    ? projets.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nom}
                        </option>
                      ))
                    : services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.libelle}
                        </option>
                      ))}
                </select>
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
                        <select
                          value={ligne.articleId}
                          onChange={(e) => modifierLigne(ligne.id, "articleId", e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                          required
                        >
                          <option value="">Sélectionner...</option>
                          {articles.map((art) => (
                            <option key={art.id} value={art.id}>
                              {art.designation} ({art.unite.libelle})
                            </option>
                          ))}
                        </select>
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
    </Dialog>
  );
}
