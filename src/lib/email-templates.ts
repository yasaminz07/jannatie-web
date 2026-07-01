const LOGO_URL = "https://jannatie.com/images/logo-white.PNG";
const BRAND_DARK = "#0f172a";
const SUPPORT_EMAIL = "jannatieteam@gmail.com";
const SITE_URL = "https://jannatie.com";
const YEAR = new Date().getFullYear();

function emailWrapper(subtitle: string, body: string, unsubscribeUrl?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Jannatie</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND_DARK};border-radius:16px 16px 0 0;padding:36px 40px 32px;text-align:center;">
              <img src="${LOGO_URL}" alt="Jannatie" width="110" height="auto"
                style="display:block;margin:0 auto 16px;max-width:110px;height:auto;" />
              <p style="color:#64748b;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin:0;">${subtitle}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:40px 40px 36px;border-radius:0 0 16px 16px;">
              ${body}

              <!-- Footer -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                style="border-top:1px solid #e2e8f0;margin-top:36px;padding-top:20px;">
                <tr>
                  <td style="text-align:center;">
                    <p style="font-size:12px;color:#94a3b8;margin:0 0 5px;">
                      &copy; ${YEAR}&nbsp;Jannatie&nbsp;&nbsp;&middot;&nbsp;&nbsp;<a href="${SITE_URL}" style="color:#94a3b8;text-decoration:none;">${SITE_URL.replace("https://", "")}</a>
                    </p>
                    <p style="font-size:11px;color:#cbd5e1;margin:0;">
                      This is an automated message. Please do not reply to this email.
                    </p>
                    ${unsubscribeUrl ? `<p style="font-size:11px;color:#cbd5e1;margin:8px 0 0;"><a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a></p>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function securityEmailHtml(opts: {
  greeting: string;
  label: string;
  maskedValue: string;
}): string {
  const body = `
    <p style="font-size:15px;font-weight:600;color:#1e293b;margin:0 0 10px;">${opts.greeting}</p>
    <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 28px;">
      Your <strong style="color:#1e293b;">${opts.label}</strong> was successfully updated on your Jannatie account.
    </p>

    <!-- Changed value block -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin:0 0 16px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.09em;margin:0 0 6px;">Updated ${opts.label}</p>
          <p style="font-size:17px;font-weight:700;color:#1e293b;margin:0;">${opts.maskedValue}</p>
        </td>
      </tr>
    </table>

    <!-- Warning block -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:12px;margin:0 0 0;">
      <tr>
        <td style="padding:18px 22px;">
          <p style="font-size:13px;color:#92400e;margin:0;line-height:1.7;">
            <strong style="color:#78350f;">Was this you?</strong> If you made this change, no action is needed.<br />
            If you did <strong>not</strong> authorise this change, contact us immediately at
            <a href="mailto:${SUPPORT_EMAIL}" style="color:#b45309;font-weight:600;">${SUPPORT_EMAIL}</a>
            and update your password right away.
          </p>
        </td>
      </tr>
    </table>`;

  return emailWrapper("Account Security Notice", body);
}

export function supportEmailHtml(opts: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): string {
  const body = `
    <p style="font-size:14px;color:#64748b;margin:0 0 24px;line-height:1.6;">
      A new support request was submitted via the Jannatie website.
    </p>

    <!-- Single combined card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
      <tr>
        <td style="padding:18px 22px 14px;">
          <p style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.09em;margin:0 0 6px;">From</p>
          <p style="font-size:15px;font-weight:700;color:#1e293b;margin:0 0 2px;">${opts.name}</p>
          <p style="font-size:13px;color:#64748b;margin:0;">${opts.email}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 22px;"><div style="border-top:1px solid #e2e8f0;"></div></td>
      </tr>
      <tr>
        <td style="padding:14px 22px;">
          <p style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.09em;margin:0 0 6px;">Subject</p>
          <p style="font-size:15px;font-weight:700;color:#1e293b;margin:0;">${opts.subject}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 22px;"><div style="border-top:1px solid #e2e8f0;"></div></td>
      </tr>
      <tr>
        <td style="padding:14px 22px 18px;">
          <p style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.09em;margin:0 0 10px;">Message</p>
          <p style="font-size:14px;color:#334155;line-height:1.75;margin:0;white-space:pre-line;">${opts.message}</p>
        </td>
      </tr>
    </table>`;

  return emailWrapper("New Support Request", body);
}

export function phoneVerifyEmailHtml(opts: {
  greeting: string;
  phone: string;
  code: string;
}): string {
  const digits = opts.code.split("").join("&nbsp;&nbsp;");
  const body = `
    <p style="font-size:15px;font-weight:600;color:#1e293b;margin:0 0 10px;">${opts.greeting}</p>
    <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 28px;">
      Enter the code below to verify your phone number
      <strong style="color:#1e293b;">${opts.phone}</strong> on Jannatie.
    </p>

    <!-- OTP block -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:16px;margin:0 0 28px;">
      <tr>
        <td style="padding:36px 24px;text-align:center;">
          <p style="font-size:11px;font-weight:700;color:#3b82f6;text-transform:uppercase;letter-spacing:0.12em;margin:0 0 16px;">Verification Code</p>
          <p style="font-size:46px;font-weight:800;color:#1d4ed8;letter-spacing:0.25em;margin:0;line-height:1;">${digits}</p>
          <p style="font-size:12px;color:#6b7280;margin:16px 0 0;">Expires in <strong>10 minutes</strong></p>
        </td>
      </tr>
    </table>

    <p style="font-size:14px;color:#64748b;line-height:1.7;margin:0;">
      If you did not request this code, you can safely ignore this email. Your account has not been changed.
    </p>`;

  return emailWrapper("Phone Verification", body);
}

export function supportConfirmEmailHtml(opts: {
  name: string;
  subject: string;
  message: string;
}): string {
  const body = `
    <p style="font-size:15px;font-weight:600;color:#1e293b;margin:0 0 10px;">Assalamu Alaykum ${opts.name},</p>
    <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 28px;">
      Thank you for reaching out — we have received your message and our team will get back to you as soon as possible, in shaa Allah.
    </p>

    <!-- Summary card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin:0 0 24px;">
      <tr>
        <td style="padding:18px 22px 14px;">
          <p style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.09em;margin:0 0 6px;">Your subject</p>
          <p style="font-size:15px;font-weight:700;color:#1e293b;margin:0;">${opts.subject}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 22px;"><div style="border-top:1px solid #e2e8f0;"></div></td>
      </tr>
      <tr>
        <td style="padding:14px 22px 18px;">
          <p style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.09em;margin:0 0 10px;">Your message</p>
          <p style="font-size:14px;color:#334155;line-height:1.75;margin:0;white-space:pre-line;">${opts.message}</p>
        </td>
      </tr>
    </table>

    <p style="font-size:13px;color:#64748b;line-height:1.7;margin:0;">
      If you have any urgent matters, you can also email us directly at
      <a href="mailto:${SUPPORT_EMAIL}" style="color:#2563eb;font-weight:600;">${SUPPORT_EMAIL}</a>.
    </p>`;

  return emailWrapper("Support Request Received", body);
}

export function newsletterWelcomeEmailHtml(opts: { email: string; unsubscribeUrl?: string }): string {
  const body = `
    <p style="font-size:15px;font-weight:600;color:#1e293b;margin:0 0 10px;">Assalamu Alaykum 🌙</p>
    <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 28px;">
      JazakAllah Khair for subscribing to Jannatie! You're now on the list for
      Islamic tips, new features, and updates — sent straight to your inbox.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;margin:0 0 28px;">
      <tr>
        <td style="padding:24px 28px;">
          <p style="font-size:13px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 12px;">What to expect</p>
          <p style="font-size:14px;color:#334155;line-height:1.8;margin:0 0 6px;">🤲 &nbsp;Weekly Islamic reminders and tips</p>
          <p style="font-size:14px;color:#334155;line-height:1.8;margin:0 0 6px;">✨ &nbsp;New features and app updates</p>
          <p style="font-size:14px;color:#334155;line-height:1.8;margin:0;">🌍 &nbsp;Community highlights and events</p>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="margin:0 0 24px;">
      <tr>
        <td style="text-align:center;padding:4px 0;">
          <a href="${SITE_URL}" style="display:inline-block;background-color:#1d4ed8;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:12px;">
            Open Jannatie
          </a>
        </td>
      </tr>
    </table>

    <p style="font-size:13px;color:#94a3b8;text-align:center;margin:0;">
      You subscribed with <strong style="color:#64748b;">${opts.email}</strong>.
      If this wasn't you, ignore this email.
    </p>`;

  return emailWrapper("Welcome to Jannatie", body, opts.unsubscribeUrl);
}

export function passwordResetEmailHtml(opts: { greeting: string; resetUrl: string }): string {
  const body = `
    <p style="font-size:15px;font-weight:600;color:#1e293b;margin:0 0 10px;">${opts.greeting}</p>
    <p style="font-size:15px;color:#475569;line-height:1.7;margin:0 0 28px;">
      We received a request to reset the password for your Jannatie account.
      Click the button below to choose a new password.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="margin:0 0 28px;">
      <tr>
        <td style="text-align:center;padding:4px 0;">
          <a href="${opts.resetUrl}"
            style="display:inline-block;background-color:#1d4ed8;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:16px 36px;border-radius:12px;">
            Reset my password
          </a>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background-color:#fff7ed;border:1px solid #fed7aa;border-radius:12px;margin:0 0 0;">
      <tr>
        <td style="padding:18px 22px;">
          <p style="font-size:13px;color:#92400e;margin:0;line-height:1.7;">
            <strong style="color:#78350f;">Didn't request this?</strong>
            If you didn't ask to reset your password, you can safely ignore this email —
            your account has not been changed.
          </p>
        </td>
      </tr>
    </table>

    <p style="font-size:12px;color:#94a3b8;margin:20px 0 0;text-align:center;">
      This link expires in 1 hour.
    </p>`;

  return emailWrapper("Password Reset", body);
}

export function newsletterEmailHtml(opts: {
  subject: string;
  body: string;
  unsubscribeUrl?: string;
}): string {
  // Convert newlines to <br> and wrap paragraphs
  const formatted = opts.body
    .split(/\n{2,}/)
    .map(p => `<p style="font-size:15px;color:#334155;line-height:1.8;margin:0 0 16px;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");

  const body = `
    <h2 style="font-size:20px;font-weight:700;color:#1e293b;margin:0 0 20px;">${opts.subject}</h2>
    ${formatted}`;

  return emailWrapper("Jannatie Newsletter", body, opts.unsubscribeUrl);
}
