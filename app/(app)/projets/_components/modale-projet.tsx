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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw } from "lucide-react";
import { creerProjet, genererCodeProjet } from "@/lib/actions/projets";
import { toast } from "sonner";
import { CyclePaie } from "@prisma/client";

interface ModaleProjetProps {
  ouvert: boolean;
  onClose: () => void;
}

export function ModaleProjet({ ouvert, onClose }: ModaleProjetProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [codeLoading, setCodeLoading] = useState(false);

  const [code, setCode] = useState("");
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const [maitreOuvrage, setMaitreOuvrage] = useState("");
  const [localisation, setLocalisation] = useState("");
  const [montantMarche, setMontantMarche] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [cyclePaie, setCyclePaie] = useState<CyclePaie>("QUINZAINE");

  // Générer le code automatiquement à l'ouverture de la modale
  useEffect(() => {
    if (ouvert && !code) {
      chargerCodeProjet();
    }
  }, [ouvert]);

  const chargerCodeProjet = async () => {
    setCodeLoading(true);
    try {
      const codeGenere = await genererCodeProjet();
      setCode(codeGenere);
    } catch (error) {
      toast.error("Erreur lors de la génération du code");
    } finally {
      setCodeLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!code.trim()) {
      toast.error("Le code projet est requis");
      return;
    }

    if (!nom.trim()) {
      toast.error("Le nom du projet est requis");
      return;
    }

    startTransition(async () => {
      try {
        const projet = await creerProjet({
          code: code.trim(),
          nom: nom.trim(),
          description: description.trim() || undefined,
          maitreOuvrage: maitreOuvrage.trim() || undefined,
          localisation: localisation.trim() || undefined,
          montantMarche: montantMarche ? parseFloat(montantMarche) : undefined,
          dateDebut: dateDebut ? new Date(dateDebut) : undefined,
          dateFin: dateFin ? new Date(dateFin) : undefined,
          cyclePaie,
        });

        toast.success("Projet créé avec succès");
        
        // Réinitialiser
        setCode("");
        setNom("");
        setDescription("");
        setMaitreOuvrage("");
        setLocalisation("");
        setMontantMarche("");
        setDateDebut("");
        setDateFin("");
        setCyclePaie("QUINZAINE");
        
        onClose();
        router.refresh();
        
        // Rediriger vers le projet créé
        router.push(`/projets/${projet.id}`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Erreur lors de la création");
      }
    });
  };

  return (
    <Dialog open={ouvert} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader
          className="border-b border-border px-6 py-4 sticky top-0 bg-white z-10"
          style={{ backgroundColor: "var(--primary-soft)" }}
        >
          <DialogTitle className="text-xl font-semibold text-[#1D186C]">
            Nouveau projet
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            Créer un nouveau projet de chantier
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-4">
          {/* Code et Nom */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code" className="text-sm font-medium">
                Code projet <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="CH-2026-001"
                  required
                  className="h-11"
                  disabled={codeLoading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={chargerCodeProjet}
                  disabled={codeLoading || isPending}
                  className="h-11 w-11 shrink-0"
                  title="Régénérer le code"
                >
                  <RefreshCw className={`size-4 ${codeLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Code unique auto-généré (modifiable)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nom" className="text-sm font-medium">
                Nom du projet <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Construction du bâtiment A"
                required
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Nom descriptif du projet
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description détaillée du projet..."
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Maître d'ouvrage et Localisation */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maitreOuvrage" className="text-sm font-medium">
                Maître d'ouvrage
              </Label>
              <Input
                id="maitreOuvrage"
                value={maitreOuvrage}
                onChange={(e) => setMaitreOuvrage(e.target.value)}
                placeholder="Nom du maître d'ouvrage"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="localisation" className="text-sm font-medium">
                Localisation
              </Label>
              <Input
                id="localisation"
                value={localisation}
                onChange={(e) => setLocalisation(e.target.value)}
                placeholder="Abidjan, Cocody, Angré 8e tranche"
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Adresse du chantier
              </p>
            </div>
          </div>

          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="montantMarche" className="text-sm font-medium">
              Montant du marché (FCFA)
            </Label>
            <Input
              id="montantMarche"
              type="number"
              value={montantMarche}
              onChange={(e) => setMontantMarche(e.target.value)}
              placeholder="50000000"
              className="h-11 tabular-nums"
              min="0"
              step="1"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateDebut" className="text-sm font-medium">
                Date de début
              </Label>
              <Input
                id="dateDebut"
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFin" className="text-sm font-medium">
                Date de fin prévue
              </Label>
              <Input
                id="dateFin"
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="h-11"
                min={dateDebut}
              />
            </div>
          </div>

          {/* Cycle de paie */}
          <div className="space-y-2">
            <Label htmlFor="cyclePaie" className="text-sm font-medium">
              Cycle de paie <span className="text-destructive">*</span>
            </Label>
            <Select
              value={cyclePaie}
              onValueChange={(value) => setCyclePaie(value as CyclePaie)}
              required
            >
              <SelectTrigger id="cyclePaie" className="h-11">
                <SelectValue placeholder="Sélectionner un cycle de paie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="JOURNALIER">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Journalier</span>
                    <span className="text-xs text-muted-foreground">Paie quotidienne</span>
                  </div>
                </SelectItem>
                <SelectItem value="HEBDOMADAIRE">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Hebdomadaire</span>
                    <span className="text-xs text-muted-foreground">Paie chaque semaine</span>
                  </div>
                </SelectItem>
                <SelectItem value="QUINZAINE">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Quinzaine</span>
                    <span className="text-xs text-muted-foreground">Paie tous les 15 jours</span>
                  </div>
                </SelectItem>
                <SelectItem value="MENSUEL">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Mensuel</span>
                    <span className="text-xs text-muted-foreground">Paie en fin de mois</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Fréquence de paie du projet
            </p>
          </div>

          <DialogFooter className="gap-2 px-6 py-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="rounded-full"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-[#13850b] hover:bg-[#0f6909] text-white rounded-full"
            >
              {isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
              Créer le projet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
