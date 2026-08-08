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
import { Pencil, Eye, History, Archive, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { ModaleJournalier } from "./modale-journalier";
import { ModaleProfilJournalier } from "./modale-profil-journalier";
import { ModaleHistoriqueMissions } from "./modale-historique-missions";

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
  const [ouvertProfil, setOuvertProfil] = useState(false);
  const [ouvertHistorique, setOuvertHistorique] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* Menu actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setOuvertModifier(true)} className="cursor-pointer">
            <Pencil className="size-4 mr-2" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOuvertProfil(true)} className="cursor-pointer">
            <Eye className="size-4 mr-2" />
            Voir le profil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOuvertHistorique(true)} className="cursor-pointer">
            <History className="size-4 mr-2" />
            Historique missions
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => console.log("Archiver")}
            className="text-destructive focus:text-destructive cursor-pointer"
          >
            <Archive className="size-4 mr-2" />
            Archiver
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modales */}
      <ModaleJournalier
        ouvert={ouvertModifier}
        onFermer={() => setOuvertModifier(false)}
        directions={[]}
        services={[]}
        projets={[]}
        employeId={employeId}
      />

      <ModaleProfilJournalier
        ouvert={ouvertProfil}
        onClose={() => setOuvertProfil(false)}
        employeId={employeId}
        employeNom={employeNom}
        employePrenom={employePrenom}
      />

      <ModaleHistoriqueMissions
        ouvert={ouvertHistorique}
        onClose={() => setOuvertHistorique(false)}
        employeId={employeId}
        employeNom={employeNom}
        employePrenom={employePrenom}
      />
    </div>
  );
}
