import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    console.log(`[email:dev] to=${to} subject=${subject}\n${html}`);
    return;
  }
  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "onboarding@resend.dev",
    to,
    subject,
    html,
  });
}

export async function sendResetPasswordEmail(to: string, url: string) {
  await send(
    to,
    "Redefina sua senha",
    `<p>Clique no link para redefinir sua senha: <a href="${url}">${url}</a></p>`
  );
}

export async function sendChangeEmailVerification(to: string, url: string) {
  await send(
    to,
    "Confirme seu novo email",
    `<p>Clique no link para confirmar seu novo email: <a href="${url}">${url}</a></p>`
  );
}
