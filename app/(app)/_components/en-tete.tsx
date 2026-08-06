import { createClient } from "@/lib/supabase/server";
import { Search, Bell } from "lucide-react";
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
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="flex h-16 items-center justify-between px-6">
        <h1 className="text-xl font-semibold">Dashboard RH</h1>

        <div className="flex items-center gap-4">
          {/* Barre de recherche */}
          <div className="relative w-96">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              placeholder="Rechercher..."
              className="pl-10 bg-background"
            />
          </div>

          {/* Notifications */}
          <button className="relative p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer">
            <Bell className="size-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
          </button>

          {/* Sélecteur de rôle */}
          <SelecteurRole />

          {/* Menu utilisateur */}
          <MenuUtilisateur user={user} />
        </div>
      </div>
    </header>
  );
}
