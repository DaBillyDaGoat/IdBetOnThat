// Resend wrapper. All transactional email goes through here so we have one
// place to swap providers if we ever leave Resend.

import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

function getClient(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY not set. Add it to .env.");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendMagicLinkEmail(args: {
  to: string;
  url: string;
}): Promise<void> {
  const { to, url } = args;
  const client = getClient();

  const subject = "Your sign-in link for idbetonthat";
  const text = [
    `Click the link below to sign in to idbetonthat:`,
    ``,
    `${url}`,
    ``,
    `This link expires in 24 hours. If you didn't request it, you can ignore this email.`,
  ].join("\n");

  const html = renderMagicLinkHtml(url);

  const result = await client.emails.send({
    from: FROM,
    to,
    subject,
    text,
    html,
  });

  if (result.error) {
    // Surface Resend errors so we don't fail silently.
    console.error("Resend send failed", result.error);
    throw new Error(`Failed to send sign-in email: ${result.error.message}`);
  }
}

function renderMagicLinkHtml(url: string): string {
  // Inline-styled, single column, no images. Renders fine in all major clients.
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#fafaf7;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0f1115;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#fafaf7;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="480" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;border:1px solid #e7e5d8;border-radius:12px;overflow:hidden;">
        <tr><td style="padding:32px 32px 0 32px;">
          <div style="font-size:14px;color:#6b7280;letter-spacing:0.04em;text-transform:lowercase;">idbetonthat</div>
          <h1 style="margin:8px 0 0;font-size:22px;font-weight:600;">Your sign-in link</h1>
          <p style="margin:16px 0 0;font-size:15px;line-height:1.5;color:#1a1d24;">
            Click the button below to sign in. Link expires in 24 hours.
          </p>
        </td></tr>
        <tr><td style="padding:24px 32px;">
          <a href="${url}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:15px;">Sign in</a>
        </td></tr>
        <tr><td style="padding:0 32px 32px 32px;">
          <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">
            Trouble with the button? Copy and paste this URL into your browser:<br>
            <span style="word-break:break-all;color:#1a1d24;">${url}</span>
          </p>
          <p style="margin:24px 0 0;font-size:12px;color:#9aa0a6;">
            Didn't ask for this? You can ignore this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
