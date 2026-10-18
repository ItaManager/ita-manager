import React, { useState, useMemo } from "react";
import {
	Search, Filter, Download, Info, Lock, ArrowUpDown, Clock, Check, X,
	AlertTriangle, TrendingUp, FileSpreadsheet, ChevronDown,
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

const AUJ = new Date("2026-07-30");
const fcfa = (n) => n || n === 0 ? new Intl.NumberFormat("fr-FR").format(n) + " F" : "—";
const dateFr = (i) => i ? new Date(i + "T00:00:00").toLocaleDateString("fr-FR") : "—";
const jours = (a, b) => a && b ? Math.round((new Date(b) - new Date(a)) / 86400000) : null;
const retard = (i) => i ? Math.round((AUJ - new Date(i + "T00:00:00")) / 86400000) : null;

/* ================================================================== */
/* STATUTS                                                             */
/* ================================================================== */

const STATUTS = {
	ATTENTE_N1: { court: "Attente N+1", fg: C.warning, bg: C.warningSoft },
	ATTENTE_ACHATS: { court: "À instruire", fg: C.primary, bg: C.primarySoft },
	ATTENTE_COMITE: { court: "Attente comité", fg: C.review, bg: C.reviewSoft },
	BC_EMIS: { court: "BC émis", fg: C.primary, bg: C.primarySoft },
	PARTIELLE: { court: "Partiellement livrée", fg: C.warning, bg: C.warningSoft },
	SOLDEE: { court: "Soldée", fg: C.success, bg: C.successSoft },
	REFUSEE: { court: "Refusée", fg: C.destructive, bg: C.destructiveSoft },
};

/* ================================================================== */
/* DONNÉES — une ligne par article commandé                            */
/* ================================================================== */

const LIGNES = [
	{
		ref: "DA-2026-041", receptionBesoin: "2026-06-18", transmissionDirecteurs: "2026-06-19",
		besoinValide: "2026-06-21", designation: "Ciment CPA 45 — sac 50 kg", emissionBC: "2026-06-22",
		numBC: "BC-041-SOCIMAT", destination: "Chantier Bouaké Nord", typeDest: "CHANTIER",
		type: "INITIALE", demandeur: "KOFFI Alain", transLogCompta: "2026-06-22",
		livraisonPrevue: "2026-06-28", livraison: "2026-06-27", fournisseur: "SOCIMAT CI",
		facture: "FA-2026-0881", montant: 1_218_000, criteres: "Prix le plus bas — 3 devis",
		statut: "SOLDEE",
	},
	{
		ref: "DA-2026-047", receptionBesoin: "2026-07-24", transmissionDirecteurs: "2026-07-25",
		besoinValide: "2026-07-26", designation: "Ciment CPA 45 — sac 50 kg", emissionBC: "2026-07-26",
		numBC: "BC-047-SOCIMAT", destination: "Chantier Bouaké Nord", typeDest: "CHANTIER",
		type: "INITIALE", demandeur: "KOFFI Alain", transLogCompta: "2026-07-26",
		livraisonPrevue: "2026-07-27", livraison: "2026-07-27", fournisseur: "SOCIMAT CI",
		facture: "FA-2026-0912", montant: 696_000, criteres: "Fournisseur habituel — délai 48 h",
		statut: "SOLDEE",
	},
	{
		ref: "DA-2026-047", receptionBesoin: "2026-07-24", transmissionDirecteurs: "2026-07-25",
		besoinValide: "2026-07-26", designation: "Gravier concassé 5/15", emissionBC: "2026-07-26",
		numBC: "BC-047-CARSUD", destination: "Chantier Bouaké Nord", typeDest: "CHANTIER",
		type: "INITIALE", demandeur: "KOFFI Alain", transLogCompta: "2026-07-26",
		livraisonPrevue: "2026-07-27", livraison: null, fournisseur: "Carrières du Sud",
		facture: null, montant: 580_000, criteres: "Seul fournisseur agréé du secteur",
		statut: "PARTIELLE", reliquat: "8 m³ sur 40",
	},
	{
		ref: "DA-2026-049", receptionBesoin: "2026-07-20", transmissionDirecteurs: "2026-07-21",
		besoinValide: "2026-07-23", designation: "Gasoil", emissionBC: "2026-07-23",
		numBC: "BC-049-TOTAL", destination: "Garage", typeDest: "SERVICE",
		type: "INITIALE", demandeur: "BAKAYOKO Issa", transLogCompta: "2026-07-23",
		livraisonPrevue: "2026-07-25", livraison: "2026-07-25", fournisseur: "Total Énergies CI",
		facture: "FA-2026-0899", montant: 1_510_000, criteres: "Contrat-cadre annuel",
		statut: "SOLDEE",
	},
	{
		ref: "DA-2026-051", receptionBesoin: "2026-07-27", transmissionDirecteurs: null,
		besoinValide: "2026-07-27", designation: "Casque de chantier", emissionBC: null,
		numBC: null, destination: "Service QHSE", typeDest: "SERVICE",
		type: "INITIALE", demandeur: "DIALLO Mariam", transLogCompta: null,
		livraisonPrevue: null, livraison: null, fournisseur: null,
		facture: null, montant: null, criteres: null,
		statut: "ATTENTE_ACHATS",
	},
	{
		ref: "DA-2026-051", receptionBesoin: "2026-07-27", transmissionDirecteurs: null,
		besoinValide: "2026-07-27", designation: "Gants de manutention", emissionBC: null,
		numBC: null, destination: "Service QHSE", typeDest: "SERVICE",
		type: "INITIALE", demandeur: "DIALLO Mariam", transLogCompta: null,
		livraisonPrevue: null, livraison: null, fournisseur: null,
		facture: null, montant: null, criteres: null,
		statut: "ATTENTE_ACHATS",
	},
	{
		ref: "DA-2026-052", receptionBesoin: "2026-07-28", transmissionDirecteurs: "2026-07-28",
		besoinValide: null, designation: "Tuyau PVC DN200", emissionBC: null,
		numBC: null, destination: "Chantier Yopougon phase 2", typeDest: "CHANTIER",
		type: "INITIALE", demandeur: "KOFFI Alain", transLogCompta: null,
		livraisonPrevue: null, livraison: null, fournisseur: "PVC Plus Abidjan",
		facture: null, montant: 3_026_000, criteres: "Meilleur délai — 3 devis comparés",
		statut: "ATTENTE_COMITE",
	},
	{
		ref: "DA-2026-053", receptionBesoin: "2026-07-28", transmissionDirecteurs: null,
		besoinValide: null, designation: "Joint de pompe DN80 — pièce détachée", emissionBC: null,
		numBC: null, destination: "Chantier Bouaké Nord", typeDest: "CHANTIER",
		type: "REGULARISATION", demandeur: "KOFFI Alain", transLogCompta: null,
		livraisonPrevue: null, livraison: "2026-07-26", fournisseur: "Quincaillerie du Nord",
		facture: "REC-4471", montant: 90_000, criteres: "Achat d'urgence — samedi",
		statut: "ATTENTE_N1",
	},
	{
		ref: "DA-2026-044", receptionBesoin: "2026-07-02", transmissionDirecteurs: "2026-07-03",
		besoinValide: "2026-07-08", designation: "Fer à béton HA12 — barre 12 m", emissionBC: "2026-07-09",
		numBC: "BC-044-SOCIMAT", destination: "Chantier Yopougon phase 2", typeDest: "CHANTIER",
		type: "INITIALE", demandeur: "BAMBA Ismaël", transLogCompta: "2026-07-09",
		livraisonPrevue: "2026-07-18", livraison: null, fournisseur: "SOCIMAT CI",
		facture: null, montant: 2_820_000, criteres: "Prix négocié — remise volume 6 %",
		statut: "BC_EMIS",
	},
	{
		ref: "DA-2026-046", receptionBesoin: "2026-07-10", transmissionDirecteurs: "2026-07-11",
		besoinValide: null, designation: "Groupe électrogène 15 kVA", emissionBC: null,
		numBC: null, destination: "Chantier Bouaké Nord", typeDest: "CHANTIER",
		type: "INITIALE", demandeur: "SANOGO Adama", transLogCompta: null,
		livraisonPrevue: null, livraison: null, fournisseur: null,
		facture: null, montant: 4_750_000, criteres: null,
		statut: "REFUSEE",
	},
];

/* ================================================================== */
/* COLONNES — ordre exact du cahier des charges                        */
/* ================================================================== */

const COLONNES = [
	{ id: "ref", libelle: "N° demande", largeur: 130, fige: true, aide: "Renseigné à la création de la demande." },
	{ id: "receptionBesoin", libelle: "Date réception besoin", largeur: 130, aide: "Horodatage de la soumission par le demandeur." },
	{ id: "transmissionDirecteurs", libelle: "Date transmission directeurs", largeur: 150, aide: "Horodatage de l'envoi au comité de validation." },
	{ id: "besoinValide", libelle: "Date besoin validé", largeur: 130, aide: "Dernier avis favorable du comité, ou validation du supérieur si le montant est sous le seuil." },
	{ id: "designation", libelle: "Désignation", largeur: 240, aide: "Article commandé. Une ligne par article." },
	{ id: "emissionBC", libelle: "Date émission BC", largeur: 130, aide: "Horodatage de la génération du bon de commande." },
	{ id: "delai", libelle: "Délai traitement", largeur: 120, calcule: true, aide: "CALCULÉ — date d'émission du BC moins date de réception du besoin. Non stocké." },
	{ id: "numBC", libelle: "N° BC", largeur: 150, aide: "Généré à l'émission, un par fournisseur." },
	{ id: "destination", libelle: "Chantier / Service", largeur: 190, aide: "Imputation de la demande." },
	{ id: "type", libelle: "Type", largeur: 130, aide: "Initiale, ou régularisation d'un achat déjà effectué." },
	{ id: "demandeur", libelle: "Demandeur", largeur: 150, aide: "Le bénéficiaire, non le saisisseur." },
	{ id: "transLogCompta", libelle: "Date trans. log./compta", largeur: 140, aide: "Envoi du bon de commande au fournisseur et notification à la logistique." },
	{ id: "livraison", libelle: "Date livraison", largeur: 140, aide: "Date de VALIDATION DE CONFORMITÉ, non celle où le camion s'est présenté. Une livraison refusée ne remplit pas cette colonne." },
	{ id: "fournisseur", libelle: "Fournisseur", largeur: 170, aide: "Retenu à l'instruction, après mise en concurrence." },
	{ id: "facture", libelle: "Facture", largeur: 130, aide: "Référence enregistrée par la Direction Financière." },
	{ id: "montant", libelle: "Montant", largeur: 130, aligne: "droite", aide: "Montant TTC de la ligne." },
	{ id: "criteres", libelle: "Critères", largeur: 230, aide: "Motif de sélection du fournisseur." },
	{ id: "statut", libelle: "Statut", largeur: 160, calcule: true, aide: "DÉDUIT de l'avancement du circuit. Non stocké." },
];

/* ================================================================== */
/* PRIMITIVES                                                          */
/* ================================================================== */

function Infobulle({ texte, cote = "bas", children }) {
	const [v, setV] = useState(false);
	if (!texte) return children;
	const pos = {
		bas: { top: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
		haut: { bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" },
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

const Carte = ({ children, className = "", style }) => (
	<div className={"rounded-xl bg-white shadow-sm " + className} style={style}>{children}</div>
);

/* ================================================================== */
/* APPLICATION                                                         */
/* ================================================================== */

export default function TableauSuiviAchats() {
	const [q, setQ] = useState("");
	const [filtre, setFiltre] = useState("tous");

	const enrichies = useMemo(() => LIGNES.map((l) => ({
		...l,
		delai: jours(l.receptionBesoin, l.emissionBC),
		enRetard: l.livraisonPrevue && !l.livraison && retard(l.livraisonPrevue) > 0,
		joursRetard: l.livraisonPrevue && !l.livraison ? retard(l.livraisonPrevue) : null,
	})), []);

	const listes = {
		tous: enrichies,
		retards: enrichies.filter((l) => l.enRetard),
		regularisations: enrichies.filter((l) => l.type === "REGULARISATION"),
		encours: enrichies.filter((l) => !["SOLDEE", "REFUSEE"].includes(l.statut)),
	};

	const norm = (t) => (t ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
	const liste = listes[filtre].filter((l) =>
		!q || norm(`${l.ref} ${l.designation} ${l.demandeur} ${l.fournisseur} ${l.destination}`).includes(norm(q)));

	/* Indicateurs */
	const avecDelai = enrichies.filter((l) => l.delai !== null);
	const delaiMoyen = avecDelai.length ? Math.round(avecDelai.reduce((s, l) => s + l.delai, 0) / avecDelai.length) : 0;
	const partRegul = Math.round(listes.regularisations.length / enrichies.length * 100);
	const engage = enrichies.filter((l) => l.statut !== "REFUSEE").reduce((s, l) => s + (l.montant ?? 0), 0);

	/* Décalage cumulé pour les colonnes figées */
	const decalage = (i) => COLONNES.slice(0, i).filter((c) => c.fige).reduce((s, c) => s + c.largeur, 0);

	return (
		<div className="min-h-screen" style={{ background: C.bg }}>
			<header className="border-b bg-white px-8 py-4" style={{ borderColor: C.border }}>
				<div className="flex flex-wrap items-start justify-between gap-4">
					<div>
						<h1 className="text-2xl font-semibold" style={{ color: C.primary }}>Tableau de suivi des demandes d'achat</h1>
						<p className="mt-1 max-w-3xl text-sm" style={{ color: C.muted }}>
							Vue d'ensemble de toutes les demandes et de leurs points de validation.
						</p>
					</div>
					<button type="button" className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium"
						style={{ borderColor: C.primary, color: C.primary }}>
						<FileSpreadsheet size={16} /> Exporter — filtres appliqués
					</button>
				</div>
			</header>

			<main className="px-8 py-6">
				{/* Bandeau lecture seule */}
				<div className="mb-5 flex items-start gap-2 rounded-lg px-4 py-3 text-sm" style={{ background: C.primarySoft, color: C.primary }}>
					<Lock size={16} className="mt-0.5 shrink-0" />
					<div>
						<strong>Lecture seule.</strong> Chaque colonne se remplit automatiquement au
						franchissement d'une étape. Aucune saisie n'est possible : personne ne peut
						antidater une transmission ni corriger un délai. <strong>Une ligne par
						article commandé</strong> — une demande de trois articles répartis sur deux
						fournisseurs produit trois lignes.
					</div>
				</div>

				{/* Indicateurs */}
				<div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					{[
						["Délai moyen de traitement", `${delaiMoyen} jours`, "de la demande au bon de commande", delaiMoyen > 5],
						["Part des régularisations", `${partRegul} %`, "achats hors circuit — signal à surveiller", partRegul > 15],
						["Lignes en retard", listes.retards.length, "date de livraison dépassée", listes.retards.length > 0],
						["Montant engagé", fcfa(engage), "hors demandes refusées", false],
					].map(([l, v, s, alerte]) => (
						<Carte key={l} className="p-5">
							<div className="text-xs font-medium uppercase tracking-wide" style={{ color: C.muted }}>{l}</div>
							<div className="mt-2 text-2xl font-semibold" style={{ color: alerte ? C.warning : C.primary }}>{v}</div>
							<div className="mt-1 text-xs" style={{ color: C.muted }}>{s}</div>
						</Carte>
					))}
				</div>

				{/* Filtres */}
				<div className="mb-4 flex flex-wrap items-center gap-3">
					<div className="relative min-w-64 flex-1 md:max-w-md">
						<Search size={16} className="absolute left-3 top-2.5" style={{ color: C.muted }} />
						<input value={q} onChange={(e) => setQ(e.target.value)}
							placeholder="Référence, article, demandeur, fournisseur, chantier"
							className="w-full rounded-lg border py-2 pl-9 pr-3 text-sm outline-none"
							style={{ borderColor: C.border, background: "#fff" }} />
					</div>

					<div className="flex flex-wrap gap-1.5">
						{[
							["tous", `Toutes (${enrichies.length})`],
							["encours", `En cours (${listes.encours.length})`],
							["retards", `Retards (${listes.retards.length})`],
							["regularisations", `Régularisations (${listes.regularisations.length})`],
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

					<span className="ml-auto text-sm" style={{ color: C.muted }}>
						{liste.length} ligne{liste.length > 1 ? "s" : ""}
					</span>
				</div>

				{/* Tableau */}
				<Carte className="overflow-hidden p-0">
					<div className="overflow-x-auto">
						<table className="text-xs" style={{ minWidth: COLONNES.reduce((s, c) => s + c.largeur, 0) }}>
							<thead>
								<tr style={{ background: C.mutedBg }}>
									{COLONNES.map((c, i) => (
										<th key={c.id}
											className="whitespace-nowrap border-b px-3 py-3 text-left font-semibold uppercase tracking-wide"
											style={{
												width: c.largeur, minWidth: c.largeur, color: C.muted,
												borderColor: C.border, fontSize: 10,
												textAlign: c.aligne === "droite" ? "right" : "left",
												position: c.fige ? "sticky" : undefined,
												left: c.fige ? decalage(i) : undefined,
												background: c.fige ? C.mutedBg : undefined,
												zIndex: c.fige ? 2 : undefined,
												boxShadow: c.fige ? "2px 0 0 " + C.border : undefined,
											}}>
											<Infobulle texte={c.aide}>
												<span className="inline-flex items-center gap-1">
													{c.libelle}
													{c.calcule && <span style={{ color: C.review, fontSize: 9 }}>ƒ</span>}
												</span>
											</Infobulle>
										</th>
									))}
								</tr>
							</thead>

							<tbody>
								{liste.map((l, idx) => {
									const st = STATUTS[l.statut];
									return (
										<tr key={idx} className="border-b hover:bg-gray-50" style={{ borderColor: "#F3F4F6" }}>
											{COLONNES.map((c, i) => {
												const fige = c.fige;
												const style = {
													width: c.largeur, minWidth: c.largeur,
													textAlign: c.aligne === "droite" ? "right" : "left",
													position: fige ? "sticky" : undefined,
													left: fige ? decalage(i) : undefined,
													background: fige ? "#fff" : undefined,
													zIndex: fige ? 1 : undefined,
													boxShadow: fige ? "2px 0 0 " + C.border : undefined,
												};

												let contenu;
												switch (c.id) {
													case "ref":
														contenu = <span className="font-medium" style={{ color: C.primary }}>{l.ref}</span>;
														break;
													case "delai":
														contenu = l.delai !== null ? (
															<Infobulle texte={`${l.delai} jours entre la réception du besoin et l'émission du bon de commande. Valeur calculée, non stockée.`}>
																<span style={{ color: l.delai > 5 ? C.warning : C.success, fontWeight: 600 }}>
																	{l.delai} j
																</span>
															</Infobulle>
														) : <span style={{ color: C.muted }}>—</span>;
														break;
													case "type":
														contenu = l.type === "REGULARISATION"
															? <Infobulle texte="Achat déjà effectué, documenté après coup. Ces demandes sont suivies séparément — leur part est le signal d'alerte du circuit.">
																	<Badge fg={C.warning} bg={C.warningSoft}>Régularisation</Badge>
																</Infobulle>
															: <span style={{ color: C.muted }}>Initiale</span>;
														break;
													case "livraison":
														contenu = l.livraison ? (
															<Infobulle texte="Date de validation de conformité par la logistique, non celle où le camion s'est présenté.">
																<span style={{ color: C.success }}>{dateFr(l.livraison)}</span>
															</Infobulle>
														) : l.enRetard ? (
															<Infobulle texte={`Livraison annoncée le ${dateFr(l.livraisonPrevue)}, non réceptionnée. ${l.joursRetard} jours de retard.`}>
																<span style={{ color: C.destructive, fontWeight: 600 }}>
																	retard {l.joursRetard} j
																</span>
															</Infobulle>
														) : <span style={{ color: C.muted }}>—</span>;
														break;
													case "montant":
														contenu = l.montant
															? <span className="font-medium">{fcfa(l.montant)}</span>
															: <span style={{ color: C.muted }}>—</span>;
														break;
													case "statut":
														contenu = (
															<div className="flex flex-col gap-1">
																<Badge fg={st.fg} bg={st.bg}>{st.court}</Badge>
																{l.reliquat && (
																	<span style={{ color: C.warning, fontSize: 10 }}>reliquat {l.reliquat}</span>
																)}
															</div>
														);
														break;
													case "destination":
														contenu = (
															<span>
																{l.destination}
																{l.typeDest === "CHANTIER" && (
																	<span className="ml-1" style={{ color: C.muted, fontSize: 10 }}>chantier</span>
																)}
															</span>
														);
														break;
													case "criteres":
														contenu = l.criteres
															? <span style={{ color: C.muted }}>{l.criteres}</span>
															: <span style={{ color: "#D1D5DB" }}>—</span>;
														break;
													default: {
														const v = l[c.id];
														const estDate = /^(date|reception|transmission|besoinValide|emission|transLog)/i.test(c.id);
														contenu = v
															? <span>{estDate ? dateFr(v) : v}</span>
															: <span style={{ color: C.muted }}>—</span>;
													}
												}

												return (
													<td key={c.id} className="whitespace-nowrap px-3 py-3" style={style}>
														{contenu}
													</td>
												);
											})}
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>

					{!liste.length && (
						<div className="py-14 text-center">
							<p className="text-sm font-medium">Aucune ligne ne correspond</p>
							<p className="mx-auto mt-1 max-w-md text-sm" style={{ color: C.muted }}>
								Élargissez la recherche ou changez de filtre.
							</p>
						</div>
					)}
				</Carte>

				{/* Légende */}
				<div className="mt-5 grid gap-5 md:grid-cols-2">
					<Carte className="p-5">
						<h2 className="text-sm font-semibold" style={{ color: C.primary }}>Deux colonnes sont calculées</h2>
						<p className="mt-1 text-xs" style={{ color: C.muted }}>
							Marquées <span style={{ color: C.review }}>ƒ</span> dans l'en-tête. Elles
							ne sont pas stockées : les stocker créerait un risque de divergence avec
							les événements.
						</p>
						<ul className="mt-3 space-y-2 text-xs" style={{ color: C.muted }}>
							<li><strong style={{ color: "#374151" }}>Délai traitement</strong> — date d'émission du bon de commande moins date de réception du besoin.</li>
							<li><strong style={{ color: "#374151" }}>Statut</strong> — déduit de l'avancement du circuit.</li>
						</ul>
					</Carte>

					<Carte className="p-5">
						<h2 className="text-sm font-semibold" style={{ color: C.primary }}>Ce que le tableau permet de mesurer</h2>
						<ul className="mt-3 space-y-2 text-xs" style={{ color: C.muted }}>
							<li><strong style={{ color: "#374151" }}>Où le circuit ralentit</strong> — délai moyen par étape.</li>
							<li><strong style={{ color: "#374151" }}>La fiabilité d'un fournisseur</strong> — écart entre date annoncée et conformité validée.</li>
							<li><strong style={{ color: "#374151" }}>La part des régularisations</strong> — au-delà de 15 %, le comité ne contrôle plus grand-chose.</li>
							<li><strong style={{ color: "#374151" }}>Les demandes bloquées</strong> — sans mouvement depuis plusieurs jours.</li>
						</ul>
					</Carte>
				</div>

				<p className="mt-5 text-xs" style={{ color: C.muted }}>
					La colonne <strong>N° demande</strong> reste figée au défilement horizontal —
					sinon on perd la référence en parcourant les seize colonnes.
				</p>
			</main>
		</div>
	);
}
