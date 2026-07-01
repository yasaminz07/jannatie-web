import nodemailer from "nodemailer";
import { Resend } from "resend";

export interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  from?: string;
}

// Use Resend when API key is set (better deliverability, sends from @jannatie.com)
// Falls back to Gmail SMTP for local dev without a Resend key
export async function sendMail(opts: MailOptions) {
  const resendKey = process.env.RESEND_API_KEY;
  const fromName = opts.from ?? "Jannatie";
  const toArray = Array.isArray(opts.to) ? opts.to : [opts.to];

  if (resendKey) {
    const resend = new Resend(resendKey);
    const fromAddress = process.env.RESEND_FROM_EMAIL ?? "noreply@jannatie.com";

    const { error } = await resend.emails.send({
      from: `${fromName} <${fromAddress}>`,
      to: toArray,
      replyTo: opts.replyTo,
      subject: opts.subject,
      html: opts.html,
    });

    if (error) throw new Error(`Resend error: ${error.message}`);
    return;
  }

  // Gmail SMTP fallback
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error("No email provider configured (RESEND_API_KEY or GMAIL_USER/GMAIL_APP_PASSWORD).");

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `${fromName} <${user}>`,
    to: toArray.join(", "),
    replyTo: opts.replyTo,
    subject: opts.subject,
    html: opts.html,
  });
}
