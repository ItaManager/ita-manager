"use client";

import { useState, useEffect } from "react";
import { listerCodesPointage, genererCodePointage } from "@/lib/actions/presences";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search, Key, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type EmployeCode = {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  aUnCode: boolean;
  codeGenereLe: Date | null;
};

export default function CodesPointagePage() {
  const [employes, setEmployes] = useState<EmployeCode[]>([]);
  const [recherche, setRecherche] = useState("");
  const [loading, setLoading] = useState(true);
  const [codeGenere, setCodeGenere] = useState<string | null>(null);
  const [employeSelectionne, setEmployeSelectionne] = useState<EmployeCode | null>(null);
  const [copied, setCopied] = useState(false);

  const charger = async () => {
    setLoading(true);
    const data = await listerCodesPointage();
    setEmployes(data);
    setLoading(false);
  };

  useEffect(() => {
    charger();
  }, []);

  const generer = async (employe: EmployeCode) => {
    try {
      const { code } = await genererCodePointage(employe.id);
      setCodeGenere(code);
      setEmployeSelectionne(employe);
      await charger();
    } catch (error) {
      toast.error("Erreur lors de la génération du code");
    }
  };

  const copierCode = () => {
    if (codeGenere) {
      navigator.clipboard.writeText(codeGenere);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Code copié dans le presse-papiers");
    }
  };

  const fermerModal = () => {
    setCodeGenere(null);
    setEmployeSelectionne(null);
    setCopied(false);
  };

  const employesFiltres = employes.filter(
    (e) =>
      e.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      e.prenom.toLowerCase().includes(recherche.toLowerCase()) ||
      e.matricule.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Gestion des codes de pointage</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Génération et régénération des codes employés
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Codes employés ({employesFiltres.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={charger} disabled={loading}>
              <RefreshCw className={`size-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, prénom ou matricule..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Chargement...
            </p>
          ) : employesFiltres.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {recherche
                ? "Aucun employé trouvé"
                : "Aucun employé actif"}
            </p>
          ) : (
            <div className="space-y-2">
              {employesFiltres.map((employe) => (
                <div
                  key={employe.id}
                  className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0"
                >
                  <div>
                    <div className="text-sm font-medium">
                      {employe.prenom} {employe.nom}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {employe.matricule}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {employe.aUnCode ? (
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">
                          Code actif
                        </Badge>
                        {employe.codeGenereLe && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(employe.codeGenereLe), "d MMM yyyy", {
                              locale: fr,
                            })}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Aucun code
                      </Badge>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generer(employe)}
                    >
                      <Key className="size-4 mr-2" />
                      {employe.aUnCode ? "Régénérer" : "Générer"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!codeGenere} onOpenChange={fermerModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Code de pointage généré</DialogTitle>
            <DialogDescription>
              Code généré pour {employeSelectionne?.prenom}{" "}
              {employeSelectionne?.nom}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted p-6 rounded-lg text-center">
              <p className="text-4xl font-mono font-bold tracking-wider">
                {codeGenere}
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={copierCode}
            >
              {copied ? (
                <>
                  <Check className="size-4 mr-2" />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="size-4 mr-2" />
                  Copier le code
                </>
              )}
            </Button>

            <div className="border-l-4 border-warning bg-warning-soft/30 p-4 rounded">
              <p className="text-sm text-muted-foreground">
                <strong>Important :</strong> Ce code ne sera plus jamais affiché.
                Assurez-vous de le communiquer à l'employé immédiatement.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
