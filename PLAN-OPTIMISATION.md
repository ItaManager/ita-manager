# 🎯 PLAN D'OPTIMISATION GLOBALE — ITA MANAGER

**Durée** : 5 jours
**Objectif** : Consolider les 6 modules livrés avant d'ajouter de nouvelles fonctionnalités
**Résultat attendu** : Base solide, sécurisée, performante et testée

---

## 📅 JOUR 1 : AUDIT SÉCURITÉ R-17

### Objectif
Vérifier que **TOUS** les fichiers `lib/actions/*.ts` respectent la règle R-17 :
> Un fichier "use server" n'exporte QUE des Server Actions protégées

### Actions

1. **Lister tous les fichiers d'actions**
```bash
find lib/actions -name "*.ts" -type f
```

2. **Vérifier chaque fichier**
- Exporte uniquement des Server Actions avec `actionProtegee` ?
- Aucune fonction utilitaire exportée ?
- Aucun import dans des composants client ?

3. **Modules à auditer**
- ✅ M17 — competences.ts (DÉJÀ FAIT)
- ⚠️ M19 — missions.ts
- ⚠️ M15 — paiements.ts
- ⚠️ M14 — achats.ts
- ⚠️ M13 — documents.ts
- ⚠️ M5 — projets.ts
- ⚠️ M3 — conges.ts
- ⚠️ M2 — employes.ts
- ⚠️ M1 — profils.ts

4. **Script automatique**
```bash
npm run verify-actions-protegees
```

### Livrables
- [ ] Rapport d'audit (fichiers vérifiés)
- [ ] Liste des violations détectées
- [ ] Corrections appliquées
- [ ] Script de vérification amélioré

---

## 📅 JOUR 2 : TESTS FLUX INTER-MODULES

### Objectif
Valider que les modules communiquent correctement entre eux

### Flux 1 : Employé → Congé → Mission
**Scénario** : Un employé demande un congé, puis une mission pendant ce congé

1. Créer un employé (M2)
2. Lui affecter une compétence (M17)
3. Demander un congé (M3)
4. Valider le congé (M3)
5. Demander une mission pendant le congé (M19)
6. **Attendu** : Détection du chevauchement

### Flux 2 : Employé → Affectation chantier → Compétence
**Scénario** : Un journalier sans compétence est affecté à un chantier

1. Créer un journalier (M2)
2. L'affecter à un projet (M5)
3. **Attendu** : Alerte "agent sans compétence"
4. Assigner une compétence (M17)
5. Vérifier coût journalier du projet

### Flux 3 : Document → Employé → Archivage
**Scénario** : Archiver un employé avec des documents

1. Créer un employé (M2)
2. Ajouter des documents (M13)
3. Archiver l'employé
4. **Attendu** : Documents conservés mais marqués

### Livrables
- [ ] 3 flux testés manuellement
- [ ] Bugs détectés et documentés
- [ ] Corrections appliquées
- [ ] Scripts de test automatisés

---

## 📅 JOUR 3 : OPTIMISATION PERFORMANCE

### Objectif
Détecter et corriger les requêtes N+1 et les problèmes de performance

### Actions

1. **Analyser les requêtes Prisma**
```bash
# Activer les logs Prisma
DATABASE_URL="...?log=query"
```

2. **Modules à optimiser**
- Liste employés (M2) — include vs select
- Liste compétences (M17) — comptage agents
- Liste missions (M19) — statut calculé
- Liste projets (M5) — tâches et jalons
- Liste documents (M13) — relations

3. **Optimisations**
- [ ] Utiliser `select` au lieu de `include` quand possible
- [ ] Paginer toutes les listes (25 items)
- [ ] Ajouter index manquants
- [ ] Regrouper les requêtes en transactions
- [ ] Mettre en cache les données statiques

4. **Benchmarks**
```bash
# Mesurer avant/après
time curl "http://localhost:3000/api/employes"
```

### Livrables
- [ ] Rapport de performance (temps de réponse)
- [ ] Index ajoutés au schéma Prisma
- [ ] Requêtes optimisées
- [ ] Temps de chargement < 500ms

---

## 📅 JOUR 4 : TESTS INTÉGRATION PAIEMENTS

### Objectif
Valider le circuit complet : Achats → Paiements → Documents

### Flux : Achat → Validation → Paiement → Justificatif
**Scénario** : Demande d'achat validée puis payée

1. Créer une demande d'achat (M14)
2. Validation N+1 (M14)
3. Validation DG (M14)
4. Générer bon de commande (M14)
5. Créer paiement Wave (M15)
6. Autoriser paiement DG (M15)
7. Exécuter paiement DFC (M15)
8. Joindre justificatif (M13)
9. **Attendu** : Circuit complet tracé

### Tests spécifiques M15
- [ ] Paiement standard (< 1M)
- [ ] Paiement urgent (> 1M, 4 yeux)
- [ ] Annulation avant exécution
- [ ] Reprise paiements EN_ATTENTE

### Livrables
- [ ] Circuit achat→paiement validé
- [ ] Bugs détectés et corrigés
- [ ] Logs des événements vérifiés
- [ ] Justificatifs correctement liés

---

## 📅 JOUR 5 : DOCUMENTATION & PROD-READY

### Objectif
Préparer l'application pour la production

### Actions

1. **Documentation technique**
- [ ] README.md à jour
- [ ] Guide de déploiement
- [ ] Variables d'environnement
- [ ] Procédures de backup
- [ ] Guide de rollback

2. **Documentation utilisateur**
- [ ] Guide utilisateur par module
- [ ] Vidéos de démonstration (optionnel)
- [ ] FAQ

3. **Vérifications finales**
```bash
# Build production
npm run build

# Tests
npx tsc --noEmit
npm run verify

# Migrations
npx prisma migrate deploy
```

4. **Checklist production**
- [ ] Toutes les variables d'env définies
- [ ] Backup base de données configuré
- [ ] Monitoring configuré
- [ ] Logs centralisés
- [ ] Emails de notification testés
- [ ] HTTPS activé
- [ ] CORS configuré
- [ ] Rate limiting activé

### Livrables
- [ ] Documentation complète
- [ ] Build production réussi
- [ ] Checklist prod validée
- [ ] Plan de déploiement

---

## 🎯 CRITÈRES DE SUCCÈS

À la fin de ces 5 jours :

✅ **Sécurité**
- Aucune violation R-17
- Toutes les Server Actions protégées
- Aucun endpoint HTTP exposé

✅ **Performance**
- Temps de chargement < 500ms
- Aucune requête N+1
- Pagination activée partout

✅ **Qualité**
- 3 flux inter-modules testés
- 0 erreur TypeScript
- Build production réussi

✅ **Documentation**
- README complet
- Guide déploiement
- Guide utilisateur

---

## 📊 MÉTRIQUES DE SUIVI

| Métrique | Avant | Cible | Après |
|---|---|---|---|
| Violations R-17 | ? | 0 | — |
| Temps chargement moyen | ? | < 500ms | — |
| Erreurs TypeScript | 0 | 0 | — |
| Modules testés | 0 | 6 | — |
| Documentation | 20% | 80% | — |

---

## 🚀 PRÊT À COMMENCER ?

Commençons par le **JOUR 1 : AUDIT SÉCURITÉ R-17**

