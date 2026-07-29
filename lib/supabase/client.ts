import { createBrowserClient } from "@supabase/ssr";

// Client Supabase pour les composants client. Connexion et déconnexion
// passent par ce client, jamais par une Server Action (M0-SOCLE.md §6).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
