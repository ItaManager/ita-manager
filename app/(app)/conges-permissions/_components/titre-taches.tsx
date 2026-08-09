import { obtenirTachesConges } from "@/lib/actions/conges";
import { Badge } from "@/components/ui/badge";

export async function TitreTaches() {
  const resultTaches = await obtenirTachesConges();
  const taches = resultTaches.success ? resultTaches.data : [];
  const count = taches.length;

  return (
    <div className="flex items-center gap-3">
      <h2 className="text-lg font-semibold text-[#18181a]">Vos tâches</h2>
      {count > 0 && (
        <Badge
          variant="default"
          className="h-5 min-w-5 items-center justify-center rounded-full p-0 px-1.5 text-xs"
          style={{ backgroundColor: "#13850b" }}
        >
          {count}
        </Badge>
      )}
    </div>
  );
}
