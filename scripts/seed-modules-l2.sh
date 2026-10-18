#!/bin/bash
##
## Script : Seed des modules L2 (M16 L2 Carburant + M15 L2 Paiements Fournisseurs)
##
## Usage: ./scripts/seed-modules-l2.sh
##

set -e

echo "🚀 Seed des modules M16 L2 et M15 L2"
echo "===================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# M16 L2 - Carburant
echo -e "${BLUE}📦 M16 L2 — Carburant${NC}"
echo "--------------------"
tsx scripts/seed-carburant-demo.ts
echo ""

# M15 L2 - Paiements Fournisseurs
echo -e "${BLUE}💰 M15 L2 — Paiements Fournisseurs${NC}"
echo "-----------------------------------"
tsx scripts/seed-paiements-fournisseurs-demo.ts
echo ""

echo -e "${GREEN}✅ Seed des modules L2 terminé avec succès !${NC}"
echo ""
echo "Vous pouvez maintenant :"
echo "  • Accéder à /assistanat/carburant pour M16 L2"
echo "  • Accéder à /paiements/fournisseurs pour M15 L2"
