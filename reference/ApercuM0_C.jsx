import React, { useState, useEffect, useRef } from "react";
import {
	LayoutDashboard, Bell, Calendar, Users, Network, Building2, FileSignature,
	CalendarOff, Clock, CalendarRange, Award, UserSearch, FolderOpen, Wallet,
	Megaphone, BarChart3, Settings, HelpCircle, Search, Lock, Unlock, LogOut,
	ShieldCheck, KeyRound, Mail, Check, X, AlertTriangle, ChevronRight, Eye,
	EyeOff, Loader2, Plus, Trash2, History, Copy, Smartphone, Ban, ArrowLeft,
	ShieldAlert, UserPlus, Power, ScrollText,
} from "lucide-react";

/* ================================================================== */
/* JETONS — identiques à globals.css                                   */
/* ================================================================== */

const C = {
	primary: "#1D186C", primaryHover: "#161152", primarySoft: "#EBEAF2",
	success: "#16850C", successSoft: "#E2FAE0",
	warning: "#B45309", warningSoft: "#FFFBEB", warningBorder: "#FDE68A",
	destructive: "#DC2626", destructiveSoft: "#FEF2F2",
	review: "#7C3AED", reviewSoft: "#F5F3FF",
	muted: "#6B7280", mutedBg: "#F9FAFB", border: "#E5E7EB", bg: "#F7F7FB",
};

/* ================================================================== */
/* RÔLES ET PERMISSIONS — matrice du dossier M0                        */
/* ================================================================== */

const ROLES = {
	ADMIN: { code: "ADMIN", libelle: "Super Admin", nom: "Armel Gnakpa", ini: "AG", totpObligatoire: true },
	DG: { code: "DG", libelle: "Directeur Général", nom: "Jules Konan", ini: "JK", totpObligatoire: true },
	DRH: { code: "DRH", libelle: "Directrice Administrative et RH", nom: "DEMO Directrice RH", ini: "DR", totpObligatoire: true },
	RH: { code: "RH", libelle: "Assistant RH", nom: "DEMO Assistant RH", ini: "AR", totpObligatoire: false },
	DFC: { code: "DFC", libelle: "Directeur Financier", nom: "DEMO Directeur Financier", ini: "DF", totpObligatoire: true },
	DT: { code: "DT", libelle: "Directeur Technique", nom: "DEMO Directeur Technique", ini: "DT", totpObligatoire: true },
	CT: { code: "CT", libelle: "Conducteur de Travaux", nom: "DEMO Conducteur", ini: "CD", totpObligatoire: false },
	CC: { code: "CC", libelle: "Chef de Chantier", nom: "DEMO Chef Chantier", ini: "CC", totpObligatoire: false },
	CE: { code: "CE", libelle: "Chargé d'études", nom: "DEMO Chargé d'études", ini: "CE", totpObligatoire: false },
};

const PERMISSIONS = {
	ADMIN: ["employe:lire", "employe:creer", "employe:modifier", "referentiel:creer", "absence:demander", "absence:valider", "grille:modifier", "derogation:valider", "paie:ouvrirPeriode", "paie:validerDT", "paie:validerDFC", "ao:creer", "ao:validerDG", "projet:creer", "planning:modifier", "releve:saisir", "releve:viser", "ressource:demander", "admin:utilisateurs", "admin:parametres", "admin:journal"],
	DG: ["employe:lire", "absence:demander", "ao:creer", "ao:soumettre", "ao:validerDG", "projet:creer", "jalon:valider"],
	DRH: ["employe:lire", "employe:creer", "employe:modifier", "employe:archiver", "referentiel:creer", "absence:demander", "absence:valider", "paie:ouvrirPeriode", "admin:utilisateurs"],
	RH: ["employe:lire", "employe:creer", "employe:modifier", "absence:demander", "paie:ouvrirPeriode"],
	DFC: ["employe:lire", "absence:demander", "grille:modifier", "derogation:valider", "paie:validerDFC", "paie:exporter"],
	DT: ["employe:lire", "referentiel:creer", "absence:demander", "paie:validerDT", "ao:creer", "ao:soumettre", "projet:creer", "planning:modifier", "jalon:valider", "releve:viser", "ressource:demander"],
	CT: ["employe:lire", "absence:demander", "planning:modifier", "releve:saisir", "releve:viser", "ressource:demander"],
	CC: ["absence:demander", "releve:saisir", "ressource:demander"],
	CE: ["absence:demander", "ao:creer"],
};

/* Modules livrés en M0. Les autres apparaissent désactivés. */
const LIVRES = ["dashboard", "utilisateurs", "journal", "parametres", "aide"];

const NAV = [
	{ groupe: "Pilotage", items: [
		{ id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard, perm: null },
		{ id: "notifications", label: "Notifications", icon: Bell, perm: null, module: "M10" },
		{ id: "calendrier", label: "Calendrier RH", icon: Calendar, perm: null, module: "M10" },
	]},
	{ groupe: "Personnel", items: [
		{ id: "employes", label: "Employés", icon: Users, perm: "employe:lire", module: "M2" },
		{ id: "organigramme", label: "Organigramme", icon: Network, perm: "employe:lire", module: "M1" },
		{ id: "services", label: "Services & Équipes", icon: Building2, perm: "employe:lire", module: "M1" },
		{ id: "contrats", label: "Contrats", icon: FileSignature, perm: "employe:lire", module: "M2" },
	]},
	{ groupe: "Temps & Absences", items: [
		{ id: "conges", label: "Congés & Permissions", icon: CalendarOff, perm: "absence:demander", module: "M3" },
		{ id: "planning", label: "Planning chantier", icon: CalendarRange, perm: "planning:modifier", module: "M5" },
		{ id: "releves", label: "Relevés d'activité", icon: Clock, perm: "releve:saisir", module: "M6" },
	]},
	{ groupe: "Technique", items: [
		{ id: "projets", label: "Projets", icon: Network, perm: "projet:creer", module: "M5" },
		{ id: "ao", label: "Appels d'offres", icon: UserSearch, perm: "ao:creer", module: "M9" },
		{ id: "ressources", label: "Ressources", icon: Award, perm: "ressource:demander", module: "M8" },
	]},
	{ groupe: "Administration", items: [
		{ id: "documents", label: "Documents", icon: FolderOpen, perm: "employe:lire", module: "M2" },
		{ id: "paie", label: "Paie & Rémunération", icon: Wallet, perm: "grille:modifier", module: "M4" },
		{ id: "annonces", label: "Annonces", icon: Megaphone, perm: null, module: "M10" },
		{ id: "rapports", label: "Rapports", icon: BarChart3, perm: null, module: "M10" },
	]},
];

const NAV_BAS = [
	{ id: "utilisateurs", label: "Utilisateurs", icon: Users, perm: "admin:utilisateurs" },
	{ id: "journal", label: "Journal d'audit", icon: ScrollText, perm: "admin:journal" },
	{ id: "parametres", label: "Paramètres", icon: Settings, perm: "admin:parametres" },
	{ id: "aide", label: "Aide", icon: HelpCircle, perm: null },
];

const MODULES_LIB = {
	M1: "Organisation", M2: "Employés", M3: "Congés", M4: "Rémunération",
	M5: "Projets", M6: "Relevés d'activité", M8: "Ressources",
	M9: "Appels d'offres", M10: "Pilotage",
};

/* ================================================================== */
/* PRIMITIVES                                                          */
/* ================================================================== */

const Champ = ({ label, aide, children, requis }) => (
	<div className="flex flex-col gap-1.5">
		<label className="text-sm font-medium" style={{ color: "#374151" }}>
			{label}{requis && <span style={{ color: C.destructive }}> *</span>}
		</label>
		{children}
		{aide && <span className="text-xs leading-snug" style={{ color: C.muted }}>{aide}</span>}
	</div>
);

const Saisie = ({ style, ...p }) => (
	<input
		className="w-full rounded-md border px-3 py-2 text-sm outline-none"
		style={{ borderColor: C.border, background: p.disabled ? C.mutedBg : "#fff", ...style }}
		{...p}
	/>
);

const Bouton = ({ variante = "plein", icone: I, children, style, ...p }) => {
	const v = {
		plein: { background: C.primary, color: "#fff", border: `1px solid ${C.primary}` },
		succes: { background: C.success, color: "#fff", border: `1px solid ${C.success}` },
		vide: { background: "#fff", color: C.primary, border: `1px solid ${C.primary}` },
		fantome: { background: "transparent", color: C.muted, border: `1px solid ${C.border}` },
		danger: { background: "#fff", color: C.destructive, border: `1px solid ${C.destructive}` },
	}[variante];
	return (
		<button type="button" className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition"
			style={{ ...v, ...style }} {...p}>
			{I && <I size={16} />}{children}
		</button>
	);
};

/* Infobulle. Positionnée au-dessus par défaut, à gauche pour les actions
   en fin de ligne — sinon elle sort du tableau. */
function Infobulle({ texte, cote = "haut", children }) {
	const [visible, setVisible] = useState(false);
	if (!texte) return children;

	const pos = {
		haut: { bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
		gauche: { right: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" },
	}[cote];

	return (
		<span className="relative inline-flex"
			onMouseEnter={() => setVisible(true)}
			onMouseLeave={() => setVisible(false)}
			onFocus={() => setVisible(true)}
			onBlur={() => setVisible(false)}>
			{children}
			{visible && (
				<span role="tooltip"
					className="pointer-events-none absolute z-50 whitespace-normal rounded-md px-3 py-2 text-xs leading-snug text-white shadow-lg"
					style={{ ...pos, background: "#111827", width: 220 }}>
					{texte}
				</span>
			)}
		</span>
	);
}

const Badge = ({ fg, bg, children }) => (
	<span className="inline-block whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium" style={{ color: fg, background: bg }}>{children}</span>
);

const Carte = ({ children, className = "", style }) => (
	<div className={"rounded-xl bg-white shadow-sm " + className} style={style}>{children}</div>
);

/* ================================================================== */
/* 1 — CONNEXION                                                       */
/* ================================================================== */

function EcranConnexion({ onConnexion, notifier }) {
	const [email, setEmail] = useState("armelgnakpa7@gmail.com");
	const [mdp, setMdp] = useState("");
	const [voir, setVoir] = useState(false);
	const [chargement, setChargement] = useState(false);
	const [erreur, setErreur] = useState("");
	const [tentatives, setTentatives] = useState(0);

	const connecter = () => {
		setErreur("");
		if (!email || !mdp) { setErreur("Renseignez votre adresse et votre mot de passe."); return; }
		setChargement(true);
		setTimeout(() => {
			setChargement(false);
			if (mdp === "demo") {
				onConnexion(email);
			} else {
				const n = tentatives + 1;
				setTentatives(n);
				setErreur(n >= 5
					? "Trop de tentatives. Réessayez dans 10 minutes."
					: "Identifiants incorrects.");
			}
		}, 700);
	};

	return (
		<div className="flex min-h-screen items-center justify-center px-4" style={{ background: C.bg }}>
			<div className="w-full max-w-md">
				<div className="mb-8 flex items-center justify-center gap-3">
					<div className="flex h-11 w-11 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: C.primary }}>ITA</div>
					<div>
						<div className="font-semibold" style={{ color: C.primary }}>ITA Manager</div>
						<div className="text-xs" style={{ color: C.muted }}>Ingénierie & Travaux SARL</div>
					</div>
				</div>

				<Carte className="p-8">
					<h1 className="text-xl font-semibold" style={{ color: C.primary }}>Connexion</h1>
					<p className="mt-1 text-sm" style={{ color: C.muted }}>Accédez à votre espace de travail.</p>

					<div className="mt-6 space-y-4">
						<Champ label="Adresse électronique" requis>
							<Saisie type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@ita.ci" />
						</Champ>

						<Champ label="Mot de passe" requis>
							<div className="relative">
								<Saisie type={voir ? "text" : "password"} value={mdp} onChange={(e) => setMdp(e.target.value)}
									onKeyDown={(e) => e.key === "Enter" && connecter()} placeholder="••••••••••••" style={{ paddingRight: 40 }} />
								<button type="button" onClick={() => setVoir((v) => !v)}
									className="absolute right-3 top-2.5" style={{ color: C.muted }}
									aria-label={voir ? "Masquer" : "Afficher"}>
									{voir ? <EyeOff size={16} /> : <Eye size={16} />}
								</button>
							</div>
						</Champ>

						{erreur && (
							<div className="flex items-start gap-2 rounded-lg px-4 py-3 text-sm"
								style={{ background: C.destructiveSoft, color: C.destructive }}>
								<AlertTriangle size={16} className="mt-0.5 shrink-0" />
								<div>
									{erreur}
									{tentatives >= 3 && tentatives < 5 && (
										<div className="mt-1 text-xs">Le message reste volontairement générique : il n'indique pas si c'est l'adresse ou le mot de passe qui est faux.</div>
									)}
								</div>
							</div>
						)}

						<Bouton onClick={connecter} disabled={chargement} style={{ width: "100%" }}>
							{chargement ? <><Loader2 size={16} className="animate-spin" /> Connexion…</> : "Se connecter"}
						</Bouton>

						<button type="button" className="w-full text-center text-sm" style={{ color: C.primary }}
							onClick={() => notifier("Un lien de réinitialisation a été envoyé si le compte existe.")}>
							Mot de passe oublié ?
						</button>
					</div>
				</Carte>

				<p className="mt-4 rounded-lg px-4 py-3 text-center text-xs"
					style={{ background: C.warningSoft, color: C.warning }}>
					Aperçu — saisissez <strong>demo</strong> comme mot de passe. Essayez aussi un
					mot de passe erroné pour voir le message et la limitation.
				</p>
			</div>
		</div>
	);
}

/* ================================================================== */
/* 2 — ACTIVATION ET TOTP                                              */
/* ================================================================== */

function EcranActivation({ role, onTermine, notifier }) {
	const [etape, setEtape] = useState(1);
	const [mdp, setMdp] = useState("");
	const [confirmation, setConfirmation] = useState("");
	const [code, setCode] = useState("");
	const [codesSecours] = useState(() =>
		Array.from({ length: 10 }, () =>
			Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Math.random().toString(36).slice(2, 6).toUpperCase()));

	const force = (m) => {
		let n = 0;
		if (m.length >= 12) n++;
		if (/[A-Z]/.test(m) && /[a-z]/.test(m)) n++;
		if (/[0-9]/.test(m)) n++;
		if (/[^A-Za-z0-9]/.test(m)) n++;
		return n;
	};
	const niveau = force(mdp);
	const mdpValide = mdp.length >= 12 && niveau >= 3 && mdp === confirmation;
	const totpRequis = ROLES[role].totpObligatoire;

	const ETAPES = totpRequis
		? ["Nouveau mot de passe", "Double authentification", "Codes de secours"]
		: ["Nouveau mot de passe"];

	return (
		<div className="flex min-h-screen items-center justify-center px-4 py-10" style={{ background: C.bg }}>
			<div className="w-full max-w-lg">
				<Carte className="p-8">
					<div className="mb-6 flex gap-1.5">
						{ETAPES.map((_, i) => (
							<span key={i} className="h-1.5 flex-1 rounded-full"
								style={{ background: i + 1 <= etape ? C.success : C.successSoft }} />
						))}
					</div>

					<div className="mb-1 text-xs font-medium uppercase tracking-wide" style={{ color: C.muted }}>
						Première connexion · étape {etape} sur {ETAPES.length}
					</div>
					<h1 className="text-xl font-semibold" style={{ color: C.primary }}>{ETAPES[etape - 1]}</h1>

					{/* --- Étape 1 --- */}
					{etape === 1 && (
						<div className="mt-6 space-y-4">
							<p className="text-sm" style={{ color: C.muted }}>
								Votre accès temporaire doit être remplacé. Choisissez un mot de passe
								d'au moins 12 caractères.
							</p>

							<Champ label="Nouveau mot de passe" requis>
								<Saisie type="password" value={mdp} onChange={(e) => setMdp(e.target.value)} placeholder="••••••••••••" />
							</Champ>

							{mdp && (
								<div>
									<div className="flex gap-1">
										{[1, 2, 3, 4].map((n) => (
											<span key={n} className="h-1 flex-1 rounded-full"
												style={{ background: n <= niveau ? (niveau >= 3 ? C.success : C.warning) : C.border }} />
										))}
									</div>
									<p className="mt-1.5 text-xs" style={{ color: niveau >= 3 ? C.success : C.warning }}>
										{mdp.length < 12 ? `${12 - mdp.length} caractères manquants`
											: niveau >= 3 ? "Mot de passe robuste"
											: "Ajoutez des majuscules, chiffres ou symboles"}
									</p>
								</div>
							)}

							<Champ label="Confirmation" requis
								aide={confirmation && mdp !== confirmation ? "Les deux saisies diffèrent." : undefined}>
								<Saisie type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)}
									style={confirmation && mdp !== confirmation ? { borderColor: C.destructive } : undefined} />
							</Champ>

							<div className="rounded-lg px-4 py-3 text-xs" style={{ background: C.mutedBg, color: C.muted }}>
								Le mot de passe est vérifié contre les bases de fuites connues.
								Un mot de passe déjà compromis ailleurs est refusé.
							</div>

							<Bouton onClick={() => totpRequis ? setEtape(2) : onTermine()}
								style={{ width: "100%", opacity: mdpValide ? 1 : 0.4 }}
								disabled={!mdpValide}>
								Continuer
							</Bouton>
						</div>
					)}

					{/* --- Étape 2 : TOTP --- */}
					{etape === 2 && (
						<div className="mt-6 space-y-5">
							<div className="flex items-start gap-2 rounded-lg px-4 py-3 text-sm"
								style={{ background: C.reviewSoft, color: C.review }}>
								<ShieldCheck size={16} className="mt-0.5 shrink-0" />
								<div>
									<strong>Obligatoire pour votre rôle.</strong>
									<div className="mt-0.5 text-xs">
										{ROLES[role].libelle} — ce rôle valide des paiements ou consulte
										des données du personnel.
									</div>
								</div>
							</div>

							<p className="text-sm" style={{ color: C.muted }}>
								Installez une application d'authentification — Google Authenticator,
								Microsoft Authenticator ou Authy — puis scannez ce code.
							</p>

							<div className="mx-auto flex h-44 w-44 items-center justify-center rounded-lg border-2"
								style={{ borderColor: C.border, background: "#fff" }}>
								<div className="grid grid-cols-8 gap-0.5 p-2">
									{Array.from({ length: 64 }).map((_, i) => (
										<span key={i} className="h-3 w-3 rounded-sm"
											style={{ background: (i * 7 + (i % 5)) % 3 === 0 ? C.primary : "transparent" }} />
									))}
								</div>
							</div>

							<div className="text-center">
								<span className="text-xs" style={{ color: C.muted }}>Ou saisissez cette clé :</span>
								<div className="mt-1 font-mono text-sm" style={{ color: C.primary }}>JBSW Y3DP EHPK 3PXP</div>
							</div>

							<Champ label="Code affiché par l'application" requis aide="Six chiffres, renouvelés toutes les 30 secondes.">
								<Saisie value={code} maxLength={6} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
									placeholder="000000" style={{ textAlign: "center", fontSize: 20, letterSpacing: 8, fontFamily: "monospace" }} />
							</Champ>

							<Bouton onClick={() => setEtape(3)} style={{ width: "100%", opacity: code.length === 6 ? 1 : 0.4 }}
								disabled={code.length !== 6}>
								Vérifier et activer
							</Bouton>

							<p className="text-center text-xs" style={{ color: C.muted }}>
								Aperçu : saisissez six chiffres quelconques.
							</p>
						</div>
					)}

					{/* --- Étape 3 : codes de secours --- */}
					{etape === 3 && (
						<div className="mt-6 space-y-5">
							<div className="flex items-start gap-2 rounded-lg border px-4 py-3 text-sm"
								style={{ borderColor: C.warningBorder, background: C.warningSoft, color: C.warning }}>
								<AlertTriangle size={16} className="mt-0.5 shrink-0" />
								<div>
									<strong>Ces codes ne seront plus jamais affichés.</strong>
									<div className="mt-0.5 text-xs">
										Imprimez-les ou notez-les maintenant. Ils sont votre seul recours
										si vous perdez votre téléphone.
									</div>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-2 rounded-lg p-4" style={{ background: C.mutedBg }}>
								{codesSecours.map((c, i) => (
									<div key={i} className="font-mono text-sm" style={{ color: C.primary }}>{c}</div>
								))}
							</div>

							<div className="flex gap-2">
								<Bouton variante="vide" icone={Copy} onClick={() => notifier("Codes copiés")} style={{ flex: 1 }}>
									Copier
								</Bouton>
								<Bouton variante="vide" onClick={() => notifier("Impression lancée")} style={{ flex: 1 }}>
									Imprimer
								</Bouton>
							</div>

							<Bouton variante="succes" icone={Check} onClick={onTermine} style={{ width: "100%" }}>
								J'ai conservé mes codes, accéder à l'application
							</Bouton>
						</div>
					)}
				</Carte>
			</div>
		</div>
	);
}

/* ================================================================== */
/* 3 — VERROUILLAGE                                                    */
/* ================================================================== */

function EcranVerrouille({ role, onDeverrouiller }) {
	const [mdp, setMdp] = useState("");
	const [erreur, setErreur] = useState("");
	const u = ROLES[role];

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center px-4"
			style={{ background: "rgba(29,24,108,0.55)", backdropFilter: "blur(6px)" }}>
			<Carte className="w-full max-w-sm p-8 text-center">
				<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ background: C.primarySoft }}>
					<Lock size={22} style={{ color: C.primary }} />
				</div>

				<h1 className="mt-4 text-lg font-semibold" style={{ color: C.primary }}>Session verrouillée</h1>
				<p className="mt-1 text-sm" style={{ color: C.muted }}>
					Après 20 minutes sans activité. Votre travail en cours est conservé.
				</p>

				<div className="mt-5 flex items-center justify-center gap-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: C.success }}>{u.ini}</div>
					<div className="text-left">
						<div className="text-sm font-medium">{u.nom}</div>
						<div className="text-xs" style={{ color: C.muted }}>{u.libelle}</div>
					</div>
				</div>

				<div className="mt-5 space-y-3 text-left">
					<Champ label="Mot de passe">
						<Saisie type="password" value={mdp} autoFocus
							onChange={(e) => { setMdp(e.target.value); setErreur(""); }}
							onKeyDown={(e) => {
								if (e.key !== "Enter") return;
								if (mdp === "demo") onDeverrouiller();
								else setErreur("Mot de passe incorrect.");
							}}
							placeholder="••••••••" />
					</Champ>
					{erreur && <p className="text-xs" style={{ color: C.destructive }}>{erreur}</p>}

					<Bouton icone={Unlock} style={{ width: "100%" }}
						onClick={() => mdp === "demo" ? onDeverrouiller() : setErreur("Mot de passe incorrect.")}>
						Déverrouiller
					</Bouton>
				</div>

				<p className="mt-4 text-xs" style={{ color: C.muted }}>
					Le déverrouillage se fait au mot de passe, pas au second facteur.
					Après 8 heures, la déconnexion est complète.
				</p>
			</Carte>
		</div>
	);
}

/* ================================================================== */
/* 4 — ÉCRANS INTERNES                                                 */
/* ================================================================== */

function Accueil({ role }) {
	const perms = PERMISSIONS[role];
	return (
		<>
			<header className="mb-6">
				<h1 className="text-2xl font-semibold" style={{ color: C.primary }}>Tableau de bord</h1>
				<p className="mt-1 text-sm" style={{ color: C.muted }}>
					Bonjour {ROLES[role].nom.replace("DEMO ", "")}. Voici votre espace de travail.
				</p>
			</header>

			<Carte className="p-14 text-center">
				<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ background: C.primarySoft }}>
					<LayoutDashboard size={24} style={{ color: C.primary }} />
				</div>
				<div className="mt-4 inline-block rounded-full px-3 py-1 text-xs font-semibold" style={{ background: C.warningSoft, color: C.warning }}>
					Module M10
				</div>
				<h2 className="mt-3 text-lg font-semibold" style={{ color: C.primary }}>Tableau de bord à venir</h2>
				<p className="mx-auto mt-2 max-w-lg text-sm" style={{ color: C.muted }}>
					Les indicateurs, alertes d'échéance et demandes en attente apparaîtront ici
					une fois les modules métier livrés. M0 fournit le socle : authentification,
					navigation et permissions.
				</p>
			</Carte>

			<Carte className="mt-6 p-5">
				<h2 className="text-sm font-semibold" style={{ color: C.primary }}>Vos permissions</h2>
				<p className="mt-1 text-xs" style={{ color: C.muted }}>
					{perms.length} permissions attachées au rôle {ROLES[role].libelle}. Elles
					déterminent votre menu et les actions autorisées.
				</p>
				<div className="mt-4 flex flex-wrap gap-1.5">
					{perms.map((p) => (
						<code key={p} className="rounded px-2 py-1 text-xs" style={{ background: C.mutedBg, color: C.primary }}>{p}</code>
					))}
				</div>
			</Carte>
		</>
	);
}

function ModuleAVenir({ item }) {
	const I = item.icon;
	return (
		<>
			<header className="mb-6">
				<h1 className="text-2xl font-semibold" style={{ color: C.primary }}>{item.label}</h1>
			</header>
			<Carte className="p-14 text-center">
				<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ background: C.primarySoft }}>
					<I size={24} style={{ color: C.primary }} />
				</div>
				<div className="mt-4 inline-block rounded-full px-3 py-1 text-xs font-semibold" style={{ background: C.warningSoft, color: C.warning }}>
					Module {item.module} — {MODULES_LIB[item.module]}
				</div>
				<h2 className="mt-3 text-lg font-semibold" style={{ color: C.primary }}>Non encore livré</h2>
				<p className="mx-auto mt-2 max-w-lg text-sm" style={{ color: C.muted }}>
					Cet écran fait partie d'un module à venir. Il apparaît dans le menu pour que
					la navigation soit stable dès le premier jour.
				</p>
			</Carte>
		</>
	);
}

function AccesRefuse({ item }) {
	return (
		<>
			<header className="mb-6">
				<h1 className="text-2xl font-semibold" style={{ color: C.primary }}>Accès non autorisé</h1>
			</header>
			<Carte className="p-14 text-center">
				<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ background: C.destructiveSoft }}>
					<ShieldAlert size={24} style={{ color: C.destructive }} />
				</div>
				<h2 className="mt-4 text-lg font-semibold" style={{ color: C.destructive }}>403 — Droits insuffisants</h2>
				<p className="mx-auto mt-2 max-w-lg text-sm" style={{ color: C.muted }}>
					Votre rôle ne permet pas d'accéder à «&nbsp;{item?.label}&nbsp;».
					Ce refus a été enregistré au journal d'audit.
				</p>
				<p className="mx-auto mt-4 max-w-lg rounded-lg px-4 py-3 text-xs" style={{ background: C.mutedBg, color: C.muted }}>
					Le contrôle est effectué côté serveur, pas seulement en masquant le menu.
					Une requête directe sur cette adresse aboutit au même refus.
				</p>
			</Carte>
		</>
	);
}

/* ================================================================== */
/* 5 — ADMINISTRATION DES UTILISATEURS                                 */
/* ================================================================== */

const COMPTES_INIT = [
	{ id: "u1", nom: "Armel Gnakpa", email: "armelgnakpa7@gmail.com", roles: ["ADMIN"], actif: true, totp: true, technique: true },
	{ id: "u2", nom: "Jules Konan", email: "jules.konan@ita.ci", roles: ["DG"], actif: true, totp: true },
	{ id: "u3", nom: "DEMO Directrice RH", email: "demo.drh@itamanager.cloud", roles: ["DRH", "RH"], actif: true, totp: true },
	{ id: "u4", nom: "DEMO Directeur Technique", email: "demo.dt@itamanager.cloud", roles: ["DT"], actif: true, totp: true },
	{ id: "u5", nom: "DEMO Chef Chantier", email: "demo.cc@itamanager.cloud", roles: ["CC"], actif: true, totp: false },
	{ id: "u6", nom: "DEMO Chargé d'études", email: "demo.ce@itamanager.cloud", roles: ["CE"], actif: false, totp: false },
];

function Utilisateurs({ role, comptes, setComptes, notifier, journaliser }) {
	const [invitation, setInvitation] = useState(false);
	const [edition, setEdition] = useState(null);
	const moi = comptes.find((c) => c.roles.includes(role)) ?? comptes[0];
	const nbAdmins = comptes.filter((c) => c.roles.includes("ADMIN") && c.actif).length;

	const basculerRole = (compte, code) => {
		const possede = compte.roles.includes(code);

		if (possede && code === "ADMIN" && nbAdmins <= 1) {
			notifier("Vous êtes le dernier administrateur. Désignez un autre administrateur avant de retirer ce rôle.", "erreur");
			return;
		}
		if (possede && code === "ADMIN" && compte.id === moi.id) {
			notifier("Vous ne pouvez pas retirer votre propre rôle d'administrateur.", "erreur");
			return;
		}

		const nouveauxRoles = possede ? compte.roles.filter((r) => r !== code) : [...compte.roles, code];
		setComptes((cs) => cs.map((c) => c.id === compte.id ? { ...c, roles: nouveauxRoles } : c));
		setEdition((e) => e && e.id === compte.id ? { ...e, roles: nouveauxRoles } : e);
		journaliser(possede ? "Retrait du rôle" : "Attribution du rôle",
			`${ROLES[code].libelle} — ${compte.nom}`);
		notifier(possede ? `Rôle ${ROLES[code].libelle} retiré` : `Rôle ${ROLES[code].libelle} attribué`);
	};

	const basculerActif = (compte) => {
		if (compte.actif && compte.id === moi.id) {
			notifier("Vous ne pouvez pas désactiver votre propre compte.", "erreur");
			return;
		}
		if (compte.actif && compte.roles.includes("ADMIN") && nbAdmins <= 1) {
			notifier("Vous êtes le dernier administrateur actif. Désignez-en un autre avant de désactiver ce compte.", "erreur");
			return;
		}
		setComptes((cs) => cs.map((c) => c.id === compte.id ? { ...c, actif: !c.actif } : c));
		journaliser(compte.actif ? "Désactivation du compte" : "Réactivation du compte", compte.nom);
		notifier(compte.actif ? "Compte désactivé — accès perdu immédiatement" : "Compte réactivé");
	};

	return (
		<>
			<header className="mb-6 flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold" style={{ color: C.primary }}>Utilisateurs et rôles</h1>
					<p className="mt-1 max-w-3xl text-sm" style={{ color: C.muted }}>
						{comptes.filter((c) => c.actif).length} comptes actifs sur {comptes.length}.
						La désactivation prend effet immédiatement, sans attendre l'expiration du jeton.
					</p>
				</div>
				<Bouton icone={UserPlus} onClick={() => setInvitation(true)}>Inviter un utilisateur</Bouton>
			</header>

			<Carte className="overflow-hidden">
				<table className="w-full text-sm">
					<thead>
						<tr style={{ background: C.mutedBg }}>
							{["Utilisateur", "Rôles", "2FA", "Statut", "Actions"].map((h) => (
								<th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: C.muted }}>{h}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{comptes.map((c) => (
							<tr key={c.id} className="border-t" style={{ borderColor: "#F3F4F6", opacity: c.actif ? 1 : 0.55 }}>
								<td className="px-4 py-3">
									<div className="flex items-center gap-2">
										<span className="font-medium">{c.nom}</span>
										{c.technique && (
											<Infobulle texte="Accès de maintenance. Ce profil n'est rattaché à aucun employé, n'apparaît pas dans l'organigramme et ne reçoit aucune demande d'approbation.">
												<Badge fg={C.muted} bg={C.mutedBg}>technique</Badge>
											</Infobulle>
										)}
										{c.id === moi.id && (
											<Infobulle texte="Votre propre compte. Vous ne pouvez ni le désactiver, ni retirer votre rôle d'administrateur.">
												<Badge fg={C.primary} bg={C.primarySoft}>vous</Badge>
											</Infobulle>
										)}
									</div>
									<div className="text-xs" style={{ color: C.muted }}>{c.email}</div>
								</td>

								<td className="px-4 py-3">
									<div className="flex flex-wrap items-center gap-1.5">
										{c.roles.length === 0 ? (
											<span className="text-xs italic" style={{ color: C.muted }}>aucun rôle</span>
										) : (
											c.roles.map((code) => (
												<Infobulle key={code}
													texte={`${PERMISSIONS[code].length} permissions${ROLES[code].totpObligatoire ? " · double authentification imposée" : ""}`}>
													<span className="rounded-md px-2 py-1 text-xs font-medium"
														style={{ background: C.successSoft, color: C.success }}>
														{ROLES[code].libelle}
													</span>
												</Infobulle>
											))
										)}
										<button type="button" onClick={() => setEdition(c)}
											className="rounded-md border px-2 py-1 text-xs font-medium"
											style={{ borderColor: C.border, color: C.primary }}>
											Modifier
										</button>
									</div>
								</td>

								<td className="px-4 py-3">
									<Infobulle texte={c.totp
										? "Double authentification active. Un code à six chiffres est demandé à chaque connexion."
										: "Non configurée. Obligatoire pour les rôles ADMIN, DG, DRH, DFC et DT dès leur première connexion."}>
										{c.totp
											? <Badge fg={C.success} bg={C.successSoft}>Activée</Badge>
											: <Badge fg={C.muted} bg={C.mutedBg}>Non activée</Badge>}
									</Infobulle>
								</td>

								<td className="px-4 py-3">
									<Infobulle texte={c.actif
										? "Le compte peut se connecter."
										: "Accès révoqué. Les données de la personne sont conservées, seul l'accès est fermé."}>
										{c.actif
											? <Badge fg={C.success} bg={C.successSoft}>Actif</Badge>
											: <Badge fg={C.destructive} bg={C.destructiveSoft}>Désactivé</Badge>}
									</Infobulle>
								</td>

								<td className="px-4 py-3">
									<div className="flex items-center justify-end gap-1">
										<Infobulle cote="gauche"
											texte={c.actif
												? "Désactiver le compte. L'accès est perdu immédiatement, sans attendre l'expiration du jeton."
												: "Réactiver le compte. L'utilisateur retrouve ses rôles antérieurs."}>
											<button type="button" onClick={() => basculerActif(c)}
												aria-label={c.actif ? "Désactiver le compte" : "Réactiver le compte"}
												className="rounded p-1.5"
												style={{ color: c.actif ? C.destructive : C.success }}>
												<Power size={16} />
											</button>
										</Infobulle>

										{c.totp && (
											<Infobulle cote="gauche"
												texte="Réinitialiser le second facteur. À utiliser si la personne a perdu son téléphone. L'action est journalisée : elle affaiblit temporairement la sécurité.">
												<button type="button"
													onClick={() => {
														setComptes((cs) => cs.map((x) => x.id === c.id ? { ...x, totp: false } : x));
														journaliser("Réinitialisation du second facteur", c.nom);
														notifier("Second facteur réinitialisé — action journalisée", "avertissement");
													}}
													aria-label="Réinitialiser le second facteur"
													className="rounded p-1.5" style={{ color: C.warning }}>
													<KeyRound size={16} />
												</button>
											</Infobulle>
										)}
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</Carte>

			<Carte className="mt-4 p-5">
				<h2 className="flex items-center gap-2 text-sm font-semibold" style={{ color: C.primary }}>
					<ShieldAlert size={15} /> Garde-fous en dur
				</h2>
				<p className="mt-1 text-xs" style={{ color: C.muted }}>
					Trois interdits vérifiés côté serveur, indépendants de toute permission.
					Essayez-les : ouvrez «&nbsp;Modifier&nbsp;» sur Armel Gnakpa et tentez de lui
					retirer le rôle Super Admin, ou désactivez votre propre compte.
				</p>
				<ul className="mt-3 space-y-1.5 text-xs" style={{ color: C.muted }}>
					{["Retirer le rôle ADMIN à son dernier détenteur",
					  "Se désactiver soi-même",
					  "Se retirer son propre rôle ADMIN"].map((t) => (
						<li key={t} className="flex items-center gap-2">
							<Ban size={13} style={{ color: C.destructive }} /> {t}
						</li>
					))}
				</ul>
			</Carte>

			{edition && (
				<Modale titre={`Rôles — ${edition.nom}`} sous={edition.email}
					onFermer={() => setEdition(null)}
					pied={<Bouton variante="fantome" onClick={() => setEdition(null)}>Fermer</Bouton>}>
					<div className="space-y-2">
						{Object.values(ROLES).map((r) => {
							const actif = edition.roles.includes(r.code);
							return (
								<button key={r.code} type="button" onClick={() => basculerRole(edition, r.code)}
									className="flex w-full items-center justify-between gap-4 rounded-lg border px-4 py-3 text-left"
									style={{
										borderColor: actif ? C.success : C.border,
										background: actif ? C.successSoft : "#fff",
									}}>
									<div>
										<div className="text-sm font-medium" style={{ color: actif ? C.success : "#374151" }}>
											{r.libelle}
										</div>
										<div className="text-xs" style={{ color: C.muted }}>
											{PERMISSIONS[r.code].length} permissions
											{r.totpObligatoire && " · double authentification imposée"}
										</div>
									</div>
									<span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border"
										style={{
											borderColor: actif ? C.success : "#D1D5DB",
											background: actif ? C.success : "#fff",
										}}>
										{actif && <Check size={12} color="#fff" />}
									</span>
								</button>
							);
						})}
					</div>

					<p className="mt-4 rounded-lg px-4 py-3 text-xs" style={{ background: C.mutedBg, color: C.muted }}>
						Chaque changement est appliqué immédiatement et inscrit au journal d'audit.
						Les garde-fous restent actifs : le dernier administrateur ne peut pas
						perdre son rôle.
					</p>
				</Modale>
			)}

			{invitation && (
				<Modale titre="Inviter un utilisateur" sous="Un courriel d'activation lui sera envoyé."
					onFermer={() => setInvitation(false)}
					pied={
						<>
							<Bouton variante="fantome" onClick={() => setInvitation(false)}>Annuler</Bouton>
							<Bouton variante="succes" icone={Mail} onClick={() => {
								setInvitation(false);
								journaliser("Invitation envoyée", "nouvel.utilisateur@ita.ci");
								notifier("Invitation envoyée par courriel");
							}}>Envoyer l'invitation</Bouton>
						</>
					}>
					<div className="space-y-4">
						<Champ label="Adresse électronique" requis aide="Elle servira d'identifiant de connexion. Adresse personnelle, jamais une boîte partagée.">
							<Saisie type="email" placeholder="prenom.nom@ita.ci" />
						</Champ>
						<Champ label="Rôle initial" requis aide="Modifiable ensuite depuis cette liste.">
							<select className="w-full rounded-md border px-3 py-2 text-sm" style={{ borderColor: C.border }}>
								{Object.values(ROLES).filter((r) => r.code !== "ADMIN").map((r) => (
									<option key={r.code} value={r.code}>{r.libelle}</option>
								))}
							</select>
						</Champ>
						<div className="rounded-lg px-4 py-3 text-xs" style={{ background: C.mutedBg, color: C.muted }}>
							L'utilisateur recevra un accès temporaire à changer dès sa première
							connexion. Si son rôle l'exige, la double authentification lui sera
							imposée dans la foulée.
						</div>
					</div>
				</Modale>
			)}
		</>
	);
}

/* ================================================================== */
/* 6 — JOURNAL D'AUDIT                                                 */
/* ================================================================== */

function Journal({ evenements }) {
	return (
		<>
			<header className="mb-6">
				<h1 className="text-2xl font-semibold" style={{ color: C.primary }}>Journal d'audit</h1>
				<p className="mt-1 max-w-3xl text-sm" style={{ color: C.muted }}>
					Toute décision opposable est tracée : validations, refus, changements de rôle,
					accès refusés. Le journal est en ajout seul — aucune action ne permet de le
					modifier ni d'en supprimer une ligne.
				</p>
			</header>

			<Carte className="overflow-hidden">
				<table className="w-full text-sm">
					<thead>
						<tr style={{ background: C.mutedBg }}>
							{["Horodatage", "Action", "Objet", "Auteur"].map((h) => (
								<th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: C.muted }}>{h}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{evenements.map((e, i) => (
							<tr key={i} className="border-t" style={{ borderColor: "#F3F4F6" }}>
								<td className="px-4 py-3 text-xs" style={{ color: C.muted }}>{e.heure}</td>
								<td className="px-4 py-3">
									<span className="font-medium">{e.action}</span>
								</td>
								<td className="px-4 py-3 text-xs">{e.objet}</td>
								<td className="px-4 py-3 text-xs" style={{ color: C.muted }}>{e.auteur}</td>
							</tr>
						))}
					</tbody>
				</table>
				{!evenements.length && (
					<div className="py-14 text-center">
						<p className="text-sm font-medium">Aucun événement</p>
						<p className="mx-auto mt-1 max-w-md text-sm" style={{ color: C.muted }}>
							Attribuez un rôle ou désactivez un compte pour voir le journal se remplir.
						</p>
					</div>
				)}
			</Carte>

			<p className="mt-4 rounded-lg px-4 py-3 text-xs" style={{ background: C.mutedBg, color: C.muted }}>
				Aucune donnée sensible n'y figure jamais : ni RIB, ni numéro CNPS, ni contenu
				médical. Des identifiants, pas des valeurs.
			</p>
		</>
	);
}

/* ================================================================== */
/* MODALE                                                              */
/* ================================================================== */

function Modale({ titre, sous, children, pied, onFermer }) {
	return (
		<div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto p-6" style={{ background: "rgba(17,17,17,0.45)" }}>
			<Carte className="w-full max-w-lg">
				<div className="flex items-start justify-between gap-4 rounded-t-xl px-7 py-5" style={{ background: C.primarySoft }}>
					<div>
						<h2 className="text-lg font-semibold" style={{ color: C.primary }}>{titre}</h2>
						{sous && <p className="mt-0.5 text-sm" style={{ color: C.muted }}>{sous}</p>}
					</div>
					<button type="button" onClick={onFermer} className="rounded-full bg-white p-2 shadow-sm"><X size={16} /></button>
				</div>
				<div className="px-7 py-5">{children}</div>
				{pied && <div className="flex justify-between gap-3 border-t px-7 py-4" style={{ borderColor: "#F3F4F6" }}>{pied}</div>}
			</Carte>
		</div>
	);
}

/* ================================================================== */
/* APPLICATION                                                         */
/* ================================================================== */

export default function ApercuM0() {
	const [phase, setPhase] = useState("connexion"); // connexion · activation · app
	const [role, setRole] = useState("ADMIN");
	const [ecran, setEcran] = useState("dashboard");
	const [verrouille, setVerrouille] = useState(false);
	const [comptes, setComptes] = useState(COMPTES_INIT);
	const [toast, setToast] = useState(null);
	const [evenements, setEvenements] = useState([
		{ heure: "27/07/2026 08:12", action: "Connexion", objet: "armelgnakpa7@gmail.com", auteur: "Armel Gnakpa" },
		{ heure: "27/07/2026 08:14", action: "Accès refusé", objet: "paie:validerDFC", auteur: "DEMO Chef Chantier" },
	]);

	const perms = PERMISSIONS[role];
	const u = ROLES[role];

	const notifier = (message, ton = "succes") => {
		setToast({ message, ton });
		setTimeout(() => setToast(null), 3500);
	};

	const journaliser = (action, objet) => {
		const h = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
		setEvenements((es) => [{ heure: `27/07/2026 ${h}`, action, objet, auteur: u.nom }, ...es]);
	};

	const itemCourant = [...NAV.flatMap((g) => g.items), ...NAV_BAS].find((i) => i.id === ecran);
	const autorise = !itemCourant?.perm || perms.includes(itemCourant.perm);
	const livre = LIVRES.includes(ecran);

	/* --- Écrans hors application --- */
	if (phase === "connexion") {
		return (
			<>
				<EcranConnexion notifier={notifier} onConnexion={() => setPhase("activation")} />
				<Toast toast={toast} />
			</>
		);
	}

	if (phase === "activation") {
		return (
			<>
				<EcranActivation role={role} notifier={notifier}
					onTermine={() => { setPhase("app"); journaliser("Activation du compte", u.nom); notifier("Compte activé"); }} />
				<Toast toast={toast} />
			</>
		);
	}

	/* --- Application --- */
	return (
		<div className="flex min-h-screen" style={{ background: C.bg }}>
			{/* Barre latérale */}
			<aside className="w-64 shrink-0 overflow-y-auto border-r bg-white" style={{ borderColor: C.border }}>
				<div className="flex items-center gap-2.5 px-5 py-5">
					<div className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: C.primary }}>ITA</div>
					<div>
						<div className="text-sm font-semibold" style={{ color: C.primary }}>ITA Manager</div>
						<div className="text-xs" style={{ color: C.muted }}>Ingénierie & Travaux</div>
					</div>
				</div>

				<nav className="px-3 pb-8">
					{NAV.map((g) => {
						const visibles = g.items.filter((i) => !i.perm || perms.includes(i.perm));
						if (!visibles.length) return null;
						return (
							<div key={g.groupe} className="mb-5">
								<div className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "#9CA3AF" }}>{g.groupe}</div>
								{visibles.map((i) => {
									const actif = ecran === i.id;
									const dispo = LIVRES.includes(i.id);
									return (
										<button key={i.id} type="button" onClick={() => setEcran(i.id)}
											className="mb-0.5 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm"
											style={{
												background: actif ? C.primarySoft : "transparent",
												color: actif ? C.primary : dispo ? "#374151" : "#9CA3AF",
												fontWeight: actif ? 600 : 400,
											}}>
											<span className="flex items-center gap-2.5"><i.icon size={16} />{i.label}</span>
											{!dispo && (
												<Infobulle cote="gauche"
													texte={`Module ${i.module} — ${MODULES_LIB[i.module]}. Non encore livré ; l'entrée reste visible pour que la navigation soit stable dès le premier jour.`}>
													<span className="text-xs" style={{ color: "#D1D5DB" }}>{i.module}</span>
												</Infobulle>
											)}
										</button>
									);
								})}
							</div>
						);
					})}

					<div className="mt-2 border-t pt-4" style={{ borderColor: C.border }}>
						{NAV_BAS.filter((i) => !i.perm || perms.includes(i.perm)).map((i) => {
							const actif = ecran === i.id;
							return (
								<button key={i.id} type="button" onClick={() => setEcran(i.id)}
									className="mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm"
									style={{ background: actif ? C.primarySoft : "transparent", color: actif ? C.primary : "#374151", fontWeight: actif ? 600 : 400 }}>
									<i.icon size={16} />{i.label}
								</button>
							);
						})}
					</div>
				</nav>
			</aside>

			{/* Contenu */}
			<div className="flex min-w-0 flex-1 flex-col">
				<header className="sticky top-0 z-20 flex items-center justify-between gap-6 border-b bg-white px-8 py-3" style={{ borderColor: C.border }}>
					<div className="relative max-w-md flex-1">
						<Search size={16} className="absolute left-3 top-2.5" style={{ color: C.muted }} />
						<input placeholder="Rechercher…" disabled
							className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none"
							style={{ borderColor: C.border, background: C.mutedBg }} />
					</div>

					<div className="flex items-center gap-4">
						<Infobulle texte="Aperçu : déclenche le verrouillage sans attendre les 20 minutes réelles. Le déverrouillage se fait au mot de passe — demo.">
							<Bouton variante="fantome" icone={Lock} onClick={() => setVerrouille(true)}
								style={{ padding: "6px 14px", fontSize: 12 }}>
								Simuler l'inactivité
							</Bouton>
						</Infobulle>

						<div className="flex items-center gap-2">
							<Infobulle texte="Dispositif de démonstration. Dans l'application réelle, le rôle provient de la session authentifiée et ne se change pas.">
								<span className="text-xs" style={{ color: C.muted }}>Rôle</span>
							</Infobulle>
							<select value={role} onChange={(e) => { setRole(e.target.value); setEcran("dashboard"); }}
								className="rounded-lg border px-3 py-1.5 text-xs font-medium"
								style={{ borderColor: C.border, color: C.primary }}>
								{Object.values(ROLES).map((r) => <option key={r.code} value={r.code}>{r.libelle}</option>)}
							</select>
						</div>

						<div className="flex items-center gap-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: C.success }}>{u.ini}</div>
							<div>
								<div className="text-xs font-medium">{u.nom}</div>
								<div className="text-xs" style={{ color: C.muted }}>{u.libelle}</div>
							</div>
						</div>

						<button type="button" onClick={() => { setPhase("connexion"); setRole("ADMIN"); }}
							title="Se déconnecter" style={{ color: C.muted }}>
							<LogOut size={16} />
						</button>
					</div>
				</header>

				<div className="border-b px-8 py-2" style={{ borderColor: C.warningBorder, background: C.warningSoft }}>
					<p className="text-xs" style={{ color: C.warning }}>
						Aperçu du module M0 — socle. Changez de rôle en haut à droite : le menu se
						recompose selon les permissions. Les modules non livrés apparaissent en gris.
					</p>
				</div>

				<main className="flex-1 px-8 py-6">
					{!autorise ? <AccesRefuse item={itemCourant} />
						: ecran === "dashboard" ? <Accueil role={role} />
						: ecran === "utilisateurs" ? <Utilisateurs role={role} comptes={comptes} setComptes={setComptes} notifier={notifier} journaliser={journaliser} />
						: ecran === "journal" ? <Journal evenements={evenements} />
						: ecran === "parametres" ? <ModuleAVenir item={{ label: "Paramètres", icon: Settings, module: "M10" }} />
						: ecran === "aide" ? <ModuleAVenir item={{ label: "Aide", icon: HelpCircle, module: "M10" }} />
						: <ModuleAVenir item={itemCourant} />}
				</main>
			</div>

			{verrouille && <EcranVerrouille role={role} onDeverrouiller={() => { setVerrouille(false); notifier("Session déverrouillée"); }} />}
			<Toast toast={toast} />
		</div>
	);
}

function Toast({ toast }) {
	if (!toast) return null;
	const couleurs = {
		succes: { bg: C.primary, icone: Check },
		erreur: { bg: C.destructive, icone: Ban },
		avertissement: { bg: C.warning, icone: AlertTriangle },
	}[toast.ton] ?? { bg: C.primary, icone: Check };
	const I = couleurs.icone;

	return (
		<div className="fixed bottom-6 right-6 z-[60] flex max-w-sm items-start gap-2 rounded-lg px-5 py-3 text-sm text-white shadow-lg"
			style={{ background: couleurs.bg }}>
			<I size={16} className="mt-0.5 shrink-0" />
			{toast.message}
		</div>
	);
}
