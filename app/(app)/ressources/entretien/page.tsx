import { Suspense } from "react";
import { exigerPermission, PERMISSIONS } from "@/lib/auth/guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { listerEntretiens, listerPlansEntretien } from "@/lib/actions/entretien";
import { TableauEntretiens } from "./_components/tableau-entretiens";

type SearchParams = Promise<{
  page?: string;
  onglet?: string;
}>;

export default async function PageEntretien({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await exigerPermission(PERMISSIONS["entretien:planifier"].code);

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const onglet = params.onglet || "entretiens";

  // Charger les données en parallèle
  const [
    { items: entretiens, total: totalEntretiens, totalPages: pagesEntretiens },
    plans,
  ] = await Promise.all([
    listerEntretiens({ page }),
    listerPlansEntretien(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Entretien du matériel</h1>
          <p className="text-muted-foreground mt-2">
            Planification et suivi de l'entretien préventif et curatif
          </p>
        </div>
        <Button disabled>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel entretien
        </Button>
      </div>

      <Suspense fallback={<div>Chargement...</div>}>
        <Tabs defaultValue={onglet} className="space-y-4">
          <TabsList>
            <TabsTrigger value="entretiens">
              Entretiens ({totalEntretiens})
            </TabsTrigger>
            <TabsTrigger value="plans">
              Plans d'entretien ({plans.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="entretiens" className="space-y-4">
            <TableauEntretiens
              entretiens={entretiens}
              total={totalEntretiens}
              pages={pagesEntretiens}
              pageActuelle={page}
            />
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            <div className="rounded-md border">
              <div className="p-4">
                {plans.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground">
                      Aucun plan d'entretien trouvé
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Créez votre premier plan pour automatiser les entretiens
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {plans.map((plan) => (
                      <div key={plan.id} className="border rounded p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-mono text-sm">{plan.materiel.codeIta}</div>
                            <div className="text-xs text-muted-foreground">
                              {plan.materiel.designation}
                            </div>
                            <div className="mt-2 text-sm">{plan.description}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {plan.periodiciteJours && `Périodicité: ${plan.periodiciteJours} jours`}
                              {plan.periodiciteJours && plan.seuilCompteur && " • "}
                              {plan.seuilCompteur && `Seuil: ${plan.seuilCompteur.toLocaleString("fr-FR")}`}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={plan.type === "PREVENTIF" ? "default" : plan.type === "CURATIF" ? "secondary" : "outline"}>
                              {plan.type === "PREVENTIF" ? "Préventif" : plan.type === "CURATIF" ? "Curatif" : "Révision"}
                            </Badge>
                            <Badge variant={plan.actif ? "default" : "secondary"}>
                              {plan.actif ? "Actif" : "Inactif"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Suspense>
    </div>
  );
}
