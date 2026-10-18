import React, { useState, useMemo } from "react";
import {
	ShoppingCart, Plus, Search, Check, X, Clock, Truck, FileText, Send,
	AlertTriangle, Package, Loader2, ChevronRight, Trash2, Upload, Eye,
	Building2, Zap, ShieldCheck, Ban, TableProperties, Filter, ArrowLeft,
	CircleAlert, Users, Wallet, Info,
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

const fcfa = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F";
const dateFr = (i) => i ? new Date(i + "T00:00:00").toLocaleDateString("fr-FR") : "—";
const AUJ = "2026-07-28";

/* ================================================================== */
/* RÔLES                                                               */
/* ================================================================== */

const ROLES = {
	CC: { code: "CC", libelle: "Chef Chantier", nom: "Alain Koffi", ini: "AK" },
	DT: { code: "DT", libelle: "Directeur Technique", nom: "Serge Yao", ini: "SY" },
	ACHATS: { code: "ACHATS", libelle: "Chef de Service Achats", nom: "Fatou Cissé", ini: "FC" },
	DRH: { code: "DRH", libelle: "Directeur Administratif et RH", nom: "Aïcha Traoré", ini: "AT" },
	DFC: { code: "DFC", libelle: "Directeur Financier", nom: "Marc Ouattara", ini: "MO" },
	DG: { code: "DG", libelle: "Directeur Général", nom: "Dr Jules Konan", ini: "JK" },
	LOG: { code: "LOG", libelle: "Gestionnaire de stocks", nom: "Ibrahim Doumbia", ini: "ID" },
};

/* ================================================================== */
/* PARAMÈTRES — modifiables dans l'aperçu                              */
/* ================================================================== */

const PARAMS_INIT = { seuilComite: 500_000, plafondUrgence: 2_000_000, tva: 18 };

/* ================================================================== */
/* RÉFÉRENTIELS                                                        */
/* ================================================================== */

const ARTICLES = [
	{ id: "a1", designation: "Ciment CPA 45 — sac 50 kg", unite: "sac" },
	{ id: "a2", designation: "Fer à béton HA12 — barre 12 m", unite: "barre" },
	{ id: "a3", designation: "Gravier concassé 5/15", unite: "m³" },
	{ id: "a4", designation: "Sable de rivière", unite: "m³" },
	{ id: "a5", designation: "Tuyau PVC DN200", unite: "ml" },
	{ id: "a6", designation: "Gasoil", unite: "litre" },
	{ id: "a7", designation: "Casque de chantier", unite: "unité" },
	{ id: "a8", designation: "Gants de manutention", unite: "paire" },
];

const FOURNISSEURS = [
	{ id: "f1", nom: "SOCIMAT CI", specialites: ["a1", "a2"] },
	{ id: "f2", nom: "Carrières du Sud", specialites: ["a3", "a4"] },
	{ id: "f3", nom: "PVC Plus Abidjan", specialites: ["a5"] },
	{ id: "f4", nom: "Total Énergies CI", specialites: ["a6"] },
	{ id: "f5", nom: "Équipements Pro BTP", specialites: ["a7", "a8"] },
	{ id: "f6", nom: "Général Négoce", specialites: ["a1", "a3", "a7", "a8"] },
];

/* Bordereau de prix — plusieurs prix par article selon le fournisseur */
const PRIX = {
	"a1-f1": 5_800, "a1-f6": 6_100,
	"a2-f1": 9_400,
	"a3-f2": 14_500, "a3-f6": 15_200,
	"a4-f2": 11_000,
	"a5-f3": 8_900,
	"a6-f4": 755,
	"a7-f5": 4_500, "a7-f6": 4_900,
	"a8-f5": 1_800, "a8-f6": 2_100,
};

const LIEUX = [
	{ id: "l1", libelle: "Magasin du siège", type: "MAGASIN" },
	{ id: "l2", libelle: "Garage", type: "GARAGE" },
	{ id: "l3", libelle: "Chantier Bouaké Nord — base vie", type: "CHANTIER" },
	{ id: "l4", libelle: "Chantier Yopougon — Sicogi", type: "CHANTIER" },
];

const DESTINATIONS = [
	{ id: "d1", libelle: "Chantier Bouaké Nord", type: "CHANTIER" },
	{ id: "d2", libelle: "Chantier Yopougon phase 2", type: "CHANTIER" },
	{ id: "d3", libelle: "Service Logistique", type: "SERVICE" },
	{ id: "d4", libelle: "Service QHSE", type: "SERVICE" },
];

/* ================================================================== */
/* STATUTS                                                             */
/* ================================================================== */

const STATUTS = {
	ATTENTE_N1: { label: "Attente supérieur", fg: C.warning, bg: C.warningSoft, etape: 1 },
	ATTENTE_ACHATS: { label: "À instruire — Achats", fg: C.primary, bg: C.primarySoft, etape: 2 },
	ATTENTE_COMITE: { label: "Attente comité", fg: C.review, bg: C.reviewSoft, etape: 3 },
	BC_EMIS: { label: "Bon de commande émis", fg: C.primary, bg: C.primarySoft, etape: 4 },
	PARTIELLE: { label: "Partiellement livrée", fg: C.warning, bg: C.warningSoft, etape: 5 },
	SOLDEE: { label: "Soldée", fg: C.success, bg: C.successSoft, etape: 6 },
	REFUSEE: { label: "Refusée", fg: C.destructive, bg: C.destructiveSoft, etape: 0 },
};

const ETAPES = ["Demande", "Supérieur", "Instruction", "Comité", "Commande", "Réception"];

/* ================================================================== */
/* DONNÉES DE DÉMONSTRATION                                            */
/* ================================================================== */

const DEMANDES_INIT = [
	{
		id: "D1", ref: "DA-2026-047", type: "INITIALE",
		demandeur: "CC", beneficiaire: "Alain Koffi", pourAutrui: false,
		destinationId: "d1", lieuId: "l3",
		description: "Reprise du radier du réservoir. Le coulage est prévu la semaine du 10 août, le stock actuel ne couvre que deux jours.",
		dateBesoin: "2026-08-08", dateSoumission: "2026-07-24",
		urgent: false,
		lignes: [
			{ id: "L1", articleId: "a1", designation: "Ciment CPA 45 — sac 50 kg", unite: "sac", quantite: 120, fournisseurId: "f1", prix: 5800, recu: 120, statutReception: "CONFORME" },
			{ id: "L2", articleId: "a3", designation: "Gravier concassé 5/15", unite: "m³", quantite: 40, fournisseurId: "f2", prix: 14500, recu: 32, statutReception: "PARTIELLE" },
		],
		statut: "PARTIELLE",
		validationN1: { par: "Serge Yao", le: "2026-07-25", avis: "OK" },
		comite: [
			{ role: "DT", nom: "Serge Yao", etat: "VALIDE", le: "2026-07-26" },
			{ role: "DRH", nom: "Aïcha Traoré", etat: "VALIDE", le: "2026-07-26" },
			{ role: "DFC", nom: "Marc Ouattara", etat: "VALIDE", le: "2026-07-26" },
			{ role: "DG", nom: "Dr Jules Konan", etat: "VALIDE", le: "2026-07-26" },
		],
		evenements: [
			{ date: "2026-07-24", action: "Demande soumise", auteur: "Alain Koffi" },
			{ date: "2026-07-25", action: "Validée par le supérieur hiérarchique", auteur: "Serge Yao" },
			{ date: "2026-07-25", action: "Instruite — fournisseurs assignés", auteur: "Fatou Cissé" },
			{ date: "2026-07-25", action: "Transmise au comité", auteur: "Fatou Cissé" },
			{ date: "2026-07-26", action: "Comité complet — validée", auteur: "système" },
			{ date: "2026-07-26", action: "Bons de commande émis", auteur: "Fatou Cissé" },
			{ date: "2026-07-27", action: "Réception conforme — 120 sacs de ciment", auteur: "Ibrahim Doumbia" },
			{ date: "2026-07-27", action: "Réception partielle — 32 m³ sur 40 de gravier", auteur: "Ibrahim Doumbia" },
		],
	},
	{
		id: "D2", ref: "DA-2026-051", type: "INITIALE",
		demandeur: "CC", beneficiaire: "Konan Adjoua", pourAutrui: true,
		destinationId: "d4", lieuId: "l1",
		description: "Renouvellement des équipements de protection. Douze casques présentent des fissures au contrôle QHSE du 20 juillet.",
		dateBesoin: "2026-08-15", dateSoumission: "2026-07-27",
		urgent: false,
		lignes: [
			{ id: "L3", articleId: "a7", designation: "Casque de chantier", unite: "unité", quantite: 25, fournisseurId: null, prix: null, recu: 0, statutReception: null },
			{ id: "L4", articleId: "a8", designation: "Gants de manutention", unite: "paire", quantite: 60, fournisseurId: null, prix: null, recu: 0, statutReception: null },
		],
		statut: "ATTENTE_ACHATS",
		validationN1: { par: "Serge Yao", le: "2026-07-27", avis: "Conforme au constat QHSE." },
		comite: [],
		evenements: [
			{ date: "2026-07-27", action: "Demande soumise pour Konan Adjoua", auteur: "Alain Koffi" },
			{ date: "2026-07-27", action: "Validée par le supérieur hiérarchique", auteur: "Serge Yao" },
		],
	},
	{
		id: "D3", ref: "DA-2026-052", type: "INITIALE",
		demandeur: "CC", beneficiaire: "Alain Koffi", pourAutrui: false,
		destinationId: "d2", lieuId: "l4",
		description: "Pose du collecteur secondaire, tronçon Sicogi. Linéaire de 340 ml à couvrir avant la reprise des pluies.",
		dateBesoin: "2026-08-20", dateSoumission: "2026-07-28",
		urgent: false,
		lignes: [
			{ id: "L5", articleId: "a5", designation: "Tuyau PVC DN200", unite: "ml", quantite: 340, fournisseurId: "f3", prix: 8900, recu: 0, statutReception: null },
		],
		statut: "ATTENTE_COMITE",
		validationN1: { par: "Serge Yao", le: "2026-07-28", avis: "OK" },
		comite: [
			{ role: "DT", nom: "Serge Yao", etat: "VALIDE", le: "2026-07-28" },
			{ role: "DRH", nom: "Aïcha Traoré", etat: "VALIDE", le: "2026-07-28" },
			{ role: "DFC", nom: "Marc Ouattara", etat: "ATTENTE", le: null },
			{ role: "DG", nom: "Dr Jules Konan", etat: "ATTENTE", le: null },
		],
		evenements: [
			{ date: "2026-07-28", action: "Demande soumise", auteur: "Alain Koffi" },
			{ date: "2026-07-28", action: "Validée par le supérieur hiérarchique", auteur: "Serge Yao" },
			{ date: "2026-07-28", action: "Instruite — PVC Plus Abidjan retenu, 3 devis comparés", auteur: "Fatou Cissé" },
			{ date: "2026-07-28", action: "Transmise au comité — 4 validateurs", auteur: "Fatou Cissé" },
		],
	},
	{
		id: "D4", ref: "DA-2026-053", type: "REGULARISATION",
		demandeur: "CC", beneficiaire: "Alain Koffi", pourAutrui: false,
		destinationId: "d1", lieuId: "l3",
		description: "Achat effectué le samedi 26 juillet. Rupture de la pompe de rabattement, la fouille se remplissait. Fournisseur local payé en espèces, facture jointe.",
		dateBesoin: "2026-07-26", dateSoumission: "2026-07-28",
		urgent: true,
		lignes: [
			{ id: "L6", articleId: null, designation: "Joint de pompe DN80 — pièce détachée", unite: "unité", quantite: 2, fournisseurId: null, prix: 45000, recu: 2, statutReception: "CONFORME" },
		],
		statut: "ATTENTE_N1",
		validationN1: null,
		comite: [],
		evenements: [
			{ date: "2026-07-28", action: "Régularisation soumise — facture jointe", auteur: "Alain Koffi" },
		],
	},
];

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
					style={{ ...pos, background: "#111827", width: 230 }}>{texte}</span>
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

const Champ = ({ label, aide, requis, children }) => (
	<div className="flex flex-col gap-1.5">
		<label className="text-sm font-medium" style={{ color: "#374151" }}>
			{label}{requis && <span style={{ color: C.destructive }}> *</span>}
		</label>
		{children}
		{aide && <span className="text-xs leading-snug" style={{ color: C.muted }}>{aide}</span>}
	</div>
);

const Saisie = ({ style, ...p }) => (
	<input className="w-full rounded-md border px-3 py-2 text-sm outline-none"
		style={{ borderColor: C.border, background: p.disabled || p.readOnly ? C.mutedBg : "#fff", ...style }} {...p} />
);

/* Champ à autocomplétation, avec création si la valeur n'existe pas. */
function Combobox({ value, onChange, options, placeholder, aide, onCreer, autoriserCreation = true }) {
	const [ouvert, setOuvert] = useState(false);
	const [recherche, setRecherche] = useState("");

	const norm = (t) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
	const selection = options.find((o) => o.value === value);
	const filtrees = recherche ? options.filter((o) => norm(o.label).includes(norm(recherche))) : options;
	const exact = options.some((o) => norm(o.label) === norm(recherche));
	const peutCreer = autoriserCreation && !!onCreer && recherche.trim().length > 1 && !exact;

	return (
		<div className="relative">
			<div className="relative">
				<input
					value={ouvert ? recherche : selection?.label ?? ""}
					onChange={(e) => { setRecherche(e.target.value); setOuvert(true); }}
					onFocus={() => { setOuvert(true); setRecherche(""); }}
					onBlur={() => setTimeout(() => setOuvert(false), 150)}
					placeholder={placeholder}
					className="w-full rounded-md border px-3 py-2 pr-8 text-sm outline-none"
					style={{ borderColor: C.border, background: "#fff" }} />
				<Search size={14} className="pointer-events-none absolute right-3 top-2.5" style={{ color: C.muted }} />
			</div>

			{ouvert && (
				<div className="absolute z-40 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-white shadow-lg"
					style={{ borderColor: C.border }}>
					{filtrees.map((o) => (
						<button key={o.value} type="button"
							onMouseDown={(e) => { e.preventDefault(); onChange(o.value); setRecherche(""); setOuvert(false); }}
							className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50"
							style={{ background: value === o.value ? C.primarySoft : undefined }}>
							<span className="truncate">{o.label}</span>
							{o.detail && <span className="shrink-0 text-xs" style={{ color: C.muted }}>{o.detail}</span>}
						</button>
					))}

					{!filtrees.length && !peutCreer && (
						<div className="px-3 py-3 text-center text-xs" style={{ color: C.muted }}>Aucun résultat</div>
					)}

					{peutCreer && (
						<button type="button"
							onMouseDown={(e) => { e.preventDefault(); onCreer(recherche.trim()); setRecherche(""); setOuvert(false); }}
							className="flex w-full items-center gap-2 border-t px-3 py-2 text-left text-sm hover:bg-gray-50"
							style={{ borderColor: C.border, color: C.success }}>
							<Plus size={14} /> Ajouter «&nbsp;{recherche.trim()}&nbsp;»
						</button>
					)}
				</div>
			)}
			{aide && <span className="mt-1 block text-xs" style={{ color: C.muted }}>{aide}</span>}
		</div>
	);
}

/* Sélection multiple à autocomplétation — pastilles plus champ d'ajout. */
function ComboboxMultiple({ valeurs, onChange, options, placeholder, onCreer }) {
	const disponibles = options.filter((o) => !valeurs.includes(o.value));
	return (
		<div className="space-y-2">
			<div className="flex flex-wrap gap-1.5">
				{valeurs.length === 0 && (
					<span className="text-xs italic" style={{ color: C.muted }}>Aucun validateur sélectionné</span>
				)}
				{valeurs.map((v) => {
					const o = options.find((x) => x.value === v);
					return (
						<span key={v} className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium"
							style={{ background: C.reviewSoft, color: C.review }}>
							{o?.label ?? v}
							<button type="button" onClick={() => onChange(valeurs.filter((x) => x !== v))}
								aria-label="Retirer" style={{ color: C.review }}>
								<X size={12} />
							</button>
						</span>
					);
				})}
			</div>

			{disponibles.length > 0 && (
				<Combobox value="" onChange={(v) => v && onChange([...valeurs, v])}
					options={disponibles} placeholder={placeholder} onCreer={onCreer} />
			)}
		</div>
	);
}

function Modale({ titre, sous, taille = "lg", children, pied, onFermer }) {
	const w = { md: "max-w-2xl", lg: "max-w-4xl", xl: "max-w-6xl" }[taille];
	return (
		<div className="fixed inset-0 z-50 overflow-auto p-6" style={{ background: "rgba(17,17,17,0.45)" }}>
			<div className={"mx-auto w-full rounded-xl bg-white shadow-xl " + w}>
				<div className="flex items-start justify-between gap-4 rounded-t-xl px-7 py-5" style={{ background: C.primarySoft }}>
					<div>
						<h2 className="text-lg font-semibold" style={{ color: C.primary }}>{titre}</h2>
						{sous && <p className="mt-0.5 text-sm" style={{ color: C.muted }}>{sous}</p>}
					</div>
					<button type="button" onClick={onFermer} className="rounded-full bg-white p-2 shadow-sm"><X size={16} /></button>
				</div>
				<div className="px-7 py-5">{children}</div>
				{pied && <div className="flex flex-wrap items-center justify-between gap-3 border-t px-7 py-4" style={{ borderColor: "#F3F4F6" }}>{pied}</div>}
			</div>
		</div>
	);
}

/* ================================================================== */
/* FIL DE PROGRESSION                                                  */
/* ================================================================== */

function Fil({ etape, refusee }) {
	return (
		<div className="flex items-center gap-1">
			{ETAPES.map((e, i) => {
				const faite = etape > i;
				const courante = etape === i + 1;
				return (
					<React.Fragment key={e}>
						<Infobulle texte={e}>
							<span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
								style={{
									background: refusee ? (i === 0 ? C.destructive : "#F3F4F6") : faite ? C.success : courante ? C.warning : "#F3F4F6",
									color: refusee ? (i === 0 ? "#fff" : "#9CA3AF") : faite || courante ? "#fff" : "#9CA3AF",
								}}>
								{faite ? <Check size={11} /> : i + 1}
							</span>
						</Infobulle>
						{i < ETAPES.length - 1 && <span className="h-px w-3" style={{ background: faite ? C.success : C.border }} />}
					</React.Fragment>
				);
			})}
		</div>
	);
}

/* ================================================================== */
/* FORMULAIRE DE DEMANDE                                               */
/* ================================================================== */

function FormDemande({ role, onFermer, onCreer, notifier }) {
	const [articles, setArticles] = useState(ARTICLES);
	const [unites, setUnites] = useState(["sac", "barre", "m³", "ml", "m²", "litre", "unité", "paire", "tonne"]);
	const [lieux, setLieux] = useState(LIEUX);
	const [f, setF] = useState({
		type: "INITIALE", pourAutrui: false, beneficiaire: "",
		destinationId: "", lieuId: "", description: "", dateBesoin: "",
		lignes: [{ articleId: "", designation: "", unite: "", quantite: "" }],
	});
	const set = (p) => setF((x) => ({ ...x, ...p }));
	const u = ROLES[role];

	const majLigne = (i, p) => set({ lignes: f.lignes.map((l, j) => j === i ? { ...l, ...p } : l) });

	const choisirArticle = (i, id) => {
		const a = articles.find((x) => x.id === id);
		majLigne(i, a ? { articleId: id, designation: a.designation, unite: a.unite } : { articleId: "", designation: "", unite: "" });
	};

	/* Création à la volée depuis le champ d'autocomplétation. */
	const creerArticle = (i, libelle) => {
		const a = { id: "a" + Date.now(), designation: libelle, unite: "" };
		setArticles((xs) => [...xs, a]);
		majLigne(i, { articleId: a.id, designation: libelle, unite: "" });
		notifier(`Article «\u00a0${libelle}&nbsp;» ajouté au bordereau — le Service Achats renseignera le prix`);
	};

	const valide = f.destinationId && f.lieuId && f.description.length > 20 && f.dateBesoin
		&& f.lignes.every((l) => l.designation && l.quantite > 0 && l.unite)
		&& (!f.pourAutrui || f.beneficiaire);

	return (
		<Modale titre="Nouvelle demande d'achat" sous="Exprimez un besoin. Le prix et le fournisseur sont déterminés par le Service Achats."
			onFermer={onFermer}
			pied={
				<>
					<Bouton variante="fantome" onClick={onFermer}>Annuler</Bouton>
					<div className="flex items-center gap-3">
						{f.description.length > 0 && f.description.length <= 20 && (
							<span className="text-xs" style={{ color: C.destructive }}>Justification trop courte</span>
						)}
						<Bouton variante="succes" icone={Send} style={!valide ? { opacity: .4 } : undefined}
							onClick={() => valide && onCreer(f)}>Soumettre au supérieur</Bouton>
					</div>
				</>
			}>
			<div className="space-y-5">
				{/* Demandeur */}
				<section className="rounded-lg border p-4" style={{ borderColor: C.border }}>
					<h3 className="mb-3 text-sm font-semibold" style={{ color: C.primary }}>Demandeur</h3>
					<div className="grid gap-4 md:grid-cols-3">
						<Champ label="Nom"><Saisie value={u.nom} readOnly /></Champ>
						<Champ label="Direction"><Saisie value="Direction Technique" readOnly /></Champ>
						<Champ label="Poste"><Saisie value={u.libelle} readOnly /></Champ>
					</div>
					<p className="mt-2 text-xs" style={{ color: C.muted }}>
						Issus de votre session, non modifiables.
					</p>

					<div className="mt-4">
						<button type="button" onClick={() => set({ pourAutrui: !f.pourAutrui, beneficiaire: "" })}
							className="flex w-full items-center justify-between gap-4 rounded-lg border px-4 py-3 text-left" style={{ borderColor: C.border }}>
							<div>
								<div className="text-sm font-medium">Demande pour un autre agent</div>
								<div className="text-xs" style={{ color: C.muted }}>
									C'est le supérieur du bénéficiaire qui validera, pas le vôtre.
								</div>
							</div>
							<span className="relative h-5 w-9 shrink-0 rounded-full" style={{ background: f.pourAutrui ? C.success : "#D1D5DB" }}>
								<span className="absolute top-0.5 h-4 w-4 rounded-full bg-white" style={{ left: f.pourAutrui ? 18 : 2 }} />
							</span>
						</button>
						{f.pourAutrui && (
							<div className="mt-3">
								<Champ label="Bénéficiaire" requis aide="Employé pour qui la demande est faite. C'est son supérieur qui validera.">
									<Combobox value={f.beneficiaire} onChange={(v) => set({ beneficiaire: v })}
										placeholder="Rechercher un agent"
										options={["Konan Adjoua", "Yao Bernard", "Diallo Mariam", "Soro Ibrahim", "Kabore Salif"].map((n) => ({ value: n, label: n }))}
										autoriserCreation={false} />
								</Champ>
							</div>
						)}
					</div>
				</section>

				{/* Nature */}
				<section className="rounded-lg border p-4" style={{ borderColor: C.border }}>
					<h3 className="mb-3 text-sm font-semibold" style={{ color: C.primary }}>Nature du besoin</h3>

					<Champ label="Type de demande" requis>
						<div className="grid gap-3 md:grid-cols-2">
							{[
								["INITIALE", "Demande initiale", "L'achat n'a pas encore été effectué."],
								["REGULARISATION", "Régularisation", "L'achat a déjà été effectué. Facture obligatoire."],
							].map(([v, t, d]) => {
								const actif = f.type === v;
								const alerte = v === "REGULARISATION";
								return (
									<button key={v} type="button" onClick={() => set({ type: v })}
										className="rounded-lg border-2 p-3 text-left"
										style={{
											borderColor: actif ? (alerte ? C.warning : C.success) : C.border,
											background: actif ? (alerte ? C.warningSoft : C.successSoft) : "#fff",
										}}>
										<div className="text-sm font-medium" style={{ color: actif ? (alerte ? C.warning : C.success) : C.primary }}>{t}</div>
										<div className="mt-0.5 text-xs" style={{ color: C.muted }}>{d}</div>
									</button>
								);
							})}
						</div>
					</Champ>

					{f.type === "REGULARISATION" && (
						<div className="mt-3 flex items-start gap-2 rounded-lg px-4 py-3 text-xs"
							style={{ background: C.warningSoft, color: C.warning }}>
							<AlertTriangle size={14} className="mt-0.5 shrink-0" />
							<div>
								Une régularisation échappe au circuit de validation préalable. La
								facture est obligatoire, et le nom de la personne qui a engagé la
								dépense sera demandé. Ces achats sont suivis séparément.
							</div>
						</div>
					)}

					<div className="mt-4 grid gap-4 md:grid-cols-3">
						<Champ label="Destination" requis aide="Chantier ou service qui consomme.">
							<Combobox value={f.destinationId} onChange={(v) => set({ destinationId: v })}
								placeholder="Rechercher un chantier ou un service"
								options={DESTINATIONS.map((d) => ({ value: d.id, label: d.libelle, detail: d.type === "CHANTIER" ? "chantier" : "service" }))}
								autoriserCreation={false} />
						</Champ>
						<Champ label="Lieu de livraison" requis>
							<Combobox value={f.lieuId} onChange={(v) => set({ lieuId: v })}
								placeholder="Rechercher un lieu"
								options={lieux.map((l) => ({ value: l.id, label: l.libelle }))}
								onCreer={(lib) => {
									const l = { id: "l" + Date.now(), libelle: lib, type: "AUTRE" };
									setLieux((xs) => [...xs, l]);
									set({ lieuId: l.id });
									notifier(`Lieu «\u00a0${lib}&nbsp;» ajouté`);
								}} />
						</Champ>
						<Champ label="Date de besoin" requis aide="Distincte de la date négociée avec le fournisseur.">
							<Saisie type="date" value={f.dateBesoin} onChange={(e) => set({ dateBesoin: e.target.value })} />
						</Champ>
					</div>

					<div className="mt-4">
						<Champ label="Description et justification" requis
							aide={`${f.description.length} caractères — 20 minimum. C'est ce que votre supérieur juge.`}>
							<textarea rows={3} value={f.description} onChange={(e) => set({ description: e.target.value })}
								placeholder="Ex : reprise du radier du réservoir. Le coulage est prévu la semaine du 10 août, le stock actuel ne couvre que deux jours."
								className="w-full resize-none rounded-md border px-3 py-2 text-sm outline-none" style={{ borderColor: C.border }} />
						</Champ>
					</div>
				</section>

				{/* Articles */}
				<section className="rounded-lg border p-4" style={{ borderColor: C.border }}>
					<div className="mb-1 flex items-center justify-between">
						<h3 className="text-sm font-semibold" style={{ color: C.primary }}>Articles demandés</h3>
						<span className="text-xs" style={{ color: C.muted }}>{f.lignes.length} ligne{f.lignes.length > 1 ? "s" : ""}</span>
					</div>
					<p className="mb-4 text-xs" style={{ color: C.muted }}>
						Choisissez dans le bordereau, ou saisissez librement si l'article n'y
						figure pas. Le prix et le fournisseur ne vous sont pas accessibles.
					</p>

					<div className="space-y-3">
						{f.lignes.map((l, i) => (
							<div key={i} className="grid gap-3 rounded-lg border p-3 md:grid-cols-12" style={{ borderColor: C.border }}>
								<div className="md:col-span-6">
									<Champ label={`Article ${i + 1}`} requis
										aide="Tapez pour rechercher. Si l'article n'existe pas, ajoutez-le.">
										<Combobox value={l.articleId} onChange={(v) => choisirArticle(i, v)}
											placeholder="Rechercher dans le bordereau"
											options={articles.map((a) => ({ value: a.id, label: a.designation, detail: a.unite || undefined }))}
											onCreer={(lib) => creerArticle(i, lib)} />
									</Champ>
								</div>
								<div className="md:col-span-2">
									<Champ label="Quantité" requis>
										<Saisie type="number" min="1" value={l.quantite} onChange={(e) => majLigne(i, { quantite: e.target.value })} />
									</Champ>
								</div>
								<div className="md:col-span-3">
									<Champ label="Unité" requis>
										<Combobox value={l.unite} onChange={(v) => majLigne(i, { unite: v })}
											placeholder="Rechercher une unité"
											options={unites.map((x) => ({ value: x, label: x }))}
											onCreer={(lib) => {
												setUnites((xs) => [...xs, lib]);
												majLigne(i, { unite: lib });
												notifier(`Unité «\u00a0${lib}&nbsp;» ajoutée`);
											}} />
									</Champ>
								</div>
								<div className="flex items-end md:col-span-1">
									{f.lignes.length > 1 && (
										<button type="button" onClick={() => set({ lignes: f.lignes.filter((_, j) => j !== i) })}
											className="pb-2" style={{ color: C.destructive }} aria-label="Retirer la ligne">
											<Trash2 size={16} />
										</button>
									)}
								</div>
							</div>
						))}
					</div>

					<div className="mt-3">
						<Bouton variante="vide" icone={Plus}
							onClick={() => set({ lignes: [...f.lignes, { articleId: "", designation: "", unite: "", quantite: "" }] })}>
							Ajouter un article
						</Bouton>
					</div>
				</section>

				{/* Pièces jointes */}
				<section className="rounded-lg border p-4" style={{ borderColor: C.border }}>
					<h3 className="text-sm font-semibold" style={{ color: C.primary }}>
						Pièces jointes {f.type === "REGULARISATION" && <span style={{ color: C.destructive }}>*</span>}
					</h3>
					<label className="mt-3 flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed px-4 py-6"
						style={{ borderColor: f.type === "REGULARISATION" ? C.warningBorder : C.border }}>
						<Upload size={18} style={{ color: C.muted }} />
						<span className="mt-2 text-sm">
							{f.type === "REGULARISATION" ? "Facture ou reçu — obligatoire" : "Photo, référence technique — facultatif"}
						</span>
						<span className="mt-0.5 text-xs" style={{ color: C.muted }}>PDF, JPG, PNG · 10 Mo max</span>
					</label>
				</section>
			</div>
		</Modale>
	);
}

/* ================================================================== */
/* INSTRUCTION PAR LE SERVICE ACHATS                                   */
/* ================================================================== */

function Instruction({ demande, params, onFermer, onValider, notifier }) {
	const [lignes, setLignes] = useState(demande.lignes.map((l) => ({ ...l })));
	const [fournisseurs, setFournisseurs] = useState(FOURNISSEURS);
	/* Comité par défaut : les quatre directions. Modifiable. */
	const [validateurs, setValidateurs] = useState(["DT", "DRH", "DFC", "DG"]);
	const [urgent, setUrgent] = useState(false);

	const majLigne = (id, p) => setLignes((ls) => ls.map((l) => l.id === id ? { ...l, ...p } : l));

	const totalHt = lignes.reduce((s, l) => s + (l.prix ?? 0) * l.quantite, 0);
	const totalTtc = totalHt * (1 + params.tva / 100);

	const sousSeuils = totalTtc < params.seuilComite;
	const urgencePossible = totalTtc < params.plafondUrgence;
	const comiteRequis = !sousSeuils && !(urgent && urgencePossible);

	const complet = lignes.every((l) => l.fournisseurId && l.prix > 0);

	/* Bons de commande, groupés par fournisseur */
	const parFournisseur = useMemo(() => {
		const map = new Map();
		lignes.filter((l) => l.fournisseurId).forEach((l) => {
			const f = fournisseurs.find((x) => x.id === l.fournisseurId);
			map.set(l.fournisseurId, { fournisseur: f, lignes: [...(map.get(l.fournisseurId)?.lignes ?? []), l] });
		});
		return [...map.values()];
	}, [lignes, fournisseurs]);

	return (
		<Modale titre={`Instruction — ${demande.ref}`} taille="xl"
			sous="Assignez un fournisseur et un prix à chaque ligne. Un fournisseur peut couvrir plusieurs articles."
			onFermer={onFermer}
			pied={
				<>
					<Bouton variante="fantome" onClick={onFermer}>Fermer</Bouton>
					<div className="flex items-center gap-3">
						{!complet && <span className="text-xs" style={{ color: C.destructive }}>Chaque ligne doit avoir un fournisseur et un prix</span>}
						<Bouton variante="succes" icone={comiteRequis ? Send : FileText}
							style={!complet ? { opacity: .4 } : undefined}
							onClick={() => complet && onValider({ lignes, validateurs: comiteRequis ? validateurs : [], urgent, totalTtc })}>
							{comiteRequis ? "Transmettre au comité" : "Émettre le bon de commande"}
						</Bouton>
					</div>
				</>
			}>

			<div className="space-y-5">
				<div className="rounded-lg p-4" style={{ background: C.mutedBg }}>
					<div className="text-xs" style={{ color: C.muted }}>Besoin exprimé</div>
					<p className="mt-1 text-sm">{demande.description}</p>
					<div className="mt-2 flex flex-wrap gap-4 text-xs" style={{ color: C.muted }}>
						<span>Demandeur : {demande.beneficiaire}</span>
						<span>Besoin le {dateFr(demande.dateBesoin)}</span>
						<span>Livraison : {LIEUX.find((l) => l.id === demande.lieuId)?.libelle}</span>
					</div>
				</div>

				{/* Lignes */}
				<div>
					<h3 className="mb-3 text-sm font-semibold" style={{ color: C.primary }}>Assignation des fournisseurs</h3>
					<div className="space-y-3">
						{lignes.map((l) => {
							const candidats = fournisseurs.filter((f) => !l.articleId || f.specialites.includes(l.articleId));
							const proposes = candidats.length ? candidats : fournisseurs;
							return (
								<div key={l.id} className="rounded-lg border p-4" style={{ borderColor: C.border }}>
									<div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
										<span className="text-sm font-medium">{l.designation}</span>
										<span className="text-sm" style={{ color: C.muted }}>{l.quantite} {l.unite}</span>
									</div>

									<div className="grid gap-4 md:grid-cols-12">
										<div className="md:col-span-6">
											<Champ label="Fournisseur retenu" requis
												aide={candidats.length
													? `${candidats.length} fournisseur(s) au bordereau. Tapez pour chercher, ou ajoutez-en un.`
													: "Article hors bordereau. Tapez pour chercher, ou ajoutez un fournisseur."}>
												<Combobox value={l.fournisseurId ?? ""}
													placeholder="Rechercher un fournisseur"
													onChange={(v) => {
														const prix = PRIX[`${l.articleId}-${v}`] ?? l.prix ?? 0;
														majLigne(l.id, { fournisseurId: v || null, prix });
													}}
													options={proposes.map((f) => ({
														value: f.id,
														label: f.nom,
														detail: PRIX[`${l.articleId}-${f.id}`]
															? `${fcfa(PRIX[`${l.articleId}-${f.id}`])} / ${l.unite}`
															: "prix à saisir",
													}))}
													onCreer={(nom) => {
														const nf = { id: "f" + Date.now(), nom, specialites: [] };
														setFournisseurs((xs) => [...xs, nf]);
														majLigne(l.id, { fournisseurId: nf.id, prix: l.prix ?? 0 });
														notifier(`Fournisseur «\u00a0${nom}&nbsp;» ajouté au référentiel`);
													}} />
											</Champ>
										</div>
										<div className="md:col-span-3">
											<Champ label="Prix unitaire" requis aide="Figé sur la commande.">
												<Saisie type="number" value={l.prix ?? ""} onChange={(e) => majLigne(l.id, { prix: Number(e.target.value) })} />
											</Champ>
										</div>
										<div className="md:col-span-3">
											<Champ label="Total ligne">
												<Saisie value={l.prix ? fcfa(l.prix * l.quantite) : "—"} readOnly />
											</Champ>
										</div>
									</div>

									<button type="button" className="mt-3 flex items-center gap-1.5 text-xs font-medium" style={{ color: C.success }}>
										<Upload size={13} /> Joindre un devis
									</button>
								</div>
							);
						})}
					</div>
				</div>

				{/* Totaux et aiguillage */}
				<div className="grid gap-4 xl:grid-cols-2">
					<Carte className="p-5" style={{ border: `1px solid ${C.border}` }}>
						<h3 className="text-sm font-semibold" style={{ color: C.primary }}>Montant</h3>
						<div className="mt-3 space-y-1.5 text-sm">
							<div className="flex justify-between"><span style={{ color: C.muted }}>Total hors taxes</span><span>{fcfa(totalHt)}</span></div>
							<div className="flex justify-between"><span style={{ color: C.muted }}>TVA {params.tva} %</span><span>{fcfa(totalTtc - totalHt)}</span></div>
							<div className="flex justify-between border-t pt-1.5 font-semibold" style={{ borderColor: C.border, color: C.primary }}>
								<span>Total TTC</span><span>{fcfa(totalTtc)}</span>
							</div>
						</div>
					</Carte>

					<Carte className="p-5" style={{ border: `1px solid ${comiteRequis ? C.review : C.success}` }}>
						<h3 className="text-sm font-semibold" style={{ color: comiteRequis ? C.review : C.success }}>
							{comiteRequis ? "Comité requis" : "Bon de commande direct"}
						</h3>
						<p className="mt-1 text-xs" style={{ color: C.muted }}>
							{sousSeuils
								? `Montant sous le seuil de ${fcfa(params.seuilComite)}. Aucune validation supplémentaire.`
								: urgent && urgencePossible
									? `Urgence déclarée, sous le plafond de ${fcfa(params.plafondUrgence)}. Les directions seront informées a posteriori.`
									: `Montant au-dessus du seuil de ${fcfa(params.seuilComite)}.`}
						</p>

						{!sousSeuils && (
							<div className="mt-3">
								<button type="button" onClick={() => setUrgent((v) => !v)}
									disabled={!urgencePossible}
									className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm"
									style={{
										borderColor: urgent ? C.warning : C.border,
										background: urgent ? C.warningSoft : "#fff",
										opacity: urgencePossible ? 1 : .5,
									}}>
									<Zap size={14} style={{ color: urgent ? C.warning : C.muted }} />
									<span style={{ color: urgent ? C.warning : "#374151" }}>
										Déclarer l'urgence
										{!urgencePossible && ` — impossible au-delà de ${fcfa(params.plafondUrgence)}`}
									</span>
								</button>
							</div>
						)}

						{comiteRequis && (
							<div className="mt-4">
								<div className="mb-1 text-xs font-medium">Comité de validation</div>
								<p className="mb-2 text-xs" style={{ color: C.muted }}>
									Les quatre directions sont proposées par défaut. Retirez ou ajoutez selon
									la nature de l'achat.
								</p>
								<ComboboxMultiple valeurs={validateurs} onChange={setValidateurs}
									placeholder="Ajouter un validateur"
									options={["DT", "DRH", "DFC", "DG"].map((r) => ({ value: r, label: ROLES[r].libelle }))} />
								<p className="mt-2 text-xs" style={{ color: C.muted }}>
									Chacun se prononce indépendamment. Un seul refus bloque la demande.
								</p>
							</div>
						)}
					</Carte>
				</div>

				{/* Bons de commande prévisionnels */}
				{parFournisseur.length > 0 && (
					<div>
						<h3 className="mb-3 text-sm font-semibold" style={{ color: C.primary }}>
							Bons de commande — {parFournisseur.length} fournisseur{parFournisseur.length > 1 ? "s" : ""}
						</h3>
						<div className="grid gap-3 md:grid-cols-2">
							{parFournisseur.map(({ fournisseur, lignes: ls }) => (
								<div key={fournisseur.id} className="rounded-lg border p-4" style={{ borderColor: C.border }}>
									<div className="flex items-center gap-2">
										<Building2 size={14} style={{ color: C.primary }} />
										<span className="text-sm font-medium">{fournisseur.nom}</span>
									</div>
									<ul className="mt-2 space-y-1 text-xs" style={{ color: C.muted }}>
										{ls.map((l) => (
											<li key={l.id} className="flex justify-between gap-3">
												<span>{l.designation}</span>
												<span>{l.quantite} {l.unite}</span>
											</li>
										))}
									</ul>
									<div className="mt-2 border-t pt-2 text-right text-sm font-semibold" style={{ borderColor: C.border, color: C.primary }}>
										{fcfa(ls.reduce((s, l) => s + l.prix * l.quantite, 0))}
									</div>
								</div>
							))}
						</div>
						<p className="mt-2 text-xs" style={{ color: C.muted }}>
							Une demande peut produire plusieurs bons de commande, un par fournisseur retenu.
						</p>
					</div>
				)}
			</div>
		</Modale>
	);
}

/* ================================================================== */
/* RÉCEPTION PAR LA LOGISTIQUE                                         */
/* ================================================================== */

function Reception({ demande, onFermer, onValider }) {
	const [lignes, setLignes] = useState(
		demande.lignes.map((l) => ({ ...l, saisie: l.quantite - (l.recu ?? 0), issue: "CONFORME", motif: "" }))
	);
	const maj = (id, p) => setLignes((ls) => ls.map((l) => l.id === id ? { ...l, ...p } : l));

	const ISSUES = {
		CONFORME: { label: "Conforme", fg: C.success, bg: C.successSoft, aide: "Quantité acceptée, facturation ouverte." },
		RESERVE: { label: "Conforme avec réserve", fg: C.warning, bg: C.warningSoft, aide: "Accepté malgré un défaut mineur. Réserve tracée, paiement possible." },
		REFUS: { label: "Non conforme", fg: C.destructive, bg: C.destructiveSoft, aide: "Refusé. Le reliquat reste ouvert." },
	};

	const valide = lignes.every((l) => l.issue === "CONFORME" || l.motif.length > 5);

	return (
		<Modale titre={`Réception — ${demande.ref}`} taille="lg"
			sous="Contrôle de conformité. C'est cette validation, non la livraison, qui ouvre le droit à facturation."
			onFermer={onFermer}
			pied={
				<>
					<Bouton variante="fantome" onClick={onFermer}>Annuler</Bouton>
					<Bouton variante="succes" icone={Check} style={!valide ? { opacity: .4 } : undefined}
						onClick={() => valide && onValider(lignes)}>Valider le contrôle</Bouton>
				</>
			}>
			<div className="space-y-4">
				{lignes.map((l) => {
					const attendu = l.quantite - (l.recu ?? 0);
					const reliquat = attendu - Number(l.saisie || 0);
					const issue = ISSUES[l.issue];
					return (
						<div key={l.id} className="rounded-lg border p-4" style={{ borderColor: C.border }}>
							<div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
								<span className="text-sm font-medium">{l.designation}</span>
								<span className="text-xs" style={{ color: C.muted }}>
									Commandé {l.quantite} {l.unite} · déjà reçu {l.recu ?? 0} · attendu {attendu}
								</span>
							</div>

							<div className="grid gap-4 md:grid-cols-12">
								<div className="md:col-span-3">
									<Champ label="Quantité reçue" requis>
										<Saisie type="number" min="0" max={attendu} value={l.saisie}
											onChange={(e) => maj(l.id, { saisie: Number(e.target.value) })} />
									</Champ>
								</div>
								<div className="md:col-span-9">
									<Champ label="Issue du contrôle" requis>
										<div className="grid gap-2 md:grid-cols-3">
											{Object.entries(ISSUES).map(([k, v]) => {
												const actif = l.issue === k;
												return (
													<Infobulle key={k} texte={v.aide}>
														<button type="button" onClick={() => maj(l.id, { issue: k })}
															className="w-full rounded-md border px-3 py-2 text-xs font-medium"
															style={{
																borderColor: actif ? v.fg : C.border,
																background: actif ? v.bg : "#fff",
																color: actif ? v.fg : C.muted,
															}}>
															{v.label}
														</button>
													</Infobulle>
												);
											})}
										</div>
									</Champ>
								</div>
							</div>

							{l.issue !== "CONFORME" && (
								<div className="mt-3">
									<Champ label="Motif" requis aide="Six caractères minimum. Une photo sera demandée en cas de refus.">
										<Saisie value={l.motif} onChange={(e) => maj(l.id, { motif: e.target.value })}
											placeholder={l.issue === "REFUS" ? "Ex : référence non conforme au bon de commande" : "Ex : sacs légèrement humides, acceptés pour usage immédiat"} />
									</Champ>
								</div>
							)}

							{reliquat > 0 && (
								<div className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs" style={{ background: C.warningSoft, color: C.warning }}>
									<CircleAlert size={13} />
									Reliquat de {reliquat} {l.unite} — la ligne reste ouverte, le fournisseur peut relivrer.
								</div>
							)}
						</div>
					);
				})}

				<div className="flex items-start gap-2 rounded-lg px-4 py-3 text-xs" style={{ background: C.primarySoft, color: C.primary }}>
					<Info size={14} className="mt-0.5 shrink-0" />
					Le paiement portera sur la <strong>quantité reçue</strong>, jamais sur la
					quantité commandée. La Direction Financière ne pourra pas payer plus qu'il
					n'est entré.
				</div>
			</div>
		</Modale>
	);
}

/* ================================================================== */
/* FICHE DE DEMANDE                                                    */
/* ================================================================== */

function Fiche({ demande, role, onFermer, onDecisionN1, onDecisionComite, onInstruire, onReceptionner }) {
	const [commentaire, setCommentaire] = useState("");
	const st = STATUTS[demande.statut];
	const dest = DESTINATIONS.find((d) => d.id === demande.destinationId);

	const monAvis = demande.comite.find((c) => c.role === role);
	const peutN1 = demande.statut === "ATTENTE_N1" && role === "DT";
	const peutComite = demande.statut === "ATTENTE_COMITE" && monAvis?.etat === "ATTENTE";
	const peutInstruire = demande.statut === "ATTENTE_ACHATS" && role === "ACHATS";
	const peutRecevoir = ["BC_EMIS", "PARTIELLE"].includes(demande.statut) && role === "LOG";

	return (
		<Modale titre={demande.ref} taille="xl"
			sous={`${dest?.libelle} · demandé par ${demande.beneficiaire}`}
			onFermer={onFermer}
			pied={
				<>
					<Bouton variante="fantome" onClick={onFermer}>Fermer</Bouton>
					<div className="flex flex-wrap gap-2">
						{peutN1 && (
							<>
								<Bouton variante="danger" onClick={() => onDecisionN1(false, commentaire)}>Refuser</Bouton>
								<Bouton variante="succes" icone={Check} onClick={() => onDecisionN1(true, commentaire)}>Valider et transmettre aux Achats</Bouton>
							</>
						)}
						{peutComite && (
							<>
								<Bouton variante="danger" onClick={() => onDecisionComite(false, commentaire)}>Refuser</Bouton>
								<Bouton variante="succes" icone={Check} onClick={() => onDecisionComite(true, commentaire)}>Valider</Bouton>
							</>
						)}
						{peutInstruire && <Bouton icone={FileText} onClick={onInstruire}>Instruire la demande</Bouton>}
						{peutRecevoir && <Bouton icone={Truck} onClick={onReceptionner}>Enregistrer une réception</Bouton>}
					</div>
				</>
			}>

			<div className="grid gap-6 xl:grid-cols-3">
				<div className="space-y-5 xl:col-span-2">
					<div className="flex flex-wrap items-center gap-3">
						<Badge fg={st.fg} bg={st.bg}>{st.label}</Badge>
						{demande.type === "REGULARISATION" && (
							<Infobulle texte="Achat déjà effectué, documenté après coup. Ces demandes sont suivies séparément pour surveiller leur part dans le total.">
								<Badge fg={C.warning} bg={C.warningSoft}>Régularisation</Badge>
							</Infobulle>
						)}
						{demande.urgent && <Badge fg={C.warning} bg={C.warningSoft}>Urgence déclarée</Badge>}
						{demande.pourAutrui && <Badge fg={C.muted} bg={C.mutedBg}>Saisie pour autrui</Badge>}
						<Fil etape={st.etape} refusee={demande.statut === "REFUSEE"} />
					</div>

					<div className="rounded-lg p-4" style={{ background: C.mutedBg }}>
						<div className="text-xs" style={{ color: C.muted }}>Justification</div>
						<p className="mt-1 text-sm">{demande.description}</p>
					</div>

					{/* Lignes */}
					<div>
						<h3 className="mb-2 text-sm font-semibold" style={{ color: C.primary }}>Articles</h3>
						<div className="overflow-hidden rounded-lg border" style={{ borderColor: C.border }}>
							<table className="w-full text-sm">
								<thead>
									<tr style={{ background: C.mutedBg }}>
										{["Désignation", "Commandé", "Reçu", "Reliquat", "Fournisseur", "Montant"].map((h) => (
											<th key={h} className="px-3 py-2 text-left text-xs font-semibold uppercase" style={{ color: C.muted }}>{h}</th>
										))}
									</tr>
								</thead>
								<tbody>
									{demande.lignes.map((l) => {
										const reliquat = l.quantite - (l.recu ?? 0);
										const f = FOURNISSEURS.find((x) => x.id === l.fournisseurId);
										return (
											<tr key={l.id} className="border-t" style={{ borderColor: "#F3F4F6" }}>
												<td className="px-3 py-2">{l.designation}</td>
												<td className="px-3 py-2 text-xs">{l.quantite} {l.unite}</td>
												<td className="px-3 py-2 text-xs" style={{ color: l.recu ? C.success : C.muted }}>{l.recu ?? 0}</td>
												<td className="px-3 py-2 text-xs" style={{ color: reliquat > 0 ? C.warning : C.muted, fontWeight: reliquat > 0 ? 600 : 400 }}>
													{reliquat > 0 ? `${reliquat} ${l.unite}` : "—"}
												</td>
												<td className="px-3 py-2 text-xs">{f?.nom ?? <span style={{ color: C.muted }}>non assigné</span>}</td>
												<td className="px-3 py-2 text-xs font-medium">{l.prix ? fcfa(l.prix * l.quantite) : "—"}</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>

					{(peutN1 || peutComite) && (
						<Champ label="Commentaire" aide="Obligatoire en cas de refus. Le demandeur le lira.">
							<textarea rows={2} value={commentaire} onChange={(e) => setCommentaire(e.target.value)}
								className="w-full resize-none rounded-md border px-3 py-2 text-sm" style={{ borderColor: C.border }} />
						</Champ>
					)}
				</div>

				<div className="space-y-5">
					{/* Validation N+1 */}
					{demande.validationN1 && (
						<div className="rounded-lg border p-4" style={{ borderColor: C.successSoft, background: "#FBFEFA" }}>
							<div className="text-xs font-medium" style={{ color: C.success }}>Validation hiérarchique</div>
							<div className="mt-1 text-sm">{demande.validationN1.par}</div>
							<div className="text-xs" style={{ color: C.muted }}>{dateFr(demande.validationN1.le)}</div>
							{demande.validationN1.avis && <p className="mt-2 text-xs">{demande.validationN1.avis}</p>}
						</div>
					)}

					{/* Comité — une ligne par validateur */}
					{demande.comite.length > 0 && (
						<div>
							<div className="mb-2 flex items-center gap-2 text-sm font-medium">
								<Users size={14} /> Comité de validation
							</div>
							<p className="mb-3 text-xs" style={{ color: C.muted }}>
								Chacun se prononce indépendamment. Un état par validateur, jamais un
								statut global unique.
							</p>
							<div className="space-y-2">
								{demande.comite.map((c) => {
									const v = { VALIDE: { l: "Validé", fg: C.success, bg: C.successSoft },
										ATTENTE: { l: "En attente", fg: C.warning, bg: C.warningSoft },
										REFUSE: { l: "Refusé", fg: C.destructive, bg: C.destructiveSoft } }[c.etat];
									return (
										<div key={c.role} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ background: v.bg }}>
											<div className="min-w-0">
												<div className="truncate text-sm" style={{ color: v.fg }}>{ROLES[c.role].libelle}</div>
												<div className="text-xs" style={{ color: C.muted }}>{c.nom}{c.le && ` · ${dateFr(c.le)}`}</div>
											</div>
											<Badge fg={v.fg} bg="#fff">{v.l}</Badge>
										</div>
									);
								})}
							</div>
						</div>
					)}

					{/* Historique */}
					<div>
						<div className="mb-2 text-sm font-medium">Historique</div>
						<div className="space-y-2">
							{demande.evenements.slice().reverse().map((e, i) => (
								<div key={i} className="rounded-lg p-3 text-xs" style={{ background: C.mutedBg }}>
									<div>{e.action}</div>
									<div className="mt-0.5" style={{ color: C.muted }}>{e.auteur} · {dateFr(e.date)}</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</Modale>
	);
}

/* ================================================================== */
/* TABLEAU DE SUIVI — LECTURE SEULE                                    */
/* ================================================================== */

function TableauSuivi({ demandes }) {
	const lignes = useMemo(() => {
		const out = [];
		demandes.forEach((d) => {
			const dateValide = d.comite.length
				? d.comite.every((c) => c.etat === "VALIDE") ? d.comite.reduce((m, c) => c.le > m ? c.le : m, "") : null
				: d.validationN1?.le ?? null;
			const dateBc = d.evenements.find((e) => e.action.includes("Bon"))?.date ?? null;
			const delai = dateBc ? Math.round((new Date(dateBc) - new Date(d.dateSoumission)) / 86400000) : null;

			d.lignes.forEach((l) => {
				const f = FOURNISSEURS.find((x) => x.id === l.fournisseurId);
				out.push({
					ref: d.ref,
					dateBesoin: d.dateSoumission,
					dateTransmission: d.evenements.find((e) => e.action.includes("comité"))?.date ?? null,
					dateValide,
					designation: l.designation,
					dateBc,
					delai,
					numBc: l.fournisseurId ? `BC-${d.ref.slice(-3)}-${l.fournisseurId.toUpperCase()}` : null,
					destination: DESTINATIONS.find((x) => x.id === d.destinationId)?.libelle,
					type: d.type === "REGULARISATION" ? "Régularisation" : "Initiale",
					demandeur: d.beneficiaire,
					dateLog: dateBc,
					dateLivraison: l.recu ? d.evenements.filter((e) => e.action.includes("Réception")).slice(-1)[0]?.date ?? null : null,
					fournisseur: f?.nom ?? null,
					montant: l.prix ? l.prix * l.quantite : null,
					statut: d.statut,
				});
			});
		});
		return out;
	}, [demandes]);

	const COLS = ["N° demande", "Réception besoin", "Transmission directeurs", "Besoin validé",
		"Désignation", "Émission BC", "Délai", "N° BC", "Chantier / Service", "Type",
		"Demandeur", "Trans. log./compta", "Livraison", "Fournisseur", "Montant", "Statut"];

	return (
		<div className="space-y-4">
			<div className="flex items-start gap-2 rounded-lg px-4 py-3 text-xs" style={{ background: C.primarySoft, color: C.primary }}>
				<Info size={14} className="mt-0.5 shrink-0" />
				<div>
					<strong>Lecture seule.</strong> Chaque colonne se remplit automatiquement au
					franchissement d'une étape. Aucune saisie n'est possible : personne ne peut
					antidater une transmission ni corriger un délai. Une ligne par article commandé.
				</div>
			</div>

			<Carte className="overflow-hidden p-0">
				<div className="overflow-x-auto">
					<table className="w-full text-xs" style={{ minWidth: 1500 }}>
						<thead>
							<tr style={{ background: C.mutedBg }}>
								{COLS.map((h) => (
									<th key={h} className="whitespace-nowrap px-3 py-2.5 text-left font-semibold uppercase" style={{ color: C.muted }}>{h}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{lignes.map((l, i) => {
								const st = STATUTS[l.statut];
								return (
									<tr key={i} className="border-t" style={{ borderColor: "#F3F4F6" }}>
										<td className="whitespace-nowrap px-3 py-2.5 font-medium">{l.ref}</td>
										<td className="whitespace-nowrap px-3 py-2.5">{dateFr(l.dateBesoin)}</td>
										<td className="whitespace-nowrap px-3 py-2.5">{dateFr(l.dateTransmission)}</td>
										<td className="whitespace-nowrap px-3 py-2.5">{dateFr(l.dateValide)}</td>
										<td className="px-3 py-2.5">{l.designation}</td>
										<td className="whitespace-nowrap px-3 py-2.5">{dateFr(l.dateBc)}</td>
										<td className="whitespace-nowrap px-3 py-2.5">
											{l.delai !== null ? (
												<Infobulle texte="Calculé — date d'émission du bon de commande moins date de réception du besoin.">
													<span style={{ color: l.delai > 5 ? C.warning : C.success, fontWeight: 600 }}>{l.delai} j</span>
												</Infobulle>
											) : "—"}
										</td>
										<td className="whitespace-nowrap px-3 py-2.5">{l.numBc ?? "—"}</td>
										<td className="whitespace-nowrap px-3 py-2.5">{l.destination}</td>
										<td className="whitespace-nowrap px-3 py-2.5">
											{l.type === "Régularisation"
												? <Badge fg={C.warning} bg={C.warningSoft}>Régularisation</Badge>
												: <span style={{ color: C.muted }}>Initiale</span>}
										</td>
										<td className="whitespace-nowrap px-3 py-2.5">{l.demandeur}</td>
										<td className="whitespace-nowrap px-3 py-2.5">{dateFr(l.dateLog)}</td>
										<td className="whitespace-nowrap px-3 py-2.5">
											{l.dateLivraison ? (
												<Infobulle texte="Date de validation de conformité, non celle où le camion s'est présenté. Une livraison refusée ne remplit pas cette colonne.">
													<span style={{ color: C.success }}>{dateFr(l.dateLivraison)}</span>
												</Infobulle>
											) : "—"}
										</td>
										<td className="whitespace-nowrap px-3 py-2.5">{l.fournisseur ?? "—"}</td>
										<td className="whitespace-nowrap px-3 py-2.5 font-medium">{l.montant ? fcfa(l.montant) : "—"}</td>
										<td className="whitespace-nowrap px-3 py-2.5"><Badge fg={st.fg} bg={st.bg}>{st.label}</Badge></td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</Carte>

			<div className="grid gap-4 md:grid-cols-4">
				{[
					["Délai moyen de traitement", `${Math.round(lignes.filter((l) => l.delai !== null).reduce((s, l) => s + l.delai, 0) / Math.max(1, lignes.filter((l) => l.delai !== null).length))} jours`, "de la demande au bon de commande"],
					["Part des régularisations", `${Math.round(lignes.filter((l) => l.type === "Régularisation").length / lignes.length * 100)} %`, "signal à surveiller"],
					["Lignes en attente", lignes.filter((l) => !l.dateLivraison).length, "non encore réceptionnées"],
					["Montant engagé", fcfa(lignes.reduce((s, l) => s + (l.montant ?? 0), 0)), "toutes demandes confondues"],
				].map(([l, v, s]) => (
					<Carte key={l} className="p-5">
						<div className="text-xs font-medium uppercase" style={{ color: C.muted }}>{l}</div>
						<div className="mt-2 text-xl font-semibold" style={{ color: C.primary }}>{v}</div>
						<div className="mt-1 text-xs" style={{ color: C.muted }}>{s}</div>
					</Carte>
				))}
			</div>
		</div>
	);
}

/* ================================================================== */
/* APPLICATION                                                         */
/* ================================================================== */

export default function ApercuAchats() {
	const [role, setRole] = useState("CC");
	const [onglet, setOnglet] = useState("demandes");
	const [demandes, setDemandes] = useState(DEMANDES_INIT);
	const [params] = useState(PARAMS_INIT);
	const [formulaire, setFormulaire] = useState(false);
	const [fiche, setFiche] = useState(null);
	const [instruction, setInstruction] = useState(null);
	const [reception, setReception] = useState(null);
	const [toast, setToast] = useState(null);
	const [filtre, setFiltre] = useState("tous");

	const notifier = (m, ton = "succes") => { setToast({ m, ton }); setTimeout(() => setToast(null), 3500); };
	const u = ROLES[role];

	const evt = (d, action) => ({ ...d, evenements: [...d.evenements, { date: AUJ, action, auteur: u.nom }] });

	const liste = demandes.filter((d) => {
		if (filtre === "action") {
			if (role === "DT" && d.statut === "ATTENTE_N1") return true;
			if (role === "ACHATS" && d.statut === "ATTENTE_ACHATS") return true;
			if (d.statut === "ATTENTE_COMITE" && d.comite.some((c) => c.role === role && c.etat === "ATTENTE")) return true;
			if (role === "LOG" && ["BC_EMIS", "PARTIELLE"].includes(d.statut)) return true;
			return false;
		}
		return true;
	});

	const aTraiter = demandes.filter((d) =>
		(role === "DT" && d.statut === "ATTENTE_N1") ||
		(role === "ACHATS" && d.statut === "ATTENTE_ACHATS") ||
		(d.statut === "ATTENTE_COMITE" && d.comite.some((c) => c.role === role && c.etat === "ATTENTE")) ||
		(role === "LOG" && ["BC_EMIS", "PARTIELLE"].includes(d.statut))
	).length;

	/* --- Actions --- */

	const creer = (f) => {
		const n = {
			id: "D" + Date.now(), ref: `DA-2026-${String(54 + demandes.length).padStart(3, "0")}`,
			type: f.type, demandeur: role, beneficiaire: f.pourAutrui ? f.beneficiaire : u.nom,
			pourAutrui: f.pourAutrui, destinationId: f.destinationId, lieuId: f.lieuId,
			description: f.description, dateBesoin: f.dateBesoin, dateSoumission: AUJ, urgent: false,
			lignes: f.lignes.map((l, i) => ({
				id: "L" + Date.now() + i, articleId: l.articleId || null, designation: l.designation,
				unite: l.unite, quantite: Number(l.quantite), fournisseurId: null, prix: null,
				recu: 0, statutReception: null,
			})),
			statut: "ATTENTE_N1", validationN1: null, comite: [],
			evenements: [{ date: AUJ, action: f.type === "REGULARISATION" ? "Régularisation soumise" : "Demande soumise", auteur: u.nom }],
		};
		setDemandes((ds) => [n, ...ds]);
		setFormulaire(false);
		notifier("Demande transmise à votre supérieur hiérarchique");
	};

	const deciderN1 = (ok, com) => {
		setDemandes((ds) => ds.map((d) => d.id !== fiche.id ? d : evt({
			...d, statut: ok ? "ATTENTE_ACHATS" : "REFUSEE",
			validationN1: { par: u.nom, le: AUJ, avis: com },
		}, ok ? "Validée par le supérieur hiérarchique" : `Refusée — ${com || "sans motif"}`)));
		notifier(ok ? "Demande transmise au Service Achats" : "Demande refusée", ok ? "succes" : "erreur");
		setFiche(null);
	};

	const instruire = ({ lignes, validateurs, urgent, totalTtc }) => {
		const comite = validateurs.map((r) => ({ role: r, nom: ROLES[r].nom, etat: "ATTENTE", le: null }));
		setDemandes((ds) => ds.map((d) => d.id !== instruction.id ? d : evt({
			...d, lignes, urgent, comite,
			statut: comite.length ? "ATTENTE_COMITE" : "BC_EMIS",
		}, comite.length
			? `Transmise au comité — ${comite.length} validateur(s)`
			: `Bons de commande émis — ${fcfa(totalTtc)}${urgent ? " · urgence déclarée" : " · sous seuil"}`)));
		notifier(comite.length ? "Transmise au comité de validation" : "Bons de commande émis");
		setInstruction(null);
	};

	const deciderComite = (ok, com) => {
		setDemandes((ds) => ds.map((d) => {
			if (d.id !== fiche.id) return d;
			const comite = d.comite.map((c) => c.role === role ? { ...c, etat: ok ? "VALIDE" : "REFUSE", le: AUJ } : c);
			const tous = comite.every((c) => c.etat === "VALIDE");
			const refus = comite.some((c) => c.etat === "REFUSE");
			return evt({
				...d, comite,
				statut: refus ? "ATTENTE_ACHATS" : tous ? "BC_EMIS" : "ATTENTE_COMITE",
			}, refus
				? `Refusée par ${ROLES[role].libelle} — retour en instruction`
				: tous ? "Comité complet — bons de commande émis" : `Validée par ${ROLES[role].libelle}`);
		}));
		notifier(ok ? "Votre avis est enregistré" : "Demande renvoyée en instruction", ok ? "succes" : "avertissement");
		setFiche(null);
	};

	const receptionner = (lignesRecues) => {
		setDemandes((ds) => ds.map((d) => {
			if (d.id !== reception.id) return d;
			const lignes = d.lignes.map((l) => {
				const r = lignesRecues.find((x) => x.id === l.id);
				if (!r || r.issue === "REFUS") return l;
				return { ...l, recu: (l.recu ?? 0) + Number(r.saisie), statutReception: r.issue };
			});
			const solde = lignes.every((l) => (l.recu ?? 0) >= l.quantite);
			return evt({ ...d, lignes, statut: solde ? "SOLDEE" : "PARTIELLE" },
				solde ? "Réception complète — demande soldée" : "Réception partielle enregistrée");
		}));
		notifier("Contrôle validé — facturation ouverte sur la quantité reçue");
		setReception(null);
	};

	return (
		<div className="min-h-screen" style={{ background: C.bg }}>
			{/* En-tête */}
			<header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-4 border-b bg-white px-8 py-3" style={{ borderColor: C.border }}>
				<div className="flex items-center gap-2.5">
					<div className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: C.primary }}>ITA</div>
					<div>
						<div className="text-sm font-semibold" style={{ color: C.primary }}>Service Achats</div>
						<div className="text-xs" style={{ color: C.muted }}>Module futur — aperçu de cadrage</div>
					</div>
				</div>

				<div className="flex items-center gap-4">
					{aTraiter > 0 && (
						<Badge fg={C.warning} bg={C.warningSoft}>{aTraiter} demande{aTraiter > 1 ? "s" : ""} à traiter</Badge>
					)}
					<div className="flex items-center gap-2">
						<span className="text-xs" style={{ color: C.muted }}>Rôle</span>
						<select value={role} onChange={(e) => setRole(e.target.value)}
							className="rounded-lg border px-3 py-1.5 text-xs font-medium" style={{ borderColor: C.border, color: C.primary }}>
							{Object.values(ROLES).map((r) => <option key={r.code} value={r.code}>{r.libelle}</option>)}
						</select>
					</div>
					<div className="flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: C.success }}>{u.ini}</div>
						<div className="text-xs">
							<div className="font-medium">{u.nom}</div>
							<div style={{ color: C.muted }}>{u.libelle}</div>
						</div>
					</div>
				</div>
			</header>

			<div className="border-b px-8 py-2" style={{ borderColor: C.warningBorder, background: C.warningSoft }}>
				<p className="text-xs" style={{ color: C.warning }}>
					Changez de rôle pour dérouler le circuit : Chef Chantier crée · Directeur
					Technique valide · Chef de Service Achats instruit · le comité se prononce ·
					le Gestionnaire de stocks réceptionne.
				</p>
			</div>

			<main className="px-8 py-6">
				<div className="mb-6 flex flex-wrap items-start justify-between gap-4">
					<div>
						<h1 className="text-2xl font-semibold" style={{ color: C.primary }}>Demandes d'achat</h1>
						<p className="mt-1 text-sm" style={{ color: C.muted }}>
							{demandes.length} demandes · suivi de leur circuit de validation
						</p>
					</div>
					{role === "CC" && <Bouton icone={Plus} onClick={() => setFormulaire(true)}>Nouvelle demande</Bouton>}
				</div>

				<div className="mb-6 flex gap-2 border-b" style={{ borderColor: C.border }}>
					{[["demandes", "Demandes", ShoppingCart], ["suivi", "Tableau de suivi", TableProperties]].map(([id, label, I]) => {
						const actif = onglet === id;
						return (
							<button key={id} type="button" onClick={() => setOnglet(id)}
								className="flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium"
								style={{ borderColor: actif ? C.primary : "transparent", color: actif ? C.primary : C.muted }}>
								<I size={15} />{label}
							</button>
						);
					})}
				</div>

				{onglet === "demandes" && (
					<>
						<div className="mb-4 flex items-center gap-3">
							<Filter size={15} style={{ color: C.muted }} />
							<div className="flex gap-1.5">
								{[["tous", "Toutes"], ["action", `À traiter${aTraiter ? ` (${aTraiter})` : ""}`]].map(([v, l]) => (
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
							<table className="w-full text-sm">
								<thead>
									<tr style={{ background: C.mutedBg }}>
										{["Référence", "Destination", "Articles", "Montant", "Avancement", "Statut", ""].map((h) => (
											<th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: C.muted }}>{h}</th>
										))}
									</tr>
								</thead>
								<tbody>
									{liste.map((d) => {
										const st = STATUTS[d.statut];
										const total = d.lignes.reduce((s, l) => s + (l.prix ?? 0) * l.quantite, 0);
										const reliquat = d.lignes.reduce((s, l) => s + (l.quantite - (l.recu ?? 0)), 0);
										return (
											<tr key={d.id} className="border-t hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
												<td className="px-4 py-3">
													<div className="flex items-center gap-2">
														<span className="font-medium">{d.ref}</span>
														{d.type === "REGULARISATION" && (
															<Infobulle texte="Achat déjà effectué, documenté après coup.">
																<Badge fg={C.warning} bg={C.warningSoft}>Régul.</Badge>
															</Infobulle>
														)}
													</div>
													<div className="text-xs" style={{ color: C.muted }}>{d.beneficiaire} · {dateFr(d.dateSoumission)}</div>
												</td>
												<td className="px-4 py-3 text-xs">{DESTINATIONS.find((x) => x.id === d.destinationId)?.libelle}</td>
												<td className="px-4 py-3 text-xs">
													{d.lignes.length} ligne{d.lignes.length > 1 ? "s" : ""}
													{reliquat > 0 && d.statut === "PARTIELLE" && (
														<div style={{ color: C.warning }}>reliquat en attente</div>
													)}
												</td>
												<td className="px-4 py-3 text-xs font-medium">{total ? fcfa(total) : "—"}</td>
												<td className="px-4 py-3"><Fil etape={st.etape} refusee={d.statut === "REFUSEE"} /></td>
												<td className="px-4 py-3"><Badge fg={st.fg} bg={st.bg}>{st.label}</Badge></td>
												<td className="px-4 py-3 text-right">
													<button type="button" onClick={() => setFiche(d)}
														className="rounded-full border px-4 py-1.5 text-xs font-medium" style={{ borderColor: C.border, color: C.primary }}>
														Ouvrir
													</button>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
							{!liste.length && (
								<div className="py-14 text-center">
									<p className="text-sm font-medium">Rien à traiter</p>
									<p className="mx-auto mt-1 max-w-md text-sm" style={{ color: C.muted }}>
										Aucune demande n'attend votre intervention. Changez de rôle pour voir le circuit avancer.
									</p>
								</div>
							)}
						</Carte>
					</>
				)}

				{onglet === "suivi" && <TableauSuivi demandes={demandes} />}
			</main>

			{formulaire && <FormDemande role={role} notifier={notifier} onFermer={() => setFormulaire(false)} onCreer={creer} />}
			{fiche && (
				<Fiche demande={demandes.find((d) => d.id === fiche.id)} role={role} onFermer={() => setFiche(null)}
					onDecisionN1={deciderN1} onDecisionComite={deciderComite}
					onInstruire={() => { setInstruction(fiche); setFiche(null); }}
					onReceptionner={() => { setReception(fiche); setFiche(null); }} />
			)}
			{instruction && <Instruction demande={instruction} params={params} notifier={notifier} onFermer={() => setInstruction(null)} onValider={instruire} />}
			{reception && <Reception demande={reception} onFermer={() => setReception(null)} onValider={receptionner} />}

			{toast && (
				<div className="fixed bottom-6 right-6 z-[60] flex max-w-sm items-start gap-2 rounded-lg px-5 py-3 text-sm text-white shadow-lg"
					style={{ background: toast.ton === "erreur" ? C.destructive : toast.ton === "avertissement" ? C.warning : C.primary }}>
					<Check size={16} className="mt-0.5 shrink-0" />{toast.m}
				</div>
			)}
		</div>
	);
}
