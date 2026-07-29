import { obtenirStatistiquesAudit } from "@/lib/actions/audit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Activity, TrendingUp } from "lucide-react";

export async function StatistiquesAudit() {
  const stats = await obtenirStatistiquesAudit();

  return (
    <div className="mb-6 grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total événements
          </CardTitle>
          <FileText className="size-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total.toLocaleString("fr-FR")}</div>
          <p className="text-xs text-muted-foreground">
            Depuis la création
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            7 derniers jours
          </CardTitle>
          <Activity className="size-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.derniers7jours.toLocaleString("fr-FR")}</div>
          <p className="text-xs text-muted-foreground">
            Activité récente
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Action principale
          </CardTitle>
          <TrendingUp className="size-4 text-muted-foreground" aria-hidden="true" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.parAction[0]?.action || "—"}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.parAction[0]?._count.id.toLocaleString("fr-FR") || 0} fois
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
