"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listerMateriel, type MaterielListItem } from "@/lib/actions/ressources";
import { Wrench, CheckCircle, XCircle, AlertCircle, Share2 } from "lucide-react";

export function ListeMateriel() {
  const [materiel, setMateriel] = useState<MaterielListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerMateriel();
  }, []);

  async function chargerMateriel() {
    setLoading(true);
    try {
      const data = await listerMateriel();
      setMateriel(data);
    } catch (error) {
      console.error("Erreur chargement matériel:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-sm text-muted-foreground">
            Chargement...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (materiel.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Wrench className="size-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            Aucun matériel enregistré
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Le parc matériel sera visible ici
          </p>
        </CardContent>
      </Card>
    );
  }

  // Grouper par famille
  const parFamille = materiel.reduce((acc, m) => {
    const fam = m.famille.libelle;
    if (!acc[fam]) {
      acc[fam] = [];
    }
    acc[fam].push(m);
    return acc;
  }, {} as Record<string, MaterielListItem[]>);

  return (
    <div className="space-y-6">
      {Object.entries(parFamille).map(([famille, items]) => (
        <div key={famille}>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Wrench className="size-5" />
            {famille} ({items.length})
          </h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const etatInfo = getEtatInfo(item.statut);

              return (
                <Card
                  key={item.id}
                  className={`cursor-pointer hover:border-primary transition-all ${
                    item.statut === "EN_PANNE" ? "border-destructive/50" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground font-mono">
                          {item.codeIta}
                        </p>
                        <p className="font-medium mt-1">{item.designation}</p>
                      </div>

                      <Badge variant={etatInfo.variant}>
                        {etatInfo.icon}
                        {etatInfo.label}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {item.partageable && (
                        <div className="flex items-center gap-1">
                          <Share2 className="size-3" />
                          <span>Partageable</span>
                        </div>
                      )}

                      {item.affectations > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="font-medium text-foreground">
                            {item.affectations}
                          </span>
                          <span>affectation(s)</span>
                        </div>
                      )}

                      {item.affectations === 0 && item.statut === "DISPONIBLE" && (
                        <span className="text-success">Disponible</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function getEtatInfo(statut: string): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: React.ReactNode;
} {
  switch (statut) {
    case "DISPONIBLE":
      return {
        label: "Disponible",
        variant: "default",
        icon: <CheckCircle className="size-3 mr-1" />,
      };
    case "EN_MISSION":
      return {
        label: "En mission",
        variant: "default",
        icon: <Share2 className="size-3 mr-1" />,
      };
    case "DEMOBILISE":
      return {
        label: "Démobilisé",
        variant: "secondary",
        icon: <AlertCircle className="size-3 mr-1" />,
      };
    case "EN_PANNE":
      return {
        label: "En panne",
        variant: "destructive",
        icon: <XCircle className="size-3 mr-1" />,
      };
    case "EN_MAINTENANCE":
      return {
        label: "Maintenance",
        variant: "outline",
        icon: <AlertCircle className="size-3 mr-1" />,
      };
    case "HORS_SERVICE":
      return {
        label: "Hors service",
        variant: "destructive",
        icon: <XCircle className="size-3 mr-1" />,
      };
    case "REFORME":
      return {
        label: "Réformé",
        variant: "secondary",
        icon: <XCircle className="size-3 mr-1" />,
      };
    default:
      return {
        label: statut,
        variant: "secondary",
        icon: null,
      };
  }
}
