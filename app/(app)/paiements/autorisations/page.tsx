/**
 * Écran des demandes d'autorisation (DG)
 * Route: /paiements/autorisations
 * Permission: paiement:autoriser
 */

import { redirect } from 'next/navigation';
import { exigerPermission } from '@/lib/auth/guard';
import { listerDemandesPaiement } from '@/lib/actions/paiements';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Autorisations de paiement · ItaPay',
};

export default async function PageAutorisations() {
  const session = await exigerPermission('paiement:autoriser');

  if (!session) {
    redirect('/connexion');
  }

  // Récupérer uniquement les demandes en attente d'autorisation
  const demandes = await listerDemandesPaiement({
    enAttenteAutorisation: true,
  });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Demandes d'autorisation</h1>
        <p className="text-muted-foreground mt-1">
          Demandes de paiement en attente de votre autorisation
        </p>
      </div>

      {demandes.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Aucune demande en attente d'autorisation
        </div>
      ) : (
        <div className="space-y-4">
          {demandes.map((demande: any) => (
            <div key={demande.id} className="border rounded p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{demande.referenceIta}</div>
                  <div className="text-sm text-muted-foreground">
                    {demande.categorie} · {demande.lignes?.length || 0} bénéficiaire(s)
                  </div>
                  <div className="text-lg font-bold mt-2">
                    {demande.montantTotal.toString()} XOF
                  </div>
                </div>
                <Link href={`/autoriser-paiement/${demande.id}`}>
                  <Button>Examiner</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
