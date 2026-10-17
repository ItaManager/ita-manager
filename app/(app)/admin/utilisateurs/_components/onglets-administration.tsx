"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Shield } from "lucide-react";
import { ListeUtilisateursClient } from "./liste-utilisateurs-client";
import { ListeRolesClient } from "./liste-roles-client";

interface OngletsAdministrationProps {
  utilisateursInitiaux: any[];
  rolesDisponibles: any[];
  rolesInitiaux: any[];
  permissionsInitiales: any[];
}

export function OngletsAdministration({
  utilisateursInitiaux,
  rolesDisponibles,
  rolesInitiaux,
  permissionsInitiales,
}: OngletsAdministrationProps) {
  return (
    <Tabs defaultValue="utilisateurs" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
        <TabsTrigger value="utilisateurs" className="gap-2">
          <Users className="size-4" />
          Utilisateurs
        </TabsTrigger>
        <TabsTrigger value="roles" className="gap-2">
          <Shield className="size-4" />
          Rôles & Permissions
        </TabsTrigger>
      </TabsList>

      <TabsContent value="utilisateurs" className="mt-0">
        <ListeUtilisateursClient
          utilisateursInitiaux={utilisateursInitiaux}
          rolesDisponibles={rolesDisponibles}
        />
      </TabsContent>

      <TabsContent value="roles" className="mt-0">
        <ListeRolesClient
          rolesInitiaux={rolesInitiaux}
          permissionsInitiales={permissionsInitiales}
        />
      </TabsContent>
    </Tabs>
  );
}
