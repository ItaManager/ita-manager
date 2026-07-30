"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Download } from "lucide-react";

interface EmployeListItem {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  email?: string | null;
  reference?: string | null; // Code de référence (ex: DG-001)
  typeMainOeuvre: "PERMANENT" | "JOURNALIER";
  posteActuel?: {
    libelle: string;
    service?: { libelle: string };
    direction: { libelle: string };
  };
  typeContrat?: string | null;
  salaire?: number | null;
  completudeDossier: number;
  actif: boolean;
}

interface LigneEmployeProps {
  employe: EmployeListItem;
}

export function LigneEmploye({ employe }: LigneEmployeProps) {
  // Statut du profil basé sur la complétude
  const getStatutBadge = (completude: number) => {
    if (completude === 100) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Profil complet
        </Badge>
      );
    } else if (completude >= 50) {
      return (
        <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
          En attente
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          Profil incomplet
        </Badge>
      );
    }
  };

  // Badge type de contrat
  const getContratBadge = (type?: string | null) => {
    if (!type) return <Badge variant="outline">—</Badge>;

    const colors: Record<string, string> = {
      CDI: "bg-blue-100 text-blue-800",
      CDD: "bg-purple-100 text-purple-800",
      INTERIM: "bg-gray-100 text-gray-800",
      STAGE: "bg-yellow-100 text-yellow-800",
    };

    return (
      <Badge className={`${colors[type] || "bg-gray-100 text-gray-800"} hover:${colors[type]}`}>
        {type}
      </Badge>
    );
  };

  return (
    <div className="grid grid-cols-[200px_120px_100px_180px_200px_180px_100px_120px_120px_100px] gap-3 px-4 py-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100">
      {/* EMPLOYÉ (Nom + Email) */}
      <div className="self-center">
        <p className="font-semibold text-gray-900">
          {employe.nom} {employe.prenom}
        </p>
        {employe.email && (
          <p className="text-xs text-gray-500 mt-0.5">{employe.email}</p>
        )}
      </div>

      {/* MATRICULE ITA */}
      <div className="font-mono text-xs text-gray-600 self-center">
        {employe.matricule}
      </div>

      {/* RÉFÉRENCE (lien bleu) */}
      <div className="self-center">
        {employe.reference ? (
          <Link
            href={`/employes/${employe.id}`}
            className="text-blue-600 hover:text-blue-800 font-medium text-xs"
          >
            {employe.reference}
          </Link>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        )}
      </div>

      {/* DIRECTION */}
      <div className="text-xs text-gray-700 self-center truncate">
        {employe.posteActuel?.direction.libelle || "—"}
      </div>

      {/* SERVICE */}
      <div className="text-xs text-gray-700 self-center truncate">
        {employe.posteActuel?.service?.libelle || "—"}
      </div>

      {/* POSTE */}
      <div className="text-xs text-gray-700 self-center truncate">
        {employe.posteActuel?.libelle || "—"}
      </div>

      {/* CONTRAT */}
      <div className="self-center">
        {getContratBadge(employe.typeContrat)}
      </div>

      {/* SALAIRE */}
      <div className="text-xs text-gray-700 self-center font-medium">
        {employe.salaire !== undefined && employe.salaire !== null
          ? `${employe.salaire.toLocaleString("fr-FR")} F`
          : "—"}
      </div>

      {/* STATUT */}
      <div className="self-center">
        {getStatutBadge(employe.completudeDossier)}
      </div>

      {/* ACTIONS */}
      <div className="flex items-center justify-end gap-1 self-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          asChild
        >
          <Link href={`/employes/${employe.id}`}>
            <Eye className="h-4 w-4" />
            <span className="sr-only">Voir</span>
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          asChild
        >
          <Link href={`/employes/${employe.id}/modifier`}>
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Modifier</span>
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <Download className="h-4 w-4" />
          <span className="sr-only">Télécharger</span>
        </Button>
      </div>
    </div>
  );
}
