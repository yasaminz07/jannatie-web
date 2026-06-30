export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { name, email, subject, message } = await request.json() as {
    name: string;
    email: string;
    subject: string;
    message: string;
  };

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Email service not configured. Add RESEND_API_KEY to your environment variables." },
      { status: 503 }
    );
  }

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e293b;">
      <h1 style="font-size:22px;font-weight:700;margin:0 0 4px;">Jannatie</h1>
      <p style="color:#94a3b8;font-size:13px;margin:0 0 28px;">New support request</p>
      <div style="background:#f1f5f9;border-radius:12px;padding:16px 20px;margin:0 0 16px;">
        <p style="font-size:12px;color:#94a3b8;margin:0 0 4px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">From</p>
        <p style="font-size:15px;color:#1e293b;font-weight:600;margin:0;">${name} &lt;${email}&gt;</p>
      </div>
      <div style="background:#f1f5f9;border-radius:12px;padding:16px 20px;margin:0 0 16px;">
        <p style="font-size:12px;color:#94a3b8;margin:0 0 4px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Subject</p>
        <p style="font-size:15px;color:#1e293b;font-weight:600;margin:0;">${subject}</p>
      </div>
      <div style="background:#f1f5f9;border-radius:12px;padding:16px 20px;">
        <p style="font-size:12px;color:#94a3b8;margin:0 0 4px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;">Message</p>
        <p style="font-size:14px;color:#334155;white-space:pre-line;margin:0;">${message}</p>
      </div>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0 16px;" />
      <p style="font-size:12px;color:#cbd5e1;margin:0;">Sent from the Jannatie Support form.</p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Jannatie Support <support@jannatie.com>",
      to: ["jannatieteam@gmail.com"],
      reply_to: email,
      subject: `[Support] ${subject}`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err.message ?? "Email failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
