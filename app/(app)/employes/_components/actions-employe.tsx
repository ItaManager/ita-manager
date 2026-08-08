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
import { Pencil, Eye, Archive, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { ModaleModificationEmploye } from "./modale-modification-employe";
import { ModaleArchiverEmploye } from "./modale-archiver-employe";

interface ActionsEmployeProps {
  employeId: string;
  employeNom: string;
  employePrenom: string;
  nationalites: Array<{ id: string; libelle: string }>;
}

export function ActionsEmploye({
  employeId,
  employeNom,
  employePrenom,
  nationalites,
}: ActionsEmployeProps) {
  const router = useRouter();
  const [ouvertModifier, setOuvertModifier] = useState(false);
  const [ouvertArchiver, setOuvertArchiver] = useState(false);

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
          <DropdownMenuItem onClick={() => router.push(`/employes/${employeId}`)} className="cursor-pointer">
            <Eye className="size-4 mr-2" />
            Voir le profil
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setOuvertArchiver(true)}
            className="text-destructive focus:text-destructive cursor-pointer"
          >
            <Archive className="size-4 mr-2" />
            Archiver
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modales */}
      <ModaleModificationEmploye
        ouvert={ouvertModifier}
        onFermer={() => setOuvertModifier(false)}
        employeId={employeId}
        nationalites={nationalites}
      />

      <ModaleArchiverEmploye
        ouvert={ouvertArchiver}
        onClose={() => setOuvertArchiver(false)}
        employeId={employeId}
        employeNom={employeNom}
        employePrenom={employePrenom}
      />
    </div>
  );
}
