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
import { MoreVertical, Eye, Check, X, Edit } from "lucide-react";
import { useRouter } from "next/navigation";

interface ActionsDemandeCongesProps {
  demandeId: string;
  statut: "EN_ATTENTE" | "APPROUVE_N1" | "VALIDE_RH" | "REFUSE";
  vue: "mes-demandes" | "a-valider" | "controle-rh" | "equipe";
}

export function ActionsDemandeConges({ demandeId, statut, vue }: ActionsDemandeCongesProps) {
  const router = useRouter();

  const peutValider = vue === "a-valider" && statut === "EN_ATTENTE";
  const peutControler = vue === "controle-rh" && statut === "APPROUVE_N1";
  const peutModifier = vue === "mes-demandes" && statut === "EN_ATTENTE";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={() => router.push(`/conges-permissions/${demandeId}`)}
          className="cursor-pointer"
        >
          <Eye className="size-4 mr-2" />
          Voir les détails
        </DropdownMenuItem>

        {peutModifier && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <Edit className="size-4 mr-2" />
              Modifier
            </DropdownMenuItem>
          </>
        )}

        {peutValider && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-[#13850b] focus:text-[#13850b]">
              <Check className="size-4 mr-2" />
              Approuver
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
              <X className="size-4 mr-2" />
              Refuser
            </DropdownMenuItem>
          </>
        )}

        {peutControler && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-[#13850b] focus:text-[#13850b]">
              <Check className="size-4 mr-2" />
              Valider (RH)
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
              <X className="size-4 mr-2" />
              Rejeter
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
