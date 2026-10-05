import { compterDemandesAValider } from "@/lib/actions/compteurs-achats";

export async function TitreTaches() {
  const count = await compterDemandesAValider();

  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-[#18181a]">Vos tâches</h2>
      {count > 0 && (
        <span className="rounded-full bg-[#f59e0b] px-2 py-0.5 text-xs font-medium text-white">
          {count}
        </span>
      )}
    </div>
  );
}
