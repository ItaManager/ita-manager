"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { ModaleNouvelleDemande } from "./modale-nouvelle-demande";
import { listerEmployes } from "@/lib/actions/employes";
import { listerProjets } from "@/lib/actions/projets";
import { toast } from "sonner";

export function BoutonNouvelleDemande() {
  const [ouvert, setOuvert] = useState(false);
  const [employes, setEmployes] = useState<Array<{ id: string; nom: string; prenom: string; matricule: string }>>([]);
  const [projets, setProjets] = useState<Array<{ id: string; nom: string }>>([]);
  const [services, setServices] = useState<Array<{ id: string; libelle: string }>>([]);
  const [chargement, setChargement] = useState(false);

  const chargerDonnees = async () => {
    setChargement(true);
    try {
      const [emps, projs] = await Promise.all([
        listerEmployes(),
        listerProjets(),
      ]);

      setEmployes(emps.items.map((e: any) => ({
        id: e.id,
        nom: e.nom,
        prenom: e.prenom,
        matricule: e.matricule,
      })));

      setProjets(projs.map((p: any) => ({
        id: p.id,
        nom: p.nom,
      })));

      // Services : pour l'instant vide, à compléter si besoin
      setServices([]);

    } catch (error) {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setChargement(false);
    }
  };

  const handleOuvrir = () => {
    setOuvert(true);
    chargerDonnees();
  };

  return (
    <>
      <Button
        onClick={handleOuvrir}
        disabled={chargement}
        className="gap-2 h-9 px-4 text-sm rounded-full bg-primary hover:bg-primary-hover text-primary-foreground transition-all cursor-pointer shadow-sm hover:shadow-md"
      >
        <Plus className="size-4" />
        Nouvelle demande
      </Button>

      <ModaleNouvelleDemande
        ouvert={ouvert}
        onClose={() => setOuvert(false)}
        employes={employes}
        projets={projets}
        services={services}
      />
    </>
  );
}
