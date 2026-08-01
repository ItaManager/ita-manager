/**
 * Page d'exécution de paiement (M15 — ItaPay)
 *
 * Accessible uniquement au DFC (paiement:executer)
 *
 * BANDEAU DANGER PERMANENT : ATTENTION ARGENT RÉEL
 *
 * Circuit :
 * 1. DG autorise → notification au DFC
 * 2. DFC clique sur le lien → arrive ici
 * 3. DFC vérifie les détails et exécute le paiement
 * 4. Appels Wave transfer_to (client simulé en Livraison 1)
 *
 * Critère de recette (Livraison 1) :
 * Le bandeau « argent réel » reste visible
 */

import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import ExecutionClient from './execution-client';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ExecuterPaiementPage({ params }: Props) {
  const { id } = await params;

  // Vérifier l'authentification
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/connexion?retour=/executer-paiement/' + id);
  }

  // Récupérer le profil avec les permissions
  const profil = await prisma.profil.findUnique({
    where: { id: user.id },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!profil) {
    redirect('/connexion');
  }

  // Vérifier la permission paiement:executer
  const permissions = profil.roles.flatMap((pr) =>
    pr.role.permissions.map((rp) => rp.permission.code)
  );

  if (!permissions.includes('paiement:executer')) {
    redirect('/403');
  }

  // Récupérer la demande de paiement
  const demande = await prisma.demandePaiement.findUnique({
    where: { id },
    include: {
      lignes: {
        select: {
          id: true,
          beneficiaireNom: true,
          beneficiaireMobile: true,
          montant: true,
          motifPaiement: true,
          referenceIta: true,
          verifieLe: true,
          nameMatch: true,
          withinLimits: true,
          statut: true,
          executeLe: true,
          wavePayoutId: true,
        },
      },
      autorisation: true,
      preparateur: {
        select: {
          email: true,
        },
      },
    },
  });

  if (!demande) {
    notFound();
  }

  // Vérifier que l'autorisation existe et est valide
  if (!demande.autorisation) {
    redirect('/paiements?erreur=autorisation-manquante');
  }

  if (!demande.autorisation.autoriseeLe) {
    redirect('/paiements?erreur=non-autorisee');
  }

  // Convertir les Decimal en number pour le client
  const demandeTypee = {
    ...demande,
    montantTotal: Number(demande.montantTotal),
    lignes: demande.lignes.map((l: any) => ({
      ...l,
      montant: Number(l.montant),
    })),
    autorisation: demande.autorisation
      ? {
          ...demande.autorisation,
          montantFige: Number(demande.autorisation.montantFige),
        }
      : null,
  };

  return <ExecutionClient demande={demandeTypee} session={{ userId: user.id, email: profil.email }} />;
}
