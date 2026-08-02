"use client";

import { useState, useEffect } from "react";
import {
  listerAppareils,
  enregistrerAppareil,
  revoquerAppareil,
} from "@/lib/actions/presences";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, Plus, Ban, Copy, Check } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

type Appareil = {
  id: string;
  libelle: string;
  emplacement: string | null;
  actif: boolean;
  dernierAcces: Date | null;
  creeLe: Date;
  revoqueLe: Date | null;
};

export default function BornesPage() {
  const [appareils, setAppareils] = useState<Appareil[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [libelle, setLibelle] = useState("");
  const [emplacement, setEmplacement] = useState("");
  const [jetonGenere, setJetonGenere] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const charger = async () => {
    setLoading(true);
    const data = await listerAppareils({});
    setAppareils(data);
    setLoading(false);
  };

  useEffect(() => {
    charger();
  }, []);

  const enregistrer = async () => {
    if (!libelle.trim()) {
      toast.error("Le libellé est obligatoire");
      return;
    }

    try {
      const { jeton } = await enregistrerAppareil(
        libelle,
        emplacement || undefined
      );
      setJetonGenere(jeton);
      setLibelle("");
      setEmplacement("");
      await charger();
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const revoquer = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir révoquer cet appareil ?")) {
      return;
    }

    try {
      await revoquerAppareil(id);
      toast.success("Appareil révoqué");
      await charger();
    } catch (error) {
      toast.error("Erreur lors de la révocation");
    }
  };

  const copierJeton = () => {
    if (jetonGenere) {
      navigator.clipboard.writeText(jetonGenere);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Jeton copié dans le presse-papiers");
    }
  };

  const fermerModal = () => {
    setShowModal(false);
    setLibelle("");
    setEmplacement("");
  };

  const fermerModalJeton = () => {
    setJetonGenere(null);
    setCopied(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gestion des bornes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enregistrement et révocation des appareils de pointage
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="size-4 mr-2" />
          Nouvel appareil
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Appareils enregistrés ({appareils.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Chargement...
            </p>
          ) : appareils.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucun appareil enregistré
            </p>
          ) : (
            <div className="space-y-3">
              {appareils.map((appareil) => (
                <div
                  key={appareil.id}
                  className="flex items-start justify-between border-b last:border-0 pb-3 last:pb-0"
                >
                  <div className="flex items-start gap-3">
                    <Smartphone className="size-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">
                        {appareil.libelle}
                      </div>
                      {appareil.emplacement && (
                        <div className="text-xs text-muted-foreground">
                          {appareil.emplacement}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        Créé le{" "}
                        {format(new Date(appareil.creeLe), "d MMM yyyy", {
                          locale: fr,
                        })}
                      </div>
                      {appareil.dernierAcces && (
                        <div className="text-xs text-muted-foreground">
                          Dernier accès :{" "}
                          {format(
                            new Date(appareil.dernierAcces),
                            "d MMM yyyy à HH:mm",
                            { locale: fr }
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {appareil.actif ? (
                      <Badge variant="default" className="text-xs">
                        Actif
                      </Badge>
                    ) : (
                      <div className="text-right">
                        <Badge variant="secondary" className="text-xs">
                          Révoqué
                        </Badge>
                        {appareil.revoqueLe && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(appareil.revoqueLe), "d MMM yyyy", {
                              locale: fr,
                            })}
                          </p>
                        )}
                      </div>
                    )}

                    {appareil.actif && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => revoquer(appareil.id)}
                      >
                        <Ban className="size-4 mr-2" />
                        Révoquer
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={fermerModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enregistrer un nouvel appareil</DialogTitle>
            <DialogDescription>
              Créez un jeton d'authentification pour une nouvelle borne de pointage
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="libelle">Libellé *</Label>
              <Input
                id="libelle"
                placeholder="Ex: Tablette accueil - RDC"
                value={libelle}
                onChange={(e) => setLibelle(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="emplacement">Emplacement (optionnel)</Label>
              <Input
                id="emplacement"
                placeholder="Ex: Accueil principal"
                value={emplacement}
                onChange={(e) => setEmplacement(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={fermerModal}>
              Annuler
            </Button>
            <Button onClick={enregistrer}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!jetonGenere} onOpenChange={fermerModalJeton}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Jeton d'appareil généré</DialogTitle>
            <DialogDescription>
              Configurez ce jeton sur l'appareil de pointage
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-xs font-mono break-all">{jetonGenere}</p>
            </div>

            <Button variant="outline" className="w-full" onClick={copierJeton}>
              {copied ? (
                <>
                  <Check className="size-4 mr-2" />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="size-4 mr-2" />
                  Copier le jeton
                </>
              )}
            </Button>

            <div className="border-l-4 border-danger bg-danger-soft/30 p-4 rounded">
              <p className="text-sm text-muted-foreground">
                <strong>CRITIQUE :</strong> Ce jeton ne sera plus jamais affiché.
                Conservez-le en lieu sûr. Si vous le perdez, vous devrez révoquer
                cet appareil et en créer un nouveau.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
