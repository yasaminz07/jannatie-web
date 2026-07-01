import nodemailer from "nodemailer";

// Gmail SMTP via App Password — set GMAIL_USER and GMAIL_APP_PASSWORD in env
function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD environment variables are required.");
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

export interface MailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  from?: string;
}

export async function sendMail(opts: MailOptions) {
  const transporter = createTransporter();
  const fromName = opts.from ?? "Jannatie";
  const fromAddress = process.env.GMAIL_USER!;

  await transporter.sendMail({
    from: `${fromName} <${fromAddress}>`,
    to: Array.isArray(opts.to) ? opts.to.join(", ") : opts.to,
    replyTo: opts.replyTo,
    subject: opts.subject,
    html: opts.html,
  });
}
