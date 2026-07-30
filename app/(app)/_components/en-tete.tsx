import { createClient } from "@/lib/supabase/server";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SelecteurRole } from "./selecteur-role";
import { MenuUtilisateur } from "./menu-utilisateur";
import { Alert, AlertDescription } from "@/components/ui/alert";

export async function EnTete() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return (
    <header className="border-b bg-white">
      <div className="flex h-16 items-center gap-4 px-6">
        {/* Barre de recherche */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Rechercher un employé, un matricule, une référence, un chantier..."
            className="w-full pl-9"
          />
        </div>

        {/* Sélecteur de rôle */}
        <SelecteurRole />

        {/* Menu utilisateur */}
        <MenuUtilisateur user={user} />
      </div>
    </header>
  );
}
