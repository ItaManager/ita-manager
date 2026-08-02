"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle2, UserPlus, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { demarrerTransport, terminerTransport } from "@/lib/actions/transport";
import { toast } from "sonner";

type DemandeInfo = {
  id: string;
  reference?: string;
  statut: string;
  chauffeur?: { id: string; nom: string; prenom: string } | null;
};

type BoutonsActionsProps = {
  demande: DemandeInfo;
};

export function BoutonsActions({ demande }: BoutonsActionsProps) {
  const router = useRouter();
  const [enChargement, setEnChargement] = useState(false);

  const handleDemarrer = async () => {
    setEnChargement(true);
    try {
      await demarrerTransport(demande.id);
      toast.success("Transport démarré");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du démarrage");
    } finally {
      setEnChargement(false);
    }
  };

  const handleTerminer = async () => {
    setEnChargement(true);
    try {
      await terminerTransport(demande.id);
      toast.success("Transport terminé");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la terminaison");
    } finally {
      setEnChargement(false);
    }
  };

  // Afficher les boutons en fonction du statut
  const peutDemarrer = demande.statut === "AFFECTEE" && demande.chauffeur;
  const peutTerminer = demande.statut === "EN_COURS";
  const peutAffecter = demande.statut === "EN_ATTENTE" || demande.statut === "APPROUVEE";

  if (!peutDemarrer && !peutTerminer && !peutAffecter) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {peutAffecter && (
        <Button disabled variant="outline">
          <UserPlus className="h-4 w-4 mr-2" />
          Affecter chauffeur
        </Button>
      )}

      {peutDemarrer && (
        <Button onClick={handleDemarrer} disabled={enChargement}>
          <Play className="h-4 w-4 mr-2" />
          Démarrer
        </Button>
      )}

      {peutTerminer && (
        <Button onClick={handleTerminer} disabled={enChargement}>
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Terminer
        </Button>
      )}
    </div>
  );
}
