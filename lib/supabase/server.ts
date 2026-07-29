import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client Supabase pour les composants et Server Actions. `getUser()`
// valide le JWT côté serveur Supabase — `getSession()` ne fait que lire
// le cookie, falsifiable (SECURITE.md, exigence bloquante n°2). Ne
// jamais appeler `getSession()` sur le client renvoyé ici.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Appelé depuis un composant serveur (pas une Server Action /
            // Route Handler) : sans effet, le middleware rafraîchit déjà
            // la session sur chaque requête.
          }
        },
      },
    },
  );
}
