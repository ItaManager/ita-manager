/**
 * Modale validation facture (Gestionnaire)
 *
 * D-02 : Si montant > seuil → A_VALIDER_DG, sinon → A_PAYER
 *
 * Workflow : A_VALIDER → A_VALIDER_DG ou A_PAYER
 */

'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  getFactureFournisseur,
  validerFactureFournisseur,
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
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface Props {
  factureId: string;
  open: boolean;
  onClose: () => void;
}

const SEUIL_DG = 500000; // FCFA

export function ModalValiderFacture({ factureId, open, onClose }: Props) {
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
        const res = (await validerFactureFournisseur({ factureId })) as any;

        if (res.success) {
          const message = res.necessiteValidationDG
            ? 'Facture validée - Envoi au DG pour validation finale'
            : 'Facture validée - Prête pour paiement';

          toast.success('Validation effectuée', {
            description: message,
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
            description: 'Le fournisseur sera notifié',
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
  const necessiteValidationDG = montantTTC > SEUIL_DG;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Validation facture</DialogTitle>
          <DialogDescription>
            Vérifiez la cohérence avec la réception confirmée
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
            <div className="flex justify-between">
              <span className="text-muted-foreground">Réception :</span>
              <Badge className="bg-green-100 text-green-700">
                Confirmée le{' '}
                {new Date(facture.receptionneLe).toLocaleDateString('fr-FR')}
              </Badge>
            </div>
            {facture.receptionCommentaire && (
              <div className="border-t pt-2">
                <p className="text-xs text-muted-foreground">
                  Commentaire réception :
                </p>
                <p className="text-xs italic">{facture.receptionCommentaire}</p>
              </div>
            )}
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Montant TTC :</span>
              <span className="font-semibold tabular-nums">
                {montantTTC.toLocaleString()} F
              </span>
            </div>
          </div>
        </Card>

        {/* D-02 : Alerte si > seuil */}
        {necessiteValidationDG && (
          <Card className="p-4 bg-orange-50 border-orange-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">
                  Validation DG requise
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Le montant ({montantTTC.toLocaleString()} F) dépasse le seuil
                  de {SEUIL_DG.toLocaleString()} F. Après votre validation,
                  cette facture sera envoyée au Directeur Général pour
                  approbation finale.
                </p>
              </div>
            </div>
          </Card>
        )}

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
              {isPending
                ? 'Validation...'
                : necessiteValidationDG
                ? 'Valider et envoyer au DG'
                : 'Valider'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
