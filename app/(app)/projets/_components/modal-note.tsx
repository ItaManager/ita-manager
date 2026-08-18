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
import { Checkbox } from "@/components/ui/checkbox";
import { creerNoteProjet, modifierNoteProjet } from "@/lib/actions/projets";
import { toast } from "sonner";

interface ModalNoteProps {
  projetId: string;
  note?: {
    id: string;
    type: string;
    titre?: string | null;
    contenu: string;
    epinglee: boolean;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

const TYPE_OPTIONS = [
  { value: "GENERALE", label: "Générale" },
  { value: "TECHNIQUE", label: "Technique" },
  { value: "QUALITE", label: "Qualité" },
  { value: "SECURITE", label: "Sécurité" },
  { value: "ADMINISTRATIVE", label: "Administrative" },
  { value: "REUNION", label: "Réunion" },
];

export function ModalNote({ projetId, note, onClose, onSuccess }: ModalNoteProps) {
  const [type, setType] = useState<string>(note?.type || "GENERALE");
  const [titre, setTitre] = useState(note?.titre || "");
  const [contenu, setContenu] = useState(note?.contenu || "");
  const [epinglee, setEpinglee] = useState(note?.epinglee || false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (note) {
      setType(note.type);
      setTitre(note.titre || "");
      setContenu(note.contenu);
      setEpinglee(note.epinglee);
    }
  }, [note]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!contenu.trim()) {
      toast.error("Le contenu est obligatoire");
      return;
    }

    setLoading(true);

    try {
      if (note?.id) {
        // Modification
        await modifierNoteProjet(note.id, {
          type: type as any,
          titre: titre.trim() || undefined,
          contenu: contenu.trim(),
        });
        toast.success("Note modifiée avec succès");
      } else {
        // Création
        await creerNoteProjet({
          projetId,
          type: type as any,
          titre: titre.trim() || undefined,
          contenu: contenu.trim(),
          epinglee,
        });
        toast.success("Note créée avec succès");
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
      <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl mx-4">
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">
            {note?.id ? "Modifier la note" : "Nouvelle note"}
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
            <Select value={type} onValueChange={setType}>
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
          </div>

          {/* Titre (optionnel) */}
          <div className="space-y-2">
            <Label htmlFor="titre">Titre (optionnel)</Label>
            <Input
              id="titre"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex: Réunion de coordination du 12 mars"
              className="rounded-md"
            />
          </div>

          {/* Contenu */}
          <div className="space-y-2">
            <Label htmlFor="contenu">
              Contenu <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="contenu"
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              placeholder="Décrivez l'observation, le compte-rendu ou la note technique..."
              rows={6}
              className="rounded-md resize-none"
            />
          </div>

          {/* Épingler (uniquement à la création) */}
          {!note?.id && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="epinglee"
                checked={epinglee}
                onCheckedChange={(checked) => setEpinglee(checked as boolean)}
              />
              <Label
                htmlFor="epinglee"
                className="text-sm font-normal cursor-pointer"
              >
                Épingler cette note (affichée en priorité)
              </Label>
            </div>
          )}

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
              {loading ? "En cours..." : note?.id ? "Enregistrer" : "Créer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
