import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { ModuleLayout } from "@/components/layouts/module-layout";
import { ListeCommandes } from "./_components/liste-commandes";
import { verifierAccesPage } from "@/lib/auth/page-access";
import { Suspense } from "react";

export default async function PageCommandes() {
  await verifierAccesPage("/achats/commandes");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/connexion");

  // Charger les demandes avec dernier événement = INSTRUCTION, AVIS_COMITE ou autre
  // On cherche les demandes qui ont été instruites et validées
  const demandes = await prisma.demandeAchat.findMany({
    include: {
      demandeur: {
        select: {
          id: true,
          matricule: true,
          nom: true,
          prenom: true,
        },
      },
      beneficiaire: {
        select: {
          matricule: true,
          nom: true,
          prenom: true,
        },
      },
      lignes: {
        include: {
          article: { select: { designation: true } },
          fournisseur: { select: { nom: true } },
        },
      },
      evenements: {
        orderBy: { timestamp: "desc" },
        take: 1,
        select: { type: true, timestamp: true },
      },
    },
    orderBy: { creeLe: "desc" },
  });

  // Filtrer les demandes prêtes pour émission de BC
  // (Instruction complète, validations comité si nécessaire)
  const demandesACommander = demandes.filter((d) => {
    const dernierEvenement = d.evenements[0]?.type;
    return (
      dernierEvenement === "INSTRUCTION" ||
      dernierEvenement === "AVIS_COMITE" ||
      dernierEvenement === "TRANSMISSION_COMITE"
    );
  });

  // Convertir les Decimal en number pour le client
  const demandesSerializables = demandesACommander.map((d) => ({
    ...d,
    lignes: d.lignes.map((l) => ({
      ...l,
      quantite: Number(l.quantite),
      prixUnitaire: l.prixUnitaire ? Number(l.prixUnitaire) : null,
      tauxTva: l.tauxTva ? Number(l.tauxTva) : null,
    })),
    creeLe: d.creeLe.toISOString(),
    dateBesoin: d.dateBesoin.toISOString(),
    evenements: d.evenements.map((e) => ({
      ...e,
      timestamp: e.timestamp.toISOString(),
    })),
  }));

  return (
    <ModuleLayout
      titre="Suivi de commande"
      description="Émettre les bons de commande pour les demandes validées"
      helpText="Les demandes validées et instruites apparaissent ici pour émission du bon de commande. Vérifiez les fournisseurs et montants avant d'émettre."
    >
      <Suspense fallback={<div>Chargement...</div>}>
        <ListeCommandes demandes={demandesSerializables} />
      </Suspense>
    </ModuleLayout>
  );
}
