/**
 * Modale validation DG (pour factures > seuil)
 *
 * D-02 : Double validation au-delà du seuil
 *
 * Workflow : A_VALIDER_DG → A_PAYER ou REFUSEE
 */

'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  getFactureFournisseur,
  validerFactureFournisseurDG,
  refuserFactureFournisseur,
} from '@/lib/actions/paiements-fournisseurs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Shield } from 'lucide-react';

interface Props {
  factureId: string;
  open: boolean;
  onClose: () => void;
}

export function ModalValiderDG({ factureId, open, onClose }: Props) {
  const [isPending, startTransition] = useTransition();
  const [facture, setFacture] = useState<any>(null);
  const [modeRefus, setModeRefus] = useState(false);
  const [motifRefus, setMotifRefus] = useState('');

  useEffect(() => {
    if (open && factureId) {
      chargerFacture();
      setModeRefus(false);
      setMotifRefus('');
    }
  }, [open, factureId]);

  const chargerFacture = async () => {
    try {
      const res = (await getFactureFournisseur({ factureId })) as any;
      if (res.success) {
        setFacture(res.facture);
      }
    } catch (error) {
      toast.error('Erreur de chargement de la facture');
    }
  };

  const handleValider = async () => {
    startTransition(async () => {
      try {
        const res = (await validerFactureFournisseurDG({ factureId })) as any;

        if (res.success) {
          toast.success('Validation DG effectuée', {
            description: 'La facture est maintenant prête pour paiement',
          });
          onClose();
        }
      } catch (error) {
        toast.error('Erreur', {
          description:
            error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    });
  };

  const handleRefuser = async () => {
    if (!motifRefus.trim()) {
      toast.error('Veuillez indiquer un motif de refus');
      return;
    }

    startTransition(async () => {
      try {
        const res = (await refuserFactureFournisseur({
          factureId,
          motif: motifRefus,
        })) as any;

        if (res.success) {
          toast.success('Facture refusée', {
            description: 'Le gestionnaire et le fournisseur seront notifiés',
          });
          onClose();
        }
      } catch (error) {
        toast.error('Erreur', {
          description:
            error instanceof Error ? error.message : 'Erreur inconnue',
        });
      }
    });
  };

  if (!facture) {
    return null;
  }

  const montantTTC = Number(facture.montantTTC);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Validation Directeur Général
          </DialogTitle>
          <DialogDescription>
            Approbation finale pour facture à montant élevé
          </DialogDescription>
        </DialogHeader>

        {/* Détails facture */}
        <Card className="p-4 bg-muted/50">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fournisseur :</span>
              <span className="font-medium">{facture.fournisseur.nom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Référence :</span>
              <span className="font-medium">{facture.reference}</span>
            </div>
            {facture.projet && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Projet :</span>
                <span className="font-medium text-xs">
                  {facture.projet.code} - {facture.projet.nom}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Réception :</span>
              <Badge className="bg-green-100 text-green-700">
                Confirmée le{' '}
                {new Date(facture.receptionneLe).toLocaleDateString('fr-FR')}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Validée gestionnaire :
              </span>
              <Badge className="bg-blue-100 text-blue-700">
                {new Date(facture.valideLe).toLocaleDateString('fr-FR')}
              </Badge>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Montant TTC :</span>
              <span className="font-semibold tabular-nums text-lg">
                {montantTTC.toLocaleString()} F
              </span>
            </div>
          </div>
        </Card>

        {/* Mode refus */}
        {modeRefus ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Motif du refus *</label>
              <Textarea
                value={motifRefus}
                onChange={(e) => setMotifRefus(e.target.value)}
                placeholder="Indiquez la raison du refus..."
                rows={4}
                className="mt-2 rounded-md resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setModeRefus(false)}
                disabled={isPending}
              >
                Annuler
              </Button>
              <Button
                onClick={handleRefuser}
                disabled={isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                <XCircle className="mr-2 h-4 w-4" />
                {isPending ? 'Refus...' : 'Confirmer le refus'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={isPending}>
              Annuler
            </Button>
            <Button
              variant="outline"
              onClick={() => setModeRefus(true)}
              disabled={isPending}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Refuser
            </Button>
            <Button
              onClick={handleValider}
              disabled={isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {isPending ? 'Validation...' : 'Approuver et autoriser paiement'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
