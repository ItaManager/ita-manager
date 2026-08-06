import React, { useState, useMemo } from "react";
import {
	HardHat, Wallet, Users, Search, Plus, X, Check, Info, Lock, Clock,
	TrendingUp, AlertTriangle, History, ChevronRight, Pencil, Archive,
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

const AUJ = new Date("2026-08-02T00:00:00Z");
const fmt = new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC" });
const dateFr = (i) => i ? fmt.format(new Date(i + "T00:00:00Z")) : "—";
const fcfa = (n) => n || n === 0 ? new Intl.NumberFormat("fr-FR").format(n) + " F" : "—";

/* ================================================================== */
/* DONNÉES                                                             */
/* ================================================================== */

/* Trois directions, trois gestes distincts */
const ROLES = {
	DT:  { code: "DT",  libelle: "Direction Technique",  peut: ["creer"] },
	DFC: { code: "DFC", libelle: "Direction Financière", peut: ["taux"] },
	DRH: { code: "DRH", libelle: "Direction RH",         peut: ["assigner"] },
	ADMIN: { code: "ADMIN", libelle: "Administrateur",   peut: ["creer", "taux", "assigner"] },
};

/* Un agent, une compétence. Une compétence composée reste une compétence. */
const COMPETENCES = [
	{
		id: "c1", libelle: "Manœuvre", categorie: "BASE", actif: true,
		taux: [
			{ montant: 5_000, effet: "2026-01-01" },
			{ montant: 4_500, effet: "2025-01-01" },
		],
	},
	{
		id: "c2", libelle: "Maçon", categorie: "QUALIFIE", actif: true,
		taux: [
			{ montant: 7_500, effet: "2026-01-01", motif: "Revalorisation annuelle" },
			{ montant: 7_000, effet: "2025-03-01" },
			{ montant: 6_500, effet: "2024-01-01" },
		],
	},
	{
		id: "c3", libelle: "Coffreur", categorie: "QUALIFIE", actif: true,
		taux: [{ montant: 8_000, effet: "2026-01-01" }],
	},
	{
		id: "c4", libelle: "Maçon-Coffreur", categorie: "COMPOSEE", actif: true,
		composeDe: ["Maçon", "Coffreur"],
		taux: [
			{ montant: 9_500, effet: "2026-04-01", motif: "Rareté du profil sur les chantiers de Bouaké" },
			{ montant: 9_000, effet: "2026-01-01" },
		],
	},
	{
		id: "c5", libelle: "Ferrailleur", categorie: "QUALIFIE", actif: true,
		taux: [{ montant: 8_500, effet: "2026-01-01" }],
	},
	{
		id: "c6", libelle: "Soudeur", categorie: "QUALIFIE", actif: true,
		taux: [{ montant: 10_000, effet: "2026-01-01" }],
	},
	{
		id: "c7", libelle: "Plombier — pose canalisation", categorie: "QUALIFIE", actif: true,
		taux: [{ montant: 9_000, effet: "2026-01-01" }],
	},
	{
		id: "c8", libelle: "Conducteur d'engins", categorie: "QUALIFIE", actif: true,
		taux: [{ montant: 12_000, effet: "2026-01-01" }],
	},
	{
		id: "c9", libelle: "Aide-maçon", categorie: "BASE", actif: true,
		taux: [{ montant: 6_000, effet: "2026-01-01" }],
	},
	{
		id: "c10", libelle: "Terrassier", categorie: "BASE", actif: false,
		taux: [{ montant: 5_500, effet: "2024-01-01" }],
		motifArchivage: "Fusionnée avec Manœuvre en janvier 2026",
	},
	/* Créées par la Direction Technique, en attente de validation financière */
	{
		id: "c11", libelle: "Carreleur", categorie: "QUALIFIE", actif: true,
		taux: [],
		creeeParDT: "2026-07-28",
	},
	{
		id: "c12", libelle: "Ferrailleur-Soudeur", categorie: "COMPOSEE", actif: true,
		composeDe: ["Ferrailleur", "Soudeur"],
		taux: [],
		creeeParDT: "2026-08-01",
	},
];

const AGENTS = [
	{ id: "a1", nom: "DOSSO Christ", competenceId: "c2", depuis: "2026-02-15", chantier: "Bouaké Nord" },
	{ id: "a2", nom: "KABORÉ Salif", competenceId: "c1", depuis: "2026-02-15", chantier: "Bouaké Nord" },
	{ id: "a3", nom: "TRAORÉ Moussa", competenceId: "c4", depuis: "2026-03-01", chantier: "Bouaké Nord" },
	{ id: "a4", nom: "OUÉDRAOGO Paul", competenceId: "c1", depuis: "2026-04-01", chantier: "Yopougon" },
	{ id: "a5", nom: "SANGARÉ Ibrahim", competenceId: "c3", depuis: "2026-04-01", chantier: "Bouaké Nord" },
	{ id: "a6", nom: "DIABATÉ Yaya", competenceId: "c5", depuis: "2026-02-20", chantier: "Bouaké Nord" },
	{ id: "a7", nom: "COULIBALY Adama", competenceId: "c1", depuis: "2026-05-10", chantier: "Yopougon" },
	{ id: "a8", nom: "BAMBA Seydou", competenceId: "c2", depuis: "2026-03-15", chantier: "Bouaké Nord" },
	{ id: "a9", nom: "KONÉ Lassina", competenceId: "c9", depuis: "2026-06-01", chantier: "Bouaké Nord" },
	{ id: "a10", nom: "OUATTARA Karim", competenceId: "c6", depuis: "2026-04-12", chantier: "Yopougon" },
	{ id: "a11", nom: "YEO Souleymane", competenceId: "c1", depuis: "2026-05-20", chantier: "Bouaké Nord" },
	{ id: "a12", nom: "SILUÉ Drissa", competenceId: "c7", depuis: "2026-06-15", chantier: "Bouaké Nord" },
	{ id: "a13", nom: "TOURÉ Ousmane", competenceId: "c1", depuis: "2026-07-01", chantier: null },
	{ id: "a14", nom: "GNAHORÉ Célestin", competenceId: "c8", depuis: "2026-03-01", chantier: "Yopougon" },
	{ id: "a15", nom: "ZAHUI Marcel", competenceId: null, depuis: null, chantier: null },
	{ id: "a16", nom: "KOUADIO Blaise", competenceId: null, depuis: null, chantier: null },
];

const CATEGORIES = {
	BASE: { l: "Base", fg: C.muted, bg: C.mutedBg },
	QUALIFIE: { l: "Qualifiée", fg: C.primary, bg: C.primarySoft },
	COMPOSEE: { l: "Composée", fg: C.review, bg: C.reviewSoft },
};

/* Taux en vigueur à une date donnée. null si la DFC n'a rien validé. */
const tauxEnVigueur = (comp, date = AUJ) => {
	if (!comp.taux?.length) return null;
	const iso = date.toISOString().slice(0, 10);
	return comp.taux.filter((t) => t.effet <= iso).sort((a, b) => b.effet.localeCompare(a.effet))[0] ?? null;
};

/* Une compétence sans taux ne peut pas être assignée — aucun montant ne se calculerait */
const assignable = (comp) => comp.actif && !!tauxEnVigueur(comp);

const agentsDe = (id) => AGENTS.filter((a) => a.competenceId === id);

/* ================================================================== */
/* PRIMITIVES                                                          */
/* ================================================================== */

function Infobulle({ texte, cote = "haut", children }) {
	const [v, setV] = useState(false);
	if (!texte) return children;
	const pos = {
		haut: { bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
		bas: { top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
		gauche: { right: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" },
	}[cote];
	return (
		<span className="relative inline-flex" onMouseEnter={() => setV(true)} onMouseLeave={() => setV(false)}
			onFocus={() => setV(true)} onBlur={() => setV(false)}>
			{children}
			{v && (
				<span role="tooltip" className="pointer-events-none absolute z-50 whitespace-normal rounded-md px-3 py-2 text-xs font-normal normal-case leading-snug text-white shadow-lg"
					style={{ ...pos, background: "#111827", width: 250, letterSpacing: 0 }}>{texte}</span>
			)}
		</span>
	);
}

const Badge = ({ fg, bg, children }) => (
	<span className="inline-block whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium" style={{ color: fg, background: bg }}>{children}</span>
);

const Carte = ({ children, className = "", style, ...reste }) => (
	<div className={"rounded-xl bg-white shadow-sm " + className} style={style} {...reste}>{children}</div>
);

const Bouton = ({ variante = "plein", icone: I, children, style, ...q }) => {
	const v = {
		plein: { background: C.primary, color: "#fff", border: `1px solid ${C.primary}` },
		succes: { background: C.success, color: "#fff", border: `1px solid ${C.success}` },
		vide: { background: "#fff", color: C.primary, border: `1px solid ${C.primary}` },
		fantome: { background: "transparent", color: C.muted, border: `1px solid ${C.border}` },
	}[variante];
	return (
		<button type="button" className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
			style={{ ...v, ...style }} {...q}>{I && <I size={16} />}{children}</button>
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

const Saisie = ({ erreur, style, ...q }) => (
	<input className="w-full rounded-md border px-3 py-2 text-sm outline-none"
		style={{
			borderColor: erreur ? C.destructive : C.border,
			background: q.readOnly || q.disabled ? C.mutedBg : "#fff",
			...style,
		}} {...q} />
);

const Zone = ({ erreur, ...q }) => (
	<textarea className="w-full resize-none rounded-md border px-3 py-2 text-sm outline-none"
		style={{ borderColor: erreur ? C.destructive : C.border, background: "#fff" }} {...q} />
);

function Combo({ value, onChange, options, placeholder, erreur }) {
	const [ouvert, setOuvert] = useState(false);
	const [q, setQ] = useState("");
	const norm = (t) => (t ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
	const sel = options.find((o) => o.value === value);
	const filtrees = q ? options.filter((o) => norm(o.label).includes(norm(q))) : options;

	return (
		<div className="relative">
			<div className="relative">
				<input value={ouvert ? q : sel?.label ?? ""}
					onChange={(e) => { setQ(e.target.value); setOuvert(true); }}
					onFocus={() => { setOuvert(true); setQ(""); }}
					onBlur={() => setTimeout(() => setOuvert(false), 150)}
					placeholder={placeholder}
					className="w-full rounded-md border px-3 py-2 pr-8 text-sm outline-none"
					style={{ borderColor: erreur ? C.destructive : C.border }} />
				<Search size={14} className="pointer-events-none absolute right-3 top-2.5" style={{ color: C.muted }} />
			</div>
			{ouvert && (
				<div className="absolute z-40 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-white shadow-lg" style={{ borderColor: C.border }}>
					{filtrees.map((o) => (
						o.desactive ? (
							<Infobulle key={o.value} cote="bas" texte={o.raison}>
								<span className="flex w-full cursor-not-allowed items-center justify-between gap-3 px-3 py-2 text-left text-sm"
									style={{ color: "#9CA3AF" }}>
									<span className="inline-flex items-center gap-1.5 truncate">
										<Lock size={11} className="shrink-0" />{o.label}
									</span>
									<span className="shrink-0 text-xs" style={{ color: C.warning }}>{o.detail}</span>
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
					{!filtrees.length && (
						<div className="px-3 py-3 text-center text-xs" style={{ color: C.muted }}>Aucun résultat</div>
					)}
				</div>
			)}
		</div>
	);
}

function Modale({ titre, sousTitre, largeur = 560, onFermer, pied, children }) {
	return (
		<div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8"
			style={{ background: "rgba(17,17,17,0.45)" }} onClick={onFermer}>
			<Carte className="w-full overflow-hidden p-0" style={{ maxWidth: largeur, maxHeight: "90vh" }}
				onClick={(e) => e.stopPropagation()}>
				<header className="flex items-start justify-between gap-4 px-7 py-5" style={{ background: C.primarySoft }}>
					<div className="min-w-0">
						<h2 className="text-lg font-semibold" style={{ color: C.primary }}>{titre}</h2>
						{sousTitre && <p className="mt-0.5 text-sm" style={{ color: C.muted }}>{sousTitre}</p>}
					</div>
					<button type="button" onClick={onFermer} className="rounded-full bg-white p-2 shadow-sm" aria-label="Fermer">
						<X size={16} />
					</button>
				</header>
				<div className="overflow-y-auto px-7 py-6" style={{ maxHeight: "calc(90vh - 160px)" }}>{children}</div>
				<footer className="flex items-center justify-between gap-3 border-t px-7 py-4" style={{ borderColor: "#F3F4F6" }}>
					{pied}
				</footer>
			</Carte>
		</div>
	);
}

/* ================================================================== */
/* MODALE — COMPÉTENCE · Direction Technique                           */
/* ================================================================== */

function ModaleCompetence({ competence, onFermer, notifier }) {
	const edition = !!competence;
	const [f, setF] = useState({
		libelle: competence?.libelle ?? "",
		categorie: competence?.categorie ?? "",
		composeDe: competence?.composeDe ?? [],
	});
	const [touche, setTouche] = useState({});
	const set = (x) => setF((y) => ({ ...y, ...x }));

	const composee = f.categorie === "COMPOSEE";

	const norm = (t) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
	const doublon = COMPETENCES.find((c) =>
		norm(c.libelle) === norm(f.libelle) && c.id !== competence?.id);

	const err = {};
	if (touche.libelle && !f.libelle.trim()) err.libelle = "Le libellé est requis.";
	if (doublon) err.libelle = `« ${doublon.libelle} » existe déjà.`;
	if (touche.categorie && !f.categorie) err.categorie = "La catégorie est requise.";
	if (composee && f.composeDe.length < 2) err.composeDe = "Une compétence composée réunit au moins deux métiers.";

	const complet = f.libelle.trim() && !doublon && f.categorie
		&& (!composee || f.composeDe.length >= 2);

	const basculerComposante = (lib) => set({
		composeDe: f.composeDe.includes(lib)
			? f.composeDe.filter((x) => x !== lib)
			: [...f.composeDe, lib],
	});

	return (
		<Modale titre={edition ? "Modifier la compétence" : "Nouvelle compétence"}
			sousTitre="Direction Technique" onFermer={onFermer}
			pied={<>
				<Bouton variante="fantome" onClick={onFermer}>Annuler</Bouton>
				<div className="flex items-center gap-3">
					{!complet && <span className="text-xs" style={{ color: C.muted }}>Champs à compléter</span>}
					<Bouton variante="succes" icone={Check} style={complet ? undefined : { opacity: .4 }}
						onClick={() => { if (complet) { notifier(edition ? "Compétence modifiée" : `« ${f.libelle} » créée — en attente du taux`); onFermer(); } }}>
						{edition ? "Enregistrer" : "Créer"}
					</Bouton>
				</div>
			</>}>

			<div className="space-y-5">
				<Champ label="Libellé" requis erreur={err.libelle}>
					<Saisie value={f.libelle} erreur={err.libelle} onBlur={() => setTouche((t) => ({ ...t, libelle: true }))}
						onChange={(e) => set({ libelle: e.target.value })} placeholder="Maçon-Coffreur" />
				</Champ>

				<Champ label="Catégorie" requis erreur={err.categorie}>
					<div className="space-y-2">
						{[
							["BASE", "Base", "Manœuvre, aide — sans qualification particulière."],
							["QUALIFIE", "Qualifiée", "Un métier — maçon, soudeur, ferrailleur."],
							["COMPOSEE", "Composée", "Plusieurs métiers réunis. Un agent qui sait faire les deux."],
						].map(([v, l, aide]) => (
							<button key={v} type="button" onClick={() => set({ categorie: v })}
								className="flex w-full items-start gap-2.5 rounded-lg border px-4 py-3 text-left"
								style={{
									borderColor: f.categorie === v ? C.primary : C.border,
									background: f.categorie === v ? C.primarySoft : "#fff",
								}}>
								<span className="mt-1 h-3 w-3 shrink-0 rounded-full border-2"
									style={{
										borderColor: f.categorie === v ? C.primary : C.border,
										background: f.categorie === v ? C.primary : "transparent",
									}} />
								<span className="text-sm">
									{l}
									<span className="mt-0.5 block text-xs" style={{ color: C.muted }}>{aide}</span>
								</span>
							</button>
						))}
					</div>
				</Champ>

				{composee && (
					<Champ label="Métiers réunis" requis erreur={err.composeDe}
						aide={!err.composeDe ? "Un agent portant cette compétence sait faire tous ces métiers." : undefined}>
						<div className="flex flex-wrap gap-1.5">
							{COMPETENCES.filter((c) => c.categorie === "QUALIFIE" && c.actif).map((c) => {
								const choisi = f.composeDe.includes(c.libelle);
								return (
									<button key={c.id} type="button" onClick={() => basculerComposante(c.libelle)}
										className="rounded-full border px-3 py-1.5 text-xs font-medium"
										style={{
											borderColor: choisi ? C.review : C.border,
											background: choisi ? C.reviewSoft : "#fff",
											color: choisi ? C.review : C.muted,
										}}>
										{c.libelle}
									</button>
								);
							})}
						</div>
					</Champ>
				)}

				{!edition && (
					<p className="flex items-start gap-2 rounded-lg px-4 py-3 text-sm"
						style={{ background: C.warningSoft, color: C.warning }}>
						<AlertTriangle size={15} className="mt-0.5 shrink-0" />
						<span>
							<strong>La compétence sera créée sans taux.</strong> Elle ne pourra pas être
							assignée tant que la Direction Financière n'aura pas fixé son taux
							journalier.
						</span>
					</p>
				)}

				<p className="flex items-start gap-2 rounded-lg px-4 py-3 text-xs" style={{ background: C.mutedBg, color: C.muted }}>
					<Info size={13} className="mt-0.5 shrink-0" />
					<span>
						<strong>Trois directions, trois gestes.</strong> La Technique définit le métier,
						la Financière fixe le taux, les RH l'assignent aux agents.
					</span>
				</p>
			</div>
		</Modale>
	);
}

/* ================================================================== */
/* MODALE — TAUX JOURNALIER · Direction Financière                     */
/* ================================================================== */

function ModaleTaux({ competence, onFermer, notifier }) {
	const courant = tauxEnVigueur(competence);
	const premier = !courant;
	const nb = agentsDe(competence.id).length;

	const [f, setF] = useState({
		montant: courant ? String(courant.montant) : "",
		effet: AUJ.toISOString().slice(0, 10),
		motif: "",
	});
	const [touche, setTouche] = useState({});
	const set = (x) => setF((y) => ({ ...y, ...x }));

	const change = courant && Number(f.montant) !== courant.montant;
	const variation = change
		? ((Number(f.montant) - courant.montant) / courant.montant) * 100 : null;

	const err = {};
	if (touche.montant && (!f.montant || Number(f.montant) <= 0)) err.montant = "Le taux est requis.";
	if (touche.motif && change && f.motif.trim().length < 20)
		err.motif = `${20 - f.motif.trim().length} caractères manquants.`;

	const complet = Number(f.montant) > 0 && (!change || f.motif.trim().length >= 20);

	return (
		<Modale titre={premier ? "Fixer le taux journalier" : "Réviser le taux"}
			sousTitre={`${competence.libelle} · Direction Financière`} onFermer={onFermer}
			pied={<>
				<Bouton variante="fantome" onClick={onFermer}>Annuler</Bouton>
				<div className="flex items-center gap-3">
					{!complet && <span className="text-xs" style={{ color: C.muted }}>Champs à compléter</span>}
					<Bouton variante="succes" icone={Check} style={complet ? undefined : { opacity: .4 }}
						onClick={() => { if (complet) { notifier(`${competence.libelle} — ${fcfa(Number(f.montant))} par jour à compter du ${dateFr(f.effet)}`); onFermer(); } }}>
						{premier ? "Valider le taux" : "Publier"}
					</Bouton>
				</div>
			</>}>

			<div className="space-y-5">
				{premier ? (
					<div className="rounded-lg border px-4 py-3" style={{ borderColor: C.warningBorder, background: C.warningSoft }}>
						<div className="flex items-start gap-2 text-sm" style={{ color: C.warning }}>
							<Clock size={15} className="mt-0.5 shrink-0" />
							<span>
								Créée par la Direction Technique le {dateFr(competence.creeeParDT)}.
								<strong> En attente de votre validation.</strong> Tant qu'aucun taux
								n'est fixé, cette compétence ne peut pas être assignée.
							</span>
						</div>
					</div>
				) : (
					<div className="rounded-lg p-4" style={{ background: C.mutedBg }}>
						<div className="text-xs font-medium uppercase tracking-wide" style={{ color: C.muted }}>Taux en vigueur</div>
						<div className="mt-1.5 flex items-baseline justify-between gap-3">
							<span className="text-lg font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
								{fcfa(courant.montant)}
							</span>
							<span className="text-xs" style={{ color: C.muted }}>depuis le {dateFr(courant.effet)}</span>
						</div>
						{nb > 0 && (
							<div className="mt-1.5 text-xs" style={{ color: C.muted }}>
								{nb} agent{nb > 1 ? "s" : ""} concerné{nb > 1 ? "s" : ""}
							</div>
						)}
					</div>
				)}

				<div className="grid gap-5 md:grid-cols-2">
					<Champ label="Montant par jour" requis erreur={err.montant}>
						<Saisie type="number" value={f.montant} erreur={err.montant}
							onBlur={() => setTouche((t) => ({ ...t, montant: true }))}
							onChange={(e) => set({ montant: e.target.value })}
							placeholder="8000" style={{ fontVariantNumeric: "tabular-nums" }} />
					</Champ>

					<Champ label="Date d'effet" requis
						aide="Les jours pointés avant gardent l'ancien taux.">
						<Saisie type="date" value={f.effet} onChange={(e) => set({ effet: e.target.value })} />
					</Champ>
				</div>

				{change && (
					<>
						<div className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm"
							style={{ background: C.warningSoft, color: C.warning }}>
							<TrendingUp size={16} className="shrink-0" />
							<span>
								<strong>{fcfa(courant.montant)} → {fcfa(Number(f.montant))}</strong> par jour,
								soit {variation.toFixed(1).replace(".", ",")} %.
								{nb > 0 && ` ${nb} agents concernés.`}
							</span>
						</div>

						<Champ label="Motif de la révision" requis erreur={err.motif}
							aide={!err.motif ? "Toute révision de taux est journalisée." : undefined}>
							<Zone rows={2} value={f.motif} erreur={err.motif}
								onBlur={() => setTouche((t) => ({ ...t, motif: true }))}
								onChange={(e) => set({ motif: e.target.value })}
								placeholder="Ex : revalorisation annuelle, rareté du profil sur les chantiers de Bouaké." />
						</Champ>
					</>
				)}

				<p className="flex items-start gap-2 rounded-lg px-4 py-3 text-xs" style={{ background: C.mutedBg, color: C.muted }}>
					<Info size={13} className="mt-0.5 shrink-0" />
					<span>
						<strong>Un taux ne se modifie pas, il se remplace.</strong> Le précédent reste
						consultable — c'est ce qui rend une paie de mars justifiable en octobre.
					</span>
				</p>
			</div>
		</Modale>
	);
}

/* ================================================================== */
/* MODALE — HISTORIQUE DES TAUX                                        */
/* ================================================================== */

function ModaleHistorique({ competence, onFermer }) {
	const versions = [...competence.taux].sort((a, b) => b.effet.localeCompare(a.effet));
	const courant = tauxEnVigueur(competence);

	return (
		<Modale titre="Historique des taux" sousTitre={competence.libelle} onFermer={onFermer}
			pied={<>
				<span className="text-xs" style={{ color: C.muted }}>
					{versions.length} version{versions.length > 1 ? "s" : ""}
				</span>
				<Bouton onClick={onFermer}>Fermer</Bouton>
			</>}>

			<ol className="space-y-3">
				{versions.map((t, i) => {
					const actuel = t.effet === courant?.effet;
					const suivant = versions[i - 1];
					const variation = suivant
						? ((suivant.montant - t.montant) / t.montant) * 100 : null;

					return (
						<li key={t.effet} className="relative pl-6">
							{i < versions.length - 1 && (
								<span className="absolute bottom-0 left-2 top-6 w-px" style={{ background: C.border }} />
							)}
							<span className="absolute left-0 top-2 h-4 w-4 rounded-full border-2 border-white"
								style={{ background: actuel ? C.success : "#D1D5DB" }} />

							<div className="rounded-lg border p-4"
								style={{ borderColor: actuel ? C.success : C.border, background: actuel ? C.successSoft : "#fff" }}>
								<div className="flex flex-wrap items-baseline justify-between gap-2">
									<span className="text-lg font-semibold" style={{ fontVariantNumeric: "tabular-nums", color: actuel ? C.success : C.primary }}>
										{fcfa(t.montant)}
									</span>
									{actuel
										? <Badge fg={C.success} bg="#fff">en vigueur</Badge>
										: <Badge fg={C.muted} bg={C.mutedBg}>remplacé</Badge>}
								</div>

								<div className="mt-1 text-xs" style={{ color: C.muted }}>
									Depuis le {dateFr(t.effet)}
									{suivant && ` jusqu'au ${dateFr(suivant.effet)}`}
								</div>

								{t.motif && (
									<div className="mt-2 text-xs" style={{ color: C.muted }}>{t.motif}</div>
								)}

								{variation !== null && (
									<div className="mt-2 text-xs" style={{ color: variation > 0 ? C.warning : C.muted }}>
										Suivi d'une hausse de {variation.toFixed(1).replace(".", ",")} %
									</div>
								)}
							</div>
						</li>
					);
				})}
			</ol>

			<p className="mt-5 flex items-start gap-2 rounded-lg px-4 py-3 text-xs" style={{ background: C.mutedBg, color: C.muted }}>
				<Info size={13} className="mt-0.5 shrink-0" />
				<span>
					Une paie du mois de mars applique le taux en vigueur en mars, quel que soit le
					taux d'aujourd'hui. <strong>C'est ce qui rend une paie passée justifiable.</strong>
				</span>
			</p>
		</Modale>
	);
}

/* ================================================================== */
/* MODALE — ASSIGNER UNE COMPÉTENCE                                    */
/* ================================================================== */

function ModaleAssigner({ agent, onFermer, notifier }) {
	const actuelle = agent.competenceId ? COMPETENCES.find((c) => c.id === agent.competenceId) : null;
	const [competenceId, setCompetenceId] = useState(agent.competenceId ?? "");
	const [effet, setEffet] = useState(AUJ.toISOString().slice(0, 10));
	const [motif, setMotif] = useState("");
	const [touche, setTouche] = useState(false);

	const nouvelle = competenceId ? COMPETENCES.find((c) => c.id === competenceId) : null;
	const change = actuelle && competenceId !== agent.competenceId;

	const tauxAvant = actuelle ? tauxEnVigueur(actuelle) : null;
	const tauxApres = nouvelle ? tauxEnVigueur(nouvelle) : null;

	const err = {};
	if (touche && change && motif.trim().length < 15)
		err.motif = `${15 - motif.trim().length} caractères manquants.`;

	const complet = competenceId && (!change || motif.trim().length >= 15);

	return (
		<Modale titre={actuelle ? "Changer de compétence" : "Assigner une compétence"}
			sousTitre={agent.nom} onFermer={onFermer}
			pied={<>
				<Bouton variante="fantome" onClick={onFermer}>Annuler</Bouton>
				<Bouton variante="succes" icone={Check} style={complet ? undefined : { opacity: .4 }}
					onClick={() => { if (complet) { notifier(`${agent.nom} — ${nouvelle.libelle}, ${fcfa(tauxApres.montant)} par jour`); onFermer(); } }}>
					{actuelle ? "Enregistrer" : "Assigner"}
				</Bouton>
			</>}>

			<div className="space-y-5">
				{actuelle && (
					<div className="rounded-lg p-4" style={{ background: C.mutedBg }}>
						<div className="text-xs font-medium uppercase tracking-wide" style={{ color: C.muted }}>Compétence actuelle</div>
						<div className="mt-1.5 flex items-baseline justify-between gap-3">
							<span className="font-medium">{actuelle.libelle}</span>
							<span className="text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>
								{fcfa(tauxAvant.montant)} / jour
							</span>
						</div>
						<div className="mt-0.5 text-xs" style={{ color: C.muted }}>
							Depuis le {dateFr(agent.depuis)}
						</div>
					</div>
				)}

				<Champ label="Compétence" requis
					aide="Un agent porte une seule compétence. S'il sait faire deux métiers, créez une compétence composée.">
					<Combo value={competenceId} onChange={setCompetenceId}
						placeholder="Rechercher une compétence"
						options={COMPETENCES.filter((c) => c.actif).map((c) => {
							const t = tauxEnVigueur(c);
							return {
								value: c.id, label: c.libelle,
								detail: t ? fcfa(t.montant) + " / j" : "sans taux",
								desactive: !t,
								raison: "La Direction Financière n'a pas encore fixé de taux. Sans taux, aucun montant ne se calculerait à la paie.",
							};
						})} />
				</Champ>

				{nouvelle && nouvelle.categorie === "COMPOSEE" && (
					<p className="flex items-start gap-2 rounded-lg px-4 py-3 text-xs"
						style={{ background: C.reviewSoft, color: C.review }}>
						<Info size={13} className="mt-0.5 shrink-0" />
						<span>
							Compétence composée — <strong>{nouvelle.composeDe.join(" et ")}</strong>.
							L'agent est payé au même taux quel que soit le travail du jour.
						</span>
					</p>
				)}

				{change && tauxAvant && tauxApres && (
					<div className="rounded-lg border px-4 py-3"
						style={{ borderColor: C.warningBorder, background: C.warningSoft }}>
						<div className="flex items-center gap-3 text-sm" style={{ color: C.warning }}>
							<TrendingUp size={16} className="shrink-0" />
							<span>
								Le taux passe de <strong>{fcfa(tauxAvant.montant)}</strong> à{" "}
								<strong>{fcfa(tauxApres.montant)}</strong> par jour.
							</span>
						</div>
					</div>
				)}

				<Champ label="À compter du" requis
					aide="Les jours pointés avant cette date gardent l'ancien taux.">
					<Saisie type="date" value={effet} onChange={(e) => setEffet(e.target.value)} />
				</Champ>

				{change && (
					<Champ label="Motif du changement" requis erreur={err.motif}
						aide={!err.motif ? "Journalisé." : undefined}>
						<Zone rows={2} value={motif} erreur={err.motif} onBlur={() => setTouche(true)}
							onChange={(e) => setMotif(e.target.value)}
							placeholder="Ex : formation coffrage validée en juillet." />
					</Champ>
				)}
			</div>
		</Modale>
	);
}

/* ================================================================== */
/* VUE — COMPÉTENCES ET TAUX                                           */
/* ================================================================== */

function VueCompetences({ voitTaux, notifier }) {
	const [q, setQ] = useState("");
	const [filtre, setFiltre] = useState("actives");
	const [modale, setModale] = useState(null);

	const norm = (t) => (t ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

	const listes = {
		actives: COMPETENCES.filter((c) => c.actif),
		sansTaux: COMPETENCES.filter((c) => c.actif && !tauxEnVigueur(c)),
		composees: COMPETENCES.filter((c) => c.actif && c.categorie === "COMPOSEE"),
		archivees: COMPETENCES.filter((c) => !c.actif),
		toutes: COMPETENCES,
	};

	const liste = listes[filtre]
		.filter((c) => !q || norm(c.libelle).includes(norm(q)))
		.sort((a, b) => {
			const ta = tauxEnVigueur(a), tb = tauxEnVigueur(b);
			if (!ta && !tb) return 0;
			if (!ta) return -1;   /* sans taux en tête — elles appellent une action */
			if (!tb) return 1;
			return tb.montant - ta.montant;
		});

	const assignes = AGENTS.filter((a) => a.competenceId).length;
	const sansCompetence = AGENTS.length - assignes;
	const enAttenteTaux = COMPETENCES.filter((c) => c.actif && !tauxEnVigueur(c)).length;
	const coutJournalier = AGENTS
		.filter((a) => a.competenceId && a.chantier)
		.reduce((s2, a) => {
			const t = tauxEnVigueur(COMPETENCES.find((c) => c.id === a.competenceId));
			return s2 + (t?.montant ?? 0);
		}, 0);

	return (
		<>
			<header className="mb-6 flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold" style={{ color: C.primary }}>Compétences et taux journaliers</h1>
					<p className="mt-1 max-w-3xl text-sm" style={{ color: C.muted }}>
						Un agent porte <strong>une</strong> compétence. S'il sait faire deux métiers,
						on crée une compétence composée.
					</p>
				</div>
				<Bouton icone={Plus} onClick={() => setModale({ type: "creer" })}>Nouvelle compétence</Bouton>
			</header>

			{/* Indicateurs */}
			<div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{[
					["Compétences actives", listes.actives.length, `dont ${listes.composees.length} composées`, false, C.primary],
					["En attente de taux", enAttenteTaux, "à valider par la Direction Financière", enAttenteTaux > 0, C.warning],
					["Sans compétence", sansCompetence, "ne peuvent pas être pointés", sansCompetence > 0, C.warning],
					["Coût journalier", voitTaux ? fcfa(coutJournalier) : null, "agents sur chantier", false, C.primary],
				].map(([l, v, s, alerte, couleur]) => (
					<Carte key={l} className="p-5">
						<div className="text-xs font-medium uppercase tracking-wide" style={{ color: C.muted }}>{l}</div>
						{v === null ? (
							<div className="mt-2">
								<Infobulle texte="Les taux relèvent des données sensibles. Permission employe:donneesSensibles requise.">
									<span className="inline-flex items-center gap-1 text-sm" style={{ color: C.muted }}>
										<Lock size={13} /> masqué
									</span>
								</Infobulle>
							</div>
						) : (
							<div className="mt-2 text-2xl font-semibold"
								style={{ color: alerte ? C.warning : couleur, fontVariantNumeric: "tabular-nums" }}>{v}</div>
						)}
						<div className="mt-1 text-xs" style={{ color: C.muted }}>{s}</div>
					</Carte>
				))}
			</div>

			{enAttenteTaux > 0 && (
				<div className="mb-5 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm"
					style={{ borderColor: C.warningBorder, background: C.warningSoft, color: C.warning }}>
					<Clock size={16} className="mt-0.5 shrink-0" />
					<div>
						<strong>{enAttenteTaux} compétences en attente de taux.</strong> Créées par la
						Direction Technique, elles attendent la validation de la Direction Financière.
						Tant qu'aucun taux n'est fixé, elles ne peuvent pas être assignées.
					</div>
				</div>
			)}

			{sansCompetence > 0 && (
				<div className="mb-5 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm"
					style={{ borderColor: C.warningBorder, background: C.warningSoft, color: C.warning }}>
					<AlertTriangle size={16} className="mt-0.5 shrink-0" />
					<div>
						<strong>{sansCompetence} agents sans compétence.</strong> Ils ne peuvent pas
						être pointés au relevé d'activité — sans taux, aucun montant ne se calcule.
					</div>
				</div>
			)}

			{/* Filtres */}
			<div className="mb-4 flex flex-wrap items-center gap-3">
				<div className="relative min-w-64 flex-1 md:max-w-sm">
					<Search size={16} className="absolute left-3 top-2.5" style={{ color: C.muted }} />
					<input value={q} onChange={(e) => setQ(e.target.value)}
						placeholder="Rechercher une compétence"
						className="w-full rounded-md border py-2 pl-9 pr-3 text-sm outline-none"
						style={{ borderColor: C.border, background: "#fff" }} />
				</div>

				<div className="flex flex-wrap gap-1.5">
					{[
						["actives", `Actives (${listes.actives.length})`],
						["sansTaux", `Sans taux (${listes.sansTaux.length})`],
						["composees", `Composées (${listes.composees.length})`],
						["archivees", `Archivées (${listes.archivees.length})`],
						["toutes", `Toutes (${COMPETENCES.length})`],
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
			</div>

			{/* Tableau */}
			<Carte className="overflow-hidden p-0">
				<table className="w-full text-xs">
					<thead>
						<tr style={{ background: C.mutedBg }}>
							{["Compétence", "Catégorie", "Taux journalier", "Depuis", "Agents", "Versions", ""].map((h) => (
								<th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wide"
									style={{ fontSize: 10, color: C.muted }}>{h}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{liste.map((c) => {
							const t = tauxEnVigueur(c);
							const nb = agentsDe(c.id).length;
							const cat = CATEGORIES[c.categorie];

							return (
								<tr key={c.id} className="border-t hover:bg-gray-50"
									style={{ borderColor: "#F3F4F6", opacity: c.actif ? 1 : .55 }}>
									<td className="px-4 py-3">
										<div className="font-medium">{c.libelle}</div>
										{c.composeDe && (
											<div className="mt-0.5 text-xs" style={{ color: C.muted }}>
												{c.composeDe.join(" + ")}
											</div>
										)}
										{!c.actif && c.motifArchivage && (
											<div className="mt-0.5 text-xs" style={{ color: C.muted }}>{c.motifArchivage}</div>
										)}
									</td>
									<td className="px-4 py-3"><Badge fg={cat.fg} bg={cat.bg}>{cat.l}</Badge></td>
									<td className="px-4 py-3">
										{!t ? (
											<Infobulle texte="La Direction Financière n'a pas encore fixé de taux. La compétence ne peut pas être assignée.">
												<Badge fg={C.warning} bg={C.warningSoft}>en attente</Badge>
											</Infobulle>
										) : voitTaux ? (
											<span className="text-sm font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
												{fcfa(t.montant)}
											</span>
										) : (
											<Infobulle texte="Permission employe:donneesSensibles requise.">
												<span className="inline-flex items-center gap-1" style={{ color: C.muted }}>
													<Lock size={11} /> masqué
												</span>
											</Infobulle>
										)}
									</td>
									<td className="px-4 py-3" style={{ color: C.muted }}>
										{t ? dateFr(t.effet) : (
											<span style={{ color: C.warning }}>créée le {dateFr(c.creeeParDT)}</span>
										)}
									</td>
									<td className="px-4 py-3">
										{nb > 0 ? (
											<span style={{ fontVariantNumeric: "tabular-nums" }}>{nb}</span>
										) : (
											<span style={{ color: "#D1D5DB" }}>aucun</span>
										)}
									</td>
									<td className="px-4 py-3">
										{c.taux.length === 0 ? (
											<span style={{ color: "#D1D5DB" }}>—</span>
										) : c.taux.length > 1 ? (
											<button type="button" onClick={() => setModale({ type: "historique", donnee: c })}
												className="inline-flex items-center gap-1 rounded px-1.5 py-0.5"
												style={{ color: C.review }}>
												<History size={12} />{c.taux.length}
											</button>
										) : (
											<span style={{ color: C.muted }}>1</span>
										)}
									</td>
									<td className="px-4 py-3 text-right">
										<div className="flex items-center justify-end gap-1">
											{!t ? (
												<Bouton variante="succes" icone={Wallet} style={{ padding: "4px 12px", fontSize: 11 }}
													onClick={() => setModale({ type: "taux", donnee: c })}>
													Fixer le taux
												</Bouton>
											) : (
												<Infobulle cote="gauche" texte="Réviser le taux journalier — Direction Financière.">
													<button type="button" onClick={() => setModale({ type: "taux", donnee: c })}
														className="rounded p-1.5" style={{ color: C.success }} aria-label="Réviser le taux">
														<Wallet size={14} />
													</button>
												</Infobulle>
											)}
											<Infobulle cote="gauche" texte="Modifier le libellé ou la catégorie — Direction Technique.">
												<button type="button" onClick={() => setModale({ type: "modifier", donnee: c })}
													className="rounded p-1.5" style={{ color: C.primary }} aria-label="Modifier">
													<Pencil size={14} />
												</button>
											</Infobulle>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</Carte>

			<p className="mt-5 flex items-start gap-2 rounded-lg px-4 py-3 text-xs" style={{ background: C.mutedBg, color: C.muted }}>
				<Info size={13} className="mt-0.5 shrink-0" />
				<span>
					<strong>Trois directions, trois gestes.</strong> La Technique définit le métier,
					la Financière fixe le taux, les RH l'assignent. Le taux alimente ensuite la paie
					chantier — M7 : le pointage donne les jours, la compétence donne le taux.
				</span>
			</p>

			{modale?.type === "creer" && (
				<ModaleCompetence onFermer={() => setModale(null)} notifier={notifier} />
			)}
			{modale?.type === "modifier" && (
				<ModaleCompetence competence={modale.donnee} onFermer={() => setModale(null)} notifier={notifier} />
			)}
			{modale?.type === "taux" && (
				<ModaleTaux competence={modale.donnee} onFermer={() => setModale(null)} notifier={notifier} />
			)}
			{modale?.type === "historique" && (
				<ModaleHistorique competence={modale.donnee} onFermer={() => setModale(null)} />
			)}
		</>
	);
}

/* ================================================================== */
/* VUE — AGENTS ET LEUR COMPÉTENCE                                     */
/* ================================================================== */

function VueAgents({ voitTaux, notifier }) {
	const [q, setQ] = useState("");
	const [filtre, setFiltre] = useState("tous");
	const [modale, setModale] = useState(null);

	const norm = (t) => (t ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

	const listes = {
		tous: AGENTS,
		sans: AGENTS.filter((a) => !a.competenceId),
		chantier: AGENTS.filter((a) => a.chantier),
	};

	const liste = listes[filtre].filter((a) => !q || norm(a.nom).includes(norm(q)));

	return (
		<>
			<header className="mb-6">
				<h1 className="text-2xl font-semibold" style={{ color: C.primary }}>Agents et compétences</h1>
				<p className="mt-1 max-w-3xl text-sm" style={{ color: C.muted }}>
					Chaque agent porte une compétence, qui détermine son taux journalier.
					L'assignation relève de la <strong>Direction RH</strong>.
				</p>
			</header>

			<div className="mb-4 flex flex-wrap items-center gap-3">
				<div className="relative min-w-64 flex-1 md:max-w-sm">
					<Search size={16} className="absolute left-3 top-2.5" style={{ color: C.muted }} />
					<input value={q} onChange={(e) => setQ(e.target.value)}
						placeholder="Rechercher un agent"
						className="w-full rounded-md border py-2 pl-9 pr-3 text-sm outline-none"
						style={{ borderColor: C.border, background: "#fff" }} />
				</div>

				<div className="flex flex-wrap gap-1.5">
					{[
						["tous", `Tous (${AGENTS.length})`],
						["sans", `Sans compétence (${listes.sans.length})`],
						["chantier", `Sur chantier (${listes.chantier.length})`],
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
			</div>

			<Carte className="overflow-hidden p-0">
				<table className="w-full text-xs">
					<thead>
						<tr style={{ background: C.mutedBg }}>
							{["Agent", "Compétence", "Taux journalier", "Depuis", "Chantier", ""].map((h) => (
								<th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wide"
									style={{ fontSize: 10, color: C.muted }}>{h}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{liste.map((a) => {
							const c = a.competenceId ? COMPETENCES.find((x) => x.id === a.competenceId) : null;
							const t = c ? tauxEnVigueur(c) : null;
							const cat = c ? CATEGORIES[c.categorie] : null;

							return (
								<tr key={a.id} className="border-t hover:bg-gray-50"
									style={{ borderColor: "#F3F4F6", background: !c ? C.warningSoft : undefined }}>
									<td className="px-4 py-3 font-medium">{a.nom}</td>
									<td className="px-4 py-3">
										{c ? (
											<div className="flex flex-wrap items-center gap-2">
												<span>{c.libelle}</span>
												<Badge fg={cat.fg} bg={cat.bg}>{cat.l}</Badge>
											</div>
										) : (
											<Infobulle texte="Sans compétence, aucun taux ne s'applique. L'agent ne peut pas être pointé au relevé d'activité.">
												<span style={{ color: C.warning, fontWeight: 600 }}>aucune compétence</span>
											</Infobulle>
										)}
									</td>
									<td className="px-4 py-3">
										{!c ? (
											<span style={{ color: "#D1D5DB" }}>—</span>
										) : voitTaux ? (
											<span className="font-medium" style={{ fontVariantNumeric: "tabular-nums" }}>
												{fcfa(t.montant)}
											</span>
										) : (
											<span className="inline-flex items-center gap-1" style={{ color: C.muted }}>
												<Lock size={11} /> masqué
											</span>
										)}
									</td>
									<td className="px-4 py-3" style={{ color: C.muted }}>{dateFr(a.depuis)}</td>
									<td className="px-4 py-3" style={{ color: C.muted }}>
										{a.chantier ?? <span style={{ color: "#D1D5DB" }}>non affecté</span>}
									</td>
									<td className="px-4 py-3 text-right">
										<Bouton variante="vide" style={{ padding: "4px 12px", fontSize: 11 }}
											onClick={() => setModale(a)}>
											{c ? "Changer" : "Assigner"}
										</Bouton>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</Carte>

			{modale && (
				<ModaleAssigner agent={modale} onFermer={() => setModale(null)} notifier={notifier} />
			)}
		</>
	);
}

/* ================================================================== */
/* APPLICATION                                                         */
/* ================================================================== */

export default function ApercuCompetences() {
	const [vue, setVue] = useState("competences");
	const [voitTaux, setVoitTaux] = useState(true);
	const [toast, setToast] = useState(null);
	const notifier = (m) => { setToast(m); setTimeout(() => setToast(null), 4000); };

	return (
		<div className="min-h-screen" style={{ background: C.bg }}>
			<header className="border-b bg-white px-8 py-3" style={{ borderColor: C.border }}>
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="flex items-center gap-2.5">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: C.primary }}>ITA</div>
						<div>
							<div className="text-sm font-semibold" style={{ color: C.primary }}>ITA Manager</div>
							<div className="text-xs" style={{ color: C.muted }}>M4 · Compétences et taux journaliers</div>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-3">
						<div className="flex gap-1.5">
							{[["competences", "Compétences", HardHat], ["agents", "Agents", Users]].map(([v, l, I]) => (
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

						<button type="button" onClick={() => setVoitTaux(!voitTaux)}
							className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
							style={{ borderColor: C.border, color: C.muted }}>
							<Lock size={12} />
							{voitTaux ? "Masquer les taux" : "Afficher les taux"}
						</button>
					</div>
				</div>
			</header>

			<main className="px-8 py-6">
				{vue === "competences"
					? <VueCompetences voitTaux={voitTaux} notifier={notifier} />
					: <VueAgents voitTaux={voitTaux} notifier={notifier} />}
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
