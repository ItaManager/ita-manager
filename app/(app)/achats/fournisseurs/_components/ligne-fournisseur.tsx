"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Pencil, Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { archiverFournisseur } from "@/lib/actions/achats";
import { ModaleFournisseur } from "./modale-fournisseur";

interface LigneFournisseurProps {
  fournisseur: {
    id: string;
    nom: string;
    numeroWave: string | null;
    actif: boolean;
  };
}

export function LigneFournisseur({ fournisseur }: LigneFournisseurProps) {
  const router = useRouter();
  const [numeroVisible, setNumeroVisible] = useState(false);
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [archivageEnCours, setArchivageEnCours] = useState(false);

  async function handleArchiver() {
    setArchivageEnCours(true);
    try {
      await archiverFournisseur(fournisseur.id, !fournisseur.actif);
      toast.success(
        fournisseur.actif
          ? `Fournisseur "${fournisseur.nom}" archivé`
          : `Fournisseur "${fournisseur.nom}" réactivé`
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'opération"
      );
    } finally {
      setArchivageEnCours(false);
    }
  }

  return (
    <>
      <tr className="border-b last:border-0 hover:bg-muted/30">
        <td className="px-6 py-3 text-sm font-medium">{fournisseur.nom}</td>
        <td className="px-6 py-3 text-sm">
          {fournisseur.numeroWave ? (
            <div className="flex items-center gap-2">
              <span className="font-mono">
                {numeroVisible ? fournisseur.numeroWave : "••••••••"}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="size-8 p-0"
                onClick={() => setNumeroVisible(!numeroVisible)}
                aria-label={
                  numeroVisible ? "Masquer le numéro" : "Afficher le numéro"
                }
              >
                {numeroVisible ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </Button>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </td>
        <td className="px-6 py-3 text-sm">
          {fournisseur.actif ? (
            <span className="statut statut-succes">Actif</span>
          ) : (
            <span className="statut statut-neutre">Inactif</span>
          )}
        </td>
        <td className="px-6 py-3 text-right">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setModaleOuverte(true)}
              aria-label="Modifier le fournisseur"
            >
              <Pencil className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleArchiver}
              disabled={archivageEnCours}
              aria-label={
                fournisseur.actif
                  ? "Archiver le fournisseur"
                  : "Réactiver le fournisseur"
              }
            >
              {fournisseur.actif ? (
                <Archive className="size-4" aria-hidden="true" />
              ) : (
                <ArchiveRestore className="size-4" aria-hidden="true" />
              )}
            </Button>
          </div>
        </td>
      </tr>

      <ModaleFournisseur
        ouvert={modaleOuverte}
        onFermer={() => setModaleOuverte(false)}
        fournisseur={fournisseur}
      />
    </>
  );
}
