import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { AlertePiece } from "@/lib/logistique/alertes";
import { formaterDateCivile } from "@/lib/dates";

// Couleurs de marque ITA (app/globals.css) — pas de dépendance à
// Tailwind ici, les clients email supportent mal le CSS avancé.
const NAVY = "#002a5c";
const RED = "#dc2626";
const ORANGE = "#ea580c";

interface Props {
  critiques: AlertePiece[];
  hautes: AlertePiece[];
}

export default function LogistiqueEcheances({ critiques, hautes }: Props) {
  const totalAlertes = critiques.length + hautes.length;

  return (
    <Html lang="fr">
      <Head />
      <Preview>
        {`${totalAlertes} pièce${totalAlertes > 1 ? "s" : ""} administrative${totalAlertes > 1 ? "s" : ""} en alerte — ITA Manager`}
      </Preview>
      <Body style={{ backgroundColor: "#f7f7fb", fontFamily: "Arial, sans-serif" }}>
        <Container
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 12,
            padding: 32,
            margin: "40px auto",
            maxWidth: 640,
          }}
        >
          <Heading style={{ color: NAVY, fontSize: 20, marginBottom: 8 }}>
            Logistique — Échéances
          </Heading>

          <Text style={{ color: "#6b7280", fontSize: 14, marginTop: 0 }}>
            Rapport quotidien — {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric"
            })}
          </Text>

          {/* Résumé */}
          <Section
            style={{
              backgroundColor: "#f3f4f6",
              borderRadius: 8,
              padding: 16,
              marginTop: 24,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "bold", margin: 0 }}>
              {totalAlertes} pièce{totalAlertes > 1 ? "s" : ""} administrative{totalAlertes > 1 ? "s" : ""} nécessite{totalAlertes > 1 ? "nt" : ""} votre attention
            </Text>
            <Text style={{ fontSize: 14, color: "#6b7280", margin: "8px 0 0" }}>
              {critiques.length > 0 && (
                <span>
                  <strong style={{ color: RED }}>{critiques.length} périmée{critiques.length > 1 ? "s" : ""}</strong>
                  {hautes.length > 0 && " · "}
                </span>
              )}
              {hautes.length > 0 && (
                <strong style={{ color: ORANGE }}>{hautes.length} à renouveler</strong>
              )}
            </Text>
          </Section>

          {/* Alertes CRITIQUES (périmées) */}
          {critiques.length > 0 && (
            <Section style={{ marginTop: 32 }}>
              <Heading
                as="h2"
                style={{
                  color: RED,
                  fontSize: 16,
                  fontWeight: "bold",
                  marginBottom: 16,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                ⚠️ {critiques.length} pièce{critiques.length > 1 ? "s" : ""} périmée{critiques.length > 1 ? "s" : ""}
              </Heading>

              {critiques.map((alerte) => (
                <Section
                  key={alerte.id}
                  style={{
                    backgroundColor: "#fef2f2",
                    border: `1px solid ${RED}20`,
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "bold", margin: 0 }}>
                    {alerte.materiel.codeIta} — {alerte.materiel.designation}
                  </Text>
                  <Text style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>
                    <strong>{alerte.typePiece.libelle}</strong>
                    {alerte.typePiece.bloquante && " · BLOQUANTE"}
                  </Text>
                  <Text style={{ fontSize: 13, color: RED, margin: "8px 0 0", fontWeight: "bold" }}>
                    Expiré depuis {Math.abs(alerte.joursRestants)} jour{Math.abs(alerte.joursRestants) > 1 ? "s" : ""}
                    {" "}— le {formaterDateCivile(alerte.dateExpiration)}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#6b7280", margin: "4px 0 0" }}>
                    Numéro : {alerte.numero}
                    {alerte.materiel.lieuBase && ` · Lieu : ${alerte.materiel.lieuBase}`}
                  </Text>
                </Section>
              ))}
            </Section>
          )}

          {/* Alertes HAUTES (expiration proche) */}
          {hautes.length > 0 && (
            <Section style={{ marginTop: 32 }}>
              <Heading
                as="h2"
                style={{
                  color: ORANGE,
                  fontSize: 16,
                  fontWeight: "bold",
                  marginBottom: 16,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                📋 {hautes.length} pièce{hautes.length > 1 ? "s" : ""} à renouveler
              </Heading>

              {hautes.map((alerte) => (
                <Section
                  key={alerte.id}
                  style={{
                    backgroundColor: "#fff7ed",
                    border: `1px solid ${ORANGE}20`,
                    borderRadius: 8,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "bold", margin: 0 }}>
                    {alerte.materiel.codeIta} — {alerte.materiel.designation}
                  </Text>
                  <Text style={{ fontSize: 13, color: "#6b7280", margin: "4px 0 0" }}>
                    <strong>{alerte.typePiece.libelle}</strong>
                    {alerte.typePiece.bloquante && " · BLOQUANTE"}
                  </Text>
                  <Text style={{ fontSize: 13, color: ORANGE, margin: "8px 0 0", fontWeight: "bold" }}>
                    Expire dans {alerte.joursRestants} jour{alerte.joursRestants > 1 ? "s" : ""}
                    {" "}— le {formaterDateCivile(alerte.dateExpiration)}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#6b7280", margin: "4px 0 0" }}>
                    Numéro : {alerte.numero}
                    {alerte.materiel.lieuBase && ` · Lieu : ${alerte.materiel.lieuBase}`}
                  </Text>
                </Section>
              ))}
            </Section>
          )}

          {/* Footer */}
          <Text
            style={{
              color: "#9ca3af",
              fontSize: 12,
              marginTop: 40,
              borderTop: "1px solid #e5e7eb",
              paddingTop: 16,
            }}
          >
            Ce message est envoyé automatiquement chaque jour à 6h. Les pièces bloquantes
            empêchent la sortie du matériel — leur renouvellement est prioritaire.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
