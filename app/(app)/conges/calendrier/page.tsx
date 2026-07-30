import { verifierAccesPage } from "@/lib/auth/page-access";
import { CalendrierAbsences } from "./_components/calendrier-absences";

/**
 * Calendrier des absences validées
 * M3 Phase 5
 *
 * Permission : employe:lire
 * Patron : 9 (calendrier)
 */
export default async function CalendrierCongesPage() {
  await verifierAccesPage("/conges/calendrier");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Calendrier des absences</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Vue d'ensemble des absences validées par service
        </p>
      </div>

      <CalendrierAbsences />
    </div>
  );
}
