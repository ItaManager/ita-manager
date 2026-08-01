/**
 * Écran des anomalies de paiement
 */

import { redirect } from 'next/navigation';
import { exigerPermission } from '@/lib/auth/guard';

export const metadata = {
  title: 'Anomalies · ItaPay',
};

export default async function PageAnomalies() {
  const session = await exigerPermission('paiement:preparer');

  if (!session) {
    redirect('/connexion');
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Anomalies</h1>
      <div className="text-center py-12 text-muted-foreground">
        Écran en construction · Affichera les paiements en erreur ou EN_ATTENTE
      </div>
    </div>
  );
}
