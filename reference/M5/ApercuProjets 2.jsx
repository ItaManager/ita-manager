import React, { useState, useMemo } from "react";
import {
	Briefcase, Users, Wallet, Flag, TrendingUp, TrendingDown, Search,
	Calendar, MapPin, Building2, Check, X, Info, Lock, AlertTriangle,
	ChevronRight, Plus, Clock, HardHat, Truck, ShoppingCart, FileText,
	CircleAlert, ArrowRight, Download,
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
const fcfa = (n) => n || n === 0 ? new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F" : "—";
const millions = (n) => (n / 1_000_000).toFixed(1).replace(".", ",") + " M";
const pct = (n) => (n > 0 ? "+" : "") + n.toFixed(1).replace(".", ",") + " %";

const joursEntre = (a, b) => {
	const j = (d) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
	return Math.round((j(new Date(b)) - j(new Date(a))) / 86400000);
};

/* ================================================================== */
/* DONNÉES                                                             */
/* ================================================================== */

const PROJETS = [
	{
		id: "p1", code: "CH-2026-004", nom: "Adduction d'eau potable — Bouaké Nord",
		maitreOuvrage: "ONEP — Office National de l'Eau Potable",
		lieu: "Bouaké, région du Gbêkê",
		montantMarche: 485_000_000, avenants: 24_000_000,
		debut: "2026-02-15", finPrevue: "2026-12-20",
		statut: "EN_COURS", cyclePaie: "QUINZAINE",
		conducteurId: "e_bamba",
		avancementPlanifie: 62, avancementConstate: 48,
		budget: {
			mainOeuvre: { prevu: 145_000_000, engage: 78_400_000 },
			materiel: { prevu: 92_000_000, engage: 61_200_000 },
			achats: { prevu: 178_000_000, engage: 124_800_000 },
			sousTraitance: { prevu: 40_000_000, engage: 12_000_000 },
		},
	},
	{
		id: "p2", code: "CH-2026-007", nom: "Voirie et assainissement — Yopougon phase 2",
		maitreOuvrage: "Mairie de Yopougon",
		lieu: "Yopougon, Abidjan",
		montantMarche: 312_000_000, avenants: 0,
		debut: "2026-05-04", finPrevue: "2027-03-30",
		statut: "EN_COURS", cyclePaie: "QUINZAINE",
		conducteurId: "e_koffi",
		avancementPlanifie: 28, avancementConstate: 31,
		budget: {
			mainOeuvre: { prevu: 98_000_000, engage: 29_100_000 },
			materiel: { prevu: 64_000_000, engage: 21_800_000 },
			achats: { prevu: 118_000_000, engage: 38_400_000 },
			sousTraitance: { prevu: 20_000_000, engage: 0 },
		},
	},
	{
		id: "p3", code: "CH-2025-018", nom: "Réhabilitation château d'eau — Agboville",
		maitreOuvrage: "SODECI",
		lieu: "Agboville, région de l'Agnéby-Tiassa",
		montantMarche: 87_000_000, avenants: 6_500_000,
		debut: "2025-09-10", finPrevue: "2026-08-15",
		statut: "EN_COURS", cyclePaie: "MENSUEL",
		conducteurId: "e_bamba",
		avancementPlanifie: 94, avancementConstate: 91,
		budget: {
			mainOeuvre: { prevu: 24_000_000, engage: 22_800_000 },
			materiel: { prevu: 18_000_000, engage: 17_100_000 },
			achats: { prevu: 38_000_000, engage: 36_900_000 },
			sousTraitance: { prevu: 4_000_000, engage: 4_000_000 },
		},
	},
	{
		id: "p4", code: "CH-2026-009", nom: "Forage et pompage — Dabou",
		maitreOuvrage: "Conseil régional des Grands Ponts",
		lieu: "Dabou, région des Grands Ponts",
		montantMarche: 64_000_000, avenants: 0,
		debut: "2026-07-20", finPrevue: "2026-11-30",
		statut: "OUVERT", cyclePaie: "QUINZAINE",
		conducteurId: "e_koffi",
		avancementPlanifie: 4, avancementConstate: 0,
		budget: {
			mainOeuvre: { prevu: 18_000_000, engage: 0 },
			materiel: { prevu: 14_000_000, engage: 1_200_000 },
			achats: { prevu: 26_000_000, engage: 3_400_000 },
			sousTraitance: { prevu: 3_000_000, engage: 0 },
		},
	},
	{
		id: "p5", code: "CH-2025-011", nom: "Extension réseau — Sinfra",
		maitreOuvrage: "ONEP",
		lieu: "Sinfra, région de la Marahoué",
		montantMarche: 156_000_000, avenants: 11_000_000,
		debut: "2025-03-01", finPrevue: "2026-06-30",
		statut: "SUSPENDU", motifSuspension: "Attente de libération d'emprise par le maître d'ouvrage",
		cyclePaie: "QUINZAINE", conducteurId: "e_bamba",
		avancementPlanifie: 100, avancementConstate: 72,
		budget: {
			mainOeuvre: { prevu: 44_000_000, engage: 34_200_000 },
			materiel: { prevu: 32_000_000, engage: 26_800_000 },
			achats: { prevu: 68_000_000, engage: 51_400_000 },
			sousTraitance: { prevu: 12_000_000, engage: 9_000_000 },
		},
	},
];

const EMPLOYES = {
	e_bamba: { nom: "BAMBA Ismaël", poste: "Conducteur de Travaux" },
	e_koffi: { nom: "KOFFI Alain", poste: "Chef Chantier" },
	e_coul: { nom: "COULIBALY Seydou", poste: "Chef d'équipe" },
	e_sango: { nom: "SANGARÉ Ibrahim", poste: "Chef d'équipe" },
	e_yao: { nom: "YAO Serge", poste: "Directeur Technique" },
	e_ngue: { nom: "N'GUESSAN Léa", poste: "Chargée d'études" },
	e_diab: { nom: "DIABATÉ Mamadou", poste: "Conducteur d'engins" },
	e_toure: { nom: "TOURÉ Abdoulaye", poste: "Chauffeur" },
};

const AFFECTATIONS = [
	{ projetId: "p1", employeId: "e_bamba", role: "CONDUCTEUR", debut: "2026-02-15", fin: null },
	{ projetId: "p1", employeId: "e_koffi", role: "CHEF_CHANTIER", debut: "2026-02-15", fin: null },
	{ projetId: "p1", employeId: "e_coul", role: "CHEF_EQUIPE", debut: "2026-02-15", fin: null },
	{ projetId: "p1", employeId: "e_sango", role: "CHEF_EQUIPE", debut: "2026-04-01", fin: null },
	{ projetId: "p1", employeId: "e_diab", role: "OPERATEUR", debut: "2026-03-10", fin: null },
	{ projetId: "p1", employeId: "e_toure", role: "OPERATEUR", debut: "2026-02-20", fin: "2026-06-30" },
	{ projetId: "p1", employeId: "e_ngue", role: "CHARGE_ETUDES", debut: "2026-02-15", fin: null },
];

const EQUIPES = [
	{ projetId: "p1", nom: "Équipe terrassement", chefId: "e_coul", effectif: 14, journaliers: 9 },
	{ projetId: "p1", nom: "Équipe pose canalisation", chefId: "e_sango", effectif: 11, journaliers: 6 },
];

const ROLES_FONCTIONNELS = {
	CONDUCTEUR: { l: "Conducteur de Travaux", fg: C.primary, bg: C.primarySoft },
	CHARGE_ETUDES: { l: "Chargé d'études", fg: C.primary, bg: C.primarySoft },
	CHEF_CHANTIER: { l: "Chef Chantier", fg: C.review, bg: C.reviewSoft },
	CHEF_EQUIPE: { l: "Chef d'équipe", fg: C.success, bg: C.successSoft },
	OPERATEUR: { l: "Opérateur", fg: C.muted, bg: C.mutedBg },
};

const TACHES = [
	{ id: "t1", projetId: "p1", libelle: "Installation de chantier", debut: "2026-02-15", fin: "2026-03-10", planifie: 100, constate: 100 },
	{ id: "t2", projetId: "p1", libelle: "Terrassement — tranchées principales", debut: "2026-03-11", fin: "2026-06-20", planifie: 100, constate: 96 },
	{ id: "t3", projetId: "p1", libelle: "Pose canalisation DN200", debut: "2026-05-02", fin: "2026-09-15", planifie: 68, constate: 42, critique: true },
	{ id: "t4", projetId: "p1", libelle: "Construction château d'eau", debut: "2026-06-01", fin: "2026-10-30", planifie: 42, constate: 28, critique: true },
	{ id: "t5", projetId: "p1", libelle: "Raccordements et branchements", debut: "2026-09-16", fin: "2026-11-30", planifie: 0, constate: 0 },
	{ id: "t6", projetId: "p1", libelle: "Essais et mise en service", debut: "2026-12-01", fin: "2026-12-20", planifie: 0, constate: 0 },
];

const JALONS = [
	{ id: "j1", projetId: "p1", libelle: "Ordre de service", date: "2026-02-15", type: "MAITRE_OUVRAGE", statut: "VALIDE", piece: true },
	{ id: "j2", projetId: "p1", libelle: "Réception des terrassements", date: "2026-06-25", type: "MAITRE_OEUVRE", statut: "VALIDE", piece: true },
	{ id: "j3", projetId: "p1", libelle: "Situation n°3 — 40 %", date: "2026-07-15", type: "MAITRE_OUVRAGE", statut: "VALIDE", piece: true, montant: 194_000_000 },
	{ id: "j4", projetId: "p1", libelle: "Réception pose canalisation", date: "2026-09-20", type: "MAITRE_OEUVRE", statut: "ATTENTE", piece: false },
	{ id: "j5", projetId: "p1", libelle: "Situation n°4 — 70 %", date: "2026-10-15", type: "MAITRE_OUVRAGE", statut: "ATTENTE", piece: false, montant: 145_500_000 },
	{ id: "j6", projetId: "p1", libelle: "Réception provisoire", date: "2026-12-20", type: "MAITRE_OUVRAGE", statut: "ATTENTE", piece: false },
];

const STATUTS = {
	BROUILLON: { l: "Brouillon", fg: C.muted, bg: C.mutedBg },
	OUVERT: { l: "Ouvert", fg: C.primary, bg: C.primarySoft },
	EN_COURS: { l: "En cours", fg: C.success, bg: C.successSoft },
	SUSPENDU: { l: "Suspendu", fg: C.warning, bg: C.warningSoft },
	CLOTURE: { l: "Clôturé", fg: C.muted, bg: C.mutedBg },
};

const POSTES_BUDGET = {
	mainOeuvre: { l: "Main-d'œuvre", icone: HardHat, source: "M7 · Paie chantier" },
	materiel: { l: "Matériel", icone: Truck, source: "M13 · Logistique" },
	achats: { l: "Achats", icone: ShoppingCart, source: "M14 · Achats" },
	sousTraitance: { l: "Sous-traitance", icone: FileText, source: "Saisie directe" },
};

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

const Bouton = ({ variante = "plein", icone: I, children, style, ...p }) => {
	const v = {
		plein: { background: C.primary, color: "#fff", border: `1px solid ${C.primary}` },
		succes: { background: C.success, color: "#fff", border: `1px solid ${C.success}` },
		vide: { background: "#fff", color: C.primary, border: `1px solid ${C.primary}` },
		fantome: { background: "transparent", color: C.muted, border: `1px solid ${C.border}` },
	}[variante];
	return (
		<button type="button" className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
			style={{ ...v, ...style }} {...p}>{I && <I size={16} />}{children}</button>
	);
};

/* Barre d'avancement à deux valeurs — planifié et constaté */
function BarreAvancement({ planifie, constate, hauteur = 8 }) {
	const ecart = constate - planifie;
	const enRetard = ecart < -5;
	return (
		<div>
			<div className="relative rounded-full" style={{ height: hauteur, background: C.mutedBg }}>
				{/* Repère du planifié */}
				<span className="absolute top-0 h-full w-px" style={{ left: `${planifie}%`, background: C.muted, zIndex: 2 }} />
				{/* Constaté */}
				<span className="absolute left-0 top-0 h-full rounded-full"
					style={{ width: `${constate}%`, background: enRetard ? C.warning : C.success }} />
			</div>
		</div>
	);
}

/* ================================================================== */
/* CALCULS                                                             */
/* ================================================================== */

const totalBudget = (b, champ) => Object.values(b).reduce((s, p) => s + p[champ], 0);

const marge = (p) => {
	const engage = totalBudget(p.budget, "engage");
	const revenu = (p.montantMarche + p.avenants) * (p.avancementConstate / 100);
	return revenu - engage;
};

/* ================================================================== */
/* LISTE DES PROJETS                                                   */
/* ================================================================== */

function ListeProjets({ onOuvrir, voitBudget }) {
	const [q, setQ] = useState("");
	const [filtre, setFiltre] = useState("actifs");

	const norm = (t) => (t ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

	const listes = {
		actifs: PROJETS.filter((p) => ["OUVERT", "EN_COURS"].includes(p.statut)),
		retard: PROJETS.filter((p) => p.avancementConstate - p.avancementPlanifie < -5),
		suspendus: PROJETS.filter((p) => p.statut === "SUSPENDU"),
		tous: PROJETS,
	};

	const liste = listes[filtre].filter((p) =>
		!q || norm(`${p.code} ${p.nom} ${p.maitreOuvrage} ${p.lieu}`).includes(norm(q)));

	const montantTotal = PROJETS.filter((p) => p.statut !== "CLOTURE")
		.reduce((s, p) => s + p.montantMarche + p.avenants, 0);
	const engageTotal = PROJETS.filter((p) => p.statut !== "CLOTURE")
		.reduce((s, p) => s + totalBudget(p.budget, "engage"), 0);

	return (
		<>
			<header className="mb-6 flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold" style={{ color: C.primary }}>Chantiers</h1>
					<p className="mt-1 text-sm" style={{ color: C.muted }}>
						{listes.actifs.length} en cours · {listes.retard.length} en retard sur le planning
					</p>
				</div>
				<Bouton icone={Plus}>Nouveau chantier</Bouton>
			</header>

			{/* Indicateurs */}
			<div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{[
					["Chantiers en cours", listes.actifs.length, "hors suspendus et clôturés", false],
					["En retard", listes.retard.length, "écart de plus de 5 points", listes.retard.length > 0],
					["Montant des marchés", voitBudget ? millions(montantTotal) : null, "avenants compris", false],
					["Engagé à ce jour", voitBudget ? millions(engageTotal) : null,
						voitBudget ? `${((engageTotal / montantTotal) * 100).toFixed(0)} % des marchés` : "", false],
				].map(([l, v, s, alerte]) => (
					<Carte key={l} className="p-5">
						<div className="text-xs font-medium uppercase tracking-wide" style={{ color: C.muted }}>{l}</div>
						{v === null ? (
							<div className="mt-2">
								<Infobulle texte="Les montants relèvent des données sensibles. Permission projet:budget requise.">
									<span className="inline-flex items-center gap-1 text-sm" style={{ color: C.muted }}>
										<Lock size={13} /> masqué
									</span>
								</Infobulle>
							</div>
						) : (
							<div className="mt-2 text-2xl font-semibold"
								style={{ color: alerte ? C.warning : C.primary, fontVariantNumeric: "tabular-nums" }}>{v}</div>
						)}
						<div className="mt-1 text-xs" style={{ color: C.muted }}>{s}</div>
					</Carte>
				))}
			</div>

			{/* Filtres */}
			<div className="mb-4 flex flex-wrap items-center gap-3">
				<div className="relative min-w-64 flex-1 md:max-w-sm">
					<Search size={16} className="absolute left-3 top-2.5" style={{ color: C.muted }} />
					<input value={q} onChange={(e) => setQ(e.target.value)}
						placeholder="Code, nom, maître d'ouvrage, lieu"
						className="w-full rounded-md border py-2 pl-9 pr-3 text-sm outline-none"
						style={{ borderColor: C.border, background: "#fff" }} />
				</div>

				<div className="flex flex-wrap gap-1.5">
					{[
						["actifs", `En cours (${listes.actifs.length})`],
						["retard", `En retard (${listes.retard.length})`],
						["suspendus", `Suspendus (${listes.suspendus.length})`],
						["tous", `Tous (${PROJETS.length})`],
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

			{/* Cartes de projet */}
			<div className="space-y-4">
				{liste.map((p) => {
					const st = STATUTS[p.statut];
					const ecart = p.avancementConstate - p.avancementPlanifie;
					const enRetard = ecart < -5;
					const jours = joursEntre(AUJ, new Date(p.finPrevue + "T00:00:00Z"));
					const engage = totalBudget(p.budget, "engage");
					const prevu = totalBudget(p.budget, "prevu");
					const conducteur = EMPLOYES[p.conducteurId];

					return (
						<Carte key={p.id} className="cursor-pointer p-5 transition hover:shadow-md"
							style={enRetard ? { borderLeft: `3px solid ${C.warning}` } : undefined}
							onClick={() => onOuvrir(p.id)}>
							<div className="flex flex-wrap items-start justify-between gap-4">
								<div className="min-w-0 flex-1">
									<div className="flex flex-wrap items-center gap-2">
										<span className="font-mono text-xs" style={{ color: C.muted }}>{p.code}</span>
										<Badge fg={st.fg} bg={st.bg}>{st.l}</Badge>
										{p.avenants > 0 && (
											<Infobulle texte={`Avenant de ${fcfa(p.avenants)} sur le marché initial. Le montant total est réévalué.`}>
												<Badge fg={C.review} bg={C.reviewSoft}>avenant</Badge>
											</Infobulle>
										)}
									</div>

									<h2 className="mt-1 font-semibold" style={{ color: C.primary }}>{p.nom}</h2>

									<div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: C.muted }}>
										<span className="inline-flex items-center gap-1"><Building2 size={12} />{p.maitreOuvrage}</span>
										<span className="inline-flex items-center gap-1"><MapPin size={12} />{p.lieu}</span>
										<span className="inline-flex items-center gap-1"><Users size={12} />{conducteur.nom}</span>
									</div>

									{p.statut === "SUSPENDU" && (
										<p className="mt-2 flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
											style={{ background: C.warningSoft, color: C.warning }}>
											<AlertTriangle size={13} className="mt-0.5 shrink-0" />
											{p.motifSuspension}
										</p>
									)}
								</div>

								{/* Avancement */}
								<div className="w-full shrink-0 md:w-64">
									<div className="flex items-baseline justify-between text-xs">
										<span style={{ color: C.muted }}>Avancement</span>
										<span className="font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
											{p.avancementConstate} %
										</span>
									</div>
									<div className="mt-1.5">
										<BarreAvancement planifie={p.avancementPlanifie} constate={p.avancementConstate} />
									</div>
									<div className="mt-1.5 flex items-center justify-between text-xs">
										<Infobulle texte="Le trait marque l'avancement PLANIFIÉ. La barre est l'avancement CONSTATÉ, déclaré aux relevés d'activité. C'est l'écart entre les deux qui a de la valeur.">
											<span style={{ color: C.muted }}>planifié {p.avancementPlanifie} %</span>
										</Infobulle>
										<span style={{ color: enRetard ? C.warning : ecart > 0 ? C.success : C.muted, fontWeight: 600 }}>
											{enRetard ? `${Math.abs(ecart)} pts de retard` : ecart > 0 ? `${ecart} pts d'avance` : "conforme"}
										</span>
									</div>
								</div>
							</div>

							{/* Ligne du bas */}
							<div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t pt-3" style={{ borderColor: "#F3F4F6" }}>
								<div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs" style={{ color: C.muted }}>
									<span className="inline-flex items-center gap-1">
										<Calendar size={12} />
										{dateFr(p.debut)} → {dateFr(p.finPrevue)}
									</span>
									<span style={{ color: jours < 60 && p.statut === "EN_COURS" ? C.warning : C.muted, fontWeight: jours < 60 ? 600 : 400 }}>
										{jours > 0 ? `${jours} jours restants` : `${-jours} jours de dépassement`}
									</span>
								</div>

								{voitBudget ? (
									<div className="flex items-center gap-4 text-xs">
										<span style={{ color: C.muted }}>
											Marché <strong style={{ color: "#374151", fontVariantNumeric: "tabular-nums" }}>
												{millions(p.montantMarche + p.avenants)}
											</strong>
										</span>
										<span style={{ color: C.muted }}>
											Engagé <strong style={{ color: engage / prevu > 0.9 ? C.warning : "#374151", fontVariantNumeric: "tabular-nums" }}>
												{millions(engage)}
											</strong>
											{" "}({((engage / prevu) * 100).toFixed(0)} % du budget)
										</span>
									</div>
								) : (
									<Infobulle cote="gauche" texte="Les montants relèvent des données sensibles.">
										<span className="inline-flex items-center gap-1 text-xs" style={{ color: C.muted }}>
											<Lock size={11} /> montants masqués
										</span>
									</Infobulle>
								)}
							</div>
						</Carte>
					);
				})}
			</div>

			<p className="mt-5 flex items-start gap-2 rounded-lg px-4 py-3 text-xs" style={{ background: C.mutedBg, color: C.muted }}>
				<Info size={13} className="mt-0.5 shrink-0" />
				<span>
					L'avancement <strong>constaté</strong> vient des relevés d'activité visés. Le
					<strong> planifié</strong> vient du planning. <strong>Les deux coexistent, ils ne
					se remplacent pas</strong> — c'est l'écart qui appelle une décision.
				</span>
			</p>
		</>
	);
}

/* ================================================================== */
/* FICHE PROJET                                                        */
/* ================================================================== */

function FicheProjet({ projetId, onRetour, voitBudget, notifier }) {
	const [onglet, setOnglet] = useState("avancement");
	const p = PROJETS.find((x) => x.id === projetId);
	const st = STATUTS[p.statut];
	const ecart = p.avancementConstate - p.avancementPlanifie;
	const conducteur = EMPLOYES[p.conducteurId];

	const taches = TACHES.filter((t) => t.projetId === p.id);
	const jalons = JALONS.filter((j) => j.projetId === p.id);
	const affectations = AFFECTATIONS.filter((a) => a.projetId === p.id);
	const equipes = EQUIPES.filter((e) => e.projetId === p.id);

	const engage = totalBudget(p.budget, "engage");
	const prevu = totalBudget(p.budget, "prevu");
	const margeProjet = marge(p);

	const ONGLETS = [
		["avancement", "Avancement", TrendingUp],
		["equipes", `Équipes (${affectations.length})`, Users],
		["budget", "Budget", Wallet],
		["jalons", `Jalons (${jalons.filter((j) => j.statut === "ATTENTE").length})`, Flag],
	];

	return (
		<>
			<button type="button" onClick={onRetour}
				className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: C.muted }}>
				<ChevronRight size={15} style={{ transform: "rotate(180deg)" }} /> Retour aux chantiers
			</button>

			{/* En-tête */}
			<Carte className="mb-5 p-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-2">
							<span className="font-mono text-xs" style={{ color: C.muted }}>{p.code}</span>
							<Badge fg={st.fg} bg={st.bg}>{st.l}</Badge>
						</div>
						<h1 className="mt-1 text-2xl font-semibold" style={{ color: C.primary }}>{p.nom}</h1>
						<div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" style={{ color: C.muted }}>
							<span className="inline-flex items-center gap-1.5"><Building2 size={14} />{p.maitreOuvrage}</span>
							<span className="inline-flex items-center gap-1.5"><MapPin size={14} />{p.lieu}</span>
						</div>
					</div>

					<div className="text-right">
						{voitBudget ? (
							<>
								<div className="text-xs font-medium uppercase tracking-wide" style={{ color: C.muted }}>Montant du marché</div>
								<div className="mt-1 text-2xl font-semibold" style={{ color: C.primary, fontVariantNumeric: "tabular-nums" }}>
									{fcfa(p.montantMarche + p.avenants)}
								</div>
								{p.avenants > 0 && (
									<div className="mt-0.5 text-xs" style={{ color: C.review }}>
										dont {fcfa(p.avenants)} d'avenant
									</div>
								)}
							</>
						) : (
							<Infobulle cote="gauche" texte="Permission projet:budget requise.">
								<span className="inline-flex items-center gap-1 text-sm" style={{ color: C.muted }}>
									<Lock size={13} /> montant masqué
								</span>
							</Infobulle>
						)}
					</div>
				</div>

				{/* Bandeau d'avancement */}
				<div className="mt-5 grid gap-5 md:grid-cols-4">
					<div className="md:col-span-2">
						<div className="flex items-baseline justify-between text-xs">
							<span style={{ color: C.muted }}>Avancement</span>
							<span className="text-sm font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
								{p.avancementConstate} % constaté
							</span>
						</div>
						<div className="mt-2">
							<BarreAvancement planifie={p.avancementPlanifie} constate={p.avancementConstate} hauteur={10} />
						</div>
						<div className="mt-2 flex items-center justify-between text-xs">
							<span style={{ color: C.muted }}>planifié {p.avancementPlanifie} %</span>
							<span style={{ color: ecart < -5 ? C.warning : ecart > 0 ? C.success : C.muted, fontWeight: 600 }}>
								{ecart < 0 ? `${Math.abs(ecart)} points de retard` : ecart > 0 ? `${ecart} points d'avance` : "conforme au planning"}
							</span>
						</div>
					</div>

					{[
						["Période", `${dateFr(p.debut)} → ${dateFr(p.finPrevue)}`,
							`${joursEntre(AUJ, new Date(p.finPrevue + "T00:00:00Z"))} jours restants`],
						["Conducteur de Travaux", conducteur.nom,
							"référent fonctionnel — vise les relevés"],
					].map(([l, v, s]) => (
						<div key={l}>
							<div className="text-xs font-medium uppercase tracking-wide" style={{ color: C.muted }}>{l}</div>
							<div className="mt-1.5 text-sm font-medium">{v}</div>
							<div className="mt-0.5 text-xs" style={{ color: C.muted }}>{s}</div>
						</div>
					))}
				</div>
			</Carte>

			{/* Onglets */}
			<div className="mb-5 flex gap-2 border-b" style={{ borderColor: C.border }}>
				{ONGLETS.map(([id, label, I]) => {
					const actif = onglet === id;
					return (
						<button key={id} type="button" onClick={() => setOnglet(id)}
							className="inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium"
							style={{
								borderColor: actif ? C.primary : "transparent",
								color: actif ? C.primary : C.muted,
							}}>
							<I size={15} />{label}
						</button>
					);
				})}
			</div>

			{/* --- Avancement --- */}
			{onglet === "avancement" && (
				<div className="space-y-5">
					<Carte className="overflow-hidden p-0">
						<div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
							<h2 className="font-semibold" style={{ color: C.primary }}>Tâches</h2>
							<Bouton variante="vide" icone={Plus} style={{ padding: "6px 14px", fontSize: 12 }}>Ajouter</Bouton>
						</div>

						<table className="w-full text-xs">
							<thead>
								<tr style={{ background: C.mutedBg }}>
									{["Tâche", "Début", "Fin", "Planifié", "Constaté", "Écart"].map((h) => (
										<th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wide"
											style={{ fontSize: 10, color: C.muted }}>{h}</th>
									))}
								</tr>
							</thead>
							<tbody>
								{taches.map((t) => {
									const e = t.constate - t.planifie;
									const retard = e < -5;
									return (
										<tr key={t.id} className="border-t" style={{ borderColor: "#F3F4F6" }}>
											<td className="px-4 py-3">
												<div className="flex items-center gap-2">
													<span className="font-medium">{t.libelle}</span>
													{t.critique && (
														<Infobulle texte="Tâche du chemin critique. Tout retard décale la fin du chantier.">
															<Badge fg={C.destructive} bg={C.destructiveSoft}>critique</Badge>
														</Infobulle>
													)}
												</div>
											</td>
											<td className="px-4 py-3" style={{ color: C.muted }}>{dateFr(t.debut)}</td>
											<td className="px-4 py-3" style={{ color: C.muted }}>{dateFr(t.fin)}</td>
											<td className="px-4 py-3" style={{ fontVariantNumeric: "tabular-nums" }}>{t.planifie} %</td>
											<td className="px-4 py-3 font-medium" style={{ fontVariantNumeric: "tabular-nums" }}>{t.constate} %</td>
											<td className="px-4 py-3">
												{e === 0 ? (
													<span style={{ color: C.muted }}>conforme</span>
												) : (
													<span style={{ color: retard ? C.warning : e > 0 ? C.success : C.muted, fontWeight: 600 }}>
														{e > 0 ? `+${e}` : e} points
													</span>
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</Carte>

					<Carte className="p-5">
						<h2 className="text-sm font-semibold" style={{ color: C.primary }}>Deux avancements, jamais confondus</h2>
						<div className="mt-3 grid gap-4 md:grid-cols-2">
							<div className="rounded-lg p-4" style={{ background: C.mutedBg }}>
								<div className="text-sm font-medium">Planifié</div>
								<p className="mt-1 text-xs" style={{ color: C.muted }}>
									Ce que le planning prévoit à cette date. Saisi par le Conducteur de
									Travaux ou le Chargé d'études.
								</p>
							</div>
							<div className="rounded-lg p-4" style={{ background: C.successSoft }}>
								<div className="text-sm font-medium" style={{ color: C.success }}>Constaté</div>
								<p className="mt-1 text-xs" style={{ color: C.success }}>
									Déclaré au relevé d'activité par le chef de chantier, puis visé.
									Il ne remplace pas le planifié.
								</p>
							</div>
						</div>
						<p className="mt-3 text-xs" style={{ color: C.muted }}>
							<strong>L'écart est calculé, jamais stocké.</strong> C'est lui qui appelle
							une décision : accélérer, replanifier, ou constater un retard.
						</p>
					</Carte>
				</div>
			)}

			{/* --- Équipes --- */}
			{onglet === "equipes" && (
				<div className="space-y-5">
					<Carte className="p-5" style={{ borderLeft: `3px solid ${C.review}` }}>
						<h2 className="flex items-center gap-2 text-sm font-semibold" style={{ color: C.review }}>
							<Info size={15} /> Chaîne fonctionnelle
						</h2>
						<p className="mt-2 text-sm" style={{ color: C.muted }}>
							Les affectations de chantier portent la chaîne <strong>fonctionnelle</strong> :
							qui vise les relevés d'activité, qui organise le planning.
						</p>
						<p className="mt-2 text-sm" style={{ color: C.muted }}>
							Elles ne portent <strong>pas</strong> la chaîne hiérarchique. Un chef de
							chantier relève du Directeur Technique pour ses congés, et du Conducteur de
							Travaux pour ses relevés. <strong>Le code ne doit jamais confondre les
							deux.</strong>
						</p>
					</Carte>

					{/* Affectations */}
					<Carte className="overflow-hidden p-0">
						<div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
							<h2 className="font-semibold" style={{ color: C.primary }}>Affectations</h2>
							<Bouton variante="vide" icone={Plus} style={{ padding: "6px 14px", fontSize: 12 }}
								onClick={() => notifier("Affecter un employé — le conflit avec un autre chantier sera signalé")}>
								Affecter
							</Bouton>
						</div>

						<table className="w-full text-xs">
							<thead>
								<tr style={{ background: C.mutedBg }}>
									{["Employé", "Poste", "Rôle sur le chantier", "Depuis", "Jusqu'au"].map((h) => (
										<th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wide"
											style={{ fontSize: 10, color: C.muted }}>{h}</th>
									))}
								</tr>
							</thead>
							<tbody>
								{affectations.map((a, i) => {
									const emp = EMPLOYES[a.employeId];
									const r = ROLES_FONCTIONNELS[a.role];
									const close = !!a.fin;
									return (
										<tr key={i} className="border-t" style={{ borderColor: "#F3F4F6", opacity: close ? .55 : 1 }}>
											<td className="px-4 py-3 font-medium">{emp.nom}</td>
											<td className="px-4 py-3" style={{ color: C.muted }}>{emp.poste}</td>
											<td className="px-4 py-3"><Badge fg={r.fg} bg={r.bg}>{r.l}</Badge></td>
											<td className="px-4 py-3" style={{ color: C.muted }}>{dateFr(a.debut)}</td>
											<td className="px-4 py-3" style={{ color: C.muted }}>
												{a.fin ? dateFr(a.fin) : "en cours"}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</Carte>

					{/* Équipes */}
					<Carte className="p-5">
						<h2 className="font-semibold" style={{ color: C.primary }}>Équipes sur site</h2>
						<div className="mt-4 grid gap-4 md:grid-cols-2">
							{equipes.map((e) => {
								const chef = EMPLOYES[e.chefId];
								return (
									<div key={e.nom} className="rounded-lg border p-4" style={{ borderColor: C.border }}>
										<div className="flex items-start justify-between gap-3">
											<div>
												<div className="font-medium">{e.nom}</div>
												<div className="mt-0.5 text-xs" style={{ color: C.muted }}>{chef.nom}</div>
											</div>
											<div className="text-right">
												<div className="text-2xl font-semibold" style={{ color: C.primary, fontVariantNumeric: "tabular-nums" }}>
													{e.effectif}
												</div>
												<div className="text-xs" style={{ color: C.muted }}>agents</div>
											</div>
										</div>
										<div className="mt-3 flex items-center gap-2 text-xs" style={{ color: C.muted }}>
											<Infobulle texte="Les journaliers sont payés à la journée via les relevés d'activité. Ils n'ouvrent aucun compteur de congés — décision A-13.">
												<Badge fg={C.warning} bg={C.warningSoft}>{e.journaliers} journaliers</Badge>
											</Infobulle>
											<span>{e.effectif - e.journaliers} permanents</span>
										</div>
									</div>
								);
							})}
						</div>
					</Carte>
				</div>
			)}

			{/* --- Budget --- */}
			{onglet === "budget" && (
				voitBudget ? (
					<div className="space-y-5">
						{/* Vue d'ensemble */}
						<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
							{[
								["Marché", fcfa(p.montantMarche + p.avenants), "avenants compris", C.primary],
								["Budget prévu", fcfa(prevu), `${((prevu / (p.montantMarche + p.avenants)) * 100).toFixed(0)} % du marché`, C.primary],
								["Engagé à ce jour", fcfa(engage), `${((engage / prevu) * 100).toFixed(0)} % du budget`,
									engage / prevu > 0.9 ? C.warning : C.primary],
								["Marge estimée", fcfa(margeProjet), "revenu constaté moins engagé",
									margeProjet < 0 ? C.destructive : C.success],
							].map(([l, v, s, couleur]) => (
								<Carte key={l} className="p-5">
									<div className="text-xs font-medium uppercase tracking-wide" style={{ color: C.muted }}>{l}</div>
									<div className="mt-2 text-lg font-semibold" style={{ color: couleur, fontVariantNumeric: "tabular-nums" }}>{v}</div>
									<div className="mt-1 text-xs" style={{ color: C.muted }}>{s}</div>
								</Carte>
							))}
						</div>

						{/* Par poste */}
						<Carte className="overflow-hidden p-0">
							<div className="px-5 py-4">
								<h2 className="font-semibold" style={{ color: C.primary }}>Consommation par poste</h2>
								<p className="mt-0.5 text-xs" style={{ color: C.muted }}>
									Les montants engagés viennent des autres modules. Rien n'est saisi deux fois.
								</p>
							</div>

							<table className="w-full text-xs">
								<thead>
									<tr style={{ background: C.mutedBg }}>
										{["Poste", "Source", "Prévu", "Engagé", "Reste", "Consommation"].map((h) => (
											<th key={h} className="px-4 py-3 text-left font-semibold uppercase tracking-wide"
												style={{ fontSize: 10, color: C.muted }}>{h}</th>
										))}
									</tr>
								</thead>
								<tbody>
									{Object.entries(p.budget).map(([cle, val]) => {
										const meta = POSTES_BUDGET[cle];
										const taux = (val.engage / val.prevu) * 100;
										const depasse = taux > 100;
										const proche = taux > 85 && taux <= 100;
										const I = meta.icone;
										return (
											<tr key={cle} className="border-t" style={{ borderColor: "#F3F4F6" }}>
												<td className="px-4 py-3">
													<span className="inline-flex items-center gap-2 font-medium">
														<I size={14} style={{ color: C.muted }} />{meta.l}
													</span>
												</td>
												<td className="px-4 py-3" style={{ color: C.muted }}>{meta.source}</td>
												<td className="px-4 py-3" style={{ fontVariantNumeric: "tabular-nums" }}>{fcfa(val.prevu)}</td>
												<td className="px-4 py-3 font-medium" style={{ fontVariantNumeric: "tabular-nums" }}>{fcfa(val.engage)}</td>
												<td className="px-4 py-3" style={{ fontVariantNumeric: "tabular-nums", color: depasse ? C.destructive : C.muted }}>
													{fcfa(val.prevu - val.engage)}
												</td>
												<td className="px-4 py-3" style={{ width: 200 }}>
													<div className="flex items-center gap-2">
														<div className="relative h-2 flex-1 rounded-full" style={{ background: C.mutedBg }}>
															<span className="absolute left-0 top-0 h-full rounded-full"
																style={{
																	width: `${Math.min(taux, 100)}%`,
																	background: depasse ? C.destructive : proche ? C.warning : C.success,
																}} />
														</div>
														<span className="w-14 text-right" style={{
															fontVariantNumeric: "tabular-nums",
															color: depasse ? C.destructive : proche ? C.warning : C.muted,
															fontWeight: depasse || proche ? 600 : 400,
														}}>
															{taux.toFixed(0)} %
														</span>
													</div>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</Carte>

						{/* Alerte de dérive */}
						{(() => {
							const derive = p.avancementConstate > 0
								? (engage / prevu) * 100 - p.avancementConstate : 0;
							if (derive < 10) return null;
							return (
								<Carte className="p-5" style={{ borderLeft: `3px solid ${C.warning}` }}>
									<h2 className="flex items-center gap-2 text-sm font-semibold" style={{ color: C.warning }}>
										<AlertTriangle size={15} /> Dérive budgétaire
									</h2>
									<p className="mt-2 text-sm" style={{ color: C.muted }}>
										Le budget est consommé à <strong>{((engage / prevu) * 100).toFixed(0)} %</strong>{" "}
										alors que l'avancement constaté n'est que de <strong>{p.avancementConstate} %</strong>.
									</p>
									<p className="mt-2 text-sm" style={{ color: C.muted }}>
										Écart de <strong style={{ color: C.warning }}>{derive.toFixed(0)} points</strong>.
										À ce rythme, le budget sera épuisé avant la fin des travaux.
									</p>
									<p className="mt-3 rounded-lg px-4 py-3 text-xs" style={{ background: C.mutedBg, color: C.muted }}>
										C'est l'indicateur qui compte le plus sur un chantier. Un budget
										consommé plus vite que le travail avancé annonce une perte, et il
										reste du temps pour agir.
									</p>
								</Carte>
							);
						})()}

						<p className="flex items-start gap-2 rounded-lg px-4 py-3 text-xs" style={{ background: C.mutedBg, color: C.muted }}>
							<Info size={13} className="mt-0.5 shrink-0" />
							<span>
								<strong>Aucun montant n'est saisi ici.</strong> La main-d'œuvre vient des
								périodes de paie validées, le matériel des affectations logistiques, les
								achats des bons de commande émis. Le module agrège, il ne double pas la
								saisie.
							</span>
						</p>
					</div>
				) : (
					<Carte className="py-16 text-center">
						<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ background: C.mutedBg }}>
							<Lock size={22} style={{ color: C.muted }} />
						</div>
						<p className="mt-4 text-sm font-medium">Accès restreint</p>
						<p className="mx-auto mt-1 max-w-md text-sm" style={{ color: C.muted }}>
							Le budget d'un chantier relève des données sensibles. Permission
							<code> projet:budget</code> requise.
						</p>
					</Carte>
				)
			)}

			{/* --- Jalons --- */}
			{onglet === "jalons" && (
				<div className="space-y-5">
					<Carte className="overflow-hidden p-0">
						<div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
							<div>
								<h2 className="font-semibold" style={{ color: C.primary }}>Jalons contractuels</h2>
								<p className="mt-0.5 text-xs" style={{ color: C.muted }}>
									Les jalons validés par un tiers exigent une pièce justificative.
								</p>
							</div>
							<Bouton variante="vide" icone={Plus} style={{ padding: "6px 14px", fontSize: 12 }}>Ajouter</Bouton>
						</div>

						<ol className="px-5 pb-5">
							{jalons.map((j, i) => {
								const valide = j.statut === "VALIDE";
								const jours = joursEntre(AUJ, new Date(j.date + "T00:00:00Z"));
								const proche = !valide && jours >= 0 && jours <= 45;
								const depasse = !valide && jours < 0;

								return (
									<li key={j.id} className="relative pl-7">
										{i < jalons.length - 1 && (
											<span className="absolute bottom-0 left-2 top-6 w-px" style={{ background: C.border }} />
										)}
										<span className="absolute left-0 top-3 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white"
											style={{ background: valide ? C.success : depasse ? C.destructive : proche ? C.warning : "#D1D5DB" }}>
											{valide && <Check size={9} color="#fff" />}
										</span>

										<div className="border-b py-3" style={{ borderColor: "#F3F4F6" }}>
											<div className="flex flex-wrap items-start justify-between gap-3">
												<div>
													<div className="flex flex-wrap items-center gap-2">
														<span className="font-medium">{j.libelle}</span>
														<Badge fg={j.type === "MAITRE_OUVRAGE" ? C.primary : C.review}
															bg={j.type === "MAITRE_OUVRAGE" ? C.primarySoft : C.reviewSoft}>
															{j.type === "MAITRE_OUVRAGE" ? "Maître d'ouvrage" : "Maître d'œuvre"}
														</Badge>
														{j.piece && (
															<Infobulle texte="Procès-verbal joint. Un jalon validé par un tiers externe exige une pièce — le validateur n'a pas de compte dans l'application.">
																<Badge fg={C.success} bg={C.successSoft}>PV joint</Badge>
															</Infobulle>
														)}
													</div>
													<div className="mt-1 text-xs" style={{ color: C.muted }}>
														{dateFr(j.date)}
														{!valide && (
															<span style={{ color: depasse ? C.destructive : proche ? C.warning : C.muted, fontWeight: depasse || proche ? 600 : 400 }}>
																{depasse ? ` — dépassé de ${-jours} jours` : ` — dans ${jours} jours`}
															</span>
														)}
													</div>
												</div>

												<div className="text-right">
													{j.montant && voitBudget && (
														<div className="text-sm font-medium" style={{ fontVariantNumeric: "tabular-nums" }}>
															{fcfa(j.montant)}
														</div>
													)}
													{valide ? (
														<Badge fg={C.success} bg={C.successSoft}>validé</Badge>
													) : (
														<Bouton variante="vide" style={{ padding: "4px 12px", fontSize: 12 }}
															onClick={() => notifier(`Validation du jalon — une pièce justificative est requise`)}>
															Valider
														</Bouton>
													)}
												</div>
											</div>
										</div>
									</li>
								);
							})}
						</ol>
					</Carte>

					<Carte className="p-5">
						<h2 className="text-sm font-semibold" style={{ color: C.primary }}>Qui valide, et comment</h2>
						<p className="mt-2 text-sm" style={{ color: C.muted }}>
							Le maître d'ouvrage et le maître d'œuvre n'ont <strong>pas de compte</strong>
							dans l'application. Leur décision est saisie par un agent d'ITA, avec le
							procès-verbal en pièce jointe.
						</p>
						<p className="mt-2 text-sm" style={{ color: C.muted }}>
							Le <strong>saisisseur</strong> et le <strong>validateur externe</strong> sont
							enregistrés séparément. Sans pièce, la validation est refusée.
						</p>
					</Carte>
				</div>
			)}
		</>
	);
}

/* ================================================================== */
/* APPLICATION                                                         */
/* ================================================================== */

export default function ApercuProjets() {
	const [projetOuvert, setProjetOuvert] = useState(null);
	const [voitBudget, setVoitBudget] = useState(true);
	const [toast, setToast] = useState(null);
	const notifier = (m) => { setToast(m); setTimeout(() => setToast(null), 3500); };

	return (
		<div className="min-h-screen" style={{ background: C.bg }}>
			<header className="border-b bg-white px-8 py-3" style={{ borderColor: C.border }}>
				<div className="flex flex-wrap items-center justify-between gap-4">
					<div className="flex items-center gap-2.5">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: C.primary }}>ITA</div>
						<div>
							<div className="text-sm font-semibold" style={{ color: C.primary }}>ITA Manager</div>
							<div className="text-xs" style={{ color: C.muted }}>M5 · Projets et planning</div>
						</div>
					</div>

					<button type="button" onClick={() => setVoitBudget(!voitBudget)}
						className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
						style={{ borderColor: C.border, color: C.muted }}>
						<Lock size={12} />
						{voitBudget ? "Masquer les montants" : "Afficher les montants"}
					</button>
				</div>
			</header>

			<main className="px-8 py-6">
				{projetOuvert
					? <FicheProjet projetId={projetOuvert} onRetour={() => setProjetOuvert(null)}
							voitBudget={voitBudget} notifier={notifier} />
					: <ListeProjets onOuvrir={setProjetOuvert} voitBudget={voitBudget} />}
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
