/**
 * Page d'autorisation de paiement (M15 — ItaPay)
 *
 * HORS COQUILLE — 420px — Mobile-first
 *
 * Accessible uniquement au DG (paiement:autoriser)
 *
 * Circuit :
 * 1. DFC demande l'autorisation → notification email au DG
 * 2. DG clique sur le lien dans l'email → arrive ici
 * 3. DG vérifie les détails et autorise ou refuse
 *
 * Critère de recette (Livraison 1) :
 * S'affiche correctement sur téléphone
 */

import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';
import AutorisationClient from './autorisation-client';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AutoriserPaiementPage({ params }: Props) {
  const { id } = await params;

  // Vérifier l'authentification
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/connexion?retour=/autoriser-paiement/' + id);
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

  // Vérifier la permission paiement:autoriser
  const permissions = profil.roles.flatMap((pr) =>
    pr.role.permissions.map((rp) => rp.permission.code)
  );

  if (!permissions.includes('paiement:autoriser')) {
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
          verifieLe: true,
          nameMatch: true,
          withinLimits: true,
          statut: true,
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

  // Convertir les Decimal en number pour le client
  const demandeTypee = {
    ...demande,
    montantTotal: Number(demande.montantTotal),
    lignes: demande.lignes.map((l) => ({
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

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <AutorisationClient
          demande={demandeTypee}
          session={{ userId: user.id, email: profil.email }}
        />
      </div>
    </div>
  );
}
