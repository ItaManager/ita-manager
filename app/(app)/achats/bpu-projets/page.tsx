import { listerBPU } from "@/lib/actions/bpu";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { ModuleLayout } from "@/components/layouts/module-layout";
import { ListeBPU } from "./_components/liste-bpu";
import { Suspense } from "react";

export default async function PageBPUProjets() {
  await verifierAccesPage("/achats/bpu-projets");
  const bpus = await listerBPU();

  // Convertir les Decimal en number pour le client
  const bpusSerializables = (bpus as any[]).map((b: any) => ({
    ...b,
    dateImport: b.dateImport.toISOString(),
    creeLe: b.creeLe.toISOString(),
    majLe: b.majLe.toISOString(),
  }));

  return (
    <ModuleLayout
      titre="Bordereau de Prix Unitaires (BPU)"
      description="Gestion des BPU par projet"
      helpText="Importez des borderaux de prix unitaires depuis Excel, consultez-les par projet et exportez-les au format formaté."
    >
      <Suspense fallback={<div>Chargement...</div>}>
        <ListeBPU bpus={bpusSerializables} />
      </Suspense>
    </ModuleLayout>
  );
}
