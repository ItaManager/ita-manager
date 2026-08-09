"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, FileText, X } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface DemandeConge {
  id: string;
  type: string;
  dateDebut: string;
  dateFin: string;
  dureeJours: number;
  statut: "ATTENTE_N1" | "ATTENTE_RH";
  motif?: string;
  creeLe: string;
  pieceJointe?: {
    nom: string;
    url: string;
    type: string;
  };
}

interface ModaleDemandesEmployeProps {
  ouvert: boolean;
  onClose: () => void;
  employeId: string;
  nom: string;
  prenom: string;
}

export function ModaleDemandesEmploye({
  ouvert,
  onClose,
  employeId,
  nom,
  prenom,
}: ModaleDemandesEmployeProps) {
  const [demandeEnRefus, setDemandeEnRefus] = useState<string | null>(null);
  const [commentaireRefus, setCommentaireRefus] = useState("");

  // TODO: Remplacer par vraies données
  const demandes: DemandeConge[] = [
    {
      id: "1",
      type: "Congé annuel",
      dateDebut: "15/08/2026",
      dateFin: "29/08/2026",
      dureeJours: 10,
      statut: "ATTENTE_N1",
      motif: "Vacances familiales",
      creeLe: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "2",
      type: "Permission pour événement familial",
      dateDebut: "12/08/2026",
      dateFin: "12/08/2026",
      dureeJours: 1,
      statut: "ATTENTE_N1",
      motif: "Mariage d'un proche",
      creeLe: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      pieceJointe: {
        nom: "invitation_mariage.pdf",
        url: "#",
        type: "application/pdf",
      },
    },
  ];

  const handleRefuser = (demandeId: string) => {
    setDemandeEnRefus(demandeId);
    setCommentaireRefus("");
  };

  const handleConfirmerRefus = (demandeId: string) => {
    if (commentaireRefus.trim().length < 10) {
      return; // Validation visuelle déjà présente
    }
    // TODO: Appeler l'action server pour refuser
    console.log("Refus confirmé:", demandeId, commentaireRefus);
    setDemandeEnRefus(null);
    setCommentaireRefus("");
  };

  const handleAnnulerRefus = () => {
    setDemandeEnRefus(null);
    setCommentaireRefus("");
  };

  const getStatutBadge = (statut: string) => {
    if (statut === "ATTENTE_N1") {
      return (
        <Badge variant="outline" className="border-orange-500 bg-orange-50 text-orange-700 text-xs">
          En attente N+1
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-blue-500 bg-blue-50 text-blue-700 text-xs">
        En attente RH
      </Badge>
    );
  };

  return (
    <Dialog open={ouvert} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="border-b border-border px-6 py-4" style={{ backgroundColor: 'var(--primary-soft)' }}>
          <DialogTitle className="text-xl font-semibold text-[#1D186C]">
            Demandes à traiter
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            {nom} {prenom} · {demandes.length} demande{demandes.length > 1 ? 's' : ''} en attente
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4">
          <div className="space-y-4">
            {demandes.map((demande) => (
              <div
                key={demande.id}
                className="rounded-lg border border-border bg-card p-4"
              >
                {/* En-tête demande */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-foreground">
                        {demande.type}
                      </h3>
                      {getStatutBadge(demande.statut)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Créée {new Date(demande.creeLe).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {/* Période et durée */}
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="flex items-start gap-2">
                    <Calendar className="size-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-foreground">Période</p>
                      <p className="text-xs text-muted-foreground">
                        {demande.dateDebut}
                        {demande.dateDebut !== demande.dateFin && ` → ${demande.dateFin}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="size-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-foreground">Durée</p>
                      <p className="text-xs text-muted-foreground">
                        {demande.dureeJours} jour{demande.dureeJours > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Motif */}
                {demande.motif && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-foreground mb-1">Motif</p>
                    <p className="text-xs text-muted-foreground">{demande.motif}</p>
                  </div>
                )}

                {/* Pièce jointe (permissions) */}
                {demande.pieceJointe && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-foreground mb-1">Pièce jointe</p>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <button className="flex items-center gap-2 px-3 py-2 rounded-md border border-border hover:bg-muted/50 transition-colors">
                          <FileText className="size-4 text-muted-foreground" />
                          <span className="text-xs text-foreground">{demande.pieceJointe.nom}</span>
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Aperçu du document</p>
                          <div className="aspect-[4/3] bg-muted rounded-md flex items-center justify-center">
                            <FileText className="size-12 text-muted-foreground" />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {demande.pieceJointe.nom} • PDF
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                )}

                {/* Zone de refus avec commentaire */}
                {demandeEnRefus === demande.id ? (
                  <div className="space-y-3 pt-3 border-t border-border">
                    <div className="space-y-2">
                      <Label htmlFor={`commentaire-${demande.id}`} className="text-xs font-medium">
                        Motif du refus <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        id={`commentaire-${demande.id}`}
                        value={commentaireRefus}
                        onChange={(e) => setCommentaireRefus(e.target.value)}
                        placeholder="Expliquez pourquoi vous refusez cette demande..."
                        rows={3}
                        className="text-xs"
                      />
                      <p className="text-xs text-muted-foreground">
                        {commentaireRefus.trim().length}/10 caractères minimum
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleAnnulerRefus}
                        className="h-8 text-xs"
                      >
                        <X className="size-3 mr-1" />
                        Annuler
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleConfirmerRefus(demande.id)}
                        disabled={commentaireRefus.trim().length < 10}
                        className="h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
                      >
                        Confirmer le refus
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Actions normales */
                  <div className="flex items-center gap-2 pt-3 border-t border-border">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRefuser(demande.id)}
                      className="h-8 text-xs border-red-500 text-red-700 hover:bg-red-50"
                    >
                      Refuser
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 text-xs bg-[#13850b] hover:bg-[#0f6909] text-white"
                    >
                      Approuver
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
