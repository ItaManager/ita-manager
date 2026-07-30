/**
 * Page borne de pointage - Version stub M12
 *
 * TODO : Implémenter pavé numérique tactile avec authentification par jeton.
 * Pour l'instant, page placeholder indiquant la fonctionnalité à venir.
 */

export default function BornePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold text-slate-900">
          Borne de pointage
        </h1>
        <p className="mt-4 text-slate-600">
          Fonctionnalité en cours d'implémentation.
        </p>
        <p className="mt-2 text-sm text-slate-500">
          La borne tactile nécessite une architecture hors session utilisateur
          et sera livrée dans un prochain sprint.
        </p>
      </div>
    </div>
  );
}
