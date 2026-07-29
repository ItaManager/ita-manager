import "server-only";
import { createClient } from "@supabase/supabase-js";

// SUPABASE_SERVICE_ROLE_KEY contourne toutes les protections (RLS
// compris) — n'atteint jamais le client (SECURITE.md, exigence
// bloquante n°3). `import "server-only"` fait échouer le build si ce
// module est un jour importé, même transitivement, dans un composant
// client.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
