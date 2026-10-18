import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";

// Couleurs de marque ITA (app/globals.css) — pas de dépendance à
// Tailwind ici, les clients email supportent mal le CSS avancé.
const NAVY = "#002a5c";

interface Props {
  lienReinitialisation: string;
}

export default function ReinitialisationMotDePasse({ lienReinitialisation }: Props) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Réinitialisation de votre mot de passe ITA Manager</Preview>
      <Body style={{ backgroundColor: "#f7f7fb", fontFamily: "Arial, sans-serif" }}>
        <Container
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 12,
            padding: 32,
            margin: "40px auto",
            maxWidth: 480,
          }}
        >
          <Heading style={{ color: NAVY, fontSize: 20 }}>ITA Manager</Heading>
          <Text style={{ color: "#111111", fontSize: 15, lineHeight: "22px" }}>
            Une réinitialisation de mot de passe a été demandée pour votre
            compte. Si vous n&apos;êtes pas à l&apos;origine de cette demande,
            ignorez cet e-mail.
          </Text>
          <Button
            href={lienReinitialisation}
            style={{
              backgroundColor: NAVY,
              color: "#ffffff",
              borderRadius: 8,
              padding: "12px 24px",
              fontSize: 15,
              textDecoration: "none",
              display: "inline-block",
              marginTop: 16,
            }}
          >
            Réinitialiser mon mot de passe
          </Button>
          <Text style={{ color: "#6b7280", fontSize: 13, marginTop: 24 }}>
            Ce lien expire dans 1 heure et ne peut être utilisé qu&apos;une
            seule fois.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
