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

  return (
    <div className="flex items-center gap-2">
      {/* Bouton icône Modifier */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOuvertModifier(true)}
        className="h-8 w-8"
        title="Modifier le profil"
      >
        <Pencil className="size-4" />
      </Button>

      {/* Menu actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setOuvertModifier(true)}>
            <Pencil className="size-4 mr-2" />
            Modifier
          </DropdownMenuItem>
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
    </div>
  );
}
