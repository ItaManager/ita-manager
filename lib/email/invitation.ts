import "server-only";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface EnvoyerEmailInvitationParams {
  email: string;
  prenom: string;
  nom: string;
  lienInvitation: string;
}

export async function envoyerEmailInvitation({
  email,
  prenom,
  nom,
  lienInvitation,
}: EnvoyerEmailInvitationParams) {
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "notifications@mail.itamanager.cloud",
    to: email,
    subject: "Bienvenue sur ITA Manager - Créez votre compte",
    html: genererTemplateInvitation({ prenom, nom, lienInvitation }),
  });

  if (error) {
    console.error("[Email Invitation] Erreur:", error);
    throw new Error(`Impossible d'envoyer l'email d'invitation : ${error.message}`);
  }

  return data;
}

function genererTemplateInvitation({
  prenom,
  nom,
  lienInvitation,
}: Omit<EnvoyerEmailInvitationParams, "email">) {
  return `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue sur ITA Manager</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                <!-- En-tête avec logo ITA -->
                <tr>
                  <td style="background: linear-gradient(135deg, #1D186C 0%, #2D1F8C 100%); padding: 40px; text-align: center;">
                    <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 700;">ITA Manager</h1>
                    <p style="color: #e0e0ff; font-size: 14px; margin: 10px 0 0 0;">Plateforme de gestion d'entreprise</p>
                  </td>
                </tr>

                <!-- Contenu principal -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="color: #1D186C; font-size: 24px; margin: 0 0 20px 0; font-weight: 600;">
                      Bonjour ${prenom} ${nom},
                    </h2>

                    <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                      Vous avez été invité(e) à rejoindre <strong>ITA Manager</strong>, la plateforme de gestion de notre entreprise.
                    </p>

                    <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                      Pour activer votre compte et créer votre mot de passe, veuillez cliquer sur le bouton ci-dessous :
                    </p>

                    <!-- Bouton CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 0 0 30px 0;">
                          <a href="${lienInvitation}"
                             style="display: inline-block; background: linear-gradient(135deg, #1D186C 0%, #2D1F8C 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(29, 24, 108, 0.3);">
                            Créer mon compte
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 0 0 10px 0;">
                      Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
                    </p>

                    <p style="color: #1D186C; font-size: 13px; word-break: break-all; background-color: #f7fafc; padding: 12px; border-radius: 6px; border-left: 4px solid #1D186C;">
                      ${lienInvitation}
                    </p>

                    <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e2e8f0;">
                      <p style="color: #a0aec0; font-size: 13px; line-height: 1.6; margin: 0;">
                        <strong>Note de sécurité :</strong> Ce lien d'invitation est unique et expire dans 24 heures.
                        Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.
                      </p>
                    </div>
                  </td>
                </tr>

                <!-- Pied de page -->
                <tr>
                  <td style="background-color: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
                    <p style="color: #718096; font-size: 13px; margin: 0 0 10px 0;">
                      © ${new Date().getFullYear()} ITA SARL - Tous droits réservés
                    </p>
                    <p style="color: #a0aec0; font-size: 12px; margin: 0;">
                      Cet email a été envoyé par ITA Manager
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
