"use client";

import type { User } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User as UserIcon, LogOut, Settings } from "lucide-react";
import { deconnecter } from "@/lib/actions/auth";

interface MenuUtilisateurProps {
  user: User;
}

export function MenuUtilisateur({ user }: MenuUtilisateurProps) {
  // Extraire initiales du nom
  const initiales = user.email
    ?.split("@")[0]
    .split(".")
    .map((n) => n[0]?.toUpperCase())
    .join("")
    .slice(0, 2) || "AT";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2" size="sm">
          <div className="flex size-8 items-center justify-center rounded-full bg-green-600 text-xs font-semibold text-white">
            {initiales}
          </div>
          <div className="text-left">
            <div className="text-sm font-medium">Aïcha Traoré</div>
            <div className="text-xs text-muted-foreground">
              Directrice Administrative et RH
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="text-sm">Connecté en tant que</div>
          <div className="text-xs font-normal text-muted-foreground">
            {user.email}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <UserIcon className="mr-2 size-4" aria-hidden="true" />
          Mon profil
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 size-4" aria-hidden="true" />
          Paramètres
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={deconnecter} className="w-full">
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center justify-start"
            >
              <LogOut className="mr-2 size-4" aria-hidden="true" />
              Déconnexion
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
