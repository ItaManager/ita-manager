import React, { useState, useMemo, useEffect } from "react";
import {
	Wallet, ShieldCheck, Send, Check, X, AlertTriangle, Lock, Clock, Search,
	Loader2, ArrowLeft, ArrowRight, Info, CircleAlert, RefreshCw, FileText,
	Smartphone, Users, Ban, TrendingDown, KeyRound, Eye, Download,
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

const fcfa = (n) => n || n === 0 ? new Intl.NumberFormat("fr-FR").format(n) + " F" : "—";
const heure = (d) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

/* ================================================================== */
/* RÔLES                                                               */
/* ================================================================== */

const ROLES = {
	DFC: { code: "DFC", libelle: "Directeur Financier", nom: "Marc OUATTARA", ini: "MO" },
	DG: { code: "DG", libelle: "Directeur Général", nom: "Dr Jules KONAN", ini: "JK" },
};

const PERMS = {
	DFC: ["paiement:consulter", "paiement:preparer", "paiement:executer"],
	DG: ["paiement:consulter", "paiement:autoriser"],
};
const peut = (r, p) => PERMS[r].includes(p);

/* ================================================================== */
/* HORAIRES — décision 2.3                                             */
/* ================================================================== */

const OUVERTURE = 8;
const LIMITE = 14;

/* Heure simulée, pilotable dans l'aperçu */
function fenetre(heureSimulee) {
	const ouvert = heureSimulee >= OUVERTURE && heureSimulee < LIMITE;
	const minutesRestantes = ouvert ? Math.round((LIMITE - heureSimulee) * 60) : 0;
	const dureeFenetre = Math.min(120, minutesRestantes);
	return { ouvert, minutesRestantes, dureeFenetre };
}

/* ================================================================== */
/* DONNÉES                                                             */
/* ================================================================== */

const SOLDE_INITIAL = 4_280_000;

const BENEFICIAIRES = [
	{ id: "b1", nom: "DOSSO Christ", mobile: "+2250598765432", montant: 142_300, verif: "MATCH", limites: true },
	{ id: "b2", nom: "KABORÉ Salif", mobile: "+2250712345678", montant: 98_000, verif: "MATCH", limites: true },
	{ id: "b3", nom: "TRAORÉ Moussa", mobile: "+2250501122334", montant: 156_800, verif: "MATCH", limites: true },
	{ id: "b4", nom: "OUÉDRAOGO Paul", mobile: "+2250755443322", montant: 121_500, verif: "NAME_NOT_KNOWN", limites: true },
	{ id: "b5", nom: "SANGARÉ Ibrahim", mobile: "+2250566778899", montant: 134_200, verif: "NO_MATCH", limites: true, nomWave: "KONÉ Adama" },
	{ id: "b6", nom: "DIABATÉ Yaya", mobile: "+2250744556677", montant: 178_400, verif: "MATCH", limites: false },
	{ id: "b7", nom: "COULIBALY Adama", mobile: "+2250522334455", montant: 145_000, verif: "MATCH", limites: true },
	{ id: "b8", nom: "BAMBA Seydou", mobile: "+2250766778811", montant: 167_300, verif: "MATCH", limites: true },
];

const DEMANDES_INIT = [
	{
		id: "d1", ref: "PAY-2026-0034", libelle: "Paie journaliers — Chantier Bouaké Nord",
		periode: "Période du 15 au 31 juillet 2026", source: "M7 · Paie chantier",
		lignes: BENEFICIAIRES, statut: "PREPARE", verifieLe: null,
		autorisation: null, tentatives: 0,
	},
	{
		id: "d2", ref: "PAY-2026-0035", libelle: "Facture SOCIMAT CI",
		periode: "Facture FA-2026-0912", source: "M14 · Achats",
		lignes: [{ id: "f1", nom: "SOCIMAT CI", mobile: "+2250700112233", montant: 696_000, verif: "MATCH", limites: true }],
		statut: "PREPARE", verifieLe: null, autorisation: null, tentatives: 0,
	},
];

const STATUTS = {
	PREPARE: { l: "Préparée", fg: C.muted, bg: C.mutedBg },
	VERIFIE: { l: "Bénéficiaires vérifiés", fg: C.primary, bg: C.primarySoft },
	ATTENTE_DG: { l: "Attente autorisation DG", fg: C.warning, bg: C.warningSoft },
	AUTORISE: { l: "Autorisée", fg: C.success, bg: C.successSoft },
	EN_COURS: { l: "Exécution en cours", fg: C.review, bg: C.reviewSoft },
	REUSSI: { l: "Exécutée", fg: C.success, bg: C.successSoft },
	PARTIEL: { l: "Partiellement exécutée", fg: C.warning, bg: C.warningSoft },
	REFUSE: { l: "Refusée par le DG", fg: C.destructive, bg: C.destructiveSoft },
	EXPIRE: { l: "Autorisation expirée", fg: C.destructive, bg: C.destructiveSoft },
};

const VERIF = {
	MATCH: { l: "Vérifié", fg: C.success, bg: C.successSoft, bloque: false },
	NAME_NOT_KNOWN: { l: "Compte non vérifié", fg: C.warning, bg: C.warningSoft, bloque: false },
	NO_MATCH: { l: "Nom différent", fg: C.destructive, bg: C.destructiveSoft, bloque: true },
	HORS_LIMITES: { l: "Plafond atteint", fg: C.destructive, bg: C.destructiveSoft, bloque: true },
};

const etatVerif = (b) => !b.limites ? "HORS_LIMITES" : b.verif;

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

/* ================================================================== */
/* BANDEAU D'AVERTISSEMENT — permanent sur l'exécution                 */
/* ================================================================== */

const BandeauDanger = () => (
	<div className="mb-5 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm"
		style={{ borderColor: C.warningBorder, background: C.warningSoft, color: C.warning }}>
		<AlertTriangle size={16} className="mt-0.5 shrink-0" />
		<div>
			<strong>Les paiements exécutés ici sont irréversibles passé trois jours.</strong>
			<div className="mt-0.5 text-xs">
				Vérifiez le bénéficiaire et le montant avant de confirmer. Une erreur de numéro
				envoie l'argent à un tiers, sans recours.
			</div>
		</div>
	</div>
);

/* ================================================================== */
/* 1 — ÉCRAN DE PRÉPARATION (DFC)                                      */
/* ================================================================== */

function Preparation({ demandes, solde, heureSimulee, onVerifier, onDemander, notifier }) {
	const [ouverte, setOuverte] = useState(null);
	const f = fenetre(heureSimulee);

	return (
		<>
			<header className="mb-6 flex flex-wrap items-start justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold" style={{ color: C.primary }}>Paiements à préparer</h1>
					<p className="mt-1 max-w-3xl text-sm" style={{ color: C.muted }}>
						Vérifiez les bénéficiaires, puis demandez l'autorisation du Directeur Général.
					</p>
				</div>
				<Carte className="px-5 py-3">
					<div className="text-xs font-medium uppercase tracking-wide" style={{ color: C.muted }}>Solde du portefeuille</div>
					<div className="mt-1 text-2xl font-semibold" style={{ color: C.primary }}>{fcfa(solde)}</div>
				</Carte>
			</header>

			{!f.ouvert && (
				<div className="mb-5 flex items-start gap-2 rounded-lg px-4 py-3 text-sm"
					style={{ background: C.destructiveSoft, color: C.destructive }}>
					<Clock size={16} className="mt-0.5 shrink-0" />
					<div>
						<strong>Hors créneau de paiement.</strong> Les paiements s'exécutent du lundi
						au vendredi, entre 8 h et 14 h. Une demande déposée maintenant partira au
						prochain créneau ouvrable.
					</div>
				</div>
			)}

			<div className="space-y-4">
				{demandes.map((d) => {
					const total = d.lignes.reduce((s, l) => s + l.montant, 0);
					const bloquants = d.lignes.filter((l) => VERIF[etatVerif(l)].bloque);
					const st = STATUTS[d.statut];
					const estOuverte = ouverte === d.id;

					return (
						<Carte key={d.id} className="overflow-hidden p-0">
							<button type="button" onClick={() => setOuverte(estOuverte ? null : d.id)}
								className="flex w-full flex-wrap items-center justify-between gap-4 px-5 py-4 text-left">
								<div className="min-w-0">
									<div className="flex flex-wrap items-center gap-2">
										<span className="font-semibold" style={{ color: C.primary }}>{d.libelle}</span>
										<Badge fg={st.fg} bg={st.bg}>{st.l}</Badge>
									</div>
									<div className="mt-0.5 text-xs" style={{ color: C.muted }}>
										{d.ref} · {d.periode} · {d.source}
									</div>
								</div>
								<div className="text-right">
									<div className="text-2xl font-semibold" style={{ color: C.primary }}>{fcfa(total)}</div>
									<div className="text-xs" style={{ color: C.muted }}>
										{d.lignes.length} bénéficiaire{d.lignes.length > 1 ? "s" : ""}
									</div>
								</div>
							</button>

							{estOuverte && (
								<div className="border-t px-5 py-4" style={{ borderColor: "#F3F4F6" }}>
									{/* Bénéficiaires */}
									<div className="overflow-x-auto">
										<table className="w-full text-xs">
											<thead>
												<tr style={{ background: C.mutedBg }}>
													{["Bénéficiaire", "Numéro Wave", "Montant", "Vérification"].map((h) => (
														<th key={h} className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide"
															style={{ color: C.muted, fontSize: 10 }}>{h}</th>
													))}
												</tr>
											</thead>
											<tbody>
												{d.lignes.map((l) => {
													const e = etatVerif(l);
													const v = VERIF[e];
													return (
														<tr key={l.id} className="border-t" style={{ borderColor: "#F3F4F6", background: v.bloque ? C.destructiveSoft : undefined }}>
															<td className="px-3 py-2.5 font-medium">{l.nom}</td>
															<td className="px-3 py-2.5 font-mono">{l.mobile}</td>
															<td className="px-3 py-2.5 font-medium">{fcfa(l.montant)}</td>
															<td className="px-3 py-2.5">
																{d.verifieLe ? (
																	<Infobulle texte={
																		e === "NO_MATCH" ? `Wave connaît ce numéro sous le nom « ${l.nomWave} ». Ne pas payer — vérifiez le numéro.`
																		: e === "HORS_LIMITES" ? "Le plafond mensuel de réception du bénéficiaire est atteint. Il doit relever ses limites chez un agent Wave."
																		: e === "NAME_NOT_KNOWN" ? "Wave n'a pas de pièce d'identité pour ce compte. Le nom ne peut pas être vérifié."
																		: "Le nom déclaré correspond à celui enregistré chez Wave."
																	}>
																		<Badge fg={v.fg} bg={v.bg}>{v.l}</Badge>
																	</Infobulle>
																) : (
																	<span style={{ color: C.muted }}>non vérifié</span>
																)}
															</td>
														</tr>
													);
												})}
											</tbody>
										</table>
									</div>

									{d.verifieLe && bloquants.length > 0 && (
										<div className="mt-4 flex items-start gap-2 rounded-lg px-4 py-3 text-sm"
											style={{ background: C.destructiveSoft, color: C.destructive }}>
											<Ban size={16} className="mt-0.5 shrink-0" />
											<div>
												<strong>{bloquants.length} bénéficiaire{bloquants.length > 1 ? "s" : ""} bloqué{bloquants.length > 1 ? "s" : ""}.</strong>
												<div className="mt-0.5 text-xs">
													Ces lignes ne partiront pas. Les autres restent exécutables — corrigez
													celles-ci et rejouez-les dans une seconde demande.
												</div>
											</div>
										</div>
									)}

									<div className="mt-4 flex flex-wrap items-center justify-between gap-3">
										<div className="text-xs" style={{ color: C.muted }}>
											{d.verifieLe
												? `Vérifié à ${d.verifieLe} · ${d.lignes.length - bloquants.length} ligne(s) exécutable(s)`
												: "Les bénéficiaires doivent être vérifiés auprès de Wave avant toute demande."}
										</div>

										<div className="flex gap-2">
											{!d.verifieLe ? (
												<Bouton variante="vide" icone={ShieldCheck} onClick={() => onVerifier(d.id)}>
													Vérifier les bénéficiaires
												</Bouton>
											) : d.statut === "VERIFIE" ? (
												<Infobulle texte={!f.ouvert
													? "Hors créneau. Les demandes d'autorisation ne sont possibles qu'entre 8 h et 14 h, du lundi au vendredi."
													: `L'autorisation ouvrira une fenêtre de ${f.dureeFenetre} minutes, sans dépasser 14 h.`}>
													<Bouton variante="succes" icone={Send}
														style={!f.ouvert ? { opacity: .4 } : undefined}
														onClick={() => f.ouvert ? onDemander(d.id) : notifier("Hors créneau de paiement", "erreur")}>
														Demander l'autorisation du DG
													</Bouton>
												</Infobulle>
											) : (
												<Badge fg={STATUTS[d.statut].fg} bg={STATUTS[d.statut].bg}>{STATUTS[d.statut].l}</Badge>
											)}
										</div>
									</div>
								</div>
							)}
						</Carte>
					);
				})}
			</div>
		</>
	);
}

/* ================================================================== */
/* 2 — ÉCRAN D'AUTORISATION (DG) — hors coquille, format téléphone     */
/* ================================================================== */

function EcranAutorisation({ demande, solde, heureSimulee, onAutoriser, onRefuser }) {
	const [etape, setEtape] = useState("decision"); // decision · totp · detail
	const [code, setCode] = useState("");
	const [motif, setMotif] = useState("");
	const [refus, setRefus] = useState(false);

	const total = demande.lignes.reduce((s, l) => s + l.montant, 0);
	const bloquants = demande.lignes.filter((l) => VERIF[etatVerif(l)].bloque);
	const executables = demande.lignes.filter((l) => !VERIF[etatVerif(l)].bloque);
	const montantExecutable = executables.reduce((s, l) => s + l.montant, 0);
	const f = fenetre(heureSimulee);

	return (
		<div className="flex min-h-screen items-start justify-center px-4 py-8" style={{ background: C.bg }}>
			<div className="w-full" style={{ maxWidth: 420 }}>
				{/* Identité */}
				<div className="mb-6 flex items-center justify-center gap-3">
					<div className="flex h-11 w-11 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: C.primary }}>ITA</div>
					<div>
						<div className="font-semibold" style={{ color: C.primary }}>ITA Manager</div>
						<div className="text-xs" style={{ color: C.muted }}>Autorisation de paiement</div>
					</div>
				</div>

				<Carte className="overflow-hidden p-0">
					{/* --- Décision --- */}
					{etape === "decision" && (
						<>
							<div className="px-6 py-5">
								<h1 className="text-lg font-semibold" style={{ color: C.primary }}>{demande.libelle}</h1>
								<p className="mt-0.5 text-sm" style={{ color: C.muted }}>{demande.periode}</p>

								<div className="mt-5 rounded-lg p-5 text-center" style={{ background: C.primarySoft }}>
									<div className="text-xs font-medium uppercase tracking-wide" style={{ color: C.muted }}>Montant à autoriser</div>
									<div className="mt-1 text-2xl font-semibold" style={{ color: C.primary }}>{fcfa(montantExecutable)}</div>
									<div className="mt-1 text-sm" style={{ color: C.muted }}>
										{executables.length} bénéficiaire{executables.length > 1 ? "s" : ""}
									</div>
								</div>

								{bloquants.length > 0 && (
									<div className="mt-3 flex items-start gap-2 rounded-lg px-4 py-3 text-xs"
										style={{ background: C.warningSoft, color: C.warning }}>
										<CircleAlert size={14} className="mt-0.5 shrink-0" />
										<div>
											{bloquants.length} bénéficiaire{bloquants.length > 1 ? "s" : ""} exclu{bloquants.length > 1 ? "s" : ""} —
											vérification Wave en échec. Le montant ci-dessus les exclut déjà.
										</div>
									</div>
								)}

								<div className="mt-4 space-y-2 text-sm">
									{[
										["Demandé par", "Marc OUATTARA — Directeur Financier"],
										["Le", `Aujourd'hui à ${String(Math.floor(heureSimulee)).padStart(2, "0")} h ${String(Math.round((heureSimulee % 1) * 60)).padStart(2, "0")}`],
										["Source", demande.source],
										["Solde du portefeuille", fcfa(solde)],
									].map(([k, v]) => (
										<div key={k} className="flex justify-between gap-3">
											<span style={{ color: C.muted }}>{k}</span>
											<span className="text-right font-medium">{v}</span>
										</div>
									))}
								</div>

								<button type="button" onClick={() => setEtape("detail")}
									className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium"
									style={{ borderColor: C.border, color: C.primary }}>
									<Eye size={15} /> Voir le détail des {executables.length} bénéficiaires
								</button>

								<div className="mt-4 flex items-start gap-2 rounded-lg px-4 py-3 text-xs"
									style={{ background: C.mutedBg, color: C.muted }}>
									<Clock size={13} className="mt-0.5 shrink-0" />
									<div>
										Fenêtre d'exécution : <strong>{f.dureeFenetre} minutes</strong> après
										votre validation, sans dépasser 14 h. Passé ce délai, l'autorisation
										expire et devra être redemandée.
									</div>
								</div>

								{refus && (
									<div className="mt-4">
										<label className="mb-1.5 block text-sm font-medium">Motif du refus</label>
										<textarea rows={2} value={motif} onChange={(e) => setMotif(e.target.value)}
											placeholder="Ex : montant supérieur au budget prévu pour cette période"
											className="w-full resize-none rounded-md border px-3 py-2 text-sm outline-none"
											style={{ borderColor: C.border }} />
									</div>
								)}
							</div>

							<div className="flex gap-3 border-t px-6 py-4" style={{ borderColor: "#F3F4F6" }}>
								{refus ? (
									<>
										<Bouton variante="fantome" onClick={() => { setRefus(false); setMotif(""); }} style={{ flex: 1 }}>
											Annuler
										</Bouton>
										<Bouton variante="danger" style={{ flex: 1, opacity: motif.length > 10 ? 1 : .4 }}
											onClick={() => motif.length > 10 && onRefuser(motif)}>
											Confirmer le refus
										</Bouton>
									</>
								) : (
									<>
										<Bouton variante="danger" onClick={() => setRefus(true)} style={{ flex: 1 }}>
											Refuser
										</Bouton>
										<Bouton variante="succes" icone={ShieldCheck} onClick={() => setEtape("totp")} style={{ flex: 1 }}>
											Autoriser
										</Bouton>
									</>
								)}
							</div>
						</>
					)}

					{/* --- Détail --- */}
					{etape === "detail" && (
						<>
							<div className="flex items-center gap-3 border-b px-6 py-4" style={{ borderColor: "#F3F4F6" }}>
								<button type="button" onClick={() => setEtape("decision")} aria-label="Retour"
									className="rounded-full border p-1.5" style={{ borderColor: C.border }}>
									<ArrowLeft size={15} />
								</button>
								<div>
									<div className="text-sm font-semibold" style={{ color: C.primary }}>Bénéficiaires</div>
									<div className="text-xs" style={{ color: C.muted }}>{executables.length} lignes exécutables</div>
								</div>
							</div>

							<div className="max-h-96 overflow-y-auto px-6 py-4">
								<ul className="space-y-2">
									{demande.lignes.map((l) => {
										const e = etatVerif(l);
										const v = VERIF[e];
										return (
											<li key={l.id} className="flex items-start justify-between gap-3 rounded-lg px-3 py-2.5"
												style={{ background: v.bloque ? C.destructiveSoft : C.mutedBg }}>
												<div className="min-w-0">
													<div className="text-sm font-medium">{l.nom}</div>
													<div className="font-mono text-xs" style={{ color: C.muted }}>{l.mobile}</div>
													{v.bloque && (
														<div className="mt-0.5 text-xs" style={{ color: C.destructive }}>{v.l} — exclu</div>
													)}
												</div>
												<div className="shrink-0 text-sm font-medium"
													style={{ color: v.bloque ? C.muted : "inherit", textDecoration: v.bloque ? "line-through" : undefined }}>
													{fcfa(l.montant)}
												</div>
											</li>
										);
									})}
								</ul>
							</div>

							<div className="border-t px-6 py-4" style={{ borderColor: "#F3F4F6" }}>
								<Bouton onClick={() => setEtape("decision")} style={{ width: "100%" }}>
									Retour à la décision
								</Bouton>
							</div>
						</>
					)}

					{/* --- TOTP --- */}
					{etape === "totp" && (
						<div className="px-6 py-6">
							<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ background: C.successSoft }}>
								<KeyRound size={20} style={{ color: C.success }} />
							</div>

							<h2 className="mt-4 text-center text-lg font-semibold" style={{ color: C.primary }}>
								Confirmez avec votre code
							</h2>
							<p className="mt-1 text-center text-sm" style={{ color: C.muted }}>
								Ouvrez votre application d'authentification et saisissez le code à six
								chiffres.
							</p>

							<div className="mt-5 rounded-lg p-4 text-center" style={{ background: C.primarySoft }}>
								<div className="text-xs" style={{ color: C.muted }}>Vous autorisez</div>
								<div className="mt-0.5 text-2xl font-semibold" style={{ color: C.primary }}>{fcfa(montantExecutable)}</div>
								<div className="text-xs" style={{ color: C.muted }}>vers {executables.length} bénéficiaires</div>
							</div>

							<div className="mt-5">
								<label className="mb-1.5 block text-sm font-medium">Code à six chiffres</label>
								<input value={code} inputMode="numeric" autoComplete="one-time-code" maxLength={6}
									onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
									placeholder="000000"
									className="w-full rounded-md border px-3 py-2 text-center outline-none"
									style={{ borderColor: C.border, fontSize: 20, letterSpacing: 8, fontFamily: "monospace" }} />
								<p className="mt-1.5 text-xs" style={{ color: C.muted }}>
									Ce code ne se transmet pas. Il prouve que c'est bien vous.
								</p>
							</div>

							<div className="mt-5 flex gap-3">
								<Bouton variante="fantome" onClick={() => { setEtape("decision"); setCode(""); }} style={{ flex: 1 }}>
									Retour
								</Bouton>
								<Bouton variante="succes" icone={Check} style={{ flex: 1, opacity: code.length === 6 ? 1 : .4 }}
									onClick={() => code.length === 6 && onAutoriser()}>
									Confirmer
								</Bouton>
							</div>
						</div>
					)}
				</Carte>

				<p className="mt-4 text-center text-xs" style={{ color: C.muted }}>
					Écran hors de l'application — pas de menu, pas de navigation.
					Vous décidez et vous fermez.
				</p>
			</div>
		</div>
	);
}

/* ================================================================== */
/* 3 — ÉCRAN D'EXÉCUTION (DFC)                                         */
/* ================================================================== */

function Execution({ demande, solde, heureSimulee, onExecuter, resultats, enCours }) {
	const [confirme, setConfirme] = useState(false);
	const executables = demande.lignes.filter((l) => !VERIF[etatVerif(l)].bloque);
	const montant = executables.reduce((s, l) => s + l.montant, 0);
	const f = fenetre(heureSimulee);

	const expire = demande.autorisation
		? new Date(demande.autorisation.expireLe)
		: null;
	const expiree = expire && new Date() > expire;

	return (
		<>
			<header className="mb-6">
				<h1 className="text-2xl font-semibold" style={{ color: C.primary }}>Exécution</h1>
				<p className="mt-1 max-w-3xl text-sm" style={{ color: C.muted }}>
					L'autorisation du Directeur Général est valide. Le paiement peut être exécuté.
				</p>
			</header>

			<BandeauDanger />

			<div className="grid gap-5 xl:grid-cols-3">
				<div className="space-y-5 xl:col-span-2">
					<Carte className="p-5">
						<div className="flex flex-wrap items-start justify-between gap-4">
							<div>
								<h2 className="font-semibold" style={{ color: C.primary }}>{demande.libelle}</h2>
								<p className="mt-0.5 text-xs" style={{ color: C.muted }}>{demande.ref} · {demande.periode}</p>
							</div>
							<div className="text-right">
								<div className="text-2xl font-semibold" style={{ color: C.primary }}>{fcfa(montant)}</div>
								<div className="text-xs" style={{ color: C.muted }}>{executables.length} bénéficiaires</div>
							</div>
						</div>

						{/* Résultats */}
						{resultats.length > 0 && (
							<div className="mt-5 overflow-x-auto">
								<table className="w-full text-xs">
									<thead>
										<tr style={{ background: C.mutedBg }}>
											{["Bénéficiaire", "Montant", "Résultat", "Réf. Wave"].map((h) => (
												<th key={h} className="px-3 py-2.5 text-left font-semibold uppercase tracking-wide"
													style={{ color: C.muted, fontSize: 10 }}>{h}</th>
											))}
										</tr>
									</thead>
									<tbody>
										{resultats.map((r) => (
											<tr key={r.id} className="border-t" style={{ borderColor: "#F3F4F6" }}>
												<td className="px-3 py-2.5 font-medium">{r.nom}</td>
												<td className="px-3 py-2.5">{fcfa(r.montant)}</td>
												<td className="px-3 py-2.5">
													{r.etat === "encours" ? (
														<span className="inline-flex items-center gap-1.5" style={{ color: C.review }}>
															<Loader2 size={12} className="animate-spin" /> en cours
														</span>
													) : r.etat === "reussi" ? (
														<Badge fg={C.success} bg={C.successSoft}>Réussi</Badge>
													) : r.etat === "attente" ? (
														<Infobulle texte="Wave a renvoyé une erreur serveur. L'état du transfert est INCONNU — il a peut-être abouti. Ne jamais rejouer sans interroger d'abord.">
															<Badge fg={C.warning} bg={C.warningSoft}>État inconnu</Badge>
														</Infobulle>
													) : (
														<Infobulle texte={r.erreur}>
															<Badge fg={C.destructive} bg={C.destructiveSoft}>Échoué</Badge>
														</Infobulle>
													)}
												</td>
												<td className="px-3 py-2.5 font-mono" style={{ color: C.muted }}>{r.waveId ?? "—"}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</Carte>

					{resultats.length === 0 && (
						<Carte className="p-5">
							<h3 className="text-sm font-semibold" style={{ color: C.primary }}>Confirmation</h3>
							<p className="mt-1 text-xs" style={{ color: C.muted }}>
								Relisez avant d'exécuter. Les transferts partent immédiatement.
							</p>

							<div className="mt-4 space-y-2 rounded-lg p-4 text-sm" style={{ background: C.mutedBg }}>
								{[
									["Montant total", fcfa(montant)],
									["Bénéficiaires", `${executables.length}`],
									["Solde après exécution", fcfa(solde - montant)],
								].map(([k, v]) => (
									<div key={k} className="flex justify-between gap-3">
										<span style={{ color: C.muted }}>{k}</span>
										<span className="font-medium">{v}</span>
									</div>
								))}
							</div>

							<label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-lg border px-4 py-3"
								style={{ borderColor: confirme ? C.success : C.border, background: confirme ? C.successSoft : "#fff" }}>
								<input type="checkbox" checked={confirme} onChange={(e) => setConfirme(e.target.checked)}
									className="mt-0.5" />
								<span className="text-sm">
									J'ai vérifié les {executables.length} bénéficiaires et le montant de{" "}
									<strong>{fcfa(montant)}</strong>.
								</span>
							</label>

							<div className="mt-4">
								<Bouton variante="succes" icone={Send}
									style={{ width: "100%", opacity: confirme && !expiree && f.ouvert && !enCours ? 1 : .4 }}
									onClick={() => confirme && !expiree && f.ouvert && !enCours && onExecuter()}>
									{enCours ? <><Loader2 size={16} className="animate-spin" /> Exécution en cours…</> : "Exécuter les paiements"}
								</Bouton>
							</div>
						</Carte>
					)}
				</div>

				{/* Colonne latérale */}
				<div className="space-y-5">
					<Carte className="p-5" style={{ borderLeft: `3px solid ${expiree ? C.destructive : C.success}` }}>
						<h3 className="flex items-center gap-2 text-sm font-semibold" style={{ color: expiree ? C.destructive : C.success }}>
							<ShieldCheck size={15} /> Autorisation
						</h3>
						{demande.autorisation ? (
							<div className="mt-3 space-y-2 text-xs">
								{[
									["Autorisée par", "Dr Jules KONAN"],
									["Le", demande.autorisation.le],
									["Expire à", demande.autorisation.expireLeAffiche],
									["Montant figé", fcfa(demande.autorisation.montantFige)],
								].map(([k, v]) => (
									<div key={k} className="flex justify-between gap-3">
										<span style={{ color: C.muted }}>{k}</span>
										<span className="text-right font-medium">{v}</span>
									</div>
								))}
							</div>
						) : (
							<p className="mt-2 text-xs" style={{ color: C.muted }}>Aucune autorisation.</p>
						)}

						{expiree && (
							<p className="mt-3 rounded-lg px-3 py-2 text-xs" style={{ background: C.destructiveSoft, color: C.destructive }}>
								Autorisation expirée. Redemandez-la au Directeur Général.
							</p>
						)}
					</Carte>

					<Carte className="p-5">
						<h3 className="text-sm font-semibold" style={{ color: C.primary }}>Portefeuille Wave</h3>
						<div className="mt-2 text-2xl font-semibold" style={{ color: C.primary }}>{fcfa(solde)}</div>
						<div className="mt-1 text-xs" style={{ color: C.muted }}>
							Solde disponible, frais compris
						</div>
						{solde < montant && (
							<p className="mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs" style={{ background: C.destructiveSoft, color: C.destructive }}>
								<TrendingDown size={13} className="mt-0.5 shrink-0" />
								Solde insuffisant pour ce paiement.
							</p>
						)}
					</Carte>

					<Carte className="p-5">
						<h3 className="text-sm font-semibold" style={{ color: C.primary }}>Créneau</h3>
						<div className="mt-2 text-sm">
							{f.ouvert
								? <span style={{ color: C.success }}>Ouvert — clôture à 14 h 00</span>
								: <span style={{ color: C.destructive }}>Fermé</span>}
						</div>
						<div className="mt-1 text-xs" style={{ color: C.muted }}>
							Lundi au vendredi, 8 h — 14 h
						</div>
					</Carte>
				</div>
			</div>
		</>
	);
}

/* ================================================================== */
/* APPLICATION                                                         */
/* ================================================================== */

const NAV = [
	{ id: "preparer", label: "À préparer", icone: FileText, perm: "paiement:preparer" },
	{ id: "executer", label: "Exécution", icone: Send, perm: "paiement:executer" },
	{ id: "releves", label: "Relevés", icone: Download, perm: "paiement:consulter" },
];

export default function ApercuItaPay() {
	const [role, setRole] = useState("DFC");
	const [ecran, setEcran] = useState("preparer");
	const [heureSimulee, setHeureSimulee] = useState(9.25);
	const [demandes, setDemandes] = useState(DEMANDES_INIT);
	const [solde, setSolde] = useState(SOLDE_INITIAL);
	const [resultats, setResultats] = useState([]);
	const [enCours, setEnCours] = useState(false);
	const [toast, setToast] = useState(null);

	const notifier = (m, ton = "succes") => { setToast({ m, ton }); setTimeout(() => setToast(null), 4000); };
	const u = ROLES[role];

	const enAttenteDG = demandes.find((d) => d.statut === "ATTENTE_DG");
	const autorisee = demandes.find((d) => d.statut === "AUTORISE");

	/* --- Actions --- */

	const verifier = (id) => {
		notifier("Vérification auprès de Wave…");
		setTimeout(() => {
			setDemandes((ds) => ds.map((d) => d.id === id
				? { ...d, verifieLe: heure(new Date()), statut: "VERIFIE" } : d));
			const d = demandes.find((x) => x.id === id);
			const bloq = d.lignes.filter((l) => VERIF[etatVerif(l)].bloque).length;
			notifier(bloq
				? `${d.lignes.length} vérifiés — ${bloq} bloqué(s), voir le détail`
				: `${d.lignes.length} bénéficiaires vérifiés`, bloq ? "avertissement" : "succes");
		}, 900);
	};

	const demanderAutorisation = (id) => {
		const f = fenetre(heureSimulee);
		const expireH = Math.min(heureSimulee + f.dureeFenetre / 60, LIMITE);
		const d = demandes.find((x) => x.id === id);
		const montantFige = d.lignes.filter((l) => !VERIF[etatVerif(l)].bloque).reduce((s, l) => s + l.montant, 0);

		setDemandes((ds) => ds.map((x) => x.id === id ? {
			...x, statut: "ATTENTE_DG",
			autorisation: {
				le: `${String(Math.floor(heureSimulee)).padStart(2, "0")} h ${String(Math.round((heureSimulee % 1) * 60)).padStart(2, "0")}`,
				expireLe: new Date(Date.now() + f.dureeFenetre * 60000).toISOString(),
				expireLeAffiche: `${String(Math.floor(expireH)).padStart(2, "0")} h ${String(Math.round((expireH % 1) * 60)).padStart(2, "0")}`,
				montantFige,
			},
		} : x));
		notifier("Demande envoyée — le Directeur Général a reçu une notification");
	};

	const autoriser = () => {
		setDemandes((ds) => ds.map((d) => d.statut === "ATTENTE_DG" ? { ...d, statut: "AUTORISE" } : d));
		setRole("DFC");
		setEcran("executer");
		notifier("Paiement autorisé — fenêtre d'exécution ouverte");
	};

	const refuser = (motif) => {
		setDemandes((ds) => ds.map((d) => d.statut === "ATTENTE_DG" ? { ...d, statut: "REFUSE", motifRefus: motif } : d));
		setRole("DFC");
		setEcran("preparer");
		notifier("Paiement refusé — le Directeur Financier est informé", "erreur");
	};

	const executer = () => {
		const d = demandes.find((x) => x.statut === "AUTORISE");
		const lignes = d.lignes.filter((l) => !VERIF[etatVerif(l)].bloque);
		setEnCours(true);
		setResultats(lignes.map((l) => ({ ...l, etat: "encours", waveId: null })));

		lignes.forEach((l, i) => {
			setTimeout(() => {
				/* Le sixième simule une erreur serveur — état inconnu */
				const erreurServeur = i === 5;
				setResultats((rs) => rs.map((r) => r.id === l.id ? {
					...r,
					etat: erreurServeur ? "attente" : "reussi",
					waveId: erreurServeur ? null : "pt-" + Math.random().toString(36).slice(2, 13),
					erreur: erreurServeur ? "HTTP 503 — service momentanément indisponible" : null,
				} : r));

				if (!erreurServeur) setSolde((s) => s - l.montant);

				if (i === lignes.length - 1) {
					setEnCours(false);
					setDemandes((ds) => ds.map((x) => x.id === d.id ? { ...x, statut: "PARTIEL" } : x));
					notifier("Exécution terminée — 1 paiement en état inconnu, à interroger", "avertissement");
				}
			}, 700 * (i + 1));
		});
	};

	/* --- Écran DG, hors coquille --- */
	if (role === "DG" && enAttenteDG) {
		return (
			<>
				<EcranAutorisation demande={enAttenteDG} solde={solde} heureSimulee={heureSimulee}
					onAutoriser={autoriser} onRefuser={refuser} />
				<BarreSimulation role={role} setRole={setRole} heureSimulee={heureSimulee} setHeureSimulee={setHeureSimulee} />
				<Toast toast={toast} />
			</>
		);
	}

	return (
		<div className="flex min-h-screen" style={{ background: C.bg }}>
			<aside className="w-60 shrink-0 border-r bg-white" style={{ borderColor: C.border }}>
				<div className="flex items-center gap-2.5 px-5 py-5">
					<div className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: C.primary }}>ITA</div>
					<div>
						<div className="text-sm font-semibold" style={{ color: C.primary }}>ItaPay</div>
						<div className="text-xs" style={{ color: C.muted }}>Paiements</div>
					</div>
				</div>

				<nav className="px-3">
					{NAV.filter((i) => peut(role, i.perm)).map((i) => {
						const actif = ecran === i.id;
						const badge = i.id === "executer" && autorisee ? 1 : 0;
						return (
							<button key={i.id} type="button" onClick={() => setEcran(i.id)}
								className="mb-0.5 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm"
								style={{ background: actif ? C.primarySoft : "transparent", color: actif ? C.primary : "#374151", fontWeight: actif ? 600 : 400 }}>
								<span className="flex items-center gap-2.5"><i.icone size={16} />{i.label}</span>
								{badge > 0 && (
									<span className="rounded-full px-1.5 py-0.5 text-xs font-semibold text-white" style={{ background: C.warning }}>{badge}</span>
								)}
							</button>
						);
					})}
				</nav>

				<div className="mx-3 mt-5 rounded-lg p-4" style={{ background: C.mutedBg }}>
					<div className="text-xs font-medium uppercase tracking-wide" style={{ color: C.muted }}>Portefeuille</div>
					<div className="mt-1 text-sm font-semibold" style={{ color: C.primary }}>{fcfa(solde)}</div>
				</div>
			</aside>

			<div className="flex min-w-0 flex-1 flex-col">
				<header className="sticky top-0 z-20 flex items-center justify-end gap-4 border-b bg-white px-8 py-3" style={{ borderColor: C.border }}>
					<div className="flex items-center gap-2">
						<div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: C.success }}>{u.ini}</div>
						<div className="text-xs">
							<div className="font-medium">{u.nom}</div>
							<div style={{ color: C.muted }}>{u.libelle}</div>
						</div>
					</div>
				</header>

				<main className="flex-1 px-8 py-6 pb-24">
					{ecran === "preparer" && (
						<Preparation demandes={demandes} solde={solde} heureSimulee={heureSimulee}
							onVerifier={verifier} onDemander={demanderAutorisation} notifier={notifier} />
					)}

					{ecran === "executer" && (
						autorisee || resultats.length > 0 ? (
							<Execution demande={autorisee ?? demandes.find((d) => d.statut === "PARTIEL")}
								solde={solde} heureSimulee={heureSimulee}
								onExecuter={executer} resultats={resultats} enCours={enCours} />
						) : (
							<>
								<header className="mb-6">
									<h1 className="text-2xl font-semibold" style={{ color: C.primary }}>Exécution</h1>
								</header>
								<Carte className="py-16 text-center">
									<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ background: C.mutedBg }}>
										<Send size={22} style={{ color: C.muted }} />
									</div>
									<p className="mt-4 text-sm font-medium">Aucun paiement autorisé</p>
									<p className="mx-auto mt-1 max-w-md text-sm" style={{ color: C.muted }}>
										Préparez une demande, faites-la autoriser par le Directeur Général,
										puis revenez ici.
									</p>
								</Carte>
							</>
						)
					)}

					{ecran === "releves" && (
						<>
							<header className="mb-6">
								<h1 className="text-2xl font-semibold" style={{ color: C.primary }}>Relevés de paiement</h1>
								<p className="mt-1 text-sm" style={{ color: C.muted }}>
									Un relevé par paiement exécuté. Pièce comptable exportable.
								</p>
							</header>
							<Carte className="py-16 text-center">
								<div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full" style={{ background: C.mutedBg }}>
									<Download size={22} style={{ color: C.muted }} />
								</div>
								<p className="mt-4 text-sm font-medium">Aucun relevé</p>
								<p className="mx-auto mt-1 max-w-md text-sm" style={{ color: C.muted }}>
									Les relevés apparaîtront après le premier paiement exécuté.
								</p>
							</Carte>
						</>
					)}
				</main>
			</div>

			<BarreSimulation role={role} setRole={setRole} heureSimulee={heureSimulee} setHeureSimulee={setHeureSimulee} />
			<Toast toast={toast} />
		</div>
	);
}

/* ================================================================== */
/* BARRE DE SIMULATION — dispositif d'aperçu uniquement                */
/* ================================================================== */

function BarreSimulation({ role, setRole, heureSimulee, setHeureSimulee }) {
	const f = fenetre(heureSimulee);
	return (
		<div className="fixed bottom-0 left-0 right-0 z-40 border-t px-6 py-3"
			style={{ borderColor: C.warningBorder, background: C.warningSoft }}>
			<div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-2 text-xs" style={{ color: C.warning }}>
					<Info size={14} />
					<span>Aperçu — dispositif de simulation</span>
				</div>

				<div className="flex flex-wrap items-center gap-4">
					<div className="flex items-center gap-2">
						<span className="text-xs" style={{ color: C.warning }}>Rôle</span>
						<select value={role} onChange={(e) => setRole(e.target.value)}
							className="rounded-lg border bg-white px-3 py-1.5 text-xs font-medium"
							style={{ borderColor: C.warningBorder, color: C.primary }}>
							{Object.values(ROLES).map((r) => <option key={r.code} value={r.code}>{r.libelle}</option>)}
						</select>
					</div>

					<div className="flex items-center gap-2">
						<span className="text-xs" style={{ color: C.warning }}>Heure</span>
						<input type="range" min="6" max="18" step="0.25" value={heureSimulee}
							onChange={(e) => setHeureSimulee(Number(e.target.value))}
							className="w-32" aria-label="Heure simulée" />
						<span className="w-24 font-mono text-xs" style={{ color: C.primary }}>
							{String(Math.floor(heureSimulee)).padStart(2, "0")} h {String(Math.round((heureSimulee % 1) * 60)).padStart(2, "0")}
						</span>
						<Badge fg={f.ouvert ? C.success : C.destructive} bg="#fff">
							{f.ouvert ? `ouvert · ${f.dureeFenetre} min` : "fermé"}
						</Badge>
					</div>
				</div>
			</div>
		</div>
	);
}

function Toast({ toast }) {
	if (!toast) return null;
	const bg = { succes: C.primary, erreur: C.destructive, avertissement: C.warning }[toast.ton] ?? C.primary;
	return (
		<div className="fixed bottom-20 right-6 z-[60] flex max-w-sm items-start gap-2 rounded-lg px-5 py-3 text-sm text-white shadow-lg"
			style={{ background: bg }}>
			<Check size={16} className="mt-0.5 shrink-0" />{toast.m}
		</div>
	);
}
