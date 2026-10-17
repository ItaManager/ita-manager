/**
 * Script de test simple pour vérifier l'envoi d'email via Resend
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function main() {
  const emailDest = process.argv[2];

  if (!emailDest) {
    console.log("Usage: npx tsx scripts/test-email-resend.ts EMAIL");
    console.log("\nExemple: npx tsx scripts/test-email-resend.ts votre@email.com");
    process.exit(0);
  }

  console.log("\n📧 Test envoi email Resend\n");
  console.log(`Destinataire : ${emailDest}`);
  console.log(`De           : ${process.env.EMAIL_FROM || "onboarding@resend.dev"}\n`);

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: emailDest,
      subject: "🧪 Test Email - ITA Manager",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
          </head>
          <body style="margin: 0; padding: 40px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1D186C; margin: 0;">🎉 Test réussi !</h1>
              </div>

              <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #1D186C;">
                <p style="margin: 0; color: #1e293b; font-size: 16px;">
                  <strong>Félicitations !</strong> Resend fonctionne correctement.
                </p>
                <p style="margin: 10px 0 0 0; color: #64748b; font-size: 14px;">
                  Cet email de test a été envoyé depuis ITA Manager.
                </p>
              </div>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                  ${new Date().toLocaleString('fr-FR')}
                </p>
              </div>

            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.log("❌ Erreur lors de l'envoi :");
      console.log(error);
      process.exit(1);
    }

    console.log("✅ Email envoyé avec succès !\n");
    console.log("📋 Détails :");
    console.log(`   ID    : ${data?.id}`);
    console.log(`   From  : ${data?.from}`);
    console.log(`   To    : ${data?.to}`);
    console.log("");
    console.log("💡 Vérifiez votre boîte mail (et les spams)\n");
  } catch (error) {
    console.log("❌ Exception :");
    console.log(error);
    process.exit(1);
  }
}

main();
