import React, { useState, useMemo } from "react";
import {
	Network, Building2, Users, Search, Plus, ChevronDown, ChevronRight,
	AlertTriangle, Check, X, Lock, ArrowUp, ShieldCheck, Info, Pencil,
	CircleAlert, GitBranch, ListTree, ClipboardCheck, HardHat, Layers,
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

const NIVEAUX = {
	DIRECTION: { libelle: "Direction", fg: C.primary, bg: C.primarySoft, rang: 4 },
	CADRE: { libelle: "Cadre", fg: C.review, bg: C.reviewSoft, rang: 3 },
	SUPPORT: { libelle: "Support", fg: C.warning, bg: C.warningSoft, rang: 2 },
	OPERATIONNEL: { libelle: "Opérationnel", fg: C.success, bg: C.successSoft, rang: 1 },
};

/* ================================================================== */
/* RÉFÉRENTIEL — conforme à DECISIONS.md section A                     */
/* ================================================================== */

const DIRECTIONS = [
	{ id: "DG", code: "DG", libelle: "Direction Générale", ordre: 1 },
	{ id: "DFC", code: "DFC", libelle: "Direction Financière et Comptable", ordre: 2 },
	{ id: "DT", code: "DT", libelle: "Direction Technique", ordre: 3 },
	{ id: "DAR", code: "DAR", libelle: "Direction Administrative et RH", ordre: 4 },
];

const SERVICES = [
	{ id: "ACHATS", libelle: "Service Achats", directionId: "DFC", source: "PDF" },
	{ id: "COMPTA", libelle: "Comptabilité", directionId: "DFC", source: "PDF" },
	{ id: "ETUDES", libelle: "Service Études et Appels d'Offres", directionId: "DT", source: "PDF" },
	{ id: "AEP", libelle: "Service Adduction d'Eau Potable", directionId: "DT", source: "PDF" },
	{ id: "ASSAIN", libelle: "Service Assainissement", directionId: "DT", source: "PDF" },
	{ id: "ROUTES", libelle: "Service Routes et Voiries", directionId: "DT", source: "PDF" },
	{ id: "LOG", libelle: "Service Logistique", directionId: "DT", source: "Corrigé" },
	{ id: "QHSE", libelle: "Service QHSE", directionId: "DAR", source: "PDF" },
];

/* 30 postes. `superieur` porte la chaîne hiérarchique (congés, ressources). */
const POSTES = [
	// Direction Générale
	{ id: "DIRECTEUR_GENERAL", libelle: "Directeur Général", directionId: "DG", serviceId: null, niveau: "DIRECTION", superieur: null, source: "Ajouté", unique: true },
	{ id: "ASSISTANTE_DIRECTION", libelle: "Assistante de Direction", directionId: "DG", serviceId: null, niveau: "SUPPORT", superieur: "DIRECTEUR_GENERAL", source: "PDF" },

	// Direction Financière et Comptable
	{ id: "DIRECTEUR_FINANCIER", libelle: "Directeur Financier et Comptable", directionId: "DFC", serviceId: null, niveau: "DIRECTION", superieur: "DIRECTEUR_GENERAL", source: "Ajouté", unique: true },
	{ id: "CHEF_ACHATS", libelle: "Chef de Service Achats", directionId: "DFC", serviceId: "ACHATS", niveau: "CADRE", superieur: "DIRECTEUR_FINANCIER", source: "Ajouté" },
	{ id: "ASSISTANT_COMPTABLE", libelle: "Assistant comptable", directionId: "DFC", serviceId: "COMPTA", niveau: "SUPPORT", superieur: "DIRECTEUR_FINANCIER", source: "Ajouté" },

	// Direction Technique
	{ id: "DIRECTEUR_TECHNIQUE", libelle: "Directeur Technique", directionId: "DT", serviceId: null, niveau: "DIRECTION", superieur: "DIRECTEUR_GENERAL", source: "Ajouté", unique: true },
	{ id: "CHARGE_ETUDES", libelle: "Chargé d'études et travaux", directionId: "DT", serviceId: "ETUDES", niveau: "CADRE", superieur: "DIRECTEUR_TECHNIQUE", source: "PDF", note: "Responsable du Service Études, et intervient dans la chaîne chantier au même niveau que le Conducteur de Travaux." },
	{ id: "CHEF_AEP", libelle: "Chef de Service Adduction d'Eau Potable", directionId: "DT", serviceId: "AEP", niveau: "CADRE", superieur: "DIRECTEUR_TECHNIQUE", source: "Ajouté" },
	{ id: "CHEF_ASSAIN", libelle: "Chef de Service Assainissement", directionId: "DT", serviceId: "ASSAIN", niveau: "CADRE", superieur: "DIRECTEUR_TECHNIQUE", source: "Ajouté" },
	{ id: "CHEF_ROUTES", libelle: "Chef de Service Routes et Voiries", directionId: "DT", serviceId: "ROUTES", niveau: "CADRE", superieur: "DIRECTEUR_TECHNIQUE", source: "Ajouté" },
	{ id: "CHEF_LOG", libelle: "Chef de Service Logistique", directionId: "DT", serviceId: "LOG", niveau: "CADRE", superieur: "DIRECTEUR_TECHNIQUE", source: "Ajouté" },
	{ id: "CHEF_GARAGE", libelle: "Chef du Garage", directionId: "DT", serviceId: "LOG", niveau: "CADRE", superieur: "CHEF_LOG", source: "PDF" },
	{ id: "GESTIONNAIRE_STOCKS", libelle: "Gestionnaire de stocks", directionId: "DT", serviceId: "LOG", niveau: "OPERATIONNEL", superieur: "CHEF_LOG", source: "PDF" },
	{ id: "MECANICIEN", libelle: "Mécanicien", directionId: "DT", serviceId: "LOG", niveau: "OPERATIONNEL", superieur: "CHEF_GARAGE", source: "PDF" },
	{ id: "CONDUCTEUR_ENGINS", libelle: "Conducteur d'engins", directionId: "DT", serviceId: "LOG", niveau: "OPERATIONNEL", superieur: "CHEF_GARAGE", source: "PDF" },
	{ id: "CHAUFFEUR", libelle: "Chauffeur", directionId: "DT", serviceId: "LOG", niveau: "OPERATIONNEL", superieur: "CHEF_GARAGE", source: "PDF" },
	{ id: "GARDIEN", libelle: "Gardien", directionId: "DT", serviceId: "LOG", niveau: "OPERATIONNEL", superieur: "CHEF_GARAGE", source: "PDF" },
	{ id: "CONDUCTEUR_TRAVAUX", libelle: "Conducteur de Travaux", directionId: "DT", serviceId: null, niveau: "CADRE", superieur: "DIRECTEUR_TECHNIQUE", source: "PDF", note: "Référent fonctionnel des chantiers — vise les relevés d'activité — mais n'est pas le supérieur hiérarchique des chefs de chantier." },
	{ id: "CHEF_CHANTIER", libelle: "Chef Chantier", directionId: "DT", serviceId: null, niveau: "CADRE", superieur: "DIRECTEUR_TECHNIQUE", source: "PDF" },
	{ id: "CHEF_CHANTIER_ADJOINT", libelle: "Chef Chantier Adjoint", directionId: "DT", serviceId: null, niveau: "CADRE", superieur: "DIRECTEUR_TECHNIQUE", source: "PDF" },
	{ id: "CHEF_EQUIPE", libelle: "Chef d'équipe", directionId: "DT", serviceId: null, niveau: "OPERATIONNEL", superieur: "CHEF_CHANTIER", source: "PDF" },
	{ id: "OUVRIER", libelle: "Ouvrier", directionId: "DT", serviceId: null, niveau: "OPERATIONNEL", superieur: "CHEF_EQUIPE", source: "Ajouté", chantier: true },
	{ id: "MANOEUVRE", libelle: "Manœuvre", directionId: "DT", serviceId: null, niveau: "OPERATIONNEL", superieur: "CHEF_EQUIPE", source: "Ajouté", chantier: true },

	// Direction Administrative et RH
	{ id: "DIRECTEUR_DARH", libelle: "Directeur Administratif et RH", directionId: "DAR", serviceId: null, niveau: "DIRECTION", superieur: "DIRECTEUR_GENERAL", source: "Ajouté", unique: true },
	{ id: "ASSISTANT_RH", libelle: "Assistant RH", directionId: "DAR", serviceId: null, niveau: "SUPPORT", superieur: "DIRECTEUR_DARH", source: "Ajouté" },
	{ id: "COURSIER", libelle: "Coursier", directionId: "DAR", serviceId: null, niveau: "SUPPORT", superieur: "DIRECTEUR_DARH", source: "PDF" },
	{ id: "TECHNICIEN_SURFACE", libelle: "Technicien de surface", directionId: "DAR", serviceId: null, niveau: "OPERATIONNEL", superieur: "DIRECTEUR_DARH", source: "PDF" },
	{ id: "CHEF_QHSE", libelle: "Chef de Service QHSE", directionId: "DAR", serviceId: "QHSE", niveau: "CADRE", superieur: "DIRECTEUR_DARH", source: "Ajouté" },
	{ id: "ASSISTANT_QHSE", libelle: "Assistant QHSE", directionId: "DAR", serviceId: "QHSE", niveau: "SUPPORT", superieur: "CHEF_QHSE", source: "PDF" },
	{ id: "RELAIS_QHSE", libelle: "Relais QHSE", directionId: "DAR", serviceId: "QHSE", niveau: "OPERATIONNEL", superieur: "ASSISTANT_QHSE", source: "PDF" },
];

/* Effectifs fictifs, pour montrer la lecture d'un organigramme peuplé. */
const EFFECTIFS = {
	DIRECTEUR_GENERAL: 1, ASSISTANTE_DIRECTION: 1, DIRECTEUR_FINANCIER: 1,
	CHEF_ACHATS: 1, ASSISTANT_COMPTABLE: 2, DIRECTEUR_TECHNIQUE: 1,
	CHARGE_ETUDES: 2, CHEF_AEP: 1, CHEF_ASSAIN: 1, CHEF_ROUTES: 1,
	CHEF_LOG: 1, CHEF_GARAGE: 1, GESTIONNAIRE_STOCKS: 1, MECANICIEN: 3,
	CONDUCTEUR_ENGINS: 4, CHAUFFEUR: 5, GARDIEN: 3, CONDUCTEUR_TRAVAUX: 3,
	CHEF_CHANTIER: 4, CHEF_CHANTIER_ADJOINT: 3, CHEF_EQUIPE: 8,
	OUVRIER: 24, MANOEUVRE: 17, DIRECTEUR_DARH: 1, ASSISTANT_RH: 1,
	COURSIER: 1, TECHNICIEN_SURFACE: 2, CHEF_QHSE: 1, ASSISTANT_QHSE: 1,
	RELAIS_QHSE: 2,
};

/* ================================================================== */
/* PRIMITIVES                                                          */
/* ================================================================== */

function Infobulle({ texte, cote = "haut", children }) {
	const [visible, setVisible] = useState(false);
	if (!texte) return children;
	const pos = {
		haut: { bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
		gauche: { right: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" },
		droite: { left: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" },
	}[cote];
	return (
		<span className="relative inline-flex"
			onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}
			onFocus={() => setVisible(true)} onBlur={() => setVisible(false)}>
			{children}
			{visible && (
				<span role="tooltip"
					className="pointer-events-none absolute z-50 whitespace-normal rounded-md px-3 py-2 text-xs leading-snug text-white shadow-lg"
					style={{ ...pos, background: "#111827", width: 240 }}>
					{texte}
				</span>
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
		vide: { background: "#fff", color: C.primary, border: `1px solid ${C.primary}` },
		fantome: { background: "transparent", color: C.muted, border: `1px solid ${C.border}` },
	}[variante];
	return (
		<button type="button" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
			style={{ ...v, ...style }} {...p}>{I && <I size={16} />}{children}</button>
	);
};

/* ================================================================== */
/* 1 — ORGANIGRAMME                                                    */
/* ================================================================== */

function Organigramme({ onSelection }) {
	const [ouverts, setOuverts] = useState(() => new Set(DIRECTIONS.map((d) => d.id)));
	const [filtre, setFiltre] = useState("");

	const basculer = (id) =>
		setOuverts((s) => {
			const n = new Set(s);
			n.has(id) ? n.delete(id) : n.add(id);
			return n;
		});

	const correspond = (p) =>
		!filtre || p.libelle.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
			.includes(filtre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

	const effectifDirection = (dirId) =>
		POSTES.filter((p) => p.directionId === dirId).reduce((s, p) => s + (EFFECTIFS[p.id] ?? 0), 0);

	return (
		<div className="space-y-4">
			<div className="relative max-w-md">
				<Search size={16} className="absolute left-3 top-2.5" style={{ color: C.muted }} />
				<input value={filtre} onChange={(e) => setFiltre(e.target.value)}
					placeholder="Rechercher un poste…"
					className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none"
					style={{ borderColor: C.border, background: "#fff" }} />
			</div>

			{DIRECTIONS.map((dir) => {
				const services = SERVICES.filter((s) => s.directionId === dir.id);
				const sansService = POSTES.filter((p) => p.directionId === dir.id && !p.serviceId);
				const ouvert = ouverts.has(dir.id);

				return (
					<Carte key={dir.id} className="overflow-hidden">
						<button type="button" onClick={() => basculer(dir.id)}
							className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
							style={{ background: C.primarySoft }}>
							<div className="flex items-center gap-3">
								{ouvert ? <ChevronDown size={18} style={{ color: C.primary }} /> : <ChevronRight size={18} style={{ color: C.primary }} />}
								<div>
									<div className="font-semibold" style={{ color: C.primary }}>{dir.libelle}</div>
									<div className="text-xs" style={{ color: C.muted }}>
										{services.length} service{services.length > 1 ? "s" : ""} ·
										{" "}{POSTES.filter((p) => p.directionId === dir.id).length} postes ·
										{" "}{effectifDirection(dir.id)} agents
									</div>
								</div>
							</div>
							<code className="text-xs" style={{ color: C.muted }}>{dir.code}</code>
						</button>

						{ouvert && (
							<div className="px-5 py-4">
								{/* Postes rattachés directement à la direction */}
								{sansService.length > 0 && (
									<div className="mb-4">
										<div className="mb-2 flex items-center gap-2">
											<Infobulle texte="Ces postes ne relèvent d'aucun service. Ils sont rattachés directement à la direction — c'est le cas de la chaîne chantier, qui intervient sur les projets de tous les services techniques.">
												<span className="flex items-center gap-1.5 text-xs font-semibold uppercase" style={{ color: C.muted }}>
													<Layers size={13} /> Rattachés à la direction
												</span>
											</Infobulle>
										</div>
										<div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
											{sansService.filter(correspond).map((p) => (
												<CartePoste key={p.id} poste={p} onSelection={onSelection} />
											))}
										</div>
									</div>
								)}

								{/* Services */}
								{services.map((svc) => {
									const postes = POSTES.filter((p) => p.serviceId === svc.id);
									const chef = postes.find((p) => p.niveau === "CADRE" && p.superieur?.startsWith("DIRECTEUR"));
									return (
										<div key={svc.id} className="mb-4 rounded-lg border p-4" style={{ borderColor: C.border }}>
											<div className="mb-3 flex flex-wrap items-center justify-between gap-2">
												<div className="flex items-center gap-2">
													<Building2 size={14} style={{ color: C.primary }} />
													<span className="text-sm font-semibold" style={{ color: C.primary }}>{svc.libelle}</span>
													{svc.source === "Corrigé" && (
														<Infobulle texte="Le PDF officiel place ce service sous la Direction Financière. Le rattachement à la Direction Technique correspond à l'organisation réelle — décision A-02.">
															<Badge fg={C.warning} bg={C.warningSoft}>écart PDF</Badge>
														</Infobulle>
													)}
												</div>
												<span className="text-xs" style={{ color: C.muted }}>
													{postes.length} poste{postes.length > 1 ? "s" : ""} ·
													{" "}{postes.reduce((s, p) => s + (EFFECTIFS[p.id] ?? 0), 0)} agents
												</span>
											</div>

											{chef && (
												<div className="mb-2 text-xs" style={{ color: C.muted }}>
													Encadré par&nbsp;: <strong style={{ color: C.primary }}>{chef.libelle}</strong>
												</div>
											)}

											<div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
												{postes.filter(correspond).map((p) => (
													<CartePoste key={p.id} poste={p} onSelection={onSelection} />
												))}
											</div>
										</div>
									);
								})}
							</div>
						)}
					</Carte>
				);
			})}
		</div>
	);
}

function CartePoste({ poste, onSelection }) {
	const n = NIVEAUX[poste.niveau];
	const effectif = EFFECTIFS[poste.id] ?? 0;

	return (
		<button type="button" onClick={() => onSelection(poste)}
			className="rounded-lg border p-3 text-left transition hover:shadow-sm"
			style={{ borderColor: C.border, background: "#fff" }}>
			<div className="flex items-start justify-between gap-2">
				<span className="text-sm font-medium leading-snug">{poste.libelle}</span>
				{poste.note && (
					<Infobulle cote="gauche" texte={poste.note}>
						<Info size={13} className="mt-0.5 shrink-0" style={{ color: C.review }} />
					</Infobulle>
				)}
			</div>

			<div className="mt-2 flex flex-wrap items-center gap-1.5">
				<Badge fg={n.fg} bg={n.bg}>{n.libelle}</Badge>
				<span className="text-xs" style={{ color: effectif ? C.muted : C.warning }}>
					{effectif ? `${effectif} agent${effectif > 1 ? "s" : ""}` : "aucun titulaire"}
				</span>
				{poste.source === "Ajouté" && (
					<Infobulle texte="Ce poste ne figure pas sur l'organigramme signé. Il a été créé parce que l'application ne peut pas fonctionner sans lui — décision A-04.">
						<Badge fg={C.muted} bg={C.mutedBg}>hors PDF</Badge>
					</Infobulle>
				)}
			</div>
		</button>
	);
}

/* ================================================================== */
/* 2 — CHAÎNE D'APPROBATION                                            */
/* ================================================================== */

function ChaineApprobation({ posteInitial }) {
	const [posteId, setPosteId] = useState(posteInitial?.id ?? "OUVRIER");

	const chaine = useMemo(() => {
		const out = [];
		let courant = POSTES.find((p) => p.id === posteId);
		let garde = 0;
		while (courant && garde < 12) {
			out.push(courant);
			courant = courant.superieur ? POSTES.find((p) => p.id === courant.superieur) : null;
			garde++;
		}
		return out;
	}, [posteId]);

	const poste = POSTES.find((p) => p.id === posteId);

	return (
		<div className="space-y-5">
			<Carte className="p-5">
				<h2 className="text-sm font-semibold" style={{ color: C.primary }}>Chaîne d'approbation hiérarchique</h2>
				<p className="mt-1 max-w-3xl text-xs" style={{ color: C.muted }}>
					Détermine qui approuve les congés, les permissions et les demandes de
					ressources. Un seul niveau intervient — le supérieur direct — conformément
					à la décision B-02.
				</p>

				<div className="mt-4 max-w-md">
					<label className="mb-1.5 block text-sm font-medium">Poste du demandeur</label>
					<select value={posteId} onChange={(e) => setPosteId(e.target.value)}
						className="w-full rounded-md border px-3 py-2 text-sm" style={{ borderColor: C.border }}>
						{DIRECTIONS.map((d) => (
							<optgroup key={d.id} label={d.libelle}>
								{POSTES.filter((p) => p.directionId === d.id).map((p) => (
									<option key={p.id} value={p.id}>{p.libelle}</option>
								))}
							</optgroup>
						))}
					</select>
				</div>
			</Carte>

			<Carte className="p-5">
				<div className="space-y-1">
					{chaine.map((p, i) => {
						const n = NIVEAUX[p.niveau];
						const premier = i === 0;
						const dernier = i === chaine.length - 1;
						return (
							<div key={p.id}>
								<div className="flex items-center gap-3 rounded-lg px-4 py-3"
									style={{
										background: premier ? C.primarySoft : i === 1 ? C.successSoft : C.mutedBg,
										border: i === 1 ? `1px solid ${C.success}` : "1px solid transparent",
									}}>
									<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
										style={{
											background: premier ? C.primary : i === 1 ? C.success : "#D1D5DB",
											color: premier || i === 1 ? "#fff" : "#6B7280",
										}}>
										{premier ? "D" : i}
									</span>
									<div className="min-w-0 flex-1">
										<div className="text-sm font-medium">{p.libelle}</div>
										<div className="text-xs" style={{ color: C.muted }}>
											{premier ? "Demandeur"
												: i === 1 ? "Approbateur — supérieur direct"
												: dernier ? "Sommet de la chaîne"
												: "Niveau supérieur, non sollicité"}
										</div>
									</div>
									<Badge fg={n.fg} bg={n.bg}>{n.libelle}</Badge>
								</div>

								{!dernier && (
									<div className="flex justify-start pl-7">
										<ArrowUp size={14} style={{ color: "#D1D5DB", margin: "2px 0" }} />
									</div>
								)}
							</div>
						);
					})}
				</div>

				{chaine.length >= 2 && (
					<div className="mt-4 flex items-start gap-2 rounded-lg px-4 py-3 text-xs"
						style={{ background: C.successSoft, color: C.success }}>
						<Check size={14} className="mt-0.5 shrink-0" />
						<div>
							Une demande de <strong>{chaine[0].libelle}</strong> est approuvée par
							le <strong>{chaine[1].libelle}</strong>, puis transmise au service
							compétent. Les niveaux au-dessus ne sont pas sollicités.
						</div>
					</div>
				)}

				{chaine.length === 1 && (
					<div className="mt-4 flex items-start gap-2 rounded-lg px-4 py-3 text-xs"
						style={{ background: C.warningSoft, color: C.warning }}>
						<AlertTriangle size={14} className="mt-0.5 shrink-0" />
						Le Directeur Général n'a pas de supérieur. Ses demandes sont réputées
						approuvées à l'étape hiérarchique — décision B-04.
					</div>
				)}
			</Carte>

			{(poste?.id === "CHEF_CHANTIER" || poste?.id === "CHEF_EQUIPE" || poste?.chantier) && (
				<Carte className="p-5" style={{ borderLeft: `3px solid ${C.review}` }}>
					<h3 className="flex items-center gap-2 text-sm font-semibold" style={{ color: C.review }}>
						<GitBranch size={15} /> Chaîne fonctionnelle, distincte
					</h3>
					<p className="mt-1 max-w-3xl text-xs" style={{ color: C.muted }}>
						Pour le <strong>visa des relevés d'activité</strong> et le planning de
						chantier, le référent n'est pas le supérieur hiérarchique mais le
						<strong> Conducteur de Travaux</strong> ou le <strong>Chargé d'études</strong> du
						chantier concerné.
					</p>
					<p className="mt-2 rounded-lg px-4 py-3 text-xs" style={{ background: C.reviewSoft, color: C.review }}>
						Décision A-08 bis. Le code ne doit jamais confondre les deux : le lien
						hiérarchique vient de l'affectation, le lien fonctionnel du chantier.
					</p>
				</Carte>
			)}
		</div>
	);
}

/* ================================================================== */
/* 3 — CONTRÔLE DE COHÉRENCE                                           */
/* ================================================================== */

function Coherence() {
	const controles = useMemo(() => {
		const sansTitulaire = POSTES.filter((p) => !EFFECTIFS[p.id]);
		const sansSuperieur = POSTES.filter((p) => !p.superieur && p.id !== "DIRECTEUR_GENERAL");
		const horsPdf = POSTES.filter((p) => p.source === "Ajouté");

		const charge = {};
		POSTES.forEach((p) => {
			if (!p.superieur) return;
			charge[p.superieur] = (charge[p.superieur] ?? 0) + (EFFECTIFS[p.id] ?? 0);
		});
		const surcharges = Object.entries(charge)
			.filter(([, n]) => n > 15)
			.map(([id, n]) => ({ poste: POSTES.find((p) => p.id === id), effectif: n }))
			.sort((a, b) => b.effectif - a.effectif);

		return { sansTitulaire, sansSuperieur, horsPdf, surcharges };
	}, []);

	const Bloc = ({ icone: I, ton, titre, texte, children }) => {
		const c = { ok: { fg: C.success, bg: C.successSoft }, alerte: { fg: C.warning, bg: C.warningSoft }, info: { fg: C.muted, bg: C.mutedBg } }[ton];
		return (
			<Carte className="p-5">
				<div className="flex items-start gap-3">
					<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: c.bg }}>
						<I size={15} style={{ color: c.fg }} />
					</span>
					<div className="min-w-0 flex-1">
						<h3 className="text-sm font-semibold" style={{ color: c.fg }}>{titre}</h3>
						<p className="mt-0.5 text-xs" style={{ color: C.muted }}>{texte}</p>
						{children}
					</div>
				</div>
			</Carte>
		);
	};

	return (
		<div className="space-y-4">
			<p className="max-w-3xl text-sm" style={{ color: C.muted }}>
				Ces contrôles s'exécutent en continu. Un organigramme incohérent produit des
				demandes qui ne partent nulle part : c'est le premier symptôme à surveiller.
			</p>

			<Bloc icone={Check} ton="ok" titre="Chaîne hiérarchique complète"
				texte={`Les ${POSTES.length - 1} postes hors Direction Générale ont un supérieur défini. Aucune boucle détectée.`} />

			{controles.sansTitulaire.length > 0 && (
				<Bloc icone={CircleAlert} ton="alerte"
					titre={`${controles.sansTitulaire.length} poste(s) sans titulaire`}
					texte="Aucun agent n'occupe ces postes. Une demande adressée à leur détenteur resterait sans destinataire.">
					<div className="mt-3 flex flex-wrap gap-1.5">
						{controles.sansTitulaire.map((p) => (
							<Badge key={p.id} fg={C.warning} bg={C.warningSoft}>{p.libelle}</Badge>
						))}
					</div>
				</Bloc>
			)}

			{controles.surcharges.length > 0 && (
				<Bloc icone={Users} ton="alerte"
					titre="Charge d'approbation élevée"
					texte="Ces postes encadrent un effectif important. Leur absence bloque une part significative des circuits.">
					<div className="mt-3 space-y-2">
						{controles.surcharges.map(({ poste, effectif }) => (
							<div key={poste.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ background: C.warningSoft }}>
								<span className="text-sm">{poste.libelle}</span>
								<span className="text-xs font-semibold" style={{ color: C.warning }}>{effectif} agents encadrés</span>
							</div>
						))}
					</div>
					<p className="mt-3 rounded-lg px-3 py-2 text-xs" style={{ background: C.mutedBg, color: C.muted }}>
						La délégation nommée — décision B-03 — est indispensable pour ces postes,
						non facultative.
					</p>
				</Bloc>
			)}

			<Bloc icone={Info} ton="info"
				titre={`${controles.horsPdf.length} postes absents de l'organigramme signé`}
				texte="Créés parce que l'application ne peut pas fonctionner sans eux. L'organigramme officiel devrait être corrigé et signé à nouveau — action H-02.">
				<div className="mt-3 flex flex-wrap gap-1.5">
					{controles.horsPdf.map((p) => (
						<Badge key={p.id} fg={C.muted} bg={C.mutedBg}>{p.libelle}</Badge>
					))}
				</div>
			</Bloc>
		</div>
	);
}

/* ================================================================== */
/* APPLICATION                                                         */
/* ================================================================== */

const ONGLETS = [
	{ id: "organigramme", label: "Organigramme", icone: Network },
	{ id: "chaine", label: "Chaîne d'approbation", icone: ListTree },
	{ id: "coherence", label: "Contrôle de cohérence", icone: ClipboardCheck },
];

export default function ApercuM1() {
	const [onglet, setOnglet] = useState("organigramme");
	const [posteSel, setPosteSel] = useState(null);

	const effectifTotal = Object.values(EFFECTIFS).reduce((a, b) => a + b, 0);

	return (
		<div className="min-h-screen px-8 py-6" style={{ background: C.bg }}>
			<header className="mb-6 flex flex-wrap items-start justify-between gap-4">
				<div>
					<div className="mb-1 text-xs font-medium uppercase tracking-wide" style={{ color: C.muted }}>
						Module M1 — Organisation
					</div>
					<h1 className="text-2xl font-semibold" style={{ color: C.primary }}>Organigramme</h1>
					<p className="mt-1 max-w-3xl text-sm" style={{ color: C.muted }}>
						Structure arrêtée en section A du registre des décisions. Elle pilote les
						affectations, les circuits d'approbation et les droits d'accès.
					</p>
				</div>
				<Bouton icone={Plus}>Créer un poste</Bouton>
			</header>

			<div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{[
					["Directions", DIRECTIONS.length, "niveaux de pilotage"],
					["Services", SERVICES.length, "unités opérationnelles"],
					["Postes", POSTES.length, "dont 14 hors PDF signé"],
					["Effectif", effectifTotal, "agents affectés"],
				].map(([l, v, s]) => (
					<Carte key={l} className="p-5">
						<div className="text-xs font-medium uppercase" style={{ color: C.muted }}>{l}</div>
						<div className="mt-2 text-2xl font-semibold" style={{ color: C.primary }}>{v}</div>
						<div className="mt-1 text-xs" style={{ color: C.muted }}>{s}</div>
					</Carte>
				))}
			</div>

			<div className="mb-6 flex gap-2 border-b" style={{ borderColor: C.border }}>
				{ONGLETS.map((o) => {
					const actif = onglet === o.id;
					return (
						<button key={o.id} type="button" onClick={() => setOnglet(o.id)}
							className="flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium"
							style={{ borderColor: actif ? C.primary : "transparent", color: actif ? C.primary : C.muted }}>
							<o.icone size={15} />{o.label}
						</button>
					);
				})}
			</div>

			{onglet === "organigramme" && (
				<Organigramme onSelection={(p) => { setPosteSel(p); setOnglet("chaine"); }} />
			)}
			{onglet === "chaine" && <ChaineApprobation posteInitial={posteSel} />}
			{onglet === "coherence" && <Coherence />}

			<p className="mt-8 rounded-lg px-4 py-3 text-xs" style={{ background: C.warningSoft, color: C.warning }}>
				Aperçu — les effectifs sont fictifs, la structure est réelle. Cliquez un poste
				dans l'organigramme pour voir sa chaîne d'approbation.
			</p>
		</div>
	);
}
