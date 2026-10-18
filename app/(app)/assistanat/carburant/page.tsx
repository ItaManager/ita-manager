"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Fuel, FileText, Warehouse, TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OngletDemandes } from "./_components/onglet-demandes";
import { OngletGarages } from "./_components/onglet-garages";
import { OngletRechargements } from "./_components/onglet-rechargements";
import { OngletConsommation } from "./_components/onglet-consommation";
import { ModalDemandeCarburant } from "./_components/modal-demande-carburant";

export default function CarburantPage() {
  const [modalDemandeOpen, setModalDemandeOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Fuel className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-semibold">Carburant</h1>
            <p className="text-sm text-muted-foreground">
              Gestion des demandes, distributions et rechargements
            </p>
          </div>
        </div>
        <Button onClick={() => setModalDemandeOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle demande
        </Button>
      </div>

      <Tabs defaultValue="demandes" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="demandes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Demandes
          </TabsTrigger>
          <TabsTrigger value="garages" className="flex items-center gap-2">
            <Warehouse className="h-4 w-4" />
            Garages
          </TabsTrigger>
          <TabsTrigger value="rechargements" className="flex items-center gap-2">
            <Fuel className="h-4 w-4" />
            Rechargements
          </TabsTrigger>
          <TabsTrigger value="consommation" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Consommation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="demandes" className="space-y-4">
          <OngletDemandes key={refreshKey} onRefresh={handleRefresh} />
        </TabsContent>

        <TabsContent value="garages" className="space-y-4">
          <OngletGarages key={refreshKey} onRefresh={handleRefresh} />
        </TabsContent>

        <TabsContent value="rechargements" className="space-y-4">
          <OngletRechargements key={refreshKey} onRefresh={handleRefresh} />
        </TabsContent>

        <TabsContent value="consommation" className="space-y-4">
          <OngletConsommation key={refreshKey} />
        </TabsContent>
      </Tabs>

      <ModalDemandeCarburant
        open={modalDemandeOpen}
        onOpenChange={setModalDemandeOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
