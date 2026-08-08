"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, Eye, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { ModaleModificationEmploye } from "./modale-modification-employe";

interface ActionsEmployeProps {
  employeId: string;
  nationalites: Array<{ id: string; libelle: string }>;
}

export function ActionsEmploye({
  employeId,
  nationalites,
}: ActionsEmployeProps) {
  const router = useRouter();
  const [ouvertModifier, setOuvertModifier] = useState(false);

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
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modale */}
      <ModaleModificationEmploye
        ouvert={ouvertModifier}
        onFermer={() => setOuvertModifier(false)}
        employeId={employeId}
        nationalites={nationalites}
      />
    </div>
  );
}
