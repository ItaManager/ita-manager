"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
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
import { creerRisqueIncident, modifierRisqueIncident } from "@/lib/actions/projets";
import { toast } from "sonner";

interface ModalRisqueProps {
  projetId: string;
  risque?: {
    id: string;
    type: string;
    gravite: string;
    titre: string;
    description?: string | null;
    mesures?: string | null;
    responsableId?: string | null;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

const TYPE_OPTIONS = [
  { value: "RISQUE", label: "Risque" },
  { value: "INCIDENT", label: "Incident" },
];

const GRAVITE_OPTIONS = [
  { value: "FAIBLE", label: "Faible" },
  { value: "MOYENNE", label: "Moyenne" },
  { value: "ELEVEE", label: "Élevée" },
  { value: "CRITIQUE", label: "Critique" },
];

export function ModalRisque({ projetId, risque, onClose, onSuccess }: ModalRisqueProps) {
  const [type, setType] = useState<string>(risque?.type || "RISQUE");
  const [gravite, setGravite] = useState<string>(risque?.gravite || "MOYENNE");
  const [titre, setTitre] = useState(risque?.titre || "");
  const [description, setDescription] = useState(risque?.description || "");
  const [mesures, setMesures] = useState(risque?.mesures || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (risque) {
      setType(risque.type);
      setGravite(risque.gravite);
      setTitre(risque.titre);
      setDescription(risque.description || "");
      setMesures(risque.mesures || "");
    }
  }, [risque]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titre.trim()) {
      toast.error("Le titre est obligatoire");
      return;
    }

    setLoading(true);

    try {
      if (risque?.id) {
        // Modification
        await modifierRisqueIncident(risque.id, {
          gravite: gravite as any,
          titre: titre.trim(),
          description: description.trim() || undefined,
          mesures: mesures.trim() || undefined,
        });
        toast.success("Risque/incident modifié avec succès");
      } else {
        // Création
        await creerRisqueIncident({
          projetId,
          type: type as any,
          gravite: gravite as any,
          titre: titre.trim(),
          description: description.trim() || undefined,
          mesures: mesures.trim() || undefined,
        });
        toast.success("Risque/incident créé avec succès");
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-background">
          <h2 className="text-lg font-semibold">
            {risque?.id ? "Modifier le risque/incident" : "Nouveau risque/incident"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">
              Type <span className="text-red-500">*</span>
            </Label>
            <Select value={type} onValueChange={setType} disabled={!!risque?.id}>
              <SelectTrigger id="type" className="rounded-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {risque?.id
                ? "Le type ne peut pas être modifié après la création"
                : "Un risque est une menace potentielle, un incident est survenu"}
            </p>
          </div>

          {/* Gravité */}
          <div className="space-y-2">
            <Label htmlFor="gravite">
              Gravité <span className="text-red-500">*</span>
            </Label>
            <Select value={gravite} onValueChange={setGravite}>
              <SelectTrigger id="gravite" className="rounded-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GRAVITE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="titre">
              Titre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="titre"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex: Retard livraison matériaux"
              className="rounded-md"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optionnel)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le risque ou l'incident en détail..."
              rows={4}
              className="rounded-md resize-none"
            />
          </div>

          {/* Mesures prises */}
          <div className="space-y-2">
            <Label htmlFor="mesures">Mesures prises ou prévues (optionnel)</Label>
            <Textarea
              id="mesures"
              value={mesures}
              onChange={(e) => setMesures(e.target.value)}
              placeholder="Actions mises en place pour traiter ce risque/incident..."
              rows={4}
              className="rounded-md resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="rounded-full"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-full bg-[#13850b] hover:bg-[#0f6909] text-white"
            >
              {loading ? "En cours..." : risque?.id ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
