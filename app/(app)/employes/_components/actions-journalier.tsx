"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Award, Eye, History, Archive, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";

interface ActionsJournalierProps {
  employeId: string;
  employeNom: string;
  employePrenom: string;
}

export function ActionsJournalier({
  employeId,
  employeNom,
  employePrenom,
}: ActionsJournalierProps) {
  const router = useRouter();
  const [ouvertModifier, setOuvertModifier] = useState(false);
  const [ouvertCompetence, setOuvertCompetence] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* Bouton Modifier */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOuvertModifier(true)}
        className="h-8 px-3 text-xs"
        title="Modifier le profil"
      >
        <Edit className="size-4 mr-1" />
        Modifier
      </Button>

      {/* Bouton Assigner compétence */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOuvertCompetence(true)}
        className="h-8 px-3 text-xs border-[#13850b] text-[#13850b] hover:bg-[#13850b] hover:text-white"
        title="Assigner une compétence (requis pour la paie)"
      >
        <Award className="size-4 mr-1" />
        Compétence
      </Button>

      {/* Menu actions supplémentaires */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => router.push(`/employes/${employeId}`)}>
            <Eye className="size-4 mr-2" />
            Voir le profil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => console.log("Historique missions")}>
            <History className="size-4 mr-2" />
            Historique missions
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => console.log("Archiver")}
            className="text-destructive focus:text-destructive"
          >
            <Archive className="size-4 mr-2" />
            Archiver
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* TODO: Modales à implémenter */}
      {/* <ModaleModifierJournalier ... /> */}
      {/* <ModaleAssignerCompetence ... /> */}
    </div>
  );
}
