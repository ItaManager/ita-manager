/**
 * Écran du solde du portefeuille Wave
 */

import { redirect } from 'next/navigation';
import { exigerPermission } from '@/lib/auth/guard';

export const metadata = {
  title: 'Portefeuille Wave · ItaPay',
};

export default async function PagePortefeuille() {
  const session = await exigerPermission('paiement:consulter');

  if (!session) {
    redirect('/connexion');
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Portefeuille Wave</h1>
      <div className="text-center py-12 text-muted-foreground">
        Écran en construction · Affichera le solde du portefeuille Wave
        <br />
        Consultez business.wave.com pour le solde actuel
      </div>
    </div>
  );
}
