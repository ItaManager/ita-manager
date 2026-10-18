"use client";

import { useState } from "react";
import type {
  LigneTableauPieces,
  TypeColonne,
  CellulePiece,
} from "@/lib/actions/logistique";
import { Lock } from "lucide-react";
import { formaterDateCivile } from "@/lib/dates";
import { ModalPiece } from "./modal-piece";

interface TableauPiecesProps {
  lignes: LigneTableauPieces[];
  colonnes: TypeColonne[];
  masquerCouts?: boolean;
}

export function TableauPieces({ lignes, colonnes, masquerCouts = false }: TableauPiecesProps) {
  const [pieceSelectionnee, setPieceSelectionnee] = useState<string | null>(
    null
  );

  function afficherCellule(cellule: CellulePiece): React.ReactNode {
    // s.o. — non applicable
    if (!cellule.applicable) {
      return (
        <span className="text-xs text-muted-foreground italic">s.o.</span>
      );
    }

    // — applicable non renseignée
    if (!cellule.piece) {
      return <span className="text-sm text-muted-foreground">—</span>;
    }

    // État avec libellé
    const { etat, libelle, piece } = cellule;

    if (etat === "PERIME") {
      return (
        <button
          onClick={() => setPieceSelectionnee(piece.id)}
          className="text-xs font-medium text-destructive hover:underline text-left"
        >
          périmé {Math.abs(Math.floor((new Date().getTime() - piece.dateExpiration.getTime()) / (1000 * 60 * 60 * 24)))} j
        </button>
      );
    }

    if (etat === "EN_ALERTE") {
      const joursRestants = Math.ceil(
        (piece.dateExpiration.getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return (
        <button
          onClick={() => setPieceSelectionnee(piece.id)}
          className="text-xs font-medium text-warning hover:underline text-left"
        >
          J−{joursRestants}
        </button>
      );
    }

    // VALIDE
    return (
      <button
        onClick={() => setPieceSelectionnee(piece.id)}
        className="text-xs text-muted-foreground hover:underline text-left"
      >
        {formaterDateCivile(piece.dateExpiration)}
      </button>
    );
  }

  return (
    <>
      <ModalPiece
        pieceId={pieceSelectionnee}
        onClose={() => setPieceSelectionnee(null)}
      />

      <div className="relative overflow-x-auto">
        <table className="tabulaire w-full">
        <thead className="sticky top-0 z-[5] bg-muted/50">
          <tr className="border-b">
            {/* Colonne 1 : Matériel (sticky left) */}
            <th className="sticky left-0 z-[10] bg-muted/50 px-4 py-3 text-left min-w-[200px]">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Matériel
              </span>
            </th>

            {/* Colonnes pièces */}
            {colonnes.map((col) => (
              <th
                key={col.id}
                className="px-4 py-3 text-left min-w-[120px] bg-muted/50"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {col.libelle}
                </span>
              </th>
            ))}

            {/* Colonne Total annuel */}
            <th className="px-4 py-3 text-right min-w-[120px] bg-muted/50">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Total annuel
              </span>
            </th>
          </tr>
        </thead>

        <tbody>
          {lignes.map((ligne) => (
            <tr key={ligne.materiel.id} className="border-b hover:bg-muted/30">
              {/* Colonne 1 : Matériel (sticky) */}
              <td className="sticky left-0 z-[5] bg-card px-4 py-3">
                <div>
                  <p className="text-sm font-medium font-mono">
                    {ligne.materiel.codeIta}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ligne.materiel.designation}
                  </p>
                </div>
              </td>

              {/* Cellules pièces */}
              {colonnes.map((col) => {
                const cellule = ligne.pieces[col.id];
                return (
                  <td
                    key={col.id}
                    className="px-4 py-3 align-top"
                  >
                    {afficherCellule(cellule)}
                  </td>
                );
              })}

              {/* Total annuel */}
              <td className="px-4 py-3 text-right align-top">
                {masquerCouts || ligne.totalAnnuel === null ? (
                  <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                    <Lock className="size-3" aria-hidden="true" />
                    <span>Masqué</span>
                  </div>
                ) : (
                  <span className="text-sm font-medium tabular-nums">
                    {ligne.totalAnnuel.toLocaleString("fr-FR")} F
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

        {lignes.length === 0 && (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Aucun matériel à afficher
          </div>
        )}
      </div>
    </>
  );
}
