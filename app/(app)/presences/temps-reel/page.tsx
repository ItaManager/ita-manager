import { verifierAccesPage } from "@/lib/auth/page-access";
import { listerPointagesJour } from "@/lib/actions/presences";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, UserX, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default async function TempsReelPage() {
  await verifierAccesPage("/presences/temps-reel");

  const aujourdHui = new Date();
  const { presents, partis, absents } = await listerPointagesJour(aujourdHui);

  const stats = [
    {
      label: "Présents",
      value: presents.length,
      icon: UserCheck,
      color: "text-success",
    },
    {
      label: "Partis",
      value: partis.length,
      icon: UserX,
      color: "text-muted-foreground",
    },
    {
      label: "Absents",
      value: absents.length,
      icon: Users,
      color: "text-warning",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Présences en temps réel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {format(aujourdHui, "EEEE d MMMM yyyy", { locale: fr })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <stat.icon className={`size-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="size-4 text-success" />
              Présents ({presents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {presents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun employé présent
              </p>
            ) : (
              <div className="space-y-3">
                {presents.map(({ employe, dernierPointage }) => (
                  <div
                    key={employe.id}
                    className="border-b last:border-0 pb-3 last:pb-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">
                          {employe.prenom} {employe.nom}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {employe.matricule}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="size-3" />
                          {format(new Date(dernierPointage.horodatage), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserX className="size-4 text-muted-foreground" />
              Partis ({partis.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {partis.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun départ enregistré
              </p>
            ) : (
              <div className="space-y-3">
                {partis.map(({ employe, dernierPointage }) => (
                  <div
                    key={employe.id}
                    className="border-b last:border-0 pb-3 last:pb-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">
                          {employe.prenom} {employe.nom}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {employe.matricule}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="size-3" />
                          {format(new Date(dernierPointage.horodatage), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-4 text-warning" />
              Absents ({absents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {absents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Tous les employés ont pointé
              </p>
            ) : (
              <div className="space-y-3">
                {absents.map((employe) => (
                  <div
                    key={employe.id}
                    className="border-b last:border-0 pb-3 last:pb-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {employe.prenom} {employe.nom}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {employe.matricule}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-info bg-info-soft/30">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Actualisation automatique :</strong> Cette page se recharge
            automatiquement toutes les 60 secondes pour afficher les dernières
            présences.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
