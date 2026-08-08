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
import { Pencil, Eye, Archive, MoreVertical, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { ModaleModificationEmploye } from "./modale-modification-employe";
import { ModaleArchiverEmploye } from "./modale-archiver-employe";
import { ModaleCreerCompte } from "./modale-creer-compte";

interface ActionsEmployeProps {
  employeId: string;
  employeNom: string;
  employePrenom: string;
  email?: string | null;
  aCompte: boolean;
  nationalites: Array<{ id: string; libelle: string }>;
}

export function ActionsEmploye({
  employeId,
  employeNom,
  employePrenom,
  email,
  aCompte,
  nationalites,
}: ActionsEmployeProps) {
  const router = useRouter();
  const [ouvertModifier, setOuvertModifier] = useState(false);
  const [ouvertArchiver, setOuvertArchiver] = useState(false);
  const [ouvertCreerCompte, setOuvertCreerCompte] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* Menu actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setOuvertModifier(true)} className="cursor-pointer">
            <Pencil className="size-4 mr-2" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push(`/employes/${employeId}`)} className="cursor-pointer">
            <Eye className="size-4 mr-2" />
            Voir le profil
          </DropdownMenuItem>

          {!aCompte && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setOuvertCreerCompte(true)}
                className="cursor-pointer text-[#13850b] focus:text-[#13850b]"
              >
                <UserPlus className="size-4 mr-2" />
                Créer un compte d'accès
              </DropdownMenuItem>
            </>
          )}

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

      <ModaleCreerCompte
        ouvert={ouvertCreerCompte}
        onClose={() => setOuvertCreerCompte(false)}
        employeId={employeId}
        employeNom={employeNom}
        employePrenom={employePrenom}
        emailInitial={email || undefined}
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
