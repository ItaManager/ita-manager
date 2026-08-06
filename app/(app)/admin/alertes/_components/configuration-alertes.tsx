"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Bell,
  BellOff,
  Settings,
  Mail,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import {
  obtenirConfigurationsAlertes,
  initialiserConfigurationsAlertes,
  type TypeAlerte,
} from "@/lib/actions/alertes";
import { ModalConfigAlerte } from "./modal-config-alerte";
import { toast } from "sonner";

interface ConfigurationAlerte {
  type: TypeAlerte;
  libelle: string;
  description: string;
  actif: boolean;
  destinataires: string[];
  seuil?: number;
  frequence: "QUOTIDIEN" | "HEBDOMADAIRE" | "MENSUEL";
}

export function ConfigurationAlertes() {
  const [configurations, setConfigurations] = useState<ConfigurationAlerte[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [modalOuvert, setModalOuvert] = useState(false);
  const [alerteSelectionnee, setAlerteSelectionnee] = useState<ConfigurationAlerte | null>(null);

  const chargerConfigurations = async () => {
    setLoading(true);
    try {
      const result = await obtenirConfigurationsAlertes();
      if (result.success && result.configurations) {
        setConfigurations(result.configurations);
      }
    } catch (error) {
      console.error("Erreur chargement configurations:", error);
      toast.error("Erreur lors du chargement des configurations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    chargerConfigurations();
  }, []);

  const handleInitialiser = () => {
    startTransition(async () => {
      try {
        const result = await initialiserConfigurationsAlertes();
        if (result.success) {
          toast.success("Configurations initialisées avec succès");
          await chargerConfigurations();
        }
      } catch (error) {
        toast.error("Erreur lors de l'initialisation");
      }
    });
  };

  const handleConfigurer = (config: ConfigurationAlerte) => {
    setAlerteSelectionnee(config);
    setModalOuvert(true);
  };

  const handleSuccess = () => {
    chargerConfigurations();
  };

  const getFrequenceBadge = (frequence: string) => {
    const variants: Record<string, { color: string; text: string }> = {
      QUOTIDIEN: { color: "#13850b", text: "Quotidien" },
      HEBDOMADAIRE: { color: "#1d186c", text: "Hebdomadaire" },
      MENSUEL: { color: "#666", text: "Mensuel" },
    };
    const variant = variants[frequence] || variants.MENSUEL;
    return (
      <Badge variant="secondary" style={{ backgroundColor: `${variant.color}20`, color: variant.color }}>
        {variant.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (configurations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BellOff className="mx-auto size-12 text-muted-foreground/40" aria-hidden="true" />
          <p className="mt-4 text-sm text-muted-foreground">
            Aucune configuration d'alerte trouvée.
          </p>
          <Button onClick={handleInitialiser} disabled={isPending} className="mt-4">
            {isPending ? "Initialisation..." : "Initialiser les configurations par défaut"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const alertesActives = configurations.filter((c) => c.actif).length;

  return (
    <>
      <div className="space-y-6">
        {/* Résumé */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Bell className="size-4" />
                Vue d'ensemble
              </span>
              <div className="flex items-center gap-2">
                <CheckCircle className="size-4 text-success" />
                <span className="text-sm font-normal">
                  {alertesActives} / {configurations.length} alertes actives
                </span>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Liste des alertes */}
        <div className="grid gap-4 md:grid-cols-2">
          {configurations.map((config) => (
            <Card
              key={config.type}
              className={!config.actif ? "opacity-60" : ""}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {config.actif ? (
                        <Bell className="size-4" style={{ color: "#13850b" }} />
                      ) : (
                        <BellOff className="size-4 text-muted-foreground" />
                      )}
                      {config.libelle}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {config.description}
                    </p>
                  </div>
                  <Switch
                    checked={config.actif}
                    onCheckedChange={() => handleConfigurer(config)}
                  />
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Fréquence */}
                <div className="flex items-center gap-2">
                  {getFrequenceBadge(config.frequence)}
                  {config.seuil && (
                    <Badge variant="outline" className="text-xs">
                      Seuil: {config.seuil} jours
                    </Badge>
                  )}
                </div>

                {/* Destinataires */}
                <div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Mail className="size-3" />
                    <span>Destinataires ({config.destinataires.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {config.destinataires.slice(0, 2).map((email, i) => (
                      <Badge key={i} variant="secondary" className="text-xs font-normal">
                        {email}
                      </Badge>
                    ))}
                    {config.destinataires.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{config.destinataires.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Bouton configurer */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleConfigurer(config)}
                  className="w-full mt-2"
                >
                  <Settings className="size-3 mr-1" />
                  Configurer
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Information */}
        <Alert>
          <AlertCircle className="size-4" />
          <AlertDescription>
            <strong>Note :</strong> Les alertes sont envoyées automatiquement selon la fréquence
            configurée. Les destinataires recevront un email récapitulatif des éléments nécessitant
            une attention.
          </AlertDescription>
        </Alert>
      </div>

      {/* Modal de configuration */}
      {alerteSelectionnee && (
        <ModalConfigAlerte
          ouvert={modalOuvert}
          onFermer={() => {
            setModalOuvert(false);
            setAlerteSelectionnee(null);
          }}
          alerte={alerteSelectionnee}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
