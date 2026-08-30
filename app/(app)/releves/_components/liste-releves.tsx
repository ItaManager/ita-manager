"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { listerReleves } from "@/lib/actions/releves";
import { listerProjets } from "@/lib/actions/projets";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { ModaleNouveauReleve } from "./modale-nouveau-releve";

interface ListeRelevesProps {
  page: number;
  limit: number;
  projetId?: string;
  statut?: "BROUILLON" | "SOUMIS" | "VISE" | "REFUSE";
}

export function ListeReleves({ page, limit, projetId, statut }: ListeRelevesProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [releves, setReleves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [filtreStatut, setFiltreStatut] = useState<string>(statut || "tous");
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [projets, setProjets] = useState<Array<{ id: string; code: string; nom: string }>>([]);

  useEffect(() => {
    chargerReleves();
    chargerProjets();
  }, [page, limit, projetId, statut]);

  async function chargerReleves() {
    setLoading(true);
    try {
      const result = await listerReleves({
        page,
        limit,
        projetId,
        statut: filtreStatut !== "tous" ? (filtreStatut as any) : undefined,
      });

      setReleves(result.items);
      setPagination(result.pagination);
    } catch (error) {
      console.error("Erreur chargement relevés:", error);
    } finally {
      setLoading(false);
    }
  }

  async function chargerProjets() {
    try {
      const result = await listerProjets();
      setProjets(result.map((p) => ({
        id: p.id,
        code: p.code,
        nom: p.nom,
      })));
    } catch (error) {
      console.error("Erreur chargement projets:", error);
    }
  }

  function changerFiltre(nouveauFiltre: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (nouveauFiltre === "tous") {
      params.delete("statut");
    } else {
      params.set("statut", nouveauFiltre);
    }
    params.delete("page");
    router.push(`/releves?${params.toString()}`);
  }

  function changerPage(nouvellePage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (nouvellePage > 1) {
      params.set("page", nouvellePage.toString());
    } else {
      params.delete("page");
    }
    router.push(`/releves?${params.toString()}`);
  }

  function changerLimit(nouvelleLimit: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", nouvelleLimit.toString());
    params.delete("page");
    router.push(`/releves?${params.toString()}`);
  }

  const statutConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    BROUILLON: {
      label: "Brouillon",
      icon: FileText,
      color: "#6B7280",
      bg: "#6B728020",
    },
    SOUMIS: {
      label: "Soumis",
      icon: Clock,
      color: "#F59E0B",
      bg: "#F59E0B20",
    },
    VISE: {
      label: "Visé",
      icon: CheckCircle2,
      color: "#10B981",
      bg: "#10B98120",
    },
    REFUSE: {
      label: "Refusé",
      icon: XCircle,
      color: "#EF4444",
      bg: "#EF444420",
    },
  };

  // Calcul des compteurs pour les filtres
  const countBrouillon = releves.filter((r) => r.statut === "BROUILLON").length;
  const countSoumis = releves.filter((r) => r.statut === "SOUMIS").length;
  const countVise = releves.filter((r) => r.statut === "VISE").length;
  const countRefuse = releves.filter((r) => r.statut === "REFUSE").length;
  const countTous = releves.length;

  return (
    <div className="space-y-4">
      {/* Filtres et actions */}
      <div className="bg-white rounded-xl border border-[#0000001a] p-4 space-y-4">
        {/* Filtres par statut */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Par statut
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => changerFiltre("tous")}>
              <Badge
                variant={filtreStatut === "tous" ? "default" : "outline"}
                className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
              >
                Tous <span className="ml-1 opacity-70">({countTous})</span>
              </Badge>
            </button>
            <button onClick={() => changerFiltre("BROUILLON")}>
              <Badge
                variant={filtreStatut === "BROUILLON" ? "default" : "outline"}
                className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
              >
                Brouillon <span className="ml-1 opacity-70">({countBrouillon})</span>
              </Badge>
            </button>
            <button onClick={() => changerFiltre("SOUMIS")}>
              <Badge
                variant={filtreStatut === "SOUMIS" ? "default" : "outline"}
                className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
              >
                Soumis <span className="ml-1 opacity-70">({countSoumis})</span>
              </Badge>
            </button>
            <button onClick={() => changerFiltre("VISE")}>
              <Badge
                variant={filtreStatut === "VISE" ? "default" : "outline"}
                className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
              >
                Visé <span className="ml-1 opacity-70">({countVise})</span>
              </Badge>
            </button>
            <button onClick={() => changerFiltre("REFUSE")}>
              <Badge
                variant={filtreStatut === "REFUSE" ? "default" : "outline"}
                className="cursor-pointer h-8 px-3 hover:bg-accent transition-colors"
              >
                Refusé <span className="ml-1 opacity-70">({countRefuse})</span>
              </Badge>
            </button>
          </div>
        </div>

        {/* Bouton nouveau relevé */}
        <div className="flex items-center justify-end">
          <Button
            onClick={() => setModaleOuverte(true)}
            className="gap-2 rounded-full bg-[#13850b] hover:bg-[#0f6909] text-white"
          >
            <Plus className="size-4" />
            Nouveau relevé
          </Button>
        </div>
      </div>

      {/* Tableau */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : releves.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="size-12 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-sm text-muted-foreground mb-1">
                Aucun relevé trouvé
              </p>
              <p className="text-xs text-muted-foreground">
                Commencez par créer un nouveau relevé d'activité
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Chantier</TableHead>
                  <TableHead>Chef de chantier</TableHead>
                  <TableHead>Pointages</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {releves.map((releve) => {
                  const config = statutConfig[releve.statut];
                  const Icon = config.icon;
                  const nbPresents = releve.pointages.filter(
                    (p: any) => p.etat === "PRESENT"
                  ).length;

                  return (
                    <TableRow key={releve.id}>
                      <TableCell className="font-medium">
                        {format(new Date(releve.date), "dd MMM yyyy", {
                          locale: fr,
                        })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-sm">
                            {releve.projet.code}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {releve.projet.nom}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {releve.chefChantier.prenom} {releve.chefChantier.nom}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {releve.chefChantier.matricule}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm tabular-nums">
                          {nbPresents} présent{nbPresents > 1 ? "s" : ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          style={{
                            backgroundColor: config.bg,
                            color: config.color,
                          }}
                          className="gap-1"
                        >
                          <Icon className="size-3" />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/releves/${releve.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Eye className="size-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.total > 0 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-[#0000001a] p-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} sur{" "}
              {pagination.total} relevé{pagination.total > 1 ? "s" : ""}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Afficher</span>
              <Select
                value={pagination.limit.toString()}
                onValueChange={(value) => changerLimit(parseInt(value))}
              >
                <SelectTrigger className="h-8 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => changerPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="h-8 gap-1 border-[#13850b] text-[#13850b] hover:bg-[#13850b]/10"
            >
              <ChevronLeft className="size-4" />
              Précédent
            </Button>
            <div className="text-sm text-muted-foreground px-2">
              Page {pagination.page} sur {pagination.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => changerPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="h-8 gap-1 border-[#13850b] text-[#13850b] hover:bg-[#13850b]/10"
            >
              Suivant
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modale nouveau relevé */}
      <ModaleNouveauReleve
        ouvert={modaleOuverte}
        onClose={() => {
          setModaleOuverte(false);
          chargerReleves(); // Rafraîchir la liste après création
        }}
        projets={projets}
      />
    </div>
  );
}
