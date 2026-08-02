"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ouvrirPeriode } from "@/lib/actions/paie";
import { Loader2, Plus } from "lucide-react";
import { prisma } from "@/lib/db/prisma";

type Projet = {
  id: string;
  code: string;
  nom: string;
};

export function BoutonOuvrirPeriode() {
  const [ouvert, setOuvert] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projets, setProjets] = useState<Projet[]>([]);
  const [projetId, setProjetId] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (ouvert) {
      // Charger les projets actifs
      fetch("/api/projets/actifs")
        .then((res) => res.json())
        .then((data) => setProjets(data))
        .catch((err) => console.error("Erreur chargement projets:", err));
    }
  }, [ouvert]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!projetId || !dateDebut || !dateFin) {
      alert("Veuillez renseigner tous les champs");
      return;
    }

    setLoading(true);
    try {
      const periode = await ouvrirPeriode({
        projetId,
        dateDebut: new Date(dateDebut),
        dateFin: new Date(dateFin),
      });

      setOuvert(false);
      router.push(`/paie/${periode.id}`);
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Erreur lors de l'ouverture de la période");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={ouvert} onOpenChange={setOuvert}>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <Plus className="size-4" />
          Ouvrir une période
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ouvrir une période de paie</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Sélection du projet */}
          <div className="space-y-2">
            <Label htmlFor="projet">
              Chantier <span className="text-destructive">*</span>
            </Label>
            <Select value={projetId} onValueChange={setProjetId}>
              <SelectTrigger id="projet">
                <SelectValue placeholder="Sélectionner un chantier" />
              </SelectTrigger>
              <SelectContent>
                {projets.map((projet) => (
                  <SelectItem key={projet.id} value={projet.id}>
                    {projet.code} — {projet.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Seuls les projets actifs sont affichés
            </p>
          </div>

          {/* Dates */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dateDebut">
                Date de début <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dateDebut"
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFin">
                Date de fin <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dateFin"
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="rounded-md border border-info-border bg-info-soft p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Note :</strong> La période ne doit pas chevaucher une autre période existante sur le même chantier.
              Seuls les relevés d'activité VISÉS sur cette période seront pris en compte dans le calcul.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-between border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOuvert(false)}
              disabled={loading}
              className="rounded-full"
            >
              Annuler
            </Button>

            <Button type="submit" disabled={loading} className="rounded-full">
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Ouvrir la période
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
