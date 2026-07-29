import "server-only";
import { Resend } from "resend";
import type { ReactNode } from "react";

// Emails envoyés par Resend (via un template react-email + generateLink
// Supabase), jamais par l'envoi automatique de Supabase — penser à le
// désactiver côté dashboard Supabase Auth pour les types d'e-mail
// concernés (récupération, invitation), sinon double envoi.
const resend = new Resend(process.env.RESEND_API_KEY!);

export async function envoyerEmail(params: {
  to: string;
  subject: string;
  react: ReactNode;
}) {
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: params.to,
    subject: params.subject,
    react: params.react,
  });

  if (error) {
    throw new Error(`Échec d'envoi de l'e-mail à ${params.to} : ${error.message}`);
  }
}
