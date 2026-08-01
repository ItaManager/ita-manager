/**
 * Écran des relevés de paiements
 */

import { redirect } from 'next/navigation';
import { exigerPermission } from '@/lib/auth/guard';

export const metadata = {
  title: 'Relevés de paiements · ItaPay',
};

export default async function PageReleves() {
  const session = await exigerPermission('paiement:consulter');

  if (!session) {
    redirect('/connexion');
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Relevés de paiements</h1>
      <div className="text-center py-12 text-muted-foreground">
        Écran en construction · Affichera les relevés de paiements exécutés
      </div>
    </div>
  );
}
