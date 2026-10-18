import React, { useState, useEffect, useMemo, useRef } from "react";
import {
	UserPlus, Users, HardHat, Check, X, AlertTriangle, Info, Lock, Search,
	Plus, Trash2, Upload, Save, Loader2, Scale, FileSignature, CalendarClock,
	ChevronRight, Eye, EyeOff, ShieldAlert, FileText, Pencil, CircleAlert,
} from "lucide-react";

/* ================================================================== */
/* JETONS                                                              */
/* ================================================================== */

const C = {
	primary: "#1D186C", primarySoft: "#EBEAF2",
	success: "#16850C", successSoft: "#E2FAE0",
	warning: "#B45309", warningSoft: "#FFFBEB", warningBorder: "#FDE68A",
	destructive: "#DC2626", destructiveSoft: "#FEF2F2",
	review: "#7C3AED", reviewSoft: "#F5F3FF",
	muted: "#6B7280", mutedBg: "#F9FAFB", border: "#E5E7EB", bg: "#F7F7FB",
};

const AUJ = "2026-07-30";
const fcfa = (n) => n || n === 0 ? new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F" : "—";
const dateFr = (i) => i ? new Date(i + "T00:00:00").toLocaleDateString("fr-FR") : "—";
const jAvant = (i) => Math.ceil((new Date(i + "T00:00:00") - new Date(AUJ + "T00:00:00")) / 86400000);

/* ================================================================== */
/* RÉFÉRENTIELS                                                        */
/* ================================================================== */

const DIRECTIONS = [
	{ id: "DG", libelle: "Direction Générale" },
	{ id: "DFC", libelle: "Direction Financière et Comptable" },
	{ id: "DT", libelle: "Direction Technique" },
	{ id: "DAR", libelle: "Direction Administrative et RH" },
];

const SERVICES = [
	{ id: "ACHATS", libelle: "Service Achats", directionId: "DFC" },
	{ id: "COMPTA", libelle: "Comptabilité", directionId: "DFC" },
	{ id: "ETUDES", libelle: "Études et Appels d'Offres", directionId: "DT" },
	{ id: "AEP", libelle: "Adduction d'Eau Potable", directionId: "DT" },
	{ id: "ASSAIN", libelle: "Assainissement", directionId: "DT" },
	{ id: "ROUTES", libelle: "Routes et Voiries", directionId: "DT" },
	{ id: "LOG", libelle: "Logistique", directionId: "DT" },
	{ id: "QHSE", libelle: "QHSE", directionId: "DAR" },
];

/* `sup` porte le supérieur par défaut — Poste.superieurPosteId */
const POSTES = [
	{ id: "DIR_GENERAL", libelle: "Directeur Général", dir: "DG", svc: null, niveau: "DIRECTION", sup: null, unique: true, reserve: true },
	{ id: "ASST_DG", libelle: "Assistante de Direction", dir: "DG", svc: null, niveau: "SUPPORT", sup: "DIR_GENERAL" },
	{ id: "DIR_FINANCIER", libelle: "Directeur Financier et Comptable", dir: "DFC", svc: null, niveau: "DIRECTION", sup: "DIR_GENERAL", unique: true, reserve: true },
	{ id: "CHEF_ACHATS", libelle: "Chef de Service Achats", dir: "DFC", svc: "ACHATS", niveau: "CADRE", sup: "DIR_FINANCIER" },
	{ id: "ASST_COMPTABLE", libelle: "Assistant comptable", dir: "DFC", svc: "COMPTA", niveau: "SUPPORT", sup: "DIR_FINANCIER" },
	{ id: "DIR_TECHNIQUE", libelle: "Directeur Technique", dir: "DT", svc: null, niveau: "DIRECTION", sup: "DIR_GENERAL", unique: true, reserve: true },
	{ id: "CHARGE_ETUDES", libelle: "Chargé d'études et travaux", dir: "DT", svc: "ETUDES", niveau: "CADRE", sup: "DIR_TECHNIQUE" },
	{ id: "CHEF_AEP", libelle: "Chef de Service AEP", dir: "DT", svc: "AEP", niveau: "CADRE", sup: "DIR_TECHNIQUE" },
	{ id: "CHEF_ASSAIN", libelle: "Chef de Service Assainissement", dir: "DT", svc: "ASSAIN", niveau: "CADRE", sup: "DIR_TECHNIQUE" },
	{ id: "CHEF_ROUTES", libelle: "Chef de Service Routes et Voiries", dir: "DT", svc: "ROUTES", niveau: "CADRE", sup: "DIR_TECHNIQUE" },
	{ id: "CHEF_LOG", libelle: "Chef de Service Logistique", dir: "DT", svc: "LOG", niveau: "CADRE", sup: "DIR_TECHNIQUE" },
	{ id: "CHEF_GARAGE", libelle: "Chef du Garage", dir: "DT", svc: "LOG", niveau: "CADRE", sup: "CHEF_LOG" },
	{ id: "GESTIONNAIRE_STOCKS", libelle: "Gestionnaire de stocks", dir: "DT", svc: "LOG", niveau: "OPERATIONNEL", sup: "CHEF_LOG" },
	{ id: "MECANICIEN", libelle: "Mécanicien", dir: "DT", svc: "LOG", niveau: "OPERATIONNEL", sup: "CHEF_GARAGE" },
	{ id: "CONDUCTEUR_ENGINS", libelle: "Conducteur d'engins", dir: "DT", svc: "LOG", niveau: "OPERATIONNEL", sup: "CHEF_GARAGE" },
	{ id: "CHAUFFEUR", libelle: "Chauffeur", dir: "DT", svc: "LOG", niveau: "OPERATIONNEL", sup: "CHEF_GARAGE" },
	{ id: "GARDIEN", libelle: "Gardien", dir: "DT", svc: "LOG", niveau: "OPERATIONNEL", sup: "CHEF_GARAGE" },
	{ id: "CONDUCTEUR_TRAVAUX", libelle: "Conducteur de Travaux", dir: "DT", svc: null, niveau: "CADRE", sup: "DIR_TECHNIQUE" },
	{ id: "CHEF_CHANTIER", libelle: "Chef Chantier", dir: "DT", svc: null, niveau: "CADRE", sup: "DIR_TECHNIQUE" },
	{ id: "CHEF_CHANTIER_ADJ", libelle: "Chef Chantier Adjoint", dir: "DT", svc: null, niveau: "CADRE", sup: "DIR_TECHNIQUE" },
	{ id: "CHEF_EQUIPE", libelle: "Chef d'équipe", dir: "DT", svc: null, niveau: "OPERATIONNEL", sup: "CHEF_CHANTIER" },
	{ id: "OUVRIER", libelle: "Ouvrier", dir: "DT", svc: null, niveau: "OPERATIONNEL", sup: "CHEF_EQUIPE", journalier: true },
	{ id: "MANOEUVRE", libelle: "Manœuvre", dir: "DT", svc: null, niveau: "OPERATIONNEL", sup: "CHEF_EQUIPE", journalier: true },
	{ id: "DIR_ADMIN_RH", libelle: "Directeur Administratif et RH", dir: "DAR", svc: null, niveau: "DIRECTION", sup: "DIR_GENERAL", unique: true, reserve: true },
	{ id: "ASST_RH", libelle: "Assistant RH", dir: "DAR", svc: null, niveau: "SUPPORT", sup: "DIR_ADMIN_RH" },
	{ id: "COURSIER", libelle: "Coursier", dir: "DAR", svc: null, niveau: "SUPPORT", sup: "DIR_ADMIN_RH" },
	{ id: "TECH_SURFACE", libelle: "Technicien de surface", dir: "DAR", svc: null, niveau: "OPERATIONNEL", sup: "DIR_ADMIN_RH" },
	{ id: "CHEF_QHSE", libelle: "Chef de Service QHSE", dir: "DAR", svc: "QHSE", niveau: "CADRE", sup: "DIR_ADMIN_RH" },
	{ id: "ASST_QHSE", libelle: "Assistant QHSE", dir: "DAR", svc: "QHSE", niveau: "SUPPORT", sup: "CHEF_QHSE" },
	{ id: "RELAIS_QHSE", libelle: "Relais QHSE", dir: "DAR", svc: "QHSE", niveau: "OPERATIONNEL", sup: "ASST_QHSE" },
];

/* Postes uniques déjà occupés — sert au contrôle de titulaire unique */
const OCCUPANTS = {
	DIR_GENERAL: "KONAN Jules",
	DIR_FINANCIER: "OUATTARA Marc",
	DIR_TECHNIQUE: "YAO Serge",
	DIR_ADMIN_RH: "TRAORÉ Aïcha",
};

const TITULAIRES = {
	DIR_TECHNIQUE: "YAO Serge", CHEF_LOG: "SANOGO Adama", CHEF_GARAGE: "BAKAYOKO Issa",
	CHEF_CHANTIER: "KOFFI Alain", CHEF_EQUIPE: "COULIBALY Seydou", DIR_ADMIN_RH: "TRAORÉ Aïcha",
	CHEF_QHSE: "ASSAMOI Grâce", ASST_QHSE: "DIALLO Mariam", DIR_FINANCIER: "OUATTARA Marc",
	DIR_GENERAL: "KONAN Jules", CONDUCTEUR_TRAVAUX: "BAMBA Ismaël",
};

const GRILLE = {
	DIRECTION: { min: 1_500_000, max: 3_000_000 },
	CADRE: { min: 450_000, max: 1_200_000 },
	SUPPORT: { min: 200_000, max: 480_000 },
	OPERATIONNEL: { min: 90_000, max: 260_000 },
};

const NATIONALITES = ["Ivoirienne", "Burkinabè", "Malienne", "Guinéenne", "Ghanéenne", "Sénégalaise", "Béninoise", "Togolaise", "Nigérienne", "Française"];
const UNITES_CONTRAT = ["CDI", "CDD", "STAGE"];

/* ================================================================== */
/* PRIMITIVES                                                          */
/* ================================================================== */

function Infobulle({ texte, cote = "haut", children }) {
	const [v, setV] = useState(false);
	if (!texte) return children;
	const pos = {
		haut: { bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
		gauche: { right: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" },
	}[cote];
	return (
		<span className="relative inline-flex" onMouseEnter={() => setV(true)} onMouseLeave={() => setV(false)}
			onFocus={() => setV(true)} onBlur={() => setV(false)}>
			{children}
			{v && (
				<span role="tooltip" className="pointer-events-none absolute z-50 rounded-md px-3 py-2 text-xs leading-snug text-white shadow-lg"
					style={{ ...pos, background: "#111827", width: 250 }}>{texte}</span>
			)}
		</span>
	);
}

const Badge = ({ fg, bg, children }) => (
	<span className="inline-block whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium" style={{ color: fg, background: bg }}>{children}</span>
);

const Carte = ({ children, className = "", style }) => (
	<div className={"rounded-xl bg-white shadow-sm " + className} style={style}>{children}</div>
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
		<button type="button" className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
			style={{ ...v, ...style }} {...p}>{I && <I size={16} />}{children}</button>
	);
};

const Champ = ({ label, aide, requis, erreur, children }) => (
	<div className="flex flex-col gap-1.5">
		<label className="text-sm font-medium" style={{ color: "#374151" }}>
			{label}{requis && <span style={{ color: C.destructive }}> *</span>}
		</label>
		{children}
		{erreur
			? <span className="text-xs" style={{ color: C.destructive }}>{erreur}</span>
			: aide && <span className="text-xs leading-snug" style={{ color: C.muted }}>{aide}</span>}
	</div>
);

const Saisie = ({ erreur, style, ...p }) => (
	<input className="w-full rounded-md border px-3 py-2 text-sm outline-none"
		style={{
			borderColor: erreur ? C.destructive : C.border,
			background: p.readOnly || p.disabled ? C.mutedBg : "#fff",
			...style,
		}} {...p} />
);

/* Champ à autocomplétation — règle R-04 */
function Combo({ value, onChange, options, placeholder, disabled, onCreer, erreur }) {
	const [ouvert, setOuvert] = useState(false);
	const [q, setQ] = useState("");
	const norm = (t) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
	const sel = options.find((o) => o.value === value);
	const filtrees = q ? options.filter((o) => norm(o.label).includes(norm(q))) : options;
	const exact = options.some((o) => norm(o.label) === norm(q));
	const peutCreer = !!onCreer && q.trim().length > 1 && !exact;

	return (
		<div className="relative">
			<div className="relative">
				<input value={ouvert ? q : sel?.label ?? ""} disabled={disabled}
					onChange={(e) => { setQ(e.target.value); setOuvert(true); }}
					onFocus={() => { setOuvert(true); setQ(""); }}
					onBlur={() => setTimeout(() => setOuvert(false), 150)}
					placeholder={placeholder}
					className="w-full rounded-md border px-3 py-2 pr-8 text-sm outline-none"
					style={{ borderColor: erreur ? C.destructive : C.border, background: disabled ? C.mutedBg : "#fff" }} />
				<Search size={14} className="pointer-events-none absolute right-3 top-2.5" style={{ color: C.muted }} />
			</div>
			{ouvert && !disabled && (
				<div className="absolute z-40 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-white shadow-lg" style={{ borderColor: C.border }}>
					{filtrees.map((o) => (
						o.desactive ? (
							<Infobulle key={o.value} texte={o.raison}>
								<span className="flex w-full cursor-not-allowed items-center gap-2 px-3 py-2 text-left text-sm" style={{ color: "#9CA3AF" }}>
									<Lock size={12} className="shrink-0" />
									<span className="truncate">{o.label}</span>
								</span>
							</Infobulle>
						) : (
							<button key={o.value} type="button"
								onMouseDown={(e) => { e.preventDefault(); onChange(o.value); setQ(""); setOuvert(false); }}
								className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50"
								style={{ background: value === o.value ? C.primarySoft : undefined }}>
								<span className="truncate">{o.label}</span>
								{o.detail && <span className="shrink-0 text-xs" style={{ color: C.muted }}>{o.detail}</span>}
							</button>
						)
					))}
					{!filtrees.length && !peutCreer && (
						<div className="px-3 py-3 text-center text-xs" style={{ color: C.muted }}>Aucun résultat</div>
					)}
					{peutCreer && (
						<button type="button"
							onMouseDown={(e) => { e.preventDefault(); onCreer(q.trim()); setQ(""); setOuvert(false); }}
							className="flex w-full items-center gap-2 border-t px-3 py-2 text-left text-sm hover:bg-gray-50"
							style={{ borderColor: C.border, color: C.success }}>
							<Plus size={14} /> Ajouter «&nbsp;{q.trim()}&nbsp;»
						</button>
					)}
				</div>
			)}
		</div>
	);
}

/* ================================================================== */
/* 1 — FORMULAIRE DE CRÉATION                                          */
/* ================================================================== */

const VIDE = {
	type: null,
	nom: "", prenom: "", naissance: "", lieuNaissance: "", nationalite: "",
	situation: "", enfants: "", cnps: "", telephone: "", adresse: "",
	urgenceNom: "", urgenceTel: "",
	directionId: "", serviceId: "", posteId: "", superieurId: "",
	contrat: "", embauche: "", finContrat: "",
	salaire: "", tauxJour: "", motifDerogation: "",
	wave: "", waveConfirme: "",
};

function Formulaire({ onFermer, notifier }) {
	const [f, setF] = useState(VIDE);
	const [onglet, setOnglet] = useState("identite");
	const [nationalites, setNationalites] = useState(NATIONALITES);
	const [brouillon, setBrouillon] = useState("aucun"); // aucun · enregistrement · enregistre
	const [touche, setTouche] = useState({});
	const minuteur = useRef(null);

	const set = (p) => setF((x) => ({ ...x, ...p }));
	const marquer = (k) => setTouche((t) => ({ ...t, [k]: true }));

	/* --- Brouillon automatique, 2 s après la frappe — décision E-03 --- */
	useEffect(() => {
		if (!f.type) return;
		setBrouillon("enregistrement");
		clearTimeout(minuteur.current);
		minuteur.current = setTimeout(() => setBrouillon("enregistre"), 2000);
		return () => clearTimeout(minuteur.current);
	}, [f]);

	const journalier = f.type === "JOURNALIER";

	/* --- Cascade --- */
	const servicesDispo = SERVICES.filter((s) => s.directionId === f.directionId);
	const postesDispo = POSTES.filter((p) =>
		p.dir === f.directionId
		&& (f.serviceId === "__AUCUN__" ? p.svc === null : f.serviceId ? p.svc === f.serviceId : true)
		&& (journalier ? p.journalier : true));

	const poste = POSTES.find((p) => p.id === f.posteId);
	const grille = poste ? GRILLE[poste.niveau] : null;
	const superieurDefaut = poste?.sup ? TITULAIRES[poste.sup] : null;

	/* --- Dérogation --- */
	const salaireNum = Number(f.salaire) || 0;
	const horsGrille = grille && salaireNum > 0 && (salaireNum > grille.max || salaireNum < grille.min);
	const audessus = grille && salaireNum > grille.max;

	/* --- Validation --- */
	const err = {};
	if (touche.nom && !f.nom.trim()) err.nom = "Le nom est requis.";
	if (touche.prenom && !f.prenom.trim()) err.prenom = "Le prénom est requis.";
	if (touche.telephone && !/^\+?[\d\s]{8,}$/.test(f.telephone)) err.telephone = "Numéro invalide.";
	if (touche.waveConfirme && f.wave && f.wave !== f.waveConfirme) err.waveConfirme = "Les deux numéros diffèrent.";
	if (touche.finContrat && f.contrat === "CDD" && !f.finContrat) err.finContrat = "Un CDD exige une date de fin.";
	if (touche.motifDerogation && horsGrille && f.motifDerogation.trim().length < 40)
		err.motifDerogation = `${40 - f.motifDerogation.trim().length} caractères manquants. Le motif doit être substantiel.`;

	const complet = journalier
		? f.nom && f.prenom && f.telephone && f.posteId && f.wave && f.wave === f.waveConfirme
		: f.nom && f.prenom && f.naissance && f.nationalite && f.telephone
			&& f.directionId && f.posteId && f.contrat && f.embauche
			&& (f.contrat !== "CDD" || f.finContrat)
			&& (!horsGrille || f.motifDerogation.trim().length >= 40);

	/* --- Étape 0 : le type décide de tout --- */
	if (!f.type) {
		return (
			<Carte className="mx-auto max-w-3xl p-8">
				<h2 className="text-xl font-semibold" style={{ color: C.primary }}>Nouveau profil</h2>
				<p className="mt-1 text-sm" style={{ color: C.muted }}>
					Cette première réponse détermine le formulaire entier — les champs demandés,
					les pièces attendues, le mode de rémunération.
				</p>

				<div className="mt-6 grid gap-4 md:grid-cols-2">
					{[
						["PERMANENT", Users, "Permanent", "Salarié au mois, avec contrat et compteur de congés.",
							["Dossier complet — 13 champs", "7 pièces justificatives", "Compteur de congés ouvert", "Payé par virement"]],
						["JOURNALIER", HardHat, "Journalier de chantier", "Payé à la journée via les relevés d'activité.",
							["Dossier allégé — 4 éléments", "2 pièces justificatives", "Aucun compteur de congés", "Payé par Wave"]],
					].map(([v, I, titre, sous, points]) => (
						<button key={v} type="button" onClick={() => set({ type: v })}
							className="rounded-xl border-2 p-5 text-left transition hover:shadow-md"
							style={{ borderColor: C.border }}>
							<div className="flex h-11 w-11 items-center justify-center rounded-lg" style={{ background: C.primarySoft }}>
								<I size={20} style={{ color: C.primary }} />
							</div>
							<h3 className="mt-3 font-semibold" style={{ color: C.primary }}>{titre}</h3>
							<p className="mt-1 text-sm" style={{ color: C.muted }}>{sous}</p>
							<ul className="mt-3 space-y-1">
								{points.map((p) => (
									<li key={p} className="flex items-start gap-1.5 text-xs" style={{ color: C.muted }}>
										<Check size={12} className="mt-0.5 shrink-0" style={{ color: C.success }} />{p}
									</li>
								))}
							</ul>
						</button>
					))}
				</div>

				<p className="mt-6 flex items-start gap-2 rounded-lg px-4 py-3 text-xs" style={{ background: C.reviewSoft, color: C.review }}>
					<Info size={14} className="mt-0.5 shrink-0" />
					<span>
						Le formulaire s'adapte <strong>dès cette question</strong>, il ne masque pas
						des champs après coup. Exiger treize champs pour un agent recruté trois
						semaines rendrait la saisie impossible sur un chantier — décision A-12.
					</span>
				</p>

				<div className="mt-6 flex justify-end">
					<Bouton variante="fantome" onClick={onFermer}>Annuler</Bouton>
				</div>
			</Carte>
		);
	}

	/* --- Journalier : formulaire court --- */
	if (journalier) {
		return (
			<Carte className="mx-auto max-w-2xl">
				<div className="flex items-start justify-between gap-4 rounded-t-xl px-7 py-5" style={{ background: C.primarySoft }}>
					<div>
						<h2 className="text-lg font-semibold" style={{ color: C.primary }}>Nouveau journalier</h2>
						<p className="mt-0.5 text-sm" style={{ color: C.muted }}>Quatre éléments suffisent.</p>
					</div>
					<div className="flex items-center gap-2">
						<IndicateurBrouillon etat={brouillon} />
						<button type="button" onClick={onFermer} className="rounded-full bg-white p-2 shadow-sm" aria-label="Fermer"><X size={16} /></button>
					</div>
				</div>

				<div className="space-y-5 px-7 py-6">
					<button type="button" onClick={() => setF(VIDE)}
						className="flex items-center gap-1.5 text-xs font-medium" style={{ color: C.muted }}>
						<ChevronRight size={13} style={{ transform: "rotate(180deg)" }} /> Changer de type
					</button>

					<div className="grid gap-5 md:grid-cols-2">
						<Champ label="Nom" requis erreur={err.nom}>
							<Saisie value={f.nom} erreur={err.nom} onBlur={() => marquer("nom")}
								onChange={(e) => set({ nom: e.target.value.toUpperCase() })} placeholder="DOSSO" />
						</Champ>
						<Champ label="Prénom" requis erreur={err.prenom}>
							<Saisie value={f.prenom} erreur={err.prenom} onBlur={() => marquer("prenom")}
								onChange={(e) => set({ prenom: e.target.value })} placeholder="Christ" />
						</Champ>
					</div>

					<Champ label="Téléphone de contact" requis erreur={err.telephone}
						aide="Pour le joindre. Distinct du numéro de paiement.">
						<Saisie value={f.telephone} erreur={err.telephone} onBlur={() => marquer("telephone")}
							onChange={(e) => set({ telephone: e.target.value })} placeholder="+225 07 12 34 56 78" />
					</Champ>

					<Champ label="Poste" requis aide="Seuls Ouvrier et Manœuvre sont ouverts aux journaliers.">
						<Combo value={f.posteId} onChange={(v) => set({ posteId: v, directionId: "DT" })}
							placeholder="Rechercher un poste"
							options={POSTES.filter((p) => p.journalier).map((p) => ({ value: p.id, label: p.libelle }))} />
					</Champ>

					{/* Wave — donnée de paiement */}
					<div className="rounded-lg border p-5" style={{ borderColor: C.warningBorder, background: C.warningSoft }}>
						<div className="flex items-start gap-2">
							<ShieldAlert size={16} className="mt-0.5 shrink-0" style={{ color: C.warning }} />
							<div>
								<h3 className="text-sm font-semibold" style={{ color: C.warning }}>Compte de paiement Wave</h3>
								<p className="mt-0.5 text-xs" style={{ color: C.warning }}>
									C'est par ce numéro que l'argent partira. Une erreur de saisie l'envoie
									à un tiers, sans recours. Double saisie exigée.
								</p>
							</div>
						</div>

						<div className="mt-4 grid gap-4 md:grid-cols-2">
							<Champ label="Numéro Wave" requis>
								<Saisie value={f.wave} onChange={(e) => set({ wave: e.target.value })} placeholder="+225 05 98 76 54 32" />
							</Champ>
							<Champ label="Confirmation" requis erreur={err.waveConfirme}
								aide={f.wave && f.wave === f.waveConfirme ? "Les deux numéros correspondent." : undefined}>
								<Saisie value={f.waveConfirme} erreur={err.waveConfirme} onBlur={() => marquer("waveConfirme")}
									onChange={(e) => set({ waveConfirme: e.target.value })} placeholder="Ressaisir le numéro"
									style={f.wave && f.wave === f.waveConfirme ? { borderColor: C.success } : undefined} />
							</Champ>
						</div>

						{f.wave && f.telephone && f.wave === f.telephone && (
							<p className="mt-3 flex items-start gap-2 rounded-lg bg-white px-3 py-2 text-xs" style={{ color: C.warning }}>
								<Info size={13} className="mt-0.5 shrink-0" />
								Le numéro Wave est identique au téléphone de contact. C'est possible, mais
								vérifiez qu'il ne s'agit pas d'une recopie par erreur.
							</p>
						)}
					</div>

					<Champ label="Pièce d'identité" requis>
						<label className="flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed px-4 py-6" style={{ borderColor: C.border }}>
							<Upload size={18} style={{ color: C.muted }} />
							<span className="mt-2 text-sm">Photo ou scan de la pièce</span>
							<span className="mt-0.5 text-xs" style={{ color: C.muted }}>JPG, PNG, PDF · 10 Mo max</span>
						</label>
					</Champ>

					<p className="flex items-start gap-2 rounded-lg px-4 py-3 text-xs" style={{ background: C.mutedBg, color: C.muted }}>
						<Info size={13} className="mt-0.5 shrink-0" />
						Un journalier <strong>n'ouvre aucun compteur de congés</strong>. Un jour non
						pointé est un jour non payé — décision A-13.
					</p>
				</div>

				<div className="flex items-center justify-between gap-3 border-t px-7 py-4" style={{ borderColor: "#F3F4F6" }}>
					<Bouton variante="fantome" onClick={onFermer}>Annuler</Bouton>
					<Bouton variante="succes" icone={Check} style={complet ? undefined : { opacity: .4 }}
						onClick={() => complet && notifier("Journalier créé — matricule ITA-2026-0181")}>
						Créer le profil
					</Bouton>
				</div>
			</Carte>
		);
	}

	/* --- Permanent : formulaire à onglets --- */
	const ONGLETS = [
		["identite", "Identité", ["nom", "prenom", "naissance", "nationalite", "telephone"]],
		["affectation", "Affectation", ["directionId", "posteId"]],
		["remuneration", "Contrat et rémunération", ["contrat", "embauche"]],
	];

	const rempli = (champs) => champs.every((c) => f[c]);

	return (
		<Carte className="mx-auto max-w-4xl">
			<div className="flex items-start justify-between gap-4 rounded-t-xl px-7 py-5" style={{ background: C.primarySoft }}>
				<div>
					<h2 className="text-lg font-semibold" style={{ color: C.primary }}>Nouvel employé permanent</h2>
					<p className="mt-0.5 text-sm" style={{ color: C.muted }}>
						Le matricule sera généré à l'enregistrement.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<IndicateurBrouillon etat={brouillon} />
					<button type="button" onClick={onFermer} className="rounded-full bg-white p-2 shadow-sm" aria-label="Fermer"><X size={16} /></button>
				</div>
			</div>

			{/* Onglets, avec état de complétude */}
			<div className="flex gap-2 border-b px-7" style={{ borderColor: C.border }}>
				{ONGLETS.map(([id, label, champs]) => {
					const actif = onglet === id;
					const ok = rempli(champs);
					return (
						<button key={id} type="button" onClick={() => setOnglet(id)}
							className="flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium"
							style={{ borderColor: actif ? C.primary : "transparent", color: actif ? C.primary : C.muted }}>
							{ok
								? <Check size={13} style={{ color: C.success }} />
								: <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#D1D5DB" }} />}
							{label}
						</button>
					);
				})}
			</div>

			<div className="px-7 py-6">
				<button type="button" onClick={() => setF(VIDE)}
					className="mb-5 flex items-center gap-1.5 text-xs font-medium" style={{ color: C.muted }}>
					<ChevronRight size={13} style={{ transform: "rotate(180deg)" }} /> Changer de type
				</button>

				{onglet === "identite" && (
					<div className="space-y-5">
						<div className="grid gap-5 md:grid-cols-2">
							<Champ label="Nom" requis erreur={err.nom}>
								<Saisie value={f.nom} erreur={err.nom} onBlur={() => marquer("nom")}
									onChange={(e) => set({ nom: e.target.value.toUpperCase() })} placeholder="N'GUESSAN" />
							</Champ>
							<Champ label="Prénom" requis erreur={err.prenom}>
								<Saisie value={f.prenom} erreur={err.prenom} onBlur={() => marquer("prenom")}
									onChange={(e) => set({ prenom: e.target.value })} placeholder="Léa" />
							</Champ>
						</div>

						<div className="grid gap-5 md:grid-cols-3">
							<Champ label="Date de naissance" requis>
								<Saisie type="date" value={f.naissance} onChange={(e) => set({ naissance: e.target.value })} />
							</Champ>
							<Champ label="Lieu de naissance">
								<Saisie value={f.lieuNaissance} onChange={(e) => set({ lieuNaissance: e.target.value })} placeholder="Abidjan" />
							</Champ>
							<Champ label="Nationalité" requis>
								<Combo value={f.nationalite} onChange={(v) => set({ nationalite: v })}
									placeholder="Rechercher"
									options={nationalites.map((n) => ({ value: n, label: n }))}
									onCreer={(v) => { setNationalites((xs) => [...xs, v]); set({ nationalite: v }); notifier(`Nationalité «\u00a0${v}\u00a0» ajoutée au référentiel`); }} />
							</Champ>
						</div>

						<div className="grid gap-5 md:grid-cols-3">
							<Champ label="Situation matrimoniale">
								<Combo value={f.situation} onChange={(v) => set({ situation: v })} placeholder="Sélectionner"
									options={["Célibataire", "Marié(e)", "Divorcé(e)", "Veuf/Veuve"].map((x) => ({ value: x, label: x }))} />
							</Champ>
							<Champ label="Nombre d'enfants">
								<Saisie type="number" min="0" value={f.enfants} onChange={(e) => set({ enfants: e.target.value })} />
							</Champ>
							<Champ label="Numéro CNPS"
								aide="Donnée sensible. Unique parmi les employés actifs.">
								<Saisie value={f.cnps} onChange={(e) => set({ cnps: e.target.value })} placeholder="0912345678"
									style={{ borderColor: C.warningBorder }} />
							</Champ>
						</div>

						<div className="grid gap-5 md:grid-cols-2">
							<Champ label="Téléphone" requis erreur={err.telephone}>
								<Saisie value={f.telephone} erreur={err.telephone} onBlur={() => marquer("telephone")}
									onChange={(e) => set({ telephone: e.target.value })} placeholder="+225 07 12 34 56 78" />
							</Champ>
							<Champ label="Adresse" aide="Donnée sensible.">
								<Saisie value={f.adresse} onChange={(e) => set({ adresse: e.target.value })} placeholder="Cocody, Riviera 3" />
							</Champ>
						</div>

						<div className="rounded-lg border p-5" style={{ borderColor: C.border }}>
							<h3 className="text-sm font-semibold" style={{ color: C.primary }}>Contact d'urgence</h3>
							<div className="mt-4 grid gap-5 md:grid-cols-2">
								<Champ label="Nom">
									<Saisie value={f.urgenceNom} onChange={(e) => set({ urgenceNom: e.target.value })} />
								</Champ>
								<Champ label="Téléphone">
									<Saisie value={f.urgenceTel} onChange={(e) => set({ urgenceTel: e.target.value })} />
								</Champ>
							</div>
						</div>
					</div>
				)}

				{onglet === "affectation" && (
					<div className="space-y-5">
						{/* Cascade */}
						<div className="rounded-lg border p-5" style={{ borderColor: C.border }}>
							<h3 className="text-sm font-semibold" style={{ color: C.primary }}>Cascade d'affectation</h3>
							<p className="mt-1 text-xs" style={{ color: C.muted }}>
								Chaque niveau filtre le suivant. Un poste peut ne relever d'aucun service.
							</p>

							<div className="mt-4 grid gap-5 md:grid-cols-3">
								<Champ label="Direction" requis>
									<Combo value={f.directionId} placeholder="Rechercher"
										onChange={(v) => set({ directionId: v, serviceId: "", posteId: "", superieurId: "" })}
										options={DIRECTIONS.map((d) => ({ value: d.id, label: d.libelle }))} />
								</Champ>

								<Champ label="Service"
									aide={!f.directionId ? "Choisissez d'abord une direction."
										: servicesDispo.length === 0 ? "Cette direction n'a aucun service."
										: undefined}>
									<Combo value={f.serviceId} disabled={!f.directionId} placeholder="Rechercher"
										onChange={(v) => set({ serviceId: v, posteId: "", superieurId: "" })}
										options={[
											{ value: "__AUCUN__", label: "— rattaché directement à la direction —" },
											...servicesDispo.map((s) => ({ value: s.id, label: s.libelle })),
										]} />
								</Champ>

								<Champ label="Poste" requis
									aide={!f.directionId ? "Choisissez d'abord une direction."
										: `${postesDispo.length} poste(s) disponible(s)`}>
									<Combo value={f.posteId} disabled={!f.directionId} placeholder="Rechercher"
										onChange={(v) => {
											const p = POSTES.find((x) => x.id === v);
											set({ posteId: v, superieurId: p?.sup ? TITULAIRES[p.sup] ?? "" : "" });
										}}
										options={postesDispo.map((p) => ({
											value: p.id,
											label: p.libelle,
											desactive: p.reserve || (p.unique && OCCUPANTS[p.id]),
											raison: p.reserve
												? "Affectation réservée au Super Admin — décision C-04."
												: OCCUPANTS[p.id]
													? `Poste à titulaire unique, occupé par ${OCCUPANTS[p.id]}. Clôturez son affectation d'abord.`
													: undefined,
										}))} />
								</Champ>
							</div>

							{/* Fil de cascade */}
							{f.directionId && (
								<div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
									<span className="font-semibold" style={{ color: C.primary }}>
										{DIRECTIONS.find((d) => d.id === f.directionId)?.libelle}
									</span>
									<span style={{ color: "#D1D5DB" }}>›</span>
									<span className="font-semibold" style={{ color: f.serviceId && f.serviceId !== "__AUCUN__" ? C.primary : "#D1D5DB" }}>
										{f.serviceId === "__AUCUN__" ? "sans service"
											: SERVICES.find((s) => s.id === f.serviceId)?.libelle ?? "service"}
									</span>
									<span style={{ color: "#D1D5DB" }}>›</span>
									<span className="font-semibold" style={{ color: poste ? C.success : "#D1D5DB" }}>
										{poste?.libelle ?? "poste"}
									</span>
								</div>
							)}
						</div>

						{/* Supérieur */}
						<Champ label="Supérieur hiérarchique" requis
							aide={superieurDefaut
								? "Proposé depuis le poste. Modifiable au cas par cas — c'est la chaîne qui approuvera ses congés."
								: "Choisissez d'abord un poste."}>
							<Combo value={f.superieurId} disabled={!poste} placeholder="Rechercher un employé"
								onChange={(v) => set({ superieurId: v })}
								options={Object.values(TITULAIRES).map((n) => ({ value: n, label: n }))} />
						</Champ>

						{superieurDefaut && f.superieurId === superieurDefaut && (
							<p className="flex items-start gap-2 rounded-lg px-4 py-3 text-xs" style={{ background: C.successSoft, color: C.success }}>
								<Check size={13} className="mt-0.5 shrink-0" />
								Supérieur proposé automatiquement depuis le poste — {POSTES.find((p) => p.id === poste.sup)?.libelle}.
							</p>
						)}

						{superieurDefaut && f.superieurId && f.superieurId !== superieurDefaut && (
							<p className="flex items-start gap-2 rounded-lg px-4 py-3 text-xs" style={{ background: C.warningSoft, color: C.warning }}>
								<Info size={13} className="mt-0.5 shrink-0" />
								Vous vous écartez du supérieur par défaut — {superieurDefaut}. C'est
								possible, mais les demandes de congé partiront vers la personne
								désignée ici.
							</p>
						)}
					</div>
				)}

				{onglet === "remuneration" && (
					<div className="space-y-5">
						<div className="grid gap-5 md:grid-cols-3">
							<Champ label="Type de contrat" requis>
								<Combo value={f.contrat} onChange={(v) => set({ contrat: v, finContrat: v === "CDI" ? "" : f.finContrat })}
									placeholder="Sélectionner"
									options={UNITES_CONTRAT.map((x) => ({ value: x, label: x }))} />
							</Champ>
							<Champ label="Date d'embauche" requis>
								<Saisie type="date" value={f.embauche} onChange={(e) => set({ embauche: e.target.value })} />
							</Champ>
							<Champ label="Date de fin"
								requis={f.contrat === "CDD" || f.contrat === "STAGE"}
								erreur={err.finContrat}
								aide={f.contrat === "CDI" ? "Sans objet pour un CDI." : undefined}>
								<Saisie type="date" value={f.finContrat} disabled={f.contrat === "CDI"} erreur={err.finContrat}
									onBlur={() => marquer("finContrat")}
									onChange={(e) => set({ finContrat: e.target.value })} />
							</Champ>
						</div>

						{f.contrat === "CDD" && (
							<p className="flex items-start gap-2 rounded-lg border px-4 py-3 text-xs"
								style={{ borderColor: C.warningBorder, background: C.warningSoft, color: C.warning }}>
								<AlertTriangle size={14} className="mt-0.5 shrink-0" />
								<span>
									<strong>Un CDD non renouvelé se transforme en CDI par tacite
									reconduction.</strong> Une alerte apparaîtra à 60 puis 30 jours de
									l'échéance, avec un rappel par courriel.
								</span>
							</p>
						)}

						{/* Salaire et grille */}
						<div className="rounded-lg border p-5" style={{ borderColor: C.border }}>
							<div className="flex flex-wrap items-baseline justify-between gap-2">
								<h3 className="text-sm font-semibold" style={{ color: C.primary }}>Rémunération</h3>
								{grille && (
									<span className="text-xs" style={{ color: C.muted }}>
										Grille {poste.niveau.toLowerCase()} : {fcfa(grille.min)} — {fcfa(grille.max)}
									</span>
								)}
							</div>

							<div className="mt-4 grid gap-5 md:grid-cols-2">
								<Champ label="Salaire mensuel brut" requis
									aide={!poste ? "Choisissez d'abord un poste." : "Donnée sensible."}>
									<Saisie type="number" value={f.salaire} disabled={!poste}
										onChange={(e) => set({ salaire: e.target.value })} placeholder="750000"
										style={horsGrille ? { borderColor: C.warning, background: C.warningSoft } : undefined} />
								</Champ>
								<Champ label="Mode de paiement">
									<Saisie value="Virement bancaire" readOnly />
								</Champ>
							</div>

							{/* Position dans la fourchette */}
							{grille && salaireNum > 0 && (
								<div className="mt-4">
									<div className="relative h-8 rounded-md" style={{ background: C.mutedBg }}>
										<div className="absolute inset-y-0 rounded-md" style={{ left: 0, right: 0, background: C.successSoft }} />
										<span className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white shadow"
											style={{
												left: `calc(${Math.max(0, Math.min(100, ((salaireNum - grille.min) / (grille.max - grille.min)) * 100))}% - 8px)`,
												background: horsGrille ? C.warning : C.primary,
											}} />
									</div>
									<div className="mt-1 flex justify-between text-xs" style={{ color: C.muted }}>
										<span>{fcfa(grille.min)}</span>
										<span>{fcfa(grille.max)}</span>
									</div>
								</div>
							)}

							{/* Dérogation */}
							{horsGrille && (
								<div className="mt-5 rounded-lg border p-5" style={{ borderColor: C.warningBorder, background: C.warningSoft }}>
									<div className="flex items-start gap-2">
										<Scale size={16} className="mt-0.5 shrink-0" style={{ color: C.warning }} />
										<div>
											<h4 className="text-sm font-semibold" style={{ color: C.warning }}>
												Dérogation salariale requise
											</h4>
											<p className="mt-0.5 text-xs" style={{ color: C.warning }}>
												Le montant est {audessus ? "supérieur au maximum" : "inférieur au minimum"} de{" "}
												{fcfa(Math.abs(salaireNum - (audessus ? grille.max : grille.min)))}. La
												Direction Financière devra statuer, et <strong>l'employé sera exclu
												des exports de paie</strong> jusqu'à sa décision.
											</p>
										</div>
									</div>

									<div className="mt-4">
										<Champ label="Motif de la dérogation" requis erreur={err.motifDerogation}
											aide={!err.motifDerogation ? `${f.motifDerogation.trim().length} / 40 caractères minimum. Un motif substantiel, non « décision de la direction ».` : undefined}>
											<textarea rows={3} value={f.motifDerogation} onBlur={() => marquer("motifDerogation")}
												onChange={(e) => set({ motifDerogation: e.target.value })}
												placeholder="Ex : recrutement en tension. Onze ans d'expérience en adduction d'eau potable, seul candidat titulaire du CACES 4 et de l'habilitation soudure PE."
												className="w-full resize-none rounded-md border px-3 py-2 text-sm outline-none"
												style={{ borderColor: err.motifDerogation ? C.destructive : C.border, background: "#fff" }} />
										</Champ>
									</div>
								</div>
							)}
						</div>
					</div>
				)}
			</div>

			<div className="flex flex-wrap items-center justify-between gap-3 border-t px-7 py-4" style={{ borderColor: "#F3F4F6" }}>
				<Bouton variante="fantome" onClick={onFermer}>Annuler</Bouton>
				<div className="flex items-center gap-3">
					{!complet && (
						<span className="text-xs" style={{ color: C.muted }}>
							Des champs obligatoires restent à renseigner
						</span>
					)}
					<Bouton variante="succes" icone={Check} style={complet ? undefined : { opacity: .4 }}
						onClick={() => complet && notifier(horsGrille
							? "Employé créé — dérogation transmise à la Direction Financière"
							: "Employé créé — matricule ITA-2026-0181")}>
						Créer le profil
					</Bouton>
				</div>
			</div>
		</Carte>
	);
}

function IndicateurBrouillon({ etat }) {
	if (etat === "aucun") return null;
	if (etat === "enregistrement") {
		return (
			<span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs shadow-sm" style={{ color: C.muted }}>
				<Loader2 size={12} className="animate-spin" /> Enregistrement…
			</span>
		);
	}
	return (
		<Infobulle texte="Brouillon enregistré automatiquement deux secondes après la frappe. Fermer cette fenêtre ne perd rien — décision E-03.">
			<span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs shadow-sm" style={{ color: C.success }}>
				<Save size={12} /> Brouillon enregistré
			</span>
		</Infobulle>
	);
}

/* ================================================================== */
/* 2 — CONTRATS ET ÉCHÉANCES                                           */
/* ================================================================== */

const CONTRATS = [
	{ id: "c1", nom: "COULIBALY", prenom: "Seydou", poste: "CHEF_EQUIPE", type: "CDD", debut: "2024-07-01", fin: "2026-08-31", avenants: 1, signe: true },
	{ id: "c2", nom: "DIABATÉ", prenom: "Mamadou", poste: "MECANICIEN", type: "CDD", debut: "2026-07-01", fin: "2026-12-31", avenants: 0, signe: false },
	{ id: "c3", nom: "KABORÉ", prenom: "Awa", poste: "ASST_QHSE", type: "STAGE", debut: "2026-06-01", fin: "2026-08-31", avenants: 0, signe: true },
	{ id: "c4", nom: "N'GUESSAN", prenom: "Léa", poste: "CHARGE_ETUDES", type: "CDI", debut: "2022-08-22", fin: null, avenants: 2, signe: true },
	{ id: "c5", nom: "TOURÉ", prenom: "Abdoulaye", poste: "CHAUFFEUR", type: "CDI", debut: "2024-01-08", fin: null, avenants: 0, signe: true },
	{ id: "c6", nom: "SANOGO", prenom: "Adama", poste: "CHEF_LOG", type: "CDI", debut: "2023-11-15", fin: null, avenants: 1, signe: true },
	{ id: "c7", nom: "GNAHORÉ", prenom: "Pascal", poste: "CHEF_AEP", type: "CDD", debut: "2025-02-17", fin: "2027-02-16", avenants: 0, signe: true },
];

function Contrats({ notifier }) {
	const [filtre, setFiltre] = useState("tous");

	const enrichis = useMemo(() => CONTRATS.map((c) => {
		const j = c.fin ? jAvant(c.fin) : null;
		const alerte = j !== null && j > 0 && j <= 60 ? (j <= 30 ? "critique" : "proche") : null;
		return { ...c, j, alerte };
	}), []);

	const listes = {
		tous: enrichis,
		echeance: enrichis.filter((c) => c.alerte),
		non_signes: enrichis.filter((c) => !c.signe),
	};

	const liste = listes[filtre];
	const nbEcheance = listes.echeance.length;
	const nbNonSignes = listes.non_signes.length;

	return (
		<>
			<header className="mb-6">
				<h1 className="text-2xl font-semibold" style={{ color: C.primary }}>Contrats</h1>
				<p className="mt-1 max-w-3xl text-sm" style={{ color: C.muted }}>
					Un CDD non renouvelé se transforme en CDI par tacite reconduction. Les alertes
					ne sont pas un confort : elles évitent une requalification non voulue.
				</p>
			</header>

			{/* Indicateurs */}
			<div className="mb-6 grid gap-4 sm:grid-cols-3">
				{[
					["Contrats actifs", enrichis.length, "toutes natures", false],
					["Échéances sous 60 jours", nbEcheance, "à renouveler ou clôturer", nbEcheance > 0],
					["Contrats non signés", nbNonSignes, "bloquent la déclaration CNPS", nbNonSignes > 0],
				].map(([l, v, s, alerte]) => (
					<Carte key={l} className="p-5">
						<div className="text-xs font-medium uppercase tracking-wide" style={{ color: C.muted }}>{l}</div>
						<div className="mt-2 text-2xl font-semibold" style={{ color: alerte ? C.warning : C.primary }}>{v}</div>
						<div className="mt-1 text-xs" style={{ color: C.muted }}>{s}</div>
					</Carte>
				))}
			</div>

			{/* Alertes en tête */}
			{nbEcheance > 0 && (
				<Carte className="mb-6 p-5" style={{ borderLeft: `3px solid ${C.warning}` }}>
					<h2 className="flex items-center gap-2 text-sm font-semibold" style={{ color: C.warning }}>
						<CalendarClock size={15} /> Échéances à traiter
					</h2>
					<div className="mt-4 space-y-2">
						{listes.echeance.sort((a, b) => a.j - b.j).map((c) => (
							<div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3"
								style={{ background: c.alerte === "critique" ? C.destructiveSoft : C.warningSoft }}>
								<div className="min-w-0">
									<div className="text-sm font-medium">{c.nom} {c.prenom}</div>
									<div className="text-xs" style={{ color: C.muted }}>
										{POSTES.find((p) => p.id === c.poste)?.libelle} · {c.type} · fin le {dateFr(c.fin)}
									</div>
								</div>
								<div className="flex items-center gap-3">
									<Badge fg={c.alerte === "critique" ? C.destructive : C.warning} bg="#fff">
										J−{c.j}
									</Badge>
									<Bouton variante="vide" style={{ padding: "4px 14px", fontSize: 12 }}
										onClick={() => notifier(`Avenant de renouvellement — ${c.nom} ${c.prenom}`)}>
										Renouveler
									</Bouton>
								</div>
							</div>
						))}
					</div>
					<p className="mt-4 flex items-start gap-2 rounded-lg px-4 py-3 text-xs" style={{ background: C.mutedBg, color: C.muted }}>
						<Info size={13} className="mt-0.5 shrink-0" />
						Un rappel par courriel part à 30 jours de l'échéance — décision E-06. La
						relance est adressée à la Direction RH et au supérieur hiérarchique.
					</p>
				</Carte>
			)}

			{/* Filtres */}
			<div className="mb-4 flex flex-wrap gap-1.5">
				{[
					["tous", `Tous (${enrichis.length})`],
					["echeance", `Échéances (${nbEcheance})`],
					["non_signes", `Non signés (${nbNonSignes})`],
				].map(([v, l]) => (
					<button key={v} type="button" onClick={() => setFiltre(v)}
						className="rounded-full border px-3 py-1.5 text-xs font-medium"
						style={{
							borderColor: filtre === v ? C.primary : C.border,
							background: filtre === v ? C.primarySoft : "#fff",
							color: filtre === v ? C.primary : C.muted,
						}}>{l}</button>
				))}
			</div>

			<Carte className="overflow-hidden p-0">
				<table className="w-full text-sm">
					<thead>
						<tr style={{ background: C.mutedBg }}>
							{["Employé", "Poste", "Nature", "Début", "Fin", "Avenants", "Signature", ""].map((h) => (
								<th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: C.muted }}>{h}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{liste.map((c) => (
							<tr key={c.id} className="border-t" style={{ borderColor: "#F3F4F6" }}>
								<td className="px-4 py-3 font-medium">{c.nom} {c.prenom}</td>
								<td className="px-4 py-3 text-xs">{POSTES.find((p) => p.id === c.poste)?.libelle}</td>
								<td className="px-4 py-3">
									<Badge fg={C.muted} bg={C.mutedBg}>{c.type}</Badge>
								</td>
								<td className="px-4 py-3 text-xs">{dateFr(c.debut)}</td>
								<td className="px-4 py-3 text-xs">
									{c.fin ? (
										c.alerte ? (
											<Infobulle texte={c.alerte === "critique"
												? "Échéance dans moins de 30 jours. Sans renouvellement ni clôture, le contrat se transforme en CDI."
												: "Échéance dans moins de 60 jours."}>
												<span style={{ color: c.alerte === "critique" ? C.destructive : C.warning, fontWeight: 600 }}>
													{dateFr(c.fin)} · J−{c.j}
												</span>
											</Infobulle>
										) : dateFr(c.fin)
									) : (
										<span style={{ color: C.muted }}>indéterminée</span>
									)}
								</td>
								<td className="px-4 py-3 text-xs">
									{c.avenants > 0 ? (
										<Infobulle texte="Une modification de poste ou de salaire donne lieu à un avenant, jamais à une réécriture du contrat. L'historique doit rester lisible.">
											<span>{c.avenants} avenant{c.avenants > 1 ? "s" : ""}</span>
										</Infobulle>
									) : <span style={{ color: C.muted }}>aucun</span>}
								</td>
								<td className="px-4 py-3">
									{c.signe
										? <Badge fg={C.success} bg={C.successSoft}>Signé</Badge>
										: <Infobulle texte="Un contrat non signé bloque la déclaration CNPS et l'entrée en paie.">
												<Badge fg={C.destructive} bg={C.destructiveSoft}>Non signé</Badge>
											</Infobulle>}
								</td>
								<td className="px-4 py-3 text-right">
									<div className="flex justify-end gap-1">
										<Infobulle cote="gauche" texte="Consulter le contrat. Ouverture par URL signée de courte durée.">
											<button type="button" className="rounded p-1.5" style={{ color: C.primary }} aria-label="Consulter">
												<Eye size={15} />
											</button>
										</Infobulle>
										<Infobulle cote="gauche" texte="Créer un avenant — changement de poste, de salaire ou de durée.">
											<button type="button" onClick={() => notifier("Formulaire d'avenant")}
												className="rounded p-1.5" style={{ color: C.review }} aria-label="Créer un avenant">
												<FileSignature size={15} />
											</button>
										</Infobulle>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
				{!liste.length && (
					<div className="py-14 text-center">
						<p className="text-sm font-medium">Aucun contrat dans cette catégorie</p>
					</div>
				)}
			</Carte>
		</>
	);
}

/* ================================================================== */
/* APPLICATION                                                         */
/* ================================================================== */

export default function ApercuM2() {
	const [vue, setVue] = useState("formulaire");
	const [toast, setToast] = useState(null);
	const notifier = (m) => { setToast(m); setTimeout(() => setToast(null), 3500); };

	return (
		<div className="min-h-screen" style={{ background: C.bg }}>
			<header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b bg-white px-8 py-3" style={{ borderColor: C.border }}>
				<div className="flex items-center gap-2.5">
					<div className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: C.primary }}>ITA</div>
					<div>
						<div className="text-sm font-semibold" style={{ color: C.primary }}>ITA Manager</div>
						<div className="text-xs" style={{ color: C.muted }}>M2 — Employés · écrans complémentaires</div>
					</div>
				</div>
				<div className="flex gap-1.5">
					{[["formulaire", "Formulaire de création", UserPlus], ["contrats", "Contrats et échéances", FileSignature]].map(([v, l, I]) => (
						<button key={v} type="button" onClick={() => setVue(v)}
							className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium"
							style={{
								borderColor: vue === v ? C.primary : C.border,
								background: vue === v ? C.primarySoft : "#fff",
								color: vue === v ? C.primary : C.muted,
							}}>
							<I size={14} />{l}
						</button>
					))}
				</div>
			</header>

			<div className="border-b px-8 py-2" style={{ borderColor: C.warningBorder, background: C.warningSoft }}>
				<p className="text-xs" style={{ color: C.warning }}>
					{vue === "formulaire"
						? "Commencez par choisir le type de main-d'œuvre — il change le formulaire entier. Essayez ensuite un salaire hors grille pour voir la dérogation se déclencher."
						: "Les échéances remontent en tête. Un CDD non renouvelé se transforme en CDI par tacite reconduction."}
				</p>
			</div>

			<main className="px-8 py-6">
				{vue === "formulaire"
					? <Formulaire onFermer={() => notifier("Fermeture — le brouillon est conservé")} notifier={notifier} />
					: <Contrats notifier={notifier} />}
			</main>

			{toast && (
				<div className="fixed bottom-6 right-6 z-[60] flex max-w-sm items-start gap-2 rounded-lg px-5 py-3 text-sm text-white shadow-lg"
					style={{ background: C.primary }}>
					<Check size={16} className="mt-0.5 shrink-0" />{toast}
				</div>
			)}
		</div>
	);
}
