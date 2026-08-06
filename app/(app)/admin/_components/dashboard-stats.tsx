"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users,
  UserCheck,
  FileText,
  Shield,
  Activity,
  AlertTriangle,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  obtenirStatistiquesSysteme,
  obtenirAlertesSysteme,
  obtenirActiviteRecente,
  obtenirStatistiquesModules,
} from "@/lib/actions/admin";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon: Icon, color, subtitle }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Icon className="size-4" style={{ color }} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold" style={{ color }}>
          {value.toLocaleString("fr-FR")}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardStats() {
  const [stats, setStats] = useState<any>(null);
  const [alertes, setAlertes] = useState<any>(null);
  const [activite, setActivite] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function chargerDonnees() {
      try {
        const [statsRes, alertesRes, activiteRes, modulesRes] = await Promise.all([
          obtenirStatistiquesSysteme(),
          obtenirAlertesSysteme(),
          obtenirActiviteRecente(),
          obtenirStatistiquesModules(),
        ]);

        if (statsRes.success) setStats(statsRes.stats);
        if (alertesRes.success) setAlertes(alertesRes.alertes);
        if (activiteRes.success) setActivite(activiteRes.evenements);
        if (modulesRes.success) setModules(modulesRes.modules);
      } catch (error) {
        console.error("Erreur chargement statistiques:", error);
      } finally {
        setLoading(false);
      }
    }

    chargerDonnees();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const alertesActives = [
    alertes?.contratsExpirantBientot > 0 && {
      type: "warning",
      message: `${alertes.contratsExpirantBientot} contrat(s) expirent dans les 30 jours`,
    },
    alertes?.utilisateursInactifs > 0 && {
      type: "info",
      message: `${alertes.utilisateursInactifs} utilisateur(s) inactif(s)`,
    },
    alertes?.utilisateursSans2FA > 0 && {
      type: "warning",
      message: `${alertes.utilisateursSans2FA} utilisateur(s) sans 2FA activé`,
    },
    alertes?.erreursRecentes > 0 && {
      type: "destructive",
      message: `${alertes.erreursRecentes} erreur(s) dans les dernières 24h`,
    },
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="size-5" />
          Vue d'ensemble
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Utilisateurs actifs"
            value={stats.utilisateurs.actifs}
            icon={UserCheck}
            color="#13850b"
            subtitle={`${stats.utilisateurs.total} total`}
          />
          <StatCard
            title="Employés"
            value={stats.employes.total}
            icon={Users}
            color="#1d186c"
          />
          <StatCard
            title="Contrats actifs"
            value={stats.contrats.actifs}
            icon={FileText}
            color="#13850b"
            subtitle={`${stats.contrats.total} total`}
          />
          <StatCard
            title="Activité aujourd'hui"
            value={stats.activite.evenementsAujourdhui}
            icon={Activity}
            color="#1d186c"
          />
        </div>
      </div>

      {/* Alertes */}
      {alertesActives.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="size-5" />
            Alertes système
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {alertesActives.map((alerte: any, i) => (
              <Alert key={i} variant={alerte.type === "destructive" ? "destructive" : "default"}>
                <AlertTriangle className="size-4" />
                <AlertDescription>{alerte.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        </div>
      )}

      {/* Modules et Activité récente */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Modules les plus utilisés */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="size-4" />
              Modules les plus utilisés (7 derniers jours)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {modules.length > 0 ? (
              <div className="space-y-3">
                {modules.slice(0, 5).map((module) => (
                  <div key={module.nom} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{module.nom}</span>
                    <Badge variant="secondary">{module.activites}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune activité récente</p>
            )}
          </CardContent>
        </Card>

        {/* Activité récente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="size-4" />
              Activité récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activite.length > 0 ? (
              <div className="space-y-3">
                {activite.slice(0, 5).map((evt) => (
                  <div key={evt.id} className="text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <span className="font-medium">{evt.auteurNom}</span>
                        <span className="text-muted-foreground"> — {evt.action}</span>
                        {evt.commentaire && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {evt.commentaire}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(evt.creeLe), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune activité récente</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sécurité */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Shield className="size-4" />
              Rôles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.securite.roles}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Rôles configurés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Shield className="size-4" />
              Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.securite.permissions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Permissions disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="size-4" />
              Dernière connexion
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.activite.derniereConnexion ? (
              <>
                <div className="text-sm font-medium truncate">
                  {stats.activite.derniereConnexion.auteurNom}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(stats.activite.derniereConnexion.creeLe), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune connexion</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
