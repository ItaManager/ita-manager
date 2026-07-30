import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Check,
  AlertTriangle,
  Info,
  Users,
  AlertCircle,
} from "lucide-react";

export async function ControlesCoherence() {
  // Charger tous les postes avec leurs relations
  const postes = await prisma.poste.findMany({
    where: { archiveLe: null },
    include: {
      direction: true,
      service: true,
      superieurPoste: {
        select: {
          code: true,
          libelle: true,
        },
      },
    },
    orderBy: [{ directionId: "asc" }, { serviceId: "asc" }, { libelle: "asc" }],
  });

  // 1. POSTES SANS SUPÉRIEUR
  const postesSansSuperieur = postes.filter((p) => !p.superieurPosteId);
  const dirGeneral = postes.find((p) => p.code === "DIR_GENERAL");
  const conformeSuperieur =
    postesSansSuperieur.length === 1 &&
    postesSansSuperieur[0]?.id === dirGeneral?.id;

  // 2. BOUCLES HIÉRARCHIQUES
  const detecterBoucles = () => {
    for (const p of postes) {
      const visite = new Set<string>();
      let courant: typeof postes[number] | undefined = p;
      while (courant?.superieurPosteId) {
        if (visite.has(courant.id)) {
          return { detectee: true, poste: p };
        }
        visite.add(courant.id);
        courant = postes.find((x) => x.id === courant!.superieurPosteId);
      }
    }
    return { detectee: false, poste: null };
  };
  const boucles = detecterBoucles();

  // 3. POSTES SANS TITULAIRE (simul\u00e9 pour M1 — sera réel en M2)
  // Pour M1, on affiche un état informatif car aucun employé n'existe encore
  const sansTitulaire: typeof postes = [];

  // 4. CHARGE D'ENCADREMENT
  const chargeEncadrement: Record<string, number> = {};
  postes.forEach((p) => {
    if (!p.superieurPosteId) return;
    chargeEncadrement[p.superieurPosteId] =
      (chargeEncadrement[p.superieurPosteId] ?? 0) + 1;
  });

  const surcharges = Object.entries(chargeEncadrement)
    .filter(([, count]) => count > 15)
    .map(([posteId, count]) => ({
      poste: postes.find((p) => p.id === posteId)!,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // 5. POSTES HORS PDF (pour référence)
  const horsPDF = postes.filter((p) => {
    // Postes ajoutés selon DECISIONS.md A-04
    const codesAjoutes = [
      "DIR_GENERAL",
      "DIR_FINANCIER",
      "DIR_TECHNIQUE",
      "DIR_ADMIN_RH",
      "ASST_RH",
      "CHEF_LOGISTIQUE",
      "CHEF_ACHATS",
      "ASST_COMPTABLE",
      "CHEF_QHSE",
      "CHEF_AEP",
      "CHEF_ASSAINISSEMENT",
      "CHEF_ROUTES",
      "OUVRIER",
      "MANOEUVRE",
    ];
    return codesAjoutes.includes(p.code);
  });

  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-sm text-muted-foreground">
        Ces contrôles s'exécutent en continu. Un organigramme incohérent produit
        des demandes qui ne partent nulle part : c'est le premier symptôme à
        surveiller.
      </p>

      {/* 1. Chaîne hiérarchique complète */}
      {conformeSuperieur && !boucles.detectee ? (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-green-700">
              <Check className="size-4" aria-hidden="true" />
              Chaîne hiérarchique complète
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Les {postes.length - 1} postes hors Direction Générale ont un
              supérieur défini. Aucune boucle détectée.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-l-4 border-l-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertCircle className="size-4" aria-hidden="true" />
              Incohérence hiérarchique détectée
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!conformeSuperieur && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" aria-hidden="true" />
                <AlertDescription>
                  <strong>
                    {postesSansSuperieur.length} poste(s) sans supérieur
                  </strong>{" "}
                  — un seul attendu (Directeur Général).
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {postesSansSuperieur.map((p) => (
                      <Badge key={p.id} variant="destructive">
                        {p.libelle}
                      </Badge>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            {boucles.detectee && boucles.poste && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" aria-hidden="true" />
                <AlertDescription>
                  <strong>Boucle hiérarchique détectée</strong> impliquant le
                  poste « {boucles.poste.libelle} ». Un poste ne peut être son
                  propre supérieur.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* 2. Postes sans titulaire */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-blue-700">
            <Info className="size-4" aria-hidden="true" />
            Postes sans titulaire
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            <strong>M1 — Module Organisation uniquement.</strong> Les employés
            seront créés en M2. Ce contrôle affichera alors les postes vacants.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Actuellement : {postes.length} postes définis, aucun employé affecté
            (normal à ce stade).
          </p>
        </CardContent>
      </Card>

      {/* 3. Charge d'encadrement excessive */}
      {surcharges.length > 0 ? (
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-amber-700">
              <Users className="size-4" aria-hidden="true" />
              Charge d'approbation élevée
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ces postes encadrent un effectif important. Leur absence bloque une
              part significative des circuits.
            </p>
            <div className="space-y-2">
              {surcharges.map(({ poste, count }) => (
                <div
                  key={poste.id}
                  className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{poste.libelle}</p>
                    <p className="text-xs text-muted-foreground">
                      {poste.direction.libelle}
                      {poste.service && ` · ${poste.service.libelle}`}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 font-semibold text-amber-700">
                    {count} subordonnés
                  </Badge>
                </div>
              ))}
            </div>
            <Alert>
              <Info className="size-4" aria-hidden="true" />
              <AlertDescription className="text-xs">
                La délégation nommée — décision B-03 — est indispensable pour ces
                postes, non facultative.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-green-700">
              <Check className="size-4" aria-hidden="true" />
              Charge d'encadrement raisonnable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Aucun poste n'encadre plus de 15 subordonnés directs.
            </p>
          </CardContent>
        </Card>
      )}

      {/* 4. Postes hors PDF (informatif) */}
      <Card className="border-l-4 border-l-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Info className="size-4" aria-hidden="true" />
            {horsPDF.length} postes absents de l'organigramme signé
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Créés parce que l'application ne peut pas fonctionner sans eux.
            L'organigramme officiel devrait être corrigé et signé à nouveau —
            action H-02.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {horsPDF.map((p) => (
              <Badge key={p.id} variant="secondary" className="text-xs">
                {p.libelle}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
