'use client';

/**
 * Formulaire de préparation de demande de paiement
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { preparerDemande } from '@/lib/actions/paiements';

type LignePaiement = {
  id: string;
  beneficiaireNom: string;
  beneficiaireMobile: string;
  montant: number;
  motifPaiement: string;
};

export function FormulairePreparer() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [categorie, setCategorie] = useState<
    'SALAIRES' | 'PRIMES' | 'FOURNISSEURS' | 'PRESTATAIRES' | 'DIVERS'
  >('FOURNISSEURS');
  const [sourceId, setSourceId] = useState('DEMO-SOURCE-001');
  const [sourceType, setSourceType] = useState('FACTURE');

  const [lignes, setLignes] = useState<LignePaiement[]>([
    {
      id: '1',
      beneficiaireNom: '',
      beneficiaireMobile: '',
      montant: 0,
      motifPaiement: '',
    },
  ]);

  const ajouterLigne = () => {
    setLignes([
      ...lignes,
      {
        id: Date.now().toString(),
        beneficiaireNom: '',
        beneficiaireMobile: '',
        montant: 0,
        motifPaiement: '',
      },
    ]);
  };

  const supprimerLigne = (id: string) => {
    if (lignes.length > 1) {
      setLignes(lignes.filter((l) => l.id !== id));
    }
  };

  const modifierLigne = (id: string, champ: keyof LignePaiement, valeur: any) => {
    setLignes(
      lignes.map((l) =>
        l.id === id ? { ...l, [champ]: valeur } : l
      )
    );
  };

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await preparerDemande({
        categorie,
        sourceId,
        sourceType,
        lignes: lignes.map((l) => ({
          beneficiaireNom: l.beneficiaireNom,
          beneficiaireMobile: l.beneficiaireMobile,
          montant: l.montant,
          motifPaiement: l.motifPaiement,
        })),
      });

      if (result.success) {
        router.push(`/paiements?success=demande-creee&ref=${result.reference}`);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création de la demande');
    } finally {
      setLoading(false);
    }
  };

  const montantTotal = lignes.reduce((acc, l) => acc + (l.montant || 0), 0);

  return (
    <form onSubmit={soumettre} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="categorie">Catégorie</Label>
          <Select value={categorie} onValueChange={(v: any) => setCategorie(v)}>
            <SelectTrigger id="categorie">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SALAIRES">Salaires</SelectItem>
              <SelectItem value="PRIMES">Primes</SelectItem>
              <SelectItem value="FOURNISSEURS">Fournisseurs</SelectItem>
              <SelectItem value="PRESTATAIRES">Prestataires</SelectItem>
              <SelectItem value="DIVERS">Divers</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="sourceId">Source ID</Label>
          <Input
            id="sourceId"
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            placeholder="Ex: BC-2026-001"
            required
          />
        </div>

        <div>
          <Label htmlFor="sourceType">Source Type</Label>
          <Input
            id="sourceType"
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value)}
            placeholder="Ex: FACTURE"
            required
          />
        </div>
      </div>

      <div className="border rounded p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Bénéficiaires</h3>
          <Button type="button" onClick={ajouterLigne} variant="outline" size="sm">
            + Ajouter
          </Button>
        </div>

        {lignes.map((ligne, index) => (
          <div key={ligne.id} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-3">
              <Label>Nom bénéficiaire</Label>
              <Input
                value={ligne.beneficiaireNom}
                onChange={(e) =>
                  modifierLigne(ligne.id, 'beneficiaireNom', e.target.value)
                }
                placeholder="KOUASSI Jean"
                required
              />
            </div>

            <div className="col-span-3">
              <Label>Téléphone Wave</Label>
              <Input
                value={ligne.beneficiaireMobile}
                onChange={(e) =>
                  modifierLigne(ligne.id, 'beneficiaireMobile', e.target.value)
                }
                placeholder="+2250700000000"
                required
              />
            </div>

            <div className="col-span-2">
              <Label>Montant (XOF)</Label>
              <Input
                type="number"
                value={ligne.montant || ''}
                onChange={(e) =>
                  modifierLigne(ligne.id, 'montant', parseFloat(e.target.value) || 0)
                }
                placeholder="50000"
                required
              />
            </div>

            <div className="col-span-3">
              <Label>Motif (max 40 car.)</Label>
              <Input
                value={ligne.motifPaiement}
                onChange={(e) =>
                  modifierLigne(ligne.id, 'motifPaiement', e.target.value)
                }
                placeholder="ITA - Facture FA-001"
                maxLength={40}
                required
              />
            </div>

            <div className="col-span-1">
              <Button
                type="button"
                onClick={() => supprimerLigne(ligne.id)}
                variant="destructive"
                size="sm"
                disabled={lignes.length === 1}
              >
                ×
              </Button>
            </div>
          </div>
        ))}

        <div className="text-right font-bold">
          Total : {montantTotal.toLocaleString('fr-FR')} XOF
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/paiements')}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Création...' : 'Créer la demande'}
        </Button>
      </div>
    </form>
  );
}
