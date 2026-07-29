# Fiche de correction — M0 étape 0.4 · Authentification

> À traiter avant la clôture de M0. Quatre correctifs, du plus bloquant au
> plus cosmétique.
>
> Référence visuelle : `ApercuM0.jsx`.

---

## 1 · Le code QR ne s'affiche pas — **bloquant**

### Symptôme

L'image affiche son texte de remplacement « Code QR de configuration TOTP ».
Le secret est bien généré, la vérification fonctionne, seule l'image manque.

### Causes possibles

| # | Cause | Vérification |
| --- | --- | --- |
| 1 | Le data URI de Supabase est mal encodé | `data.totp.qr_code` contient un `#` non encodé qui coupe l'URI |
| 2 | La politique de sécurité bloque une source externe | Console : blocage `Content-Security-Policy` sur `img-src` |
| 3 | `next/image` sans domaine autorisé | Erreur explicite au chargement |

### Correctif retenu

**Ne pas utiliser l'image renvoyée par Supabase.** Générer le QR côté client
à partir de `data.totp.uri`. Cela règle les trois causes d'un coup : aucune
image chargée, aucun data URI, aucune requête externe.

```bash
npm install qrcode.react
```

```tsx
"use client";

import { QRCodeSVG } from "qrcode.react";

// enrolement provient de supabase.auth.mfa.enroll({ factorType: "totp" })
// enrolement.totp.uri → "otpauth://totp/ITA%20Manager:email?secret=…&issuer=…"

<div className="mx-auto flex size-52 items-center justify-center rounded-lg border-2 bg-card p-3">
  <QRCodeSVG
    value={enrolement.totp.uri}
    size={180}
    level="M"
    aria-label="Code QR de configuration de la double authentification"
  />
</div>
```

**Vérification** : le QR doit être scannable par Google Authenticator, et le
code généré doit être accepté.

---

## 2 · Le champ de code accepte des lettres — **bloquant**

### Symptôme

Sur les captures, « O6INMA » a été saisi dans le champ « Code à 6 chiffres ».
L'utilisateur a recopié le début du secret dans le mauvais champ.

**Ce n'est pas une erreur d'utilisateur, c'est un défaut du champ.** Il doit
rendre cette saisie impossible.

### Correctif

```tsx
<Input
  value={code}
  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
  inputMode="numeric"
  autoComplete="one-time-code"
  maxLength={6}
  placeholder="000000"
  className="text-center font-mono text-xl tracking-[0.5em]"
  aria-label="Code à six chiffres"
/>
```

Quatre points :

- `replace(/\D/g, "")` — toute saisie non numérique est écartée
- `inputMode="numeric"` — clavier numérique sur tablette
- `autoComplete="one-time-code"` — remplissage automatique depuis le trousseau
- Le bouton reste inactif tant que `code.length !== 6`

### Le secret manuel, à distinguer visuellement

Le secret affiché sous le QR ne doit pas ressembler au champ de saisie —
c'est ce qui a produit la confusion.

```tsx
<div className="rounded-lg bg-muted p-3 text-center">
  <p className="text-xs text-muted-foreground">
    Impossible de scanner ? Saisissez cette clé dans votre application :
  </p>
  <code className="mt-1 block break-all font-mono text-sm text-primary">
    {secretFormate}
  </code>
</div>
```

Formater par groupes de quatre — `O6IN MAXO JT4K IRQP` — pour la recopie
manuelle.

---

## 3 · Les codes de secours manquent — **bloquant**

Exigence du dossier M0, section 6, et critère de recette.

### Attendu

Après la vérification réussie du code TOTP, **avant** l'accès à
l'application :

- Dix codes à usage unique
- **Affichés une seule fois**, jamais réaccessibles
- Copier et imprimer
- Confirmation explicite avant de poursuivre

```tsx
<Alert className="border-warning-border bg-warning-soft">
  <AlertTriangle className="size-4 text-warning" />
  <AlertTitle className="text-warning">
    Ces codes ne seront plus jamais affichés
  </AlertTitle>
  <AlertDescription className="text-warning">
    Imprimez-les ou notez-les maintenant. Ils sont votre seul recours si vous
    perdez votre téléphone.
  </AlertDescription>
</Alert>

<div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-4">
  {codes.map((c) => (
    <code key={c} className="font-mono text-sm text-primary">{c}</code>
  ))}
</div>

<Button onClick={terminer} className="w-full bg-success …">
  J'ai conservé mes codes, accéder à l'application
</Button>
```

**Vérification** : un code de secours utilisé ne doit pas fonctionner une
seconde fois.

---

## 4 · Finition visuelle — **non bloquant, à rattraper**

Les écrans sont fonctionnels mais nus au regard du thème. Comparer avec
`ApercuM0.jsx`.

### 4.1 · Bloc d'identité

Absent des captures. À placer au-dessus de la carte, sur tous les écrans
publics — connexion, activation, réinitialisation.

```tsx
<div className="mb-8 flex items-center justify-center gap-3">
  <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
    ITA
  </div>
  <div>
    <p className="font-semibold text-primary">ITA Manager</p>
    <p className="text-xs text-muted-foreground">Ingénierie &amp; Travaux SARL</p>
  </div>
</div>
```

### 4.2 · Structure de carte

Chaque carte porte un titre et un sous-titre. Sur les captures, la carte de
connexion commence directement par « E-mail ».

```tsx
<Card className="p-8">
  <h1 className="text-xl font-semibold text-primary">Connexion</h1>
  <p className="mt-1 text-sm text-muted-foreground">
    Accédez à votre espace de travail.
  </p>
  {/* champs */}
</Card>
```

### 4.3 · Fil de progression sur l'activation

L'activation compte trois étapes — mot de passe, double authentification,
codes de secours. Rien ne l'indique.

```tsx
<div className="mb-6 flex gap-1.5">
  {etapes.map((_, i) => (
    <span key={i} className="h-1.5 flex-1 rounded-full"
      style={{ background: i + 1 <= etape ? "var(--success)" : "var(--success-soft)" }} />
  ))}
</div>
<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
  Première connexion · étape {etape} sur {etapes.length}
</p>
```

### 4.4 · Robustesse du mot de passe

Sur l'écran de définition du mot de passe : quatre segments, plus un message
qui dit ce qui manque — « 4 caractères manquants », « ajoutez des majuscules
ou des chiffres », « mot de passe robuste ».

### 4.5 · Afficher ou masquer le mot de passe

Bouton œil dans le champ. Absent des captures.

### 4.6 · Message d'erreur de connexion

Doit rester **générique** : « Identifiants incorrects. » Ne jamais préciser
si c'est l'adresse ou le mot de passe qui est faux — cela permettrait
d'énumérer les comptes existants.

Après trois tentatives, ajouter une ligne expliquant la limitation à venir.

---

## Contrôle après correction

- [ ] Le QR s'affiche et se scanne avec Google Authenticator
- [ ] Le champ de code n'accepte que des chiffres, six au maximum
- [ ] Le secret manuel est visuellement distinct du champ de saisie
- [ ] Dix codes de secours s'affichent après vérification
- [ ] Un code de secours utilisé ne fonctionne pas deux fois
- [ ] Le bloc d'identité apparaît sur les trois écrans publics
- [ ] Le fil de progression est visible pendant l'activation
- [ ] L'indicateur de robustesse réagit à la saisie
- [ ] Le message d'erreur de connexion reste générique
