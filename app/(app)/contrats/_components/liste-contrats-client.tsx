"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, RefreshCw } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ModalDetailContrat } from "./modal-detail-contrat";
import { ModaleRenouvelerContrat } from "./modale-renouveler-contrat";

interface Contrat {
  id: string;
  employe: {
    id: string;
    nom: string;
    prenom: string;
    matricule: string;
    typeMainOeuvre: string;
  };
  typeContrat: string;
  dateDebut: Date;
  dateFin?: Date;
  salaire?: number;
  derniersAvenants: number;
  actif: boolean;
  niveauAlerte: "danger" | "warning" | null;
  documentUrl?: string;
}

interface ListeContratsClientProps {
  contrats: Contrat[];
}

export function ListeContratsClient({ contrats }: ListeContratsClientProps) {
  const [contratSelectionne, setContratSelectionne] = useState<Contrat | null>(null);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [modalRenouvellementOuvert, setModalRenouvellementOuvert] = useState(false);
  const [contratARenouveler, setContratARenouveler] = useState<Contrat | null>(null);

  const getInitials = (nom: string, prenom: string) => {
    return `${nom[0]}${prenom[0]}`.toUpperCase();
  };

  const calculerJoursRestants = (dateFin?: Date): number | null => {
    if (!dateFin) return null;
    const now = new Date();
    const fin = new Date(dateFin);
    const diff = fin.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getBadgeEcheance = (joursRestants: number | null) => {
    if (joursRestants === null) {
      return (
        <Badge variant="outline" className="bg-primary-soft text-primary border-primary/20">
          CDI
        </Badge>
      );
    }

    if (joursRestants < 30) {
      return (
        <Badge variant="destructive" className="gap-1.5">
          CRITIQUE - {joursRestants}j
        </Badge>
      );
    }

    if (joursRestants < 60) {
      return (
        <Badge className="gap-1.5 bg-warning-soft text-warning border-warning/20">
          ALERTE - {joursRestants}j
        </Badge>
      );
    }

    return (
      <Badge className="gap-1.5 bg-success-soft text-success border-success/20">
        OK - {joursRestants}j
      </Badge>
    );
  };

  const ouvrirDetail = (contrat: Contrat) => {
    setContratSelectionne(contrat);
    setModalOuvert(true);
  };

  const fermerModal = () => {
    setModalOuvert(false);
    setTimeout(() => setContratSelectionne(null), 200);
  };

  const handleRenouveler = (contrat: Contrat) => {
    setContratARenouveler(contrat);
    setModalRenouvellementOuvert(true);
    fermerModal();
  };

  const fermerModalRenouvellement = () => {
    setModalRenouvellementOuvert(false);
    setTimeout(() => setContratARenouveler(null), 200);
  };

  return (
    <>
      <tbody>
        {contrats.length === 0 ? (
          <tr>
            <td colSpan={6} className="py-12 text-center text-muted-foreground">
              <div className="text-muted-foreground">Aucun contrat trouvé</div>
              <p className="text-sm text-muted-foreground mt-1">
                Les contrats apparaîtront ici une fois les employés créés
              </p>
            </td>
          </tr>
        ) : (
          contrats.map((contrat) => {
            const joursRestants = calculerJoursRestants(contrat.dateFin);
            return (
              <tr
                key={contrat.id}
                className="border-b border-border hover:bg-muted/50 transition-colors"
              >
                <td className="py-3 px-4">
                  <Link
                    href={`/employes/${contrat.employe.id}?onglet=contrats`}
                    className="flex items-center gap-3 hover:opacity-80"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium text-white" style={{ backgroundColor: '#13850b' }}>
                      {getInitials(contrat.employe.nom, contrat.employe.prenom)}
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {contrat.employe.nom} {contrat.employe.prenom}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {contrat.employe.matricule}
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="py-3 px-4 text-sm">
                  {contrat.typeContrat === "CDD" ? (
                    <Badge variant="secondary" className="bg-warning-soft text-warning border-warning/20">
                      CDD
                    </Badge>
                  ) : contrat.typeContrat === "CDI" ? (
                    <Badge className="border-[#13850b]/20" style={{ backgroundColor: '#e8f5e9', color: '#13850b' }}>
                      CDI
                    </Badge>
                  ) : (
                    <Badge variant="outline">{contrat.typeContrat}</Badge>
                  )}
                </td>
                <td className="py-3 px-4 text-sm text-muted-foreground">
                  {format(new Date(contrat.dateDebut), "dd/MM/yyyy", { locale: fr })}
                </td>
                <td className="py-3 px-4 text-sm text-muted-foreground">
                  {contrat.dateFin ? (
                    format(new Date(contrat.dateFin), "dd/MM/yyyy", { locale: fr })
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-3 px-4">{getBadgeEcheance(joursRestants)}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => ouvrirDetail(contrat)}
                      className="h-8 px-2"
                    >
                      <Eye className="size-4" />
                    </Button>
                    {contrat.actif && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRenouveler(contrat)}
                        className="h-8 px-2"
                        title="Renouveler le contrat"
                      >
                        <RefreshCw className="size-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </tbody>

      <ModalDetailContrat
        contrat={contratSelectionne}
        ouvert={modalOuvert}
        onFermer={fermerModal}
        onRenouveler={handleRenouveler}
      />

      <ModaleRenouvelerContrat
        contrat={contratARenouveler}
        ouvert={modalRenouvellementOuvert}
        onFermer={fermerModalRenouvellement}
      />
    </>
  );
}
