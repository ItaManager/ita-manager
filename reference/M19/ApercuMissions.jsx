import React, { useState, useMemo } from "react";
import {
	Plane, Plus, Check, X, Info, Lock, AlertTriangle, Clock, FileText,
	Search, Wallet, ChevronRight, ChevronLeft, Paperclip, Users,
	MapPin, CalendarDays, Banknote, TrendingUp, TrendingDown, Ban,
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
const dateFr = (i) => i ? fmt.format(new Date(i.slice(0, 10) + "T00:00:00Z")) : "—";
const fcfa = (n) => n || n === 0 ? new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F" : "—";
const joursEntre = (a, b) => {
	const j = (d) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
	return Math.round((j(new Date(b)) - j(new Date(a))) / 86400000);
};

/* ================================================================== */
/* RÉFÉRENTIELS                                                        */
/* ================================================================== */

const CATEGORIES = {
	TRANSPORT: "Transport",
	HEBERGEMENT: "Hébergement",
	RESTAURATION: "Restauration",
	CARBURANT: "Carburant",
	PEAGE: "Péage",
	COMMUNICATION: "Communication",
	AUTRE: "Autre",
};

const TRANSPORTS = {
	VEHICULE_ITA: "Véhicule ITA",
	TRANSPORT_COMMUN: "Transport en commun",
	VEHICULE_PERSONNEL: "Véhicule personnel",
	AVION: "Avion",
	AUTRE: "Autre",
};

const ETATS = {
	BROUILLON:        { l: "Brouillon", fg: C.muted, bg: C.mutedBg },
	ATTENTE_N1:       { l: "Attente du supérieur", fg: C.warning, bg: C.warningSoft },
	ATTENTE_RH:       { l: "Attente RH", fg: C.warning, bg: C.warningSoft },
	ATTENTE_AVANCE:   { l: "Attente de l'avance", fg: C.warning, bg: C.warningSoft },
	APPROUVEE:        { l: "Approuvée", fg: C.success, bg: C.successSoft },
	EN_COURS:         { l: "En cours", fg: C.primary, bg: C.primarySoft },
	ATTENTE_RAPPORT:  { l: "Rapport attendu", fg: C.destructive, bg: C.destructiveSoft },
	ATTENTE_CONTROLE: { l: "Contrôle en cours", fg: C.review, bg: C.reviewSoft },
	CLOTUREE:         { l: "Clôturée", fg: C.muted, bg: C.mutedBg },
	REFUSEE:          { l: "Refusée", fg: C.destructive, bg: C.destructiveSoft },
	ANNULEE:          { l: "Annulée", fg: C.muted, bg: C.mutedBg },
};

/* ================================================================== */
/* DONNÉES                                                             */
/* ================================================================== */

const MISSIONS = [
	{
		id: "m1", reference: "MIS-2026-0031",
		objet: "Réception provisoire du lot de canalisations",
		destination: "Bouaké, région du Gbêkê",
		transport: "VEHICULE_ITA",
		dateDepart: "2026-07-12", dateRetour: "2026-07-15",
		fraisEstimes: 180_000,
		soumiseLe: "2026-07-05T09:00:00Z",
		viseeN1Le: "2026-07-05T14:20:00Z", viseeN1Par: "YAO Serge",
		valideeRhLe: "2026-07-06T10:00:00Z", valideeRhPar: "TRAORÉ Aïcha",
		avanceVerseeLe: "2026-07-10T11:00:00Z",
		avance: { montant: 180_000, moyen: "ESPECES", emargement: true },
		rapportDeposeLe: null,
	},
	{
		id: "m2", reference: "MIS-2026-0038",
		objet: "Formation sécurité chantier — session régionale",
		destination: "Yamoussoukro",
		transport: "TRANSPORT_COMMUN",
		dateDepart: "2026-07-20", dateRetour: "2026-07-24",
		fraisEstimes: 240_000,
		soumiseLe: "2026-07-10T08:30:00Z",
		viseeN1Le: "2026-07-10T16:00:00Z", viseeN1Par: "YAO Serge",
		valideeRhLe: "2026-07-11T09:15:00Z", valideeRhPar: "TRAORÉ Aïcha",
		avanceVerseeLe: "2026-07-17T14:00:00Z",
		avance: { montant: 240_000, moyen: "WAVE", emargement: true },
		rapportDeposeLe: "2026-07-27T10:00:00Z",
		depenses: [
			{ id: "f1", categorie: "TRANSPORT", libelle: "Car Abidjan-Yamoussoukro aller-retour", montant: 24_000, date: "2026-07-20", piece: true },
			{ id: "f2", categorie: "HEBERGEMENT", libelle: "Hôtel Le Rocher — 4 nuits", montant: 140_000, date: "2026-07-24", piece: true },
			{ id: "f3", categorie: "RESTAURATION", libelle: "Repas, 5 jours", montant: 42_500, date: "2026-07-24", piece: false },
			{ id: "f4", categorie: "COMMUNICATION", libelle: "Recharge téléphonique", montant: 5_000, date: "2026-07-22", piece: false },
			{ id: "f5", categorie: "AUTRE", libelle: "Documentation technique", montant: 18_000, date: "2026-07-23", piece: true },
		],
	},
	{
		id: "m3", reference: "MIS-2026-0042",
		objet: "Négociation avec le fournisseur de granulats",
		destination: "Divo, région du Lôh-Djiboua",
		transport: "VEHICULE_ITA",
		dateDepart: "2026-08-10", dateRetour: "2026-08-12",
		fraisEstimes: 95_000,
		soumiseLe: "2026-08-01T11:00:00Z",
		viseeN1Le: "2026-08-01T17:30:00Z", viseeN1Par: "YAO Serge",
		valideeRhLe: null,
	},
	{
		id: "m4", reference: "MIS-2026-0044",
		objet: "Visite du chantier de Sinfra — reprise des travaux",
		destination: "Sinfra, région de la Marahoué",
		transport: "VEHICULE_ITA",
		dateDepart: "2026-08-18", dateRetour: "2026-08-19",
		fraisEstimes: 0,
		soumiseLe: "2026-08-02T08:00:00Z",
		viseeN1Le: null,
	},
	{
		id: "m5", reference: "MIS-2026-0022",
		objet: "Salon des équipements BTP",
		destination: "Abidjan — Palais des Congrès",
		transport: "VEHICULE_PERSONNEL",
		dateDepart: "2026-06-08", dateRetour: "2026-06-09",
		fraisEstimes: 60_000,
		soumiseLe: "2026-06-01T09:00:00Z",
		viseeN1Le: "2026-06-01T15:00:00Z", viseeN1Par: "YAO Serge",
		valideeRhLe: "2026-06-02T08:30:00Z", valideeRhPar: "TRAORÉ Aïcha",
		avanceVerseeLe: "2026-06-05T10:00:00Z",
		avance: { montant: 60_000, moyen: "ESPECES", emargement: true },
		rapportDeposeLe: "2026-06-11T14:00:00Z",
		clotureeLe: "2026-06-15T09:00:00Z",
		regularisation: { totalAvance: 60_000, totalJustifie: 48_500, solde: -11_500, sens: "RELIQUAT_A_RENDRE", apure: "ESPECES" },
	},
];

/* Contexte que la RH doit voir pour décider */
const CONTEXTE_RH = {
	m3: {
		demandeur: "DIABATÉ Mamadou", poste: "Conducteur d'engins",
		service: "Service Logistique", superieur: "YAO Serge",
		conflits: [],
		historique: { missions: 4, regularisees: 3, retardMoyen: 2 },
		affectation: "Chantier Bouaké Nord — équipe terrassement",
	},
	m6: {
		demandeur: "ASSAMOI Grâce", poste: "Chef de Service QHSE",
		service: "Service QHSE", superieur: "YAO Serge",
		conflits: [{ nature: "CONGE", libelle: "Congé annuel validé du 21/09 au 02/10", chevauche: true }],
		historique: { missions: 7, regularisees: 7, retardMoyen: 1 },
		affectation: "Siège",
	},
	m7: {
		demandeur: "KOFFI Alain", poste: "Chef Chantier",
		service: "Direction Technique", superieur: "YAO Serge",
		conflits: [{ nature: "MISSION", libelle: "Mission MIS-2026-0045 du 24 au 26 août", chevauche: false }],
		historique: { missions: 12, regularisees: 9, retardMoyen: 11 },
		alerteHistorique: "Trois missions régularisées en retard cette année",
		affectation: "Chantier Bouaké Nord",
	},
};

/* Missions supplémentaires, pour les files RH et DFC */
const AUTRES = [
	{
		id: "m6", reference: "MIS-2026-0046",
		objet: "Audit QHSE annuel — préparation de la certification",
		destination: "Abidjan — bureaux du certificateur",
		transport: "VEHICULE_ITA",
		dateDepart: "2026-09-28", dateRetour: "2026-09-30",
		fraisEstimes: 145_000,
		soumiseLe: "2026-08-01T09:30:00Z",
		viseeN1Le: "2026-08-01T15:00:00Z", viseeN1Par: "YAO Serge",
		valideeRhLe: null,
		lignesEstimees: [
			["TRANSPORT", "Carburant aller-retour", 35_000],
			["HEBERGEMENT", "Hôtel, 2 nuits", 90_000],
			["RESTAURATION", "Repas, 3 jours", 20_000],
		],
	},
	{
		id: "m7", reference: "MIS-2026-0047",
		objet: "Réunion de chantier avec le maître d'œuvre",
		destination: "Bouaké, région du Gbêkê",
		transport: "VEHICULE_ITA",
		dateDepart: "2026-08-25", dateRetour: "2026-08-27",
		fraisEstimes: 210_000,
		soumiseLe: "2026-07-31T11:00:00Z",
		viseeN1Le: "2026-07-31T17:45:00Z", viseeN1Par: "YAO Serge",
		valideeRhLe: null,
		lignesEstimees: [
			["HEBERGEMENT", "Hôtel, 2 nuits", 120_000],
			["RESTAURATION", "Repas, 3 jours", 45_000],
			["CARBURANT", "Plein aller-retour", 45_000],
		],
	},
	{
		id: "m8", reference: "MIS-2026-0043",
		objet: "Retrait de pièces détachées chez le concessionnaire",
		destination: "Abidjan — zone industrielle de Yopougon",
		transport: "VEHICULE_ITA",
		dateDepart: "2026-08-06", dateRetour: "2026-08-06",
		fraisEstimes: 38_000,
		soumiseLe: "2026-07-29T08:00:00Z",
		viseeN1Le: "2026-07-29T12:00:00Z", viseeN1Par: "SANOGO Adama",
		valideeRhLe: "2026-07-30T09:00:00Z", valideeRhPar: "TRAORÉ Aïcha",
		avanceVerseeLe: null,
		demandeurNom: "BAKAYOKO Issa",
	},
	{
		id: "m9", reference: "MIS-2026-0048",
		objet: "Mission de recouvrement — situation n°3",
		destination: "Abidjan — siège de l'ONEP",
		transport: "VEHICULE_ITA",
		dateDepart: "2026-08-07", dateRetour: "2026-08-08",
		fraisEstimes: 185_000,
		soumiseLe: "2026-07-30T10:00:00Z",
		viseeN1Le: "2026-07-30T14:00:00Z", viseeN1Par: "KONAN Jules",
		valideeRhLe: "2026-07-31T08:30:00Z", valideeRhPar: "TRAORÉ Aïcha",
		avanceVerseeLe: null,
		demandeurNom: "OUATTARA Marc",
	},
];

/* ================================================================== */
/* CALCUL D'ÉTAT — déduit, jamais stocké                               */
/* ================================================================== */

function etatMission(m, auj = AUJ) {
	if (m.annuleeLe) return "ANNULEE";
	if (m.refuseeLe) return "REFUSEE";
	if (m.clotureeLe) return "CLOTUREE";
	if (m.rapportDeposeLe) return "ATTENTE_CONTROLE";

	const depart = new Date(m.dateDepart + "T00:00:00Z");
	const retour = new Date(m.dateRetour + "T00:00:00Z");

	if (retour < auj && !m.rapportDeposeLe) return "ATTENTE_RAPPORT";
	if (depart <= auj && auj <= retour) return "EN_COURS";

	if (m.avanceVerseeLe) return "APPROUVEE";
	if (m.valideeRhLe) return m.fraisEstimes > 0 ? "ATTENTE_AVANCE" : "APPROUVEE";
	if (m.viseeN1Le) return "ATTENTE_RH";
	if (m.soumiseLe) return "ATTENTE_N1";
	return "BROUILLON";
}

/* La règle qui fait que les rapports arrivent */
const missionBloquante = () =>
	MISSIONS.find((m) => etatMission(m) === "ATTENTE_RAPPORT");

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
					style={{ ...pos, background: "#111827", width: 260, letterSpacing: 0 }}>{texte}</span>
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
		danger: { background: "#fff", color: C.destructive, border: `1px solid ${C.destructive}` },
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
		style={{ borderColor: erreur ? C.destructive : C.border, background: q.disabled ? C.mutedBg : "#fff", ...style }} {...q} />
);

const Zone = ({ erreur, ...q }) => (
	<textarea className="w-full resize-none rounded-md border px-3 py-2 text-sm outline-none"
		style={{ borderColor: erreur ? C.destructive : C.border, background: "#fff" }} {...q} />
);

/* Coquille de modale à étapes — patron 4 bis */
function ModaleEtapes({ titre, sousTitre, etapes, etape, setEtape, largeur = 620, onFermer, pied, children }) {
	return (
		<div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8"
			style={{ background: "rgba(17,17,17,0.45)" }} onClick={onFermer}>
			<Carte className="w-full overflow-hidden p-0" style={{ maxWidth: largeur, maxHeight: "90vh" }}
				onClick={(e) => e.stopPropagation()}>
				<header className="px-7 py-5" style={{ background: C.primarySoft }}>
					<div className="flex items-start justify-between gap-4">
						<div className="min-w-0">
							<h2 className="text-lg font-semibold" style={{ color: C.primary }}>{titre}</h2>
							{sousTitre && <p className="mt-0.5 text-sm" style={{ color: C.muted }}>{sousTitre}</p>}
						</div>
						<button type="button" onClick={onFermer} className="rounded-full bg-white p-2 shadow-sm" aria-label="Fermer">
							<X size={16} />
						</button>
					</div>

					{/* Fil des étapes */}
					<ol className="mt-4 flex items-center gap-2">
						{etapes.map((l, i) => {
							const n = i + 1;
							const passee = n < etape, courante = n === etape;
							return (
								<li key={l} className="flex flex-1 items-center gap-2">
									<button type="button" onClick={() => passee && setEtape(n)}
										className="flex items-center gap-2 text-xs font-medium"
										style={{ color: courante ? C.primary : passee ? C.success : C.muted,
											cursor: passee ? "pointer" : "default" }}>
										<span className="flex h-6 w-6 items-center justify-center rounded-full text-xs"
											style={{
												background: courante ? C.primary : passee ? C.success : "#fff",
												color: courante || passee ? "#fff" : C.muted,
												border: courante || passee ? "none" : `1px solid ${C.border}`,
											}}>
											{passee ? <Check size={12} /> : n}
										</span>
										<span className="hidden sm:inline">{l}</span>
									</button>
									{i < etapes.length - 1 && (
										<span className="h-px flex-1" style={{ background: passee ? C.success : C.border }} />
									)}
								</li>
							);
						})}
					</ol>
				</header>

				<div className="overflow-y-auto px-7 py-6" style={{ maxHeight: "calc(90vh - 230px)" }}>{children}</div>

				<footer className="flex items-center justify-between gap-3 border-t px-7 py-4" style={{ borderColor: "#F3F4F6" }}>
					{pied}
				</footer>
			</Carte>
		</div>
	);
}

/* ================================================================== */
/* MODALE — NOUVELLE DEMANDE                                           */
/* ================================================================== */

function ModaleDemande({ onFermer, notifier }) {
	const [etape, setEtape] = useState(1);
	const [f, setF] = useState({
		objet: "", destination: "", transport: "", dateDepart: "", dateRetour: "",
	});
	const [frais, setFrais] = useState([]);
	const set = (x) => setF((y) => ({ ...y, ...x }));

	const total = frais.reduce((s, l) => s + (Number(l.montant) || 0), 0);
	const jours = f.dateDepart && f.dateRetour ? joursEntre(f.dateDepart, f.dateRetour) + 1 : 0;

	const e1 = f.objet.trim() && f.destination.trim() && f.transport && f.dateDepart && f.dateRetour
		&& f.dateRetour >= f.dateDepart;

	const ajouter = () => setFrais((x) => [...x, { id: Date.now(), categorie: "TRANSPORT", libelle: "", montant: "" }]);
	const modifier = (id, p) => setFrais((x) => x.map((l) => l.id === id ? { ...l, ...p } : l));
	const retirer = (id) => setFrais((x) => x.filter((l) => l.id !== id));

	return (
		<ModaleEtapes titre="Nouvelle demande de mission" sousTitre="DIABATÉ Mamadou · Conducteur d'engins"
			etapes={["La mission", "Les frais", "Récapitulatif"]} etape={etape} setEtape={setEtape}
			onFermer={onFermer}
			pied={<>
				{etape > 1
					? <Bouton variante="fantome" icone={ChevronLeft} onClick={() => setEtape(etape - 1)}>Précédent</Bouton>
					: <Bouton variante="fantome" onClick={onFermer}>Annuler</Bouton>}

				{etape < 3
					? <Bouton icone={ChevronRight} style={etape === 1 && !e1 ? { opacity: .4 } : undefined}
							onClick={() => { if (etape > 1 || e1) setEtape(etape + 1); }}>Suivant</Bouton>
					: <Bouton variante="succes" icone={Check}
							onClick={() => { notifier("Demande soumise — votre supérieur va la viser"); onFermer(); }}>
							Soumettre
						</Bouton>}
			</>}>

			{/* --- Étape 1 --- */}
			{etape === 1 && (
				<div className="space-y-5">
					<Champ label="Objet de la mission" requis>
						<Saisie value={f.objet} onChange={(e) => set({ objet: e.target.value })}
							placeholder="Réception provisoire du lot de canalisations" />
					</Champ>

					<Champ label="Destination" requis>
						<Saisie value={f.destination} onChange={(e) => set({ destination: e.target.value })}
							placeholder="Bouaké, région du Gbêkê" />
					</Champ>

					<Champ label="Moyen de transport" requis>
						<div className="flex flex-wrap gap-1.5">
							{Object.entries(TRANSPORTS).map(([v, l]) => (
								<button key={v} type="button" onClick={() => set({ transport: v })}
									className="rounded-full border px-3 py-1.5 text-xs font-medium"
									style={{
										borderColor: f.transport === v ? C.primary : C.border,
										background: f.transport === v ? C.primarySoft : "#fff",
										color: f.transport === v ? C.primary : C.muted,
									}}>{l}</button>
							))}
						</div>
					</Champ>

					<div className="grid gap-5 md:grid-cols-2">
						<Champ label="Départ" requis>
							<Saisie type="date" value={f.dateDepart} onChange={(e) => set({ dateDepart: e.target.value })} />
						</Champ>
						<Champ label="Retour" requis
							erreur={f.dateRetour && f.dateDepart && f.dateRetour < f.dateDepart
								? "Le retour doit suivre le départ." : undefined}>
							<Saisie type="date" value={f.dateRetour} onChange={(e) => set({ dateRetour: e.target.value })} />
						</Champ>
					</div>

					{jours > 0 && (
						<p className="rounded-lg px-4 py-3 text-sm" style={{ background: C.mutedBg, color: C.muted }}>
							Mission de <strong>{jours} jour{jours > 1 ? "s" : ""}</strong>.
						</p>
					)}
				</div>
			)}

			{/* --- Étape 2 --- */}
			{etape === 2 && (
				<div className="space-y-5">
					<p className="text-sm" style={{ color: C.muted }}>
						Estimez ce que la mission coûtera. Cette estimation dimensionne l'avance —
						<strong> elle ne vous engage pas</strong>. Vous justifierez vos dépenses
						réelles au retour.
					</p>

					{frais.map((l) => (
						<div key={l.id} className="rounded-lg border p-4" style={{ borderColor: C.border }}>
							<div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
								<select value={l.categorie} onChange={(e) => modifier(l.id, { categorie: e.target.value })}
									className="rounded-md border px-3 py-2 text-sm outline-none" style={{ borderColor: C.border }}>
									{Object.entries(CATEGORIES).map(([v, x]) => <option key={v} value={v}>{x}</option>)}
								</select>
								<Saisie value={l.libelle} onChange={(e) => modifier(l.id, { libelle: e.target.value })}
									placeholder="Hôtel, 3 nuits" />
								<div className="flex items-center gap-2">
									<Saisie type="number" value={l.montant} onChange={(e) => modifier(l.id, { montant: e.target.value })}
										placeholder="0" style={{ width: 110, fontVariantNumeric: "tabular-nums" }} />
									<button type="button" onClick={() => retirer(l.id)} className="rounded p-1.5"
										style={{ color: C.destructive }} aria-label="Retirer">
										<X size={15} />
									</button>
								</div>
							</div>
						</div>
					))}

					<Bouton variante="vide" icone={Plus} onClick={ajouter} style={{ width: "100%" }}>
						Ajouter une ligne
					</Bouton>

					<div className="flex items-baseline justify-between rounded-lg px-4 py-3"
						style={{ background: total > 0 ? C.primarySoft : C.mutedBg }}>
						<span className="text-sm" style={{ color: total > 0 ? C.primary : C.muted }}>Total estimé</span>
						<span className="text-lg font-semibold" style={{ color: total > 0 ? C.primary : C.muted, fontVariantNumeric: "tabular-nums" }}>
							{fcfa(total)}
						</span>
					</div>

					{total === 0 && (
						<p className="flex items-start gap-2 rounded-lg px-4 py-3 text-xs" style={{ background: C.mutedBg, color: C.muted }}>
							<Info size={13} className="mt-0.5 shrink-0" />
							Sans frais, la mission ne passera pas par la Direction Financière. Elle
							sera approuvée dès la validation RH.
						</p>
					)}
				</div>
			)}

			{/* --- Étape 3 --- */}
			{etape === 3 && (
				<div className="space-y-5">
					<div className="rounded-lg border p-5" style={{ borderColor: C.border }}>
						<h3 className="text-sm font-semibold" style={{ color: C.primary }}>{f.objet}</h3>
						<div className="mt-2 space-y-1.5 text-sm" style={{ color: C.muted }}>
							<div className="flex items-center gap-2"><MapPin size={13} />{f.destination}</div>
							<div className="flex items-center gap-2"><CalendarDays size={13} />
								{dateFr(f.dateDepart)} → {dateFr(f.dateRetour)} · {jours} jour{jours > 1 ? "s" : ""}
							</div>
							<div className="flex items-center gap-2"><Plane size={13} />{TRANSPORTS[f.transport]}</div>
						</div>

						{total > 0 && (
							<div className="mt-4 flex items-baseline justify-between border-t pt-3" style={{ borderColor: "#F3F4F6" }}>
								<span className="text-sm" style={{ color: C.muted }}>Avance demandée</span>
								<span className="font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>{fcfa(total)}</span>
							</div>
						)}
					</div>

					<div className="rounded-lg p-5" style={{ background: C.primarySoft }}>
						<h3 className="text-sm font-semibold" style={{ color: C.primary }}>Ce qui suit</h3>
						<ol className="mt-3 space-y-2.5">
							{[
								["YAO Serge", "votre supérieur — il vise d'abord"],
								["Direction RH", "valide ou refuse"],
								...(total > 0 ? [["Direction Financière", `verse l'avance de ${fcfa(total)} avant le départ`]] : []),
								["Au retour", "vous déposez votre rapport et vos justificatifs"],
							].map(([qui, quoi], i) => (
								<li key={qui} className="flex items-start gap-3 text-sm">
									<span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
										style={{ background: C.primary }}>{i + 1}</span>
									<span><strong>{qui}</strong> — {quoi}</span>
								</li>
							))}
						</ol>
					</div>
				</div>
			)}
		</ModaleEtapes>
	);
}

/* ================================================================== */
/* MODALE — DÉPÔT DU RAPPORT                                           */
/* ================================================================== */

function ModaleRapport({ mission, onFermer, notifier }) {
	const [etape, setEtape] = useState(1);
	const [r, setR] = useState({ objetRealise: "", resultats: "", personnes: "", difficultes: "", suite: "" });
	const [depenses, setDepenses] = useState([]);

	const avance = mission.avance?.montant ?? 0;
	const total = depenses.reduce((s, l) => s + (Number(l.montant) || 0), 0);
	const solde = total - avance;

	const e1 = r.objetRealise.trim().length >= 30 && r.resultats.trim().length >= 30;

	/* Justificatif obligatoire, sauf restauration sous 5 000 F */
	const sansPiece = depenses.filter((l) =>
		!l.piece && !(l.categorie === "RESTAURATION" && Number(l.montant) <= 5000));
	const e2 = depenses.length > 0 && sansPiece.length === 0;

	const ajouter = () => setDepenses((x) => [...x, {
		id: Date.now(), categorie: "TRANSPORT", libelle: "", montant: "", date: "", piece: false,
	}]);
	const modifier = (id, p) => setDepenses((x) => x.map((l) => l.id === id ? { ...l, ...p } : l));
	const retirer = (id) => setDepenses((x) => x.filter((l) => l.id !== id));

	return (
		<ModaleEtapes titre="Rapport de mission" sousTitre={`${mission.reference} · ${mission.objet}`}
			etapes={["Le rapport", "Les dépenses"]} etape={etape} setEtape={setEtape} largeur={720}
			onFermer={onFermer}
			pied={<>
				{etape > 1
					? <Bouton variante="fantome" icone={ChevronLeft} onClick={() => setEtape(1)}>Précédent</Bouton>
					: <Bouton variante="fantome" onClick={onFermer}>Annuler</Bouton>}

				{etape === 1
					? <Bouton icone={ChevronRight} style={e1 ? undefined : { opacity: .4 }}
							onClick={() => { if (e1) setEtape(2); }}>Suivant</Bouton>
					: <div className="flex items-center gap-3">
							{!e2 && (
								<span className="text-xs" style={{ color: C.destructive }}>
									{!depenses.length ? "Ajoutez vos dépenses" : `${sansPiece.length} justificatif${sansPiece.length > 1 ? "s" : ""} manquant${sansPiece.length > 1 ? "s" : ""}`}
								</span>
							)}
							<Bouton variante="succes" icone={Check} style={e2 ? undefined : { opacity: .4 }}
								onClick={() => { if (e2) { notifier("Rapport déposé — la Direction Financière va contrôler"); onFermer(); } }}>
								Déposer
							</Bouton>
						</div>}
			</>}>

			{/* --- Étape 1 --- */}
			{etape === 1 && (
				<div className="space-y-5">
					<Champ label="Objet réalisé" requis
						aide={r.objetRealise.trim().length < 30
							? `${30 - r.objetRealise.trim().length} caractères manquants.`
							: "Ce qui a été fait, concrètement."}>
						<Zone rows={3} value={r.objetRealise} onChange={(e) => setR({ ...r, objetRealise: e.target.value })}
							placeholder="La réception provisoire a été menée avec le représentant de l'ONEP..." />
					</Champ>

					<Champ label="Résultats" requis
						aide={r.resultats.trim().length < 30
							? `${30 - r.resultats.trim().length} caractères manquants.`
							: "Ce qui en ressort pour ITA."}>
						<Zone rows={3} value={r.resultats} onChange={(e) => setR({ ...r, resultats: e.target.value })}
							placeholder="Le lot est accepté sous réserve de la reprise de trois raccords..." />
					</Champ>

					<Champ label="Personnes rencontrées">
						<Saisie value={r.personnes} onChange={(e) => setR({ ...r, personnes: e.target.value })}
							placeholder="M. KOUASSI Bernard — Chef de projet ONEP" />
					</Champ>

					<div className="grid gap-5 md:grid-cols-2">
						<Champ label="Difficultés">
							<Zone rows={2} value={r.difficultes} onChange={(e) => setR({ ...r, difficultes: e.target.value })}
								placeholder="Facultatif" />
						</Champ>
						<Champ label="Suite à donner">
							<Zone rows={2} value={r.suite} onChange={(e) => setR({ ...r, suite: e.target.value })}
								placeholder="Facultatif" />
						</Champ>
					</div>
				</div>
			)}

			{/* --- Étape 2 --- */}
			{etape === 2 && (
				<div className="space-y-5">
					<p className="text-sm" style={{ color: C.muted }}>
						Déclarez ce que vous avez réellement dépensé. <strong>Chaque ligne exige un
						justificatif</strong>, sauf la restauration en dessous de 5 000 F.
					</p>

					{depenses.map((l) => {
						const besoinPiece = !(l.categorie === "RESTAURATION" && Number(l.montant) <= 5000);
						const manque = besoinPiece && !l.piece;
						return (
							<div key={l.id} className="rounded-lg border p-4"
								style={{ borderColor: manque ? C.warningBorder : C.border, background: manque ? C.warningSoft : "#fff" }}>
								<div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
									<select value={l.categorie} onChange={(e) => modifier(l.id, { categorie: e.target.value })}
										className="rounded-md border px-3 py-2 text-sm outline-none" style={{ borderColor: C.border }}>
										{Object.entries(CATEGORIES).map(([v, x]) => <option key={v} value={v}>{x}</option>)}
									</select>
									<Saisie value={l.libelle} onChange={(e) => modifier(l.id, { libelle: e.target.value })}
										placeholder="Hôtel Le Rocher — 4 nuits" />
									<div className="flex items-center gap-2">
										<Saisie type="number" value={l.montant} onChange={(e) => modifier(l.id, { montant: e.target.value })}
											placeholder="0" style={{ width: 110, fontVariantNumeric: "tabular-nums" }} />
										<button type="button" onClick={() => retirer(l.id)} className="rounded p-1.5"
											style={{ color: C.destructive }} aria-label="Retirer">
											<X size={15} />
										</button>
									</div>
								</div>

								<div className="mt-3 flex flex-wrap items-center gap-3">
									<Saisie type="date" value={l.date} onChange={(e) => modifier(l.id, { date: e.target.value })}
										style={{ width: 160 }} />

									{besoinPiece ? (
										<button type="button" onClick={() => modifier(l.id, { piece: !l.piece })}
											className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
											style={{
												borderColor: l.piece ? C.success : C.destructive,
												background: l.piece ? C.successSoft : "#fff",
												color: l.piece ? C.success : C.destructive,
											}}>
											<Paperclip size={13} />
											{l.piece ? "Justificatif joint" : "Justificatif requis"}
										</button>
									) : (
										<Infobulle texte="La restauration en dessous de 5 000 F peut être déclarée sans reçu.">
											<Badge fg={C.muted} bg={C.mutedBg}>sans reçu — sous le seuil</Badge>
										</Infobulle>
									)}
								</div>
							</div>
						);
					})}

					<Bouton variante="vide" icone={Plus} onClick={ajouter} style={{ width: "100%" }}>
						Ajouter une dépense
					</Bouton>

					{/* Le solde, en direct */}
					<div className="rounded-lg border p-5" style={{ borderColor: C.border }}>
						<div className="space-y-2 text-sm">
							<div className="flex items-baseline justify-between">
								<span style={{ color: C.muted }}>Avance reçue</span>
								<span className="font-medium" style={{ fontVariantNumeric: "tabular-nums" }}>{fcfa(avance)}</span>
							</div>
							<div className="flex items-baseline justify-between">
								<span style={{ color: C.muted }}>Dépenses déclarées</span>
								<span className="font-medium" style={{ fontVariantNumeric: "tabular-nums" }}>{fcfa(total)}</span>
							</div>
						</div>

						<div className="mt-3 flex items-baseline justify-between border-t pt-3" style={{ borderColor: "#F3F4F6" }}>
							{solde === 0 ? (
								<>
									<span className="text-sm font-medium">Équilibré</span>
									<span className="font-semibold" style={{ color: C.muted }}>—</span>
								</>
							) : solde > 0 ? (
								<>
									<span className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: C.success }}>
										<TrendingUp size={15} /> Complément qui vous sera versé
									</span>
									<span className="text-lg font-semibold" style={{ color: C.success, fontVariantNumeric: "tabular-nums" }}>
										{fcfa(solde)}
									</span>
								</>
							) : (
								<>
									<span className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: C.warning }}>
										<TrendingDown size={15} /> Reliquat que vous devrez rendre
									</span>
									<span className="text-lg font-semibold" style={{ color: C.warning, fontVariantNumeric: "tabular-nums" }}>
										{fcfa(-solde)}
									</span>
								</>
							)}
						</div>

						<p className="mt-3 text-xs" style={{ color: C.muted }}>
							Ce solde est indicatif. La Direction Financière contrôle chaque ligne —
							une dépense rejetée augmente le reliquat.
						</p>
					</div>
				</div>
			)}
		</ModaleEtapes>
	);
}

/* ================================================================== */
/* VUE — CONTRÔLE DES DÉPENSES · Direction Financière                  */
/* ================================================================== */

function VueControle({ mission, onRetour, notifier }) {
	const [decisions, setDecisions] = useState({});
	const [motifs, setMotifs] = useState({});
	const [ouvert, setOuvert] = useState(null);

	const avance = mission.avance.montant;
	const depenses = mission.depenses ?? [];

	const trancher = (id, acceptee) => setDecisions((d) => ({ ...d, [id]: acceptee }));

	const enAttente = depenses.filter((d) => decisions[d.id] === undefined);
	const acceptees = depenses.filter((d) => decisions[d.id] === true);
	const rejetees = depenses.filter((d) => decisions[d.id] === false);

	const totalJustifie = acceptees.reduce((s, d) => s + d.montant, 0);
	const solde = totalJustifie - avance;

	const motifsIncomplets = rejetees.filter((d) => (motifs[d.id] ?? "").trim().length < 20);
	const peutCloturer = enAttente.length === 0 && motifsIncomplets.length === 0;

	return (
		<>
			<button type="button" onClick={onRetour}
				className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: C.muted }}>
				<ChevronLeft size={15} /> Retour aux missions
			</button>

			<Carte className="mb-5 p-6">
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<span className="font-mono text-xs" style={{ color: C.muted }}>{mission.reference}</span>
						<h1 className="mt-1 text-xl font-semibold" style={{ color: C.primary }}>{mission.objet}</h1>
						<div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" style={{ color: C.muted }}>
							<span className="inline-flex items-center gap-1.5"><Users size={13} />DIABATÉ Mamadou</span>
							<span className="inline-flex items-center gap-1.5"><MapPin size={13} />{mission.destination}</span>
							<span className="inline-flex items-center gap-1.5"><CalendarDays size={13} />
								{dateFr(mission.dateDepart)} → {dateFr(mission.dateRetour)}
							</span>
						</div>
					</div>

					<div className="text-right">
						<div className="text-xs font-medium uppercase tracking-wide" style={{ color: C.muted }}>Avance versée</div>
						<div className="mt-1 text-xl font-semibold" style={{ color: C.primary, fontVariantNumeric: "tabular-nums" }}>
							{fcfa(avance)}
						</div>
						<div className="mt-0.5 text-xs" style={{ color: C.muted }}>
							{mission.avance.moyen === "WAVE" ? "par Wave" : "en espèces"}
						</div>
					</div>
				</div>
			</Carte>

			{/* Avancement du contrôle */}
			<div className="mb-5 grid gap-4 sm:grid-cols-4">
				{[
					["À trancher", enAttente.length, enAttente.length > 0, C.warning],
					["Acceptées", acceptees.length, false, C.success],
					["Rejetées", rejetees.length, rejetees.length > 0, C.destructive],
					["Justifié", fcfa(totalJustifie), false, C.primary],
				].map(([l, v, alerte, couleur]) => (
					<Carte key={l} className="p-5">
						<div className="text-xs font-medium uppercase tracking-wide" style={{ color: C.muted }}>{l}</div>
						<div className="mt-2 text-xl font-semibold"
							style={{ color: alerte ? couleur : C.primary, fontVariantNumeric: "tabular-nums" }}>{v}</div>
					</Carte>
				))}
			</div>

			{/* Lignes */}
			<Carte className="overflow-hidden p-0">
				<div className="px-5 py-4">
					<h2 className="font-semibold" style={{ color: C.primary }}>Dépenses déclarées</h2>
					<p className="mt-0.5 text-xs" style={{ color: C.muted }}>
						Chaque ligne s'accepte ou se rejette. <strong>Seules les lignes acceptées
						comptent</strong> dans le justifié.
					</p>
				</div>

				<div className="space-y-3 px-5 pb-5">
					{depenses.map((d) => {
						const dec = decisions[d.id];
						const motif = motifs[d.id] ?? "";
						const motifCourt = dec === false && motif.trim().length < 20;

						return (
							<div key={d.id} className="rounded-lg border p-4"
								style={{
									borderColor: dec === true ? C.success : dec === false ? C.destructive : C.border,
									background: dec === true ? C.successSoft : dec === false ? C.destructiveSoft : "#fff",
								}}>
								<div className="flex flex-wrap items-start justify-between gap-4">
									<div className="min-w-0">
										<div className="flex flex-wrap items-center gap-2">
											<Badge fg={C.primary} bg={C.primarySoft}>{CATEGORIES[d.categorie]}</Badge>
											{d.piece ? (
												<button type="button" onClick={() => notifier(`Ouverture du justificatif — ${d.libelle}`)}
													className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: C.primary }}>
													<Paperclip size={12} /> Voir le justificatif
												</button>
											) : (
												<Infobulle texte="Restauration sous 5 000 F — le reçu n'est pas exigé.">
													<Badge fg={C.muted} bg={C.mutedBg}>sans reçu</Badge>
												</Infobulle>
											)}
										</div>
										<div className="mt-1.5 font-medium">{d.libelle}</div>
										<div className="mt-0.5 text-xs" style={{ color: C.muted }}>{dateFr(d.date)}</div>
									</div>

									<div className="flex shrink-0 items-center gap-3">
										<span className="text-sm font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
											{fcfa(d.montant)}
										</span>

										<div className="flex gap-1.5">
											<button type="button" onClick={() => trancher(d.id, false)}
												className="rounded-full border p-2"
												style={{
													borderColor: dec === false ? C.destructive : C.border,
													background: dec === false ? C.destructive : "#fff",
													color: dec === false ? "#fff" : C.destructive,
												}} aria-label="Rejeter">
												<X size={14} />
											</button>
											<button type="button" onClick={() => trancher(d.id, true)}
												className="rounded-full border p-2"
												style={{
													borderColor: dec === true ? C.success : C.border,
													background: dec === true ? C.success : "#fff",
													color: dec === true ? "#fff" : C.success,
												}} aria-label="Accepter">
												<Check size={14} />
											</button>
										</div>
									</div>
								</div>

								{dec === false && (
									<div className="mt-3">
										<Champ label="Motif du rejet" requis
											erreur={motifCourt ? `${20 - motif.trim().length} caractères manquants.` : undefined}
											aide={!motifCourt ? "Le demandeur lira ce motif." : undefined}>
											<Zone rows={2} value={motif} erreur={motifCourt}
												onChange={(e) => setMotifs((m) => ({ ...m, [d.id]: e.target.value }))}
												placeholder="Ex : dépense hors périmètre de la mission, sans lien avec l'objet déclaré." />
										</Champ>
									</div>
								)}
							</div>
						);
					})}
				</div>
			</Carte>

			{/* Régularisation */}
			<Carte className="mt-5 p-6">
				<h2 className="font-semibold" style={{ color: C.primary }}>Régularisation</h2>

				<div className="mt-4 space-y-2 text-sm">
					<div className="flex items-baseline justify-between">
						<span style={{ color: C.muted }}>Avance versée</span>
						<span className="font-medium" style={{ fontVariantNumeric: "tabular-nums" }}>{fcfa(avance)}</span>
					</div>
					<div className="flex items-baseline justify-between">
						<span style={{ color: C.muted }}>
							Total justifié — {acceptees.length} ligne{acceptees.length > 1 ? "s" : ""} acceptée{acceptees.length > 1 ? "s" : ""}
						</span>
						<span className="font-medium" style={{ fontVariantNumeric: "tabular-nums" }}>{fcfa(totalJustifie)}</span>
					</div>
					{rejetees.length > 0 && (
						<div className="flex items-baseline justify-between text-xs" style={{ color: C.destructive }}>
							<span>dont {fcfa(rejetees.reduce((s, d) => s + d.montant, 0))} rejeté{rejetees.length > 1 ? "s" : ""}</span>
							<span>non compté dans le justifié</span>
						</div>
					)}
				</div>

				<div className="mt-4 rounded-lg p-5"
					style={{ background: solde === 0 ? C.mutedBg : solde > 0 ? C.successSoft : C.warningSoft }}>
					<div className="flex flex-wrap items-baseline justify-between gap-3">
						<span className="text-sm font-medium"
							style={{ color: solde === 0 ? C.muted : solde > 0 ? C.success : C.warning }}>
							{solde === 0 ? "Équilibré — clôture directe"
								: solde > 0 ? "Complément dû à l'employé"
								: "Reliquat à rendre par l'employé"}
						</span>
						<span className="text-2xl font-semibold"
							style={{ color: solde === 0 ? C.muted : solde > 0 ? C.success : C.warning, fontVariantNumeric: "tabular-nums" }}>
							{solde === 0 ? "—" : fcfa(Math.abs(solde))}
						</span>
					</div>

					{solde !== 0 && (
						<div className="mt-4">
							<div className="text-xs font-medium" style={{ color: "#374151" }}>Moyen d'apurement</div>
							<div className="mt-2 flex flex-wrap gap-1.5">
								{(solde > 0
									? [["WAVE", "Wave"], ["ESPECES", "Espèces"]]
									: [["ESPECES", "Espèces"], ["RETENUE", "Retenue sur salaire"]]
								).map(([v, l]) => (
									<button key={v} type="button" onClick={() => setOuvert(v)}
										className="rounded-full border px-3 py-1.5 text-xs font-medium"
										style={{
											borderColor: ouvert === v ? C.primary : C.border,
											background: ouvert === v ? C.primarySoft : "#fff",
											color: ouvert === v ? C.primary : C.muted,
										}}>{l}</button>
								))}
							</div>

							{ouvert === "WAVE" && (
								<p className="mt-3 flex items-start gap-2 rounded-lg bg-white px-4 py-3 text-xs" style={{ color: C.review }}>
									<Info size={13} className="mt-0.5 shrink-0" />
									<span>
										Le versement créera une <strong>demande de paiement dans ItaPay</strong>.
										Elle suivra son circuit — autorisation du Directeur Général, fenêtre
										horaire, exécution. M19 ne paie rien lui-même.
									</span>
								</p>
							)}
							{ouvert === "RETENUE" && (
								<p className="mt-3 flex items-start gap-2 rounded-lg bg-white px-4 py-3 text-xs" style={{ color: C.warning }}>
									<AlertTriangle size={13} className="mt-0.5 shrink-0" />
									<span>
										La retenue sur salaire suppose <strong>l'accord écrit de
										l'employé</strong>. À vérifier au regard du droit du travail
										ivoirien — décision H en attente.
									</span>
								</p>
							)}
						</div>
					)}
				</div>

				<div className="mt-5 flex items-center justify-between gap-3">
					{!peutCloturer ? (
						<span className="text-xs" style={{ color: C.muted }}>
							{enAttente.length > 0
								? `${enAttente.length} ligne${enAttente.length > 1 ? "s" : ""} encore à trancher`
								: `${motifsIncomplets.length} motif${motifsIncomplets.length > 1 ? "s" : ""} de rejet à compléter`}
						</span>
					) : <span />}

					<Bouton variante="succes" icone={Check} style={peutCloturer ? undefined : { opacity: .4 }}
						onClick={() => { if (peutCloturer) notifier(`Mission clôturée — ${solde === 0 ? "équilibrée" : solde > 0 ? "complément de " + fcfa(solde) : "reliquat de " + fcfa(-solde)}`); }}>
						Clôturer la mission
					</Bouton>
				</div>
			</Carte>
		</>
	);
}

/* ================================================================== */
/* MODALE — REFUS                                                      */
/* ================================================================== */

function ModaleRefus({ mission, etape, onFermer, notifier }) {
	const [motif, setMotif] = useState("");
	const [touche, setTouche] = useState(false);
	const err = touche && motif.trim().length < 20
		? `${20 - motif.trim().length} caractères manquants.` : null;
	const complet = motif.trim().length >= 20;

	return (
		<div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8"
			style={{ background: "rgba(17,17,17,0.45)" }} onClick={onFermer}>
			<Carte className="w-full overflow-hidden p-0" style={{ maxWidth: 540, maxHeight: "90vh" }}
				onClick={(e) => e.stopPropagation()}>
				<header className="flex items-start justify-between gap-4 px-7 py-5" style={{ background: C.destructiveSoft }}>
					<div>
						<h2 className="text-lg font-semibold" style={{ color: C.destructive }}>Refuser la mission</h2>
						<p className="mt-0.5 text-sm" style={{ color: C.muted }}>{mission.reference}</p>
					</div>
					<button type="button" onClick={onFermer} className="rounded-full bg-white p-2 shadow-sm" aria-label="Fermer">
						<X size={16} />
					</button>
				</header>

				<div className="space-y-5 px-7 py-6">
					<div className="rounded-lg p-4" style={{ background: C.mutedBg }}>
						<div className="text-sm font-medium">{mission.objet}</div>
						<div className="mt-1 text-xs" style={{ color: C.muted }}>
							{mission.destination} · {dateFr(mission.dateDepart)} → {dateFr(mission.dateRetour)}
						</div>
					</div>

					<Champ label="Motif du refus" requis erreur={err}
						aide={!err ? "Le demandeur et son supérieur liront ce motif." : undefined}>
						<Zone rows={4} value={motif} onBlur={() => setTouche(true)}
							onChange={(e) => setMotif(e.target.value)}
							placeholder="Expliquez ce qui a manqué, et ce que le demandeur peut faire." />
					</Champ>

					<p className="flex items-start gap-2 rounded-lg px-4 py-3 text-xs" style={{ background: C.mutedBg, color: C.muted }}>
						<Info size={13} className="mt-0.5 shrink-0" />
						Le refus est enregistré avec l'étape à laquelle il a eu lieu — ici,{" "}
						<strong>{etape === "N1" ? "le visa du supérieur" : "la validation RH"}</strong>.
					</p>
				</div>

				<footer className="flex items-center justify-between gap-3 border-t px-7 py-4" style={{ borderColor: "#F3F4F6" }}>
					<Bouton variante="fantome" onClick={onFermer}>Annuler</Bouton>
					<Bouton variante="danger" icone={X} style={complet ? undefined : { opacity: .4 }}
						onClick={() => { if (complet) { notifier("Mission refusée — le demandeur a été notifié"); onFermer(); } }}>
						Refuser
					</Bouton>
				</footer>
			</Carte>
		</div>
	);
}

/* ================================================================== */
/* MODALE — VERSEMENT DE L'AVANCE · Direction Financière               */
/* ================================================================== */

const PLAFOND_ESPECES = 150_000;

function ModaleVersement({ mission, onFermer, notifier }) {
	const [moyen, setMoyen] = useState("");
	const [montant, setMontant] = useState(String(mission.fraisEstimes));
	const [emargement, setEmargement] = useState(false);

	const m = Number(montant) || 0;
	const especesInterdit = m > PLAFOND_ESPECES;
	const complet = m > 0 && moyen && (moyen === "WAVE" || emargement);

	return (
		<div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8"
			style={{ background: "rgba(17,17,17,0.45)" }} onClick={onFermer}>
			<Carte className="w-full overflow-hidden p-0" style={{ maxWidth: 580, maxHeight: "90vh" }}
				onClick={(e) => e.stopPropagation()}>
				<header className="flex items-start justify-between gap-4 px-7 py-5" style={{ background: C.primarySoft }}>
					<div>
						<h2 className="text-lg font-semibold" style={{ color: C.primary }}>Verser l'avance</h2>
						<p className="mt-0.5 text-sm" style={{ color: C.muted }}>
							{mission.reference} · {mission.demandeurNom}
						</p>
					</div>
					<button type="button" onClick={onFermer} className="rounded-full bg-white p-2 shadow-sm" aria-label="Fermer">
						<X size={16} />
					</button>
				</header>

				<div className="space-y-5 px-7 py-6">
					<div className="rounded-lg p-4" style={{ background: C.mutedBg }}>
						<div className="text-sm font-medium">{mission.objet}</div>
						<div className="mt-1 text-xs" style={{ color: C.muted }}>
							{mission.destination} · départ le {dateFr(mission.dateDepart)}
						</div>
						<div className="mt-2 flex items-baseline justify-between border-t pt-2" style={{ borderColor: C.border }}>
							<span className="text-xs" style={{ color: C.muted }}>Estimé par le demandeur</span>
							<span className="font-medium" style={{ fontVariantNumeric: "tabular-nums" }}>
								{fcfa(mission.fraisEstimes)}
							</span>
						</div>
					</div>

					<Champ label="Montant de l'avance" requis
						aide="Vous pouvez verser moins que l'estimation. Le solde se régularisera au retour.">
						<Saisie type="number" value={montant} onChange={(e) => setMontant(e.target.value)}
							style={{ fontVariantNumeric: "tabular-nums" }} />
					</Champ>

					<Champ label="Moyen de versement" requis>
						<div className="space-y-2">
							{[
								["WAVE", "Wave", "Passe par ItaPay — autorisation du Directeur Général, fenêtre horaire, exécution.", false],
								["ESPECES", "Espèces", `Remise directe contre émargement. Autorisé jusqu'à ${fcfa(PLAFOND_ESPECES)}.`, especesInterdit],
							].map(([v, l, aide, bloque]) => (
								<button key={v} type="button" onClick={() => { if (!bloque) setMoyen(v); }}
									className="flex w-full items-start gap-2.5 rounded-lg border px-4 py-3 text-left"
									style={{
										borderColor: moyen === v ? C.primary : bloque ? C.border : C.border,
										background: moyen === v ? C.primarySoft : bloque ? C.mutedBg : "#fff",
										opacity: bloque ? .55 : 1,
										cursor: bloque ? "not-allowed" : "pointer",
									}}>
									<span className="mt-1 h-3 w-3 shrink-0 rounded-full border-2"
										style={{
											borderColor: moyen === v ? C.primary : C.border,
											background: moyen === v ? C.primary : "transparent",
										}} />
									<span className="text-sm">
										<span className="inline-flex items-center gap-1.5">
											{l}
											{bloque && <Lock size={11} style={{ color: C.destructive }} />}
										</span>
										<span className="mt-0.5 block text-xs" style={{ color: C.muted }}>{aide}</span>
									</span>
								</button>
							))}
						</div>
					</Champ>

					{especesInterdit && (
						<p className="flex items-start gap-2 rounded-lg px-4 py-3 text-sm"
							style={{ background: C.destructiveSoft, color: C.destructive }}>
							<AlertTriangle size={15} className="mt-0.5 shrink-0" />
							<span>
								<strong>Au-delà de {fcfa(PLAFOND_ESPECES)}, Wave est obligatoire.</strong>{" "}
								Une remise en espèces échappe au circuit à quatre yeux — le préparateur
								n'y est pas distinct de l'exécutant.
							</span>
						</p>
					)}

					{moyen === "WAVE" && (
						<p className="flex items-start gap-2 rounded-lg px-4 py-3 text-xs"
							style={{ background: C.reviewSoft, color: C.review }}>
							<Info size={13} className="mt-0.5 shrink-0" />
							<span>
								Une <strong>demande de paiement</strong> sera créée dans ItaPay. Elle
								suivra son circuit complet — autorisation du DG, fenêtre de 8 h à 14 h,
								exécution par vos soins. <strong>M19 ne paie rien lui-même.</strong>
							</span>
						</p>
					)}

					{moyen === "ESPECES" && (
						<label className="flex cursor-pointer items-start gap-2.5 rounded-lg border px-4 py-3"
							style={{ borderColor: emargement ? C.success : C.warningBorder,
								background: emargement ? C.successSoft : C.warningSoft }}>
							<input type="checkbox" checked={emargement} onChange={(e) => setEmargement(e.target.checked)} className="mt-0.5" />
							<span className="text-sm">
								L'employé a émargé
								<span className="mt-0.5 block text-xs" style={{ color: C.muted }}>
									Sans émargement, la mission ne passe pas en « approuvée ».
								</span>
							</span>
						</label>
					)}
				</div>

				<footer className="flex items-center justify-between gap-3 border-t px-7 py-4" style={{ borderColor: "#F3F4F6" }}>
					<Bouton variante="fantome" onClick={onFermer}>Annuler</Bouton>
					<div className="flex items-center gap-3">
						{!complet && (
							<span className="text-xs" style={{ color: C.muted }}>
								{!moyen ? "Choisissez un moyen" : moyen === "ESPECES" && !emargement ? "Émargement requis" : "Montant requis"}
							</span>
						)}
						<Bouton variante="succes" icone={Check} style={complet ? undefined : { opacity: .4 }}
							onClick={() => { if (complet) {
								notifier(moyen === "WAVE"
									? `Demande de paiement créée dans ItaPay — ${fcfa(m)}`
									: `Avance de ${fcfa(m)} remise en espèces`);
								onFermer();
							} }}>
							{moyen === "WAVE" ? "Créer la demande de paiement" : "Enregistrer la remise"}
						</Bouton>
					</div>
				</footer>
			</Carte>
		</div>
	);
}

/* ================================================================== */
/* VUE — À TRAITER · Direction RH                                      */
/* ================================================================== */

function VueRH({ notifier }) {
	const [refus, setRefus] = useState(null);
	const [deplie, setDeplie] = useState(null);

	const aTraiter = [MISSIONS[2], ...AUTRES.slice(0, 2)];

	return (
		<>
			<header className="mb-6">
				<h1 className="text-2xl font-semibold" style={{ color: C.primary }}>Missions à traiter</h1>
				<p className="mt-1 max-w-3xl text-sm" style={{ color: C.muted }}>
					TRAORÉ Aïcha · Directrice Administrative et RH — {aTraiter.length} demandes visées
					par leur supérieur, en attente de votre décision.
				</p>
			</header>

			<div className="space-y-4">
				{aTraiter.map((m) => {
					const ctx = CONTEXTE_RH[m.id];
					const ouvert = deplie === m.id;
					const jours = joursEntre(m.dateDepart, m.dateRetour) + 1;
					const attente = joursEntre(m.viseeN1Le.slice(0, 10), AUJ.toISOString().slice(0, 10));
					const conflitBloquant = ctx?.conflits.some((c) => c.chevauche);

					return (
						<Carte key={m.id} className="p-5"
							style={conflitBloquant ? { borderLeft: `3px solid ${C.warning}` } : undefined}>
							<div className="flex flex-wrap items-start justify-between gap-4">
								<div className="min-w-0">
									<div className="flex flex-wrap items-center gap-2">
										<span className="font-mono text-xs" style={{ color: C.muted }}>{m.reference}</span>
										<Badge fg={C.warning} bg={C.warningSoft}>
											visée il y a {attente} jour{attente > 1 ? "s" : ""}
										</Badge>
									</div>

									<div className="mt-1.5 font-medium">{m.objet}</div>

									<div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: C.muted }}>
										<span className="inline-flex items-center gap-1"><Users size={11} />
											{ctx.demandeur} · {ctx.poste}
										</span>
										<span className="inline-flex items-center gap-1"><MapPin size={11} />{m.destination}</span>
										<span className="inline-flex items-center gap-1"><CalendarDays size={11} />
											{dateFr(m.dateDepart)} → {dateFr(m.dateRetour)} · {jours} j
										</span>
									</div>

									<div className="mt-1.5 text-xs" style={{ color: C.success }}>
										Visée par {m.viseeN1Par} le {dateFr(m.viseeN1Le)}
									</div>
								</div>

								<div className="text-right">
									{m.fraisEstimes > 0 ? (
										<>
											<div className="text-sm font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
												{fcfa(m.fraisEstimes)}
											</div>
											<div className="text-xs" style={{ color: C.muted }}>avance estimée</div>
										</>
									) : (
										<Badge fg={C.muted} bg={C.mutedBg}>sans frais</Badge>
									)}
								</div>
							</div>

							{/* Conflits — ce que la RH seule peut voir */}
							{ctx.conflits.length > 0 && ctx.conflits.map((c, i) => (
								<p key={i} className="mt-3 flex items-start gap-2 rounded-lg px-4 py-2.5 text-xs"
									style={{
										background: c.chevauche ? C.warningSoft : C.mutedBg,
										color: c.chevauche ? C.warning : C.muted,
									}}>
									{c.chevauche
										? <AlertTriangle size={13} className="mt-0.5 shrink-0" />
										: <Info size={13} className="mt-0.5 shrink-0" />}
									<span>
										<strong>{c.chevauche ? "Chevauchement" : "À savoir"}</strong> — {c.libelle}
										{c.chevauche && ". Le demandeur ne peut pas être en mission et en congé en même temps."}
									</span>
								</p>
							))}

							{ctx.alerteHistorique && (
								<p className="mt-3 flex items-start gap-2 rounded-lg px-4 py-2.5 text-xs"
									style={{ background: C.warningSoft, color: C.warning }}>
									<Clock size={13} className="mt-0.5 shrink-0" />
									{ctx.alerteHistorique}
								</p>
							)}

							{/* Contexte replié */}
							{ouvert && (
								<div className="mt-3 space-y-3">
									<div className="grid gap-3 rounded-lg px-4 py-3 sm:grid-cols-4" style={{ background: C.mutedBg }}>
										{[
											["Service", ctx.service],
											["Supérieur", ctx.superieur],
											["Affectation", ctx.affectation],
											["Missions cette année", `${ctx.historique.missions}, dont ${ctx.historique.regularisees} régularisées`],
										].map(([k, v]) => (
											<div key={k}>
												<div className="text-xs" style={{ color: C.muted }}>{k}</div>
												<div className="mt-0.5 text-sm font-medium">{v}</div>
											</div>
										))}
									</div>

									{m.lignesEstimees && (
										<div className="rounded-lg border p-4" style={{ borderColor: C.border }}>
											<div className="text-xs font-medium uppercase tracking-wide" style={{ color: C.muted }}>
												Frais estimés
											</div>
											<div className="mt-2 space-y-1.5">
												{m.lignesEstimees.map(([cat, lib, mt], i) => (
													<div key={i} className="flex items-baseline justify-between text-sm">
														<span style={{ color: C.muted }}>
															<Badge fg={C.primary} bg={C.primarySoft}>{CATEGORIES[cat]}</Badge>
															<span className="ml-2">{lib}</span>
														</span>
														<span style={{ fontVariantNumeric: "tabular-nums" }}>{fcfa(mt)}</span>
													</div>
												))}
											</div>
											<p className="mt-3 text-xs" style={{ color: C.muted }}>
												Estimation indicative. Le demandeur justifiera ses dépenses réelles au
												retour — l'écart n'est pas une faute.
											</p>
										</div>
									)}
								</div>
							)}

							{/* Actions */}
							<div className="mt-4 flex flex-wrap items-center justify-between gap-3">
								<button type="button" onClick={() => setDeplie(ouvert ? null : m.id)}
									className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: C.muted }}>
									<ChevronRight size={13} style={{ transform: ouvert ? "rotate(90deg)" : "none" }} />
									{ouvert ? "Masquer le contexte" : "Voir le contexte"}
								</button>

								<div className="flex flex-wrap items-center gap-2">
									<Bouton variante="danger" icone={X} style={{ padding: "6px 16px", fontSize: 13 }}
										onClick={() => setRefus({ mission: m, etape: "RH" })}>
										Refuser
									</Bouton>
									<Bouton variante="succes" icone={Check} style={{ padding: "6px 16px", fontSize: 13 }}
										onClick={() => notifier(m.fraisEstimes > 0
											? `Mission validée — transmise à la Direction Financière pour l'avance`
											: `Mission validée — approuvée, sans frais`)}>
										Valider
									</Bouton>
								</div>
							</div>
						</Carte>
					);
				})}
			</div>

			<p className="mt-5 flex items-start gap-2 rounded-lg px-4 py-3 text-xs" style={{ background: C.mutedBg, color: C.muted }}>
				<Info size={13} className="mt-0.5 shrink-0" />
				<span>
					Le supérieur a déjà visé — il a jugé que la mission a lieu d'être. <strong>Votre
					décision porte sur ce qu'il ne voit pas</strong> : les congés de la période, les
					autres missions, l'historique de régularisation.
				</span>
			</p>

			{refus && (
				<ModaleRefus {...refus} onFermer={() => setRefus(null)} notifier={notifier} />
			)}
		</>
	);
}

/* ================================================================== */
/* VUE — À PAYER · Direction Financière                                */
/* ================================================================== */

function VueDFC({ notifier }) {
	const [versement, setVersement] = useState(null);
	const aPayer = AUTRES.slice(2);

	const total = aPayer.reduce((s, m) => s + m.fraisEstimes, 0);

	return (
		<>
			<header className="mb-6">
				<h1 className="text-2xl font-semibold" style={{ color: C.primary }}>Avances à verser</h1>
				<p className="mt-1 max-w-3xl text-sm" style={{ color: C.muted }}>
					OUATTARA Marc · Directeur Financier et Comptable — {aPayer.length} missions
					validées, en attente de leur avance.
				</p>
			</header>

			<div className="mb-5 grid gap-4 sm:grid-cols-3">
				{[
					["Avances en attente", aPayer.length, "missions validées", false],
					["Montant total", fcfa(total), "estimé par les demandeurs", false],
					["Départ le plus proche", "6 août", "dans 4 jours", true],
				].map(([l, v, s, alerte]) => (
					<Carte key={l} className="p-5">
						<div className="text-xs font-medium uppercase tracking-wide" style={{ color: C.muted }}>{l}</div>
						<div className="mt-2 text-xl font-semibold"
							style={{ color: alerte ? C.warning : C.primary, fontVariantNumeric: "tabular-nums" }}>{v}</div>
						<div className="mt-1 text-xs" style={{ color: C.muted }}>{s}</div>
					</Carte>
				))}
			</div>

			<div className="space-y-4">
				{aPayer.map((m) => {
					const joursAvantDepart = joursEntre(AUJ.toISOString().slice(0, 10), m.dateDepart);
					const urgent = joursAvantDepart <= 5;
					const especesPossible = m.fraisEstimes <= PLAFOND_ESPECES;

					return (
						<Carte key={m.id} className="p-5"
							style={urgent ? { borderLeft: `3px solid ${C.warning}` } : undefined}>
							<div className="flex flex-wrap items-start justify-between gap-4">
								<div className="min-w-0">
									<div className="flex flex-wrap items-center gap-2">
										<span className="font-mono text-xs" style={{ color: C.muted }}>{m.reference}</span>
										<Badge fg={urgent ? C.warning : C.muted} bg={urgent ? C.warningSoft : C.mutedBg}>
											départ dans {joursAvantDepart} jour{joursAvantDepart > 1 ? "s" : ""}
										</Badge>
									</div>

									<div className="mt-1.5 font-medium">{m.objet}</div>

									<div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: C.muted }}>
										<span className="inline-flex items-center gap-1"><Users size={11} />{m.demandeurNom}</span>
										<span className="inline-flex items-center gap-1"><MapPin size={11} />{m.destination}</span>
										<span className="inline-flex items-center gap-1"><CalendarDays size={11} />
											{dateFr(m.dateDepart)} → {dateFr(m.dateRetour)}
										</span>
									</div>

									<div className="mt-1.5 text-xs" style={{ color: C.success }}>
										Validée par {m.valideeRhPar} le {dateFr(m.valideeRhLe)}
									</div>
								</div>

								<div className="flex shrink-0 flex-col items-end gap-2">
									<div className="text-right">
										<div className="text-lg font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
											{fcfa(m.fraisEstimes)}
										</div>
										<div className="text-xs" style={{ color: C.muted }}>
											{especesPossible
												? "espèces ou Wave"
												: <span style={{ color: C.warning }}>Wave obligatoire</span>}
										</div>
									</div>

									<Bouton variante="succes" icone={Wallet} style={{ padding: "6px 16px", fontSize: 13 }}
										onClick={() => setVersement(m)}>
										Verser l'avance
									</Bouton>
								</div>
							</div>

							{!especesPossible && (
								<p className="mt-3 flex items-start gap-2 rounded-lg px-4 py-2.5 text-xs"
									style={{ background: C.warningSoft, color: C.warning }}>
									<Lock size={13} className="mt-0.5 shrink-0" />
									Au-delà de {fcfa(PLAFOND_ESPECES)}, le versement passe par Wave — donc par
									ItaPay, avec l'autorisation du Directeur Général.
								</p>
							)}
						</Carte>
					);
				})}
			</div>

			<p className="mt-5 flex items-start gap-2 rounded-lg px-4 py-3 text-xs" style={{ background: C.mutedBg, color: C.muted }}>
				<Info size={13} className="mt-0.5 shrink-0" />
				<span>
					<strong>M19 ne paie rien lui-même.</strong> Un versement Wave crée une demande de
					paiement dans ItaPay, qui suit son propre circuit. Une remise en espèces
					s'enregistre ici, contre émargement.
				</span>
			</p>

			{versement && (
				<ModaleVersement mission={versement} onFermer={() => setVersement(null)} notifier={notifier} />
			)}
		</>
	);
}

/* ================================================================== */
/* VUE — MES MISSIONS                                                  */
/* ================================================================== */

function MesMissions({ onControler, notifier }) {
	const [modale, setModale] = useState(null);
	const bloquante = missionBloquante();

	return (
		<>
			<header className="mb-6 flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold" style={{ color: C.primary }}>Mes missions</h1>
					<p className="mt-1 text-sm" style={{ color: C.muted }}>
						DIABATÉ Mamadou · Conducteur d'engins
					</p>
				</div>

				<Infobulle cote="gauche"
					texte={bloquante ? `La mission ${bloquante.reference} attend encore son rapport.` : undefined}>
					<Bouton icone={Plus} style={bloquante ? { opacity: .4 } : undefined}
						onClick={() => { if (!bloquante) setModale({ type: "demande" }); }}>
						Nouvelle mission
					</Bouton>
				</Infobulle>
			</header>

			{/* Le blocage */}
			{bloquante && (
				<div className="mb-5 flex items-start gap-3 rounded-lg border px-5 py-4"
					style={{ borderColor: C.destructive, background: C.destructiveSoft }}>
					<Ban size={18} className="mt-0.5 shrink-0" style={{ color: C.destructive }} />
					<div className="min-w-0 flex-1">
						<div className="font-medium" style={{ color: C.destructive }}>
							Vous ne pouvez pas demander de nouvelle mission
						</div>
						<p className="mt-1 text-sm" style={{ color: C.destructive }}>
							Votre mission <strong>{bloquante.reference}</strong> du{" "}
							{dateFr(bloquante.dateDepart)} au {dateFr(bloquante.dateRetour)} attend
							encore son rapport — {joursEntre(bloquante.dateRetour, AUJ)} jours de
							retard.
						</p>
						<p className="mt-1.5 text-xs" style={{ color: C.destructive }}>
							Une avance de {fcfa(bloquante.avance.montant)} vous a été versée. Elle
							reste due tant que la mission n'est pas régularisée.
						</p>
						<div className="mt-3">
							<Bouton variante="danger" icone={FileText} style={{ padding: "6px 16px", fontSize: 13 }}
								onClick={() => setModale({ type: "rapport", donnee: bloquante })}>
								Déposer le rapport
							</Bouton>
						</div>
					</div>
				</div>
			)}

			{/* Liste */}
			<div className="space-y-3">
				{MISSIONS.map((m) => {
					const etat = etatMission(m);
					const e = ETATS[etat];
					const jours = joursEntre(m.dateDepart, m.dateRetour) + 1;

					return (
						<Carte key={m.id} className="p-5">
							<div className="flex flex-wrap items-start justify-between gap-4">
								<div className="min-w-0">
									<div className="flex flex-wrap items-center gap-2">
										<span className="font-mono text-xs" style={{ color: C.muted }}>{m.reference}</span>
										<Badge fg={e.fg} bg={e.bg}>{e.l}</Badge>
									</div>

									<div className="mt-1.5 font-medium">{m.objet}</div>

									<div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: C.muted }}>
										<span className="inline-flex items-center gap-1"><MapPin size={11} />{m.destination}</span>
										<span className="inline-flex items-center gap-1"><CalendarDays size={11} />
											{dateFr(m.dateDepart)} → {dateFr(m.dateRetour)} · {jours} j
										</span>
										<span className="inline-flex items-center gap-1"><Plane size={11} />{TRANSPORTS[m.transport]}</span>
									</div>

									{/* Où en est la mission */}
									{etat === "ATTENTE_N1" && (
										<div className="mt-2 text-xs" style={{ color: C.warning }}>
											En attente du visa de YAO Serge, votre supérieur
										</div>
									)}
									{etat === "ATTENTE_RH" && (
										<div className="mt-2 text-xs" style={{ color: C.warning }}>
											Visée par {m.viseeN1Par} le {dateFr(m.viseeN1Le)} — en attente de la Direction RH
										</div>
									)}
									{etat === "ATTENTE_CONTROLE" && (
										<div className="mt-2 text-xs" style={{ color: C.review }}>
											Rapport déposé le {dateFr(m.rapportDeposeLe)} — la Direction Financière contrôle
										</div>
									)}
									{etat === "CLOTUREE" && m.regularisation && (
										<div className="mt-2 text-xs" style={{ color: C.muted }}>
											Clôturée le {dateFr(m.clotureeLe)} ·{" "}
											{m.regularisation.sens === "RELIQUAT_A_RENDRE"
												? `reliquat de ${fcfa(-m.regularisation.solde)} rendu en espèces`
												: m.regularisation.sens === "COMPLEMENT_DU"
													? `complément de ${fcfa(m.regularisation.solde)} versé`
													: "équilibrée"}
										</div>
									)}
								</div>

								<div className="flex shrink-0 flex-col items-end gap-2">
									{m.fraisEstimes > 0 ? (
										<div className="text-right">
											<div className="text-sm font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
												{fcfa(m.avance?.montant ?? m.fraisEstimes)}
											</div>
											<div className="text-xs" style={{ color: C.muted }}>
												{m.avanceVerseeLe
													? (m.avance.moyen === "WAVE" ? "versé par Wave" : "versé en espèces")
													: "estimé"}
											</div>
										</div>
									) : (
										<Badge fg={C.muted} bg={C.mutedBg}>sans frais</Badge>
									)}

									{etat === "ATTENTE_RAPPORT" && (
										<Bouton variante="danger" icone={FileText} style={{ padding: "6px 14px", fontSize: 12 }}
											onClick={() => setModale({ type: "rapport", donnee: m })}>
											Déposer le rapport
										</Bouton>
									)}
									{etat === "ATTENTE_CONTROLE" && (
										<Bouton variante="vide" style={{ padding: "6px 14px", fontSize: 12 }}
											onClick={() => onControler(m)}>
											Voir le contrôle
										</Bouton>
									)}
								</div>
							</div>
						</Carte>
					);
				})}
			</div>

			<p className="mt-5 flex items-start gap-2 rounded-lg px-4 py-3 text-xs" style={{ background: C.mutedBg, color: C.muted }}>
				<Info size={13} className="mt-0.5 shrink-0" />
				<span>
					<strong>Les frais sont avancés, pas remboursés.</strong> La Direction Financière
					verse avant le départ ; vous justifiez au retour. Tant qu'une mission n'est pas
					régularisée, vous ne pouvez pas en demander une nouvelle.
				</span>
			</p>

			{modale?.type === "demande" && (
				<ModaleDemande onFermer={() => setModale(null)} notifier={notifier} />
			)}
			{modale?.type === "rapport" && (
				<ModaleRapport mission={modale.donnee} onFermer={() => setModale(null)} notifier={notifier} />
			)}
		</>
	);
}

/* ================================================================== */
/* APPLICATION                                                         */
/* ================================================================== */

const ROLES = [
	["EMPLOYE", "Employé", Users],
	["RH", "Direction RH", FileText],
	["DFC", "Direction Financière", Wallet],
];

export default function ApercuMissions() {
	const [role, setRole] = useState("RH");
	const [controle, setControle] = useState(null);
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
							<div className="text-xs" style={{ color: C.muted }}>M19 · Missions et frais de mission</div>
						</div>
					</div>

					<div className="flex flex-wrap items-center gap-3">
						<span className="text-xs" style={{ color: C.muted }}>Se voir comme</span>
						<div className="flex flex-wrap gap-1.5">
							{ROLES.map(([v, l, I]) => (
								<button key={v} type="button" onClick={() => { setRole(v); setControle(null); }}
									className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
									style={{
										borderColor: role === v ? C.primary : C.border,
										background: role === v ? C.primarySoft : "#fff",
										color: role === v ? C.primary : C.muted,
									}}>
									<I size={13} />{l}
								</button>
							))}
						</div>
					</div>
				</div>
			</header>

			<main className="px-8 py-6">
				{role === "RH" && <VueRH notifier={notifier} />}
				{role === "DFC" && <VueDFC notifier={notifier} />}
				{role === "EMPLOYE" && (controle
					? <VueControle mission={controle} onRetour={() => setControle(null)} notifier={notifier} />
					: <MesMissions onControler={setControle} notifier={notifier} />)}
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
