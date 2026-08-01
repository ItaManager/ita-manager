/**
 * Écran de préparation de demandes de paiement
 * Route: /paiements/a-preparer
 * Permission: paiement:preparer
 */

import { redirect } from 'next/navigation';
import { exigerPermission } from '@/lib/auth/guard';
import { FormulairePreparer } from './_components/formulaire-preparer';

export const metadata = {
  title: 'Préparer un paiement · ItaPay',
};

export default async function PagePreparerPaiement() {
  const session = await exigerPermission('paiement:preparer');

  if (!session) {
    redirect('/connexion');
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Préparer une demande de paiement</h1>
        <p className="text-muted-foreground mt-1">
          Créez une nouvelle demande de paiement pour un ou plusieurs
          bénéficiaires. La demande nécessitera une autorisation du DG avant
          exécution.
        </p>
      </div>

      <FormulairePreparer />
    </div>
  );
}
